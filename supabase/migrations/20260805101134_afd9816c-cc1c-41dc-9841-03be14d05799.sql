ALTER TABLE public.calls DROP CONSTRAINT IF EXISTS calls_status_check;
ALTER TABLE public.calls ADD CONSTRAINT calls_status_check CHECK (status = ANY (ARRAY['dialing'::text,'ringing'::text,'active'::text,'ongoing'::text,'answered'::text,'declined'::text,'missed'::text,'ended'::text]));

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['profiles','conversations','conversation_members','messages','contacts','stories','story_views','calls','call_signals','notifications','communities','community_members','products','orders','jobs','wallet_transactions','push_subscriptions','user_devices','reactions','comments','shares']
  LOOP
    IF to_regclass('public.' || t) IS NOT NULL THEN
      EXECUTE format('GRANT SELECT, INSERT, UPDATE, DELETE ON public.%I TO authenticated', t);
      EXECUTE format('GRANT ALL ON public.%I TO service_role', t);
    END IF;
  END LOOP;
END $$;
GRANT SELECT ON public.currencies TO authenticated;
GRANT ALL ON public.currencies TO service_role;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='products_seller_profile_fkey') THEN
    ALTER TABLE public.products ADD CONSTRAINT products_seller_profile_fkey FOREIGN KEY (seller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='stories_user_profile_fkey') THEN
    ALTER TABLE public.stories ADD CONSTRAINT stories_user_profile_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname='calls_caller_profile_fkey') THEN
    ALTER TABLE public.calls ADD CONSTRAINT calls_caller_profile_fkey FOREIGN KEY (caller_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
END $$;

CREATE TABLE public.business_pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  name text NOT NULL,
  category text,
  description text,
  location text,
  phone text,
  email text,
  website text,
  logo_url text,
  cover_url text,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.business_pages TO authenticated;
GRANT ALL ON public.business_pages TO service_role;
ALTER TABLE public.business_pages ENABLE ROW LEVEL SECURITY;
CREATE POLICY business_pages_read ON public.business_pages FOR SELECT TO authenticated USING (is_active OR owner_id=auth.uid());
CREATE POLICY business_pages_insert ON public.business_pages FOR INSERT TO authenticated WITH CHECK (owner_id=auth.uid() AND public.has_completed_profile(auth.uid()));
CREATE POLICY business_pages_update ON public.business_pages FOR UPDATE TO authenticated USING (owner_id=auth.uid()) WITH CHECK (owner_id=auth.uid());
CREATE POLICY business_pages_delete ON public.business_pages FOR DELETE TO authenticated USING (owner_id=auth.uid());
CREATE TRIGGER business_pages_touch BEFORE UPDATE ON public.business_pages FOR EACH ROW EXECUTE FUNCTION public.touch_updated_at();

CREATE OR REPLACE FUNCTION public.wallet_balance(p_user uuid, p_currency text DEFAULT 'XOF') RETURNS numeric
LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$
  SELECT COALESCE(sum(amount),0) FROM public.wallet_transactions WHERE user_id=p_user AND currency=p_currency AND status='completed';
$$;
REVOKE ALL ON FUNCTION public.wallet_balance(uuid,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.wallet_balance(uuid,text) TO authenticated, service_role;

CREATE OR REPLACE FUNCTION public.transfer_wallet(p_recipient uuid, p_amount numeric, p_currency text DEFAULT 'XOF', p_note text DEFAULT NULL) RETURNS uuid
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
DECLARE v_sender uuid := auth.uid(); v_transfer uuid := gen_random_uuid();
BEGIN
  IF v_sender IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_recipient=v_sender OR p_amount<=0 THEN RAISE EXCEPTION 'Invalid transfer'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id=p_recipient) THEN RAISE EXCEPTION 'Recipient not found'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(v_sender::text || ':' || p_currency));
  IF public.wallet_balance(v_sender,p_currency) < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  INSERT INTO public.wallet_transactions(id,user_id,recipient_id,amount,currency,type,description,status)
  VALUES(v_transfer,v_sender,p_recipient,-p_amount,p_currency,'transfer_out',COALESCE(p_note,'Transfert interne'),'completed');
  INSERT INTO public.wallet_transactions(user_id,recipient_id,amount,currency,type,description,status)
  VALUES(p_recipient,v_sender,p_amount,p_currency,'transfer_in',COALESCE(p_note,'Transfert interne'),'completed');
  RETURN v_transfer;
END $$;
REVOKE ALL ON FUNCTION public.transfer_wallet(uuid,numeric,text,text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.transfer_wallet(uuid,numeric,text,text) TO authenticated;

CREATE OR REPLACE FUNCTION public.notify_message_or_call() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
  IF TG_TABLE_NAME='messages' THEN
    INSERT INTO public.notifications(user_id,type,title,body,icon,action_url,data)
    SELECT cm.user_id,'message','Nouveau message',COALESCE(NULLIF(NEW.content,''),'Nouveau contenu'),'💬','/app',jsonb_build_object('conversation_id',NEW.conversation_id,'message_id',NEW.id)
    FROM public.conversation_members cm WHERE cm.conversation_id=NEW.conversation_id AND cm.user_id<>NEW.sender_id;
  ELSIF TG_TABLE_NAME='calls' AND NEW.callee_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id,type,title,body,icon,action_url,data)
    VALUES(NEW.callee_id,'call','Appel entrant',CASE WHEN NEW.call_type='video' THEN 'Appel vidéo entrant' ELSE 'Appel audio entrant' END,'📞','/app',jsonb_build_object('call_id',NEW.id));
  END IF;
  RETURN NEW;
END $$;
DROP TRIGGER IF EXISTS messages_notify_recipients ON public.messages;
CREATE TRIGGER messages_notify_recipients AFTER INSERT ON public.messages FOR EACH ROW EXECUTE FUNCTION public.notify_message_or_call();
DROP TRIGGER IF EXISTS calls_notify_recipient ON public.calls;
CREATE TRIGGER calls_notify_recipient AFTER INSERT ON public.calls FOR EACH ROW EXECUTE FUNCTION public.notify_message_or_call();

DO $$
DECLARE t text;
BEGIN
  FOREACH t IN ARRAY ARRAY['messages','contacts','stories','story_views','calls','call_signals','notifications','communities','community_members','products','jobs','wallet_transactions','business_pages']
  LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_publication_tables WHERE pubname='supabase_realtime' AND schemaname='public' AND tablename=t) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I',t);
    END IF;
  END LOOP;
END $$;
-- Messaging, conversation membership and notification repair

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calls TO authenticated;
GRANT ALL ON public.conversations, public.conversation_members, public.messages, public.notifications, public.calls TO service_role;

ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS msg_read ON public.messages;
CREATE POLICY msg_read ON public.messages
FOR SELECT TO authenticated
USING (
  public.is_conversation_member(conversation_id, auth.uid())
  AND (expires_at IS NULL OR expires_at > now())
);

DROP POLICY IF EXISTS msg_update_member ON public.messages;
CREATE POLICY msg_update_member ON public.messages
FOR UPDATE TO authenticated
USING (public.is_conversation_member(conversation_id, auth.uid()))
WITH CHECK (
  public.is_conversation_member(conversation_id, auth.uid())
  AND sender_id = (SELECT m.sender_id FROM public.messages AS m WHERE m.id = messages.id)
  AND conversation_id = (SELECT m.conversation_id FROM public.messages AS m WHERE m.id = messages.id)
);

DROP POLICY IF EXISTS msg_delete_sender ON public.messages;
CREATE POLICY msg_delete_sender ON public.messages
FOR DELETE TO authenticated
USING (sender_id = auth.uid());

DROP POLICY IF EXISTS cm_read_member ON public.conversation_members;
CREATE POLICY cm_read_member ON public.conversation_members
FOR SELECT TO authenticated
USING (public.is_conversation_member(conversation_id, auth.uid()));

DROP POLICY IF EXISTS cm_update_self ON public.conversation_members;
CREATE POLICY cm_update_self ON public.conversation_members
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS cm_delete_self ON public.conversation_members;
CREATE POLICY cm_delete_self ON public.conversation_members
FOR DELETE TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS conv_update_creator ON public.conversations;
CREATE POLICY conv_update_creator ON public.conversations
FOR UPDATE TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

DROP POLICY IF EXISTS conv_delete_creator ON public.conversations;
CREATE POLICY conv_delete_creator ON public.conversations
FOR DELETE TO authenticated
USING (created_by = auth.uid());

DROP POLICY IF EXISTS notifications_owner_select ON public.notifications;
CREATE POLICY notifications_owner_select ON public.notifications
FOR SELECT TO authenticated
USING (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_owner_update ON public.notifications;
CREATE POLICY notifications_owner_update ON public.notifications
FOR UPDATE TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS notifications_owner_delete ON public.notifications;
CREATE POLICY notifications_owner_delete ON public.notifications
FOR DELETE TO authenticated
USING (user_id = auth.uid());

CREATE OR REPLACE FUNCTION public.notify_message_or_call()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'messages' THEN
    INSERT INTO public.notifications(user_id, type, title, body, icon, action_url, data)
    SELECT cm.user_id, 'message', 'Nouveau message', COALESCE(NULLIF(NEW.content, ''), 'Nouveau contenu'), '💬', '/app',
      jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id)
    FROM public.conversation_members AS cm
    WHERE cm.conversation_id = NEW.conversation_id AND cm.user_id <> NEW.sender_id;
  ELSIF TG_TABLE_NAME = 'calls' AND NEW.callee_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, body, icon, action_url, data)
    VALUES (
      NEW.callee_id, 'call', 'Appel entrant',
      CASE WHEN NEW.call_type = 'video' THEN 'Appel vidéo entrant' ELSE 'Appel audio entrant' END,
      '📞', '/app', jsonb_build_object('call_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_message_or_call() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_message_or_call() TO service_role;

CREATE OR REPLACE FUNCTION public.notify_missed_call()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'missed' AND OLD.status IS DISTINCT FROM NEW.status AND NEW.callee_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, body, icon, action_url, data)
    VALUES (
      NEW.callee_id, 'call', 'Appel manqué',
      CASE WHEN NEW.call_type = 'video' THEN 'Appel vidéo manqué' ELSE 'Appel audio manqué' END,
      '📵', '/app', jsonb_build_object('call_id', NEW.id)
    );
  END IF;
  RETURN NEW;
END;
$$;
REVOKE ALL ON FUNCTION public.notify_missed_call() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_missed_call() TO service_role;

DROP TRIGGER IF EXISTS messages_notify_recipients ON public.messages;
CREATE TRIGGER messages_notify_recipients
AFTER INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.notify_message_or_call();

DROP TRIGGER IF EXISTS calls_notify_recipient ON public.calls;
CREATE TRIGGER calls_notify_recipient
AFTER INSERT ON public.calls
FOR EACH ROW EXECUTE FUNCTION public.notify_message_or_call();

DROP TRIGGER IF EXISTS calls_notify_missed ON public.calls;
CREATE TRIGGER calls_notify_missed
AFTER UPDATE OF status ON public.calls
FOR EACH ROW
WHEN (NEW.status = 'missed' AND OLD.status IS DISTINCT FROM NEW.status)
EXECUTE FUNCTION public.notify_missed_call();

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
ON public.messages(conversation_id, created_at DESC)
WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS messages_unread_conversation_idx
ON public.messages(conversation_id, is_read, sender_id)
WHERE deleted_at IS NULL;
CREATE INDEX IF NOT EXISTS conversation_members_user_conversation_idx
ON public.conversation_members(user_id, conversation_id);
CREATE INDEX IF NOT EXISTS notifications_user_created_idx
ON public.notifications(user_id, created_at DESC);

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['messages','notifications','conversations','conversation_members','calls']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
END $$;
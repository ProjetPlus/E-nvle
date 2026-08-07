CREATE UNIQUE INDEX IF NOT EXISTS notifications_message_event_unique
ON public.notifications (user_id, ((data->>'message_id')))
WHERE type = 'message' AND data ? 'message_id';

CREATE UNIQUE INDEX IF NOT EXISTS notifications_call_event_unique
ON public.notifications (user_id, ((data->>'call_id')), type)
WHERE data ? 'call_id' AND type IN ('call', 'system');

CREATE INDEX IF NOT EXISTS messages_conversation_created_idx
ON public.messages (conversation_id, created_at DESC)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS messages_conversation_unread_idx
ON public.messages (conversation_id, is_read, sender_id)
WHERE deleted_at IS NULL;

CREATE INDEX IF NOT EXISTS conversation_members_user_conversation_idx
ON public.conversation_members (user_id, conversation_id);

CREATE INDEX IF NOT EXISTS notifications_user_unread_created_idx
ON public.notifications (user_id, is_read, created_at DESC);

CREATE INDEX IF NOT EXISTS calls_callee_status_started_idx
ON public.calls (callee_id, status, started_at DESC);

CREATE OR REPLACE FUNCTION public.notify_message_or_call()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'messages' AND TG_OP = 'INSERT' THEN
    INSERT INTO public.notifications(user_id, type, title, body, icon, action_url, data)
    SELECT
      cm.user_id,
      'message',
      'Nouveau message',
      COALESCE(NULLIF(NEW.content, ''), 'Nouveau contenu'),
      '💬',
      '/app',
      jsonb_build_object('conversation_id', NEW.conversation_id, 'message_id', NEW.id, 'sender_id', NEW.sender_id)
    FROM public.conversation_members cm
    WHERE cm.conversation_id = NEW.conversation_id
      AND cm.user_id <> NEW.sender_id
    ON CONFLICT DO NOTHING;
  ELSIF TG_TABLE_NAME = 'calls' AND TG_OP = 'INSERT' AND NEW.callee_id IS NOT NULL THEN
    INSERT INTO public.notifications(user_id, type, title, body, icon, action_url, data)
    VALUES (
      NEW.callee_id,
      'call',
      'Appel entrant',
      CASE WHEN NEW.call_type = 'video' THEN 'Appel vidéo entrant' ELSE 'Appel audio entrant' END,
      '📞',
      '/app',
      jsonb_build_object('call_id', NEW.id, 'caller_id', NEW.caller_id, 'status', NEW.status)
    )
    ON CONFLICT DO NOTHING;
  ELSIF TG_TABLE_NAME = 'calls' AND TG_OP = 'UPDATE'
    AND NEW.callee_id IS NOT NULL
    AND NEW.status = 'missed'
    AND OLD.status IS DISTINCT FROM NEW.status THEN
    INSERT INTO public.notifications(user_id, type, title, body, icon, action_url, data)
    VALUES (
      NEW.callee_id,
      'system',
      'Appel manqué',
      CASE WHEN NEW.call_type = 'video' THEN 'Vous avez manqué un appel vidéo' ELSE 'Vous avez manqué un appel audio' END,
      '📵',
      '/app',
      jsonb_build_object('call_id', NEW.id, 'caller_id', NEW.caller_id, 'status', NEW.status)
    )
    ON CONFLICT DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

REVOKE ALL ON FUNCTION public.notify_message_or_call() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.notify_message_or_call() TO service_role;

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
FOR EACH ROW EXECUTE FUNCTION public.notify_message_or_call();

DO $$
DECLARE table_name text;
BEGIN
  FOREACH table_name IN ARRAY ARRAY['messages','conversations','conversation_members','notifications','calls','call_signals','contacts','stories']
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM pg_publication_tables
      WHERE pubname = 'supabase_realtime' AND schemaname = 'public' AND tablename = table_name
    ) THEN
      EXECUTE format('ALTER PUBLICATION supabase_realtime ADD TABLE public.%I', table_name);
    END IF;
  END LOOP;
END $$;
CREATE TABLE IF NOT EXISTS public.call_signals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_id uuid NOT NULL REFERENCES public.calls(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  recipient_id uuid NOT NULL,
  signal_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, DELETE ON public.call_signals TO authenticated;
GRANT ALL ON public.call_signals TO service_role;
ALTER TABLE public.call_signals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Call participants can read signals" ON public.call_signals;
DROP POLICY IF EXISTS "Call participants can create signals" ON public.call_signals;
DROP POLICY IF EXISTS "Call participants can delete own signals" ON public.call_signals;

CREATE POLICY "Call participants can read signals"
ON public.call_signals
FOR SELECT
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE POLICY "Call participants can create signals"
ON public.call_signals
FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() = sender_id
  AND EXISTS (
    SELECT 1 FROM public.calls c
    WHERE c.id = call_id
      AND (c.caller_id = auth.uid() OR c.callee_id = auth.uid())
      AND (c.caller_id = recipient_id OR c.callee_id = recipient_id)
  )
);

CREATE POLICY "Call participants can delete own signals"
ON public.call_signals
FOR DELETE
TO authenticated
USING (auth.uid() = sender_id OR auth.uid() = recipient_id);

CREATE INDEX IF NOT EXISTS call_signals_call_created_idx ON public.call_signals (call_id, created_at);
CREATE INDEX IF NOT EXISTS call_signals_recipient_idx ON public.call_signals (recipient_id, created_at DESC);

DROP POLICY IF EXISTS "calls_all" ON public.calls;
DROP POLICY IF EXISTS "calls_create" ON public.calls;
DROP POLICY IF EXISTS "calls_participant" ON public.calls;
DROP POLICY IF EXISTS "calls_update" ON public.calls;
DROP POLICY IF EXISTS "conv_members_all" ON public.conversation_members;
DROP POLICY IF EXISTS "conversations_all" ON public.conversations;
DROP POLICY IF EXISTS "messages_all" ON public.messages;

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.call_signals;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
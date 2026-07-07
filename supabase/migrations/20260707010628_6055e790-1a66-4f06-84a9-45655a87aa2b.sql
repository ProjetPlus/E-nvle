CREATE OR REPLACE FUNCTION public.set_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  NEW.profile_completed := (
    coalesce(trim(NEW.full_name), '') <> ''
    AND coalesce(trim(NEW.phone), '') <> ''
    AND coalesce(trim(NEW.location), '') <> ''
    AND coalesce(trim(NEW.profession), '') <> ''
    AND coalesce(trim(NEW.avatar_url), '') <> ''
    AND coalesce(trim(NEW.cover_url), '') <> ''
  );
  NEW.searchable_phone := regexp_replace(coalesce(NEW.phone, ''), '[^+0-9]', '', 'g');
  NEW.updated_at := now();
  RETURN NEW;
END;
$function$;

ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS last_signal_at timestamptz DEFAULT now();
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS caller_presence text DEFAULT 'available';
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS callee_presence text DEFAULT 'pending';
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS media_ready boolean DEFAULT false;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS stun_turn_config jsonb DEFAULT '{"iceServers":[{"urls":["stun:stun.l.google.com:19302","stun:global.stun.twilio.com:3478"]}]}'::jsonb;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.calls TO authenticated;
GRANT ALL ON public.calls TO service_role;

CREATE INDEX IF NOT EXISTS profiles_searchable_phone_idx ON public.profiles (searchable_phone);
CREATE INDEX IF NOT EXISTS profiles_status_last_seen_idx ON public.profiles (status, last_seen DESC);
CREATE INDEX IF NOT EXISTS calls_participants_status_idx ON public.calls (caller_id, callee_id, status, started_at DESC);

DROP POLICY IF EXISTS "calls_all" ON public.calls;
DROP POLICY IF EXISTS "Call participants can read calls" ON public.calls;
DROP POLICY IF EXISTS "Call participants can create calls" ON public.calls;
DROP POLICY IF EXISTS "Call participants can update calls" ON public.calls;

CREATE POLICY "Call participants can read calls"
ON public.calls
FOR SELECT
TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = callee_id);

CREATE POLICY "Call participants can create calls"
ON public.calls
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = caller_id);

CREATE POLICY "Call participants can update calls"
ON public.calls
FOR UPDATE
TO authenticated
USING (auth.uid() = caller_id OR auth.uid() = callee_id)
WITH CHECK (auth.uid() = caller_id OR auth.uid() = callee_id);

UPDATE public.profiles
SET updated_at = now()
WHERE id IS NOT NULL;
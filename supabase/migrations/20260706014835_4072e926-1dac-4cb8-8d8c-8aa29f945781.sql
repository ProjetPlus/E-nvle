-- E'nvlé One production readiness: grants, profile completion, contacts, stories and calls

-- 1) Required Data API grants for existing public tables
GRANT SELECT ON public.profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT ALL ON public.profiles TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT ALL ON public.conversations TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_members TO authenticated;
GRANT ALL ON public.conversation_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT ALL ON public.messages TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT ALL ON public.contacts TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.calls TO authenticated;
GRANT ALL ON public.calls TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT SELECT ON public.stories TO anon;
GRANT ALL ON public.stories TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_views TO authenticated;
GRANT ALL ON public.story_views TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.notifications TO authenticated;
GRANT ALL ON public.notifications TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT SELECT ON public.products TO anon;
GRANT ALL ON public.products TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.wallet_transactions TO authenticated;
GRANT ALL ON public.wallet_transactions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.jobs TO authenticated;
GRANT SELECT ON public.jobs TO anon;
GRANT ALL ON public.jobs TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.communities TO authenticated;
GRANT SELECT ON public.communities TO anon;
GRANT ALL ON public.communities TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.community_members TO authenticated;
GRANT ALL ON public.community_members TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.comments TO authenticated;
GRANT ALL ON public.comments TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reactions TO authenticated;
GRANT ALL ON public.reactions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shares TO authenticated;
GRANT ALL ON public.shares TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.push_subscriptions TO authenticated;
GRANT ALL ON public.push_subscriptions TO service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_devices TO authenticated;
GRANT ALL ON public.user_devices TO service_role;
GRANT SELECT ON public.currencies TO anon, authenticated;
GRANT ALL ON public.currencies TO service_role;

-- 2) Profile completion, cover photo and phone change support
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS profile_completed boolean DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS phone_changed_at timestamptz;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS searchable_phone text;

CREATE UNIQUE INDEX IF NOT EXISTS profiles_phone_unique_idx ON public.profiles (phone) WHERE phone IS NOT NULL;
CREATE INDEX IF NOT EXISTS profiles_search_idx ON public.profiles USING gin (to_tsvector('simple', coalesce(full_name,'') || ' ' || coalesce(username,'') || ' ' || coalesce(phone,'')));
CREATE INDEX IF NOT EXISTS contacts_user_idx ON public.contacts (user_id);
CREATE INDEX IF NOT EXISTS contacts_contact_idx ON public.contacts (contact_id);
CREATE INDEX IF NOT EXISTS conversation_members_user_idx ON public.conversation_members (user_id);
CREATE INDEX IF NOT EXISTS messages_conversation_created_idx ON public.messages (conversation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS calls_callee_status_idx ON public.calls (callee_id, status, started_at DESC);
CREATE INDEX IF NOT EXISTS calls_caller_started_idx ON public.calls (caller_id, started_at DESC);

-- 3) Contact relationship integrity without touching auth schema
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND table_name='contacts' AND constraint_name='contacts_user_profile_fkey'
  ) THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_user_profile_fkey FOREIGN KEY (user_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND table_name='contacts' AND constraint_name='contacts_contact_profile_fkey'
  ) THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_contact_profile_fkey FOREIGN KEY (contact_id) REFERENCES public.profiles(id) ON DELETE CASCADE;
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_schema='public' AND table_name='contacts' AND constraint_name='contacts_unique_pair'
  ) THEN
    ALTER TABLE public.contacts
      ADD CONSTRAINT contacts_unique_pair UNIQUE (user_id, contact_id);
  END IF;
END $$;

-- 4) Story resharing and live status support
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS allow_reshare boolean DEFAULT true;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS reshared_from uuid REFERENCES public.stories(id) ON DELETE SET NULL;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS is_live boolean DEFAULT false;
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS live_status text DEFAULT 'ended';
ALTER TABLE public.stories ADD COLUMN IF NOT EXISTS live_participants jsonb DEFAULT '[]'::jsonb;
CREATE INDEX IF NOT EXISTS stories_expires_idx ON public.stories (expires_at DESC);

-- 5) Call signaling fields used by the UI
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS answered_at timestamptz;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS caller_muted boolean DEFAULT false;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS callee_muted boolean DEFAULT false;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS caller_video_enabled boolean DEFAULT true;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS callee_video_enabled boolean DEFAULT true;
ALTER TABLE public.calls ADD COLUMN IF NOT EXISTS ring_state text DEFAULT 'dialing';

-- 6) Normalize profile completion automatically
CREATE OR REPLACE FUNCTION public.set_profile_completion()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  NEW.profile_completed := (
    coalesce(trim(NEW.full_name), '') <> ''
    AND coalesce(trim(NEW.phone), '') <> ''
    AND coalesce(trim(NEW.bio), '') <> ''
    AND coalesce(trim(NEW.location), '') <> ''
    AND coalesce(trim(NEW.profession), '') <> ''
    AND coalesce(trim(NEW.avatar_url), '') <> ''
    AND coalesce(trim(NEW.cover_url), '') <> ''
  );
  NEW.searchable_phone := regexp_replace(coalesce(NEW.phone, ''), '[^+0-9]', '', 'g');
  NEW.updated_at := now();
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_profiles_completion ON public.profiles;
CREATE TRIGGER trg_profiles_completion
BEFORE INSERT OR UPDATE ON public.profiles
FOR EACH ROW EXECUTE FUNCTION public.set_profile_completion();

-- 7) Keep RLS enabled and add safe CRUD policies where missing
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conversation_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS contacts_own ON public.contacts;
CREATE POLICY contacts_own ON public.contacts
FOR ALL TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS profiles_read_registered ON public.profiles;
CREATE POLICY profiles_read_registered ON public.profiles
FOR SELECT TO authenticated
USING (true);

DROP POLICY IF EXISTS profiles_read_public_minimal ON public.profiles;
CREATE POLICY profiles_read_public_minimal ON public.profiles
FOR SELECT TO anon
USING (true);

DROP POLICY IF EXISTS profiles_update_self_complete ON public.profiles;
CREATE POLICY profiles_update_self_complete ON public.profiles
FOR UPDATE TO authenticated
USING (id = auth.uid())
WITH CHECK (id = auth.uid());

-- 8) Ensure realtime receives the key collaboration tables
DO $$
BEGIN
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.contacts; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.conversation_members; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.messages; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.calls; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.stories; EXCEPTION WHEN duplicate_object THEN NULL; END;
  BEGIN ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications; EXCEPTION WHEN duplicate_object THEN NULL; END;
END $$;
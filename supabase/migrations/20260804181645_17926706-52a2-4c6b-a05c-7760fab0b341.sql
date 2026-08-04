GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.conversation_members TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.contacts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stories TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.story_views TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.calls TO authenticated;
GRANT SELECT, INSERT, DELETE ON public.call_signals TO authenticated;

GRANT ALL ON public.profiles, public.conversations, public.conversation_members, public.messages, public.contacts, public.stories, public.story_views, public.calls, public.call_signals TO service_role;

CREATE OR REPLACE FUNCTION public.has_completed_profile(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = _user_id AND profile_completed IS TRUE
  );
$$;
REVOKE ALL ON FUNCTION public.has_completed_profile(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_completed_profile(uuid) TO authenticated, service_role;

DROP POLICY IF EXISTS conv_create ON public.conversations;
CREATE POLICY conv_create ON public.conversations FOR INSERT TO authenticated
WITH CHECK (created_by = auth.uid() AND public.has_completed_profile(auth.uid()));

DROP POLICY IF EXISTS cm_insert ON public.conversation_members;
CREATE POLICY cm_insert ON public.conversation_members FOR INSERT TO authenticated
WITH CHECK (
  public.has_completed_profile(auth.uid())
  AND (user_id = auth.uid() OR public.is_conversation_member(conversation_id, auth.uid()))
);

DROP POLICY IF EXISTS msg_send ON public.messages;
CREATE POLICY msg_send ON public.messages FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.has_completed_profile(auth.uid())
  AND public.is_conversation_member(conversation_id, auth.uid())
);

DROP POLICY IF EXISTS contacts_own ON public.contacts;
CREATE POLICY contacts_read_own ON public.contacts FOR SELECT TO authenticated
USING (user_id = auth.uid() AND public.has_completed_profile(auth.uid()));
CREATE POLICY contacts_insert_own ON public.contacts FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND contact_id <> auth.uid() AND public.has_completed_profile(auth.uid()));
CREATE POLICY contacts_update_own ON public.contacts FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND public.has_completed_profile(auth.uid()))
WITH CHECK (user_id = auth.uid() AND contact_id <> auth.uid() AND public.has_completed_profile(auth.uid()));
CREATE POLICY contacts_delete_own ON public.contacts FOR DELETE TO authenticated
USING (user_id = auth.uid() AND public.has_completed_profile(auth.uid()));

DROP POLICY IF EXISTS stories_read ON public.stories;
DROP POLICY IF EXISTS stories_own ON public.stories;
CREATE POLICY stories_read_completed ON public.stories FOR SELECT TO authenticated
USING (public.has_completed_profile(auth.uid()) AND (expires_at IS NULL OR expires_at > now()));
CREATE POLICY stories_insert_own ON public.stories FOR INSERT TO authenticated
WITH CHECK (user_id = auth.uid() AND public.has_completed_profile(auth.uid()));
CREATE POLICY stories_update_own ON public.stories FOR UPDATE TO authenticated
USING (user_id = auth.uid() AND public.has_completed_profile(auth.uid()))
WITH CHECK (user_id = auth.uid() AND public.has_completed_profile(auth.uid()));
CREATE POLICY stories_delete_own ON public.stories FOR DELETE TO authenticated
USING (user_id = auth.uid() AND public.has_completed_profile(auth.uid()));

DROP POLICY IF EXISTS sv_own ON public.story_views;
CREATE POLICY story_views_read_own_story ON public.story_views FOR SELECT TO authenticated
USING (
  viewer_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.stories s WHERE s.id = story_id AND s.user_id = auth.uid())
);
CREATE POLICY story_views_insert_self ON public.story_views FOR INSERT TO authenticated
WITH CHECK (viewer_id = auth.uid() AND public.has_completed_profile(auth.uid()));
CREATE POLICY story_views_delete_self ON public.story_views FOR DELETE TO authenticated
USING (viewer_id = auth.uid());

DROP POLICY IF EXISTS calls_create ON public.calls;
DROP POLICY IF EXISTS "Call participants can create calls" ON public.calls;
CREATE POLICY calls_create_completed ON public.calls FOR INSERT TO authenticated
WITH CHECK (caller_id = auth.uid() AND public.has_completed_profile(auth.uid()));
DROP POLICY IF EXISTS calls_participant ON public.calls;
DROP POLICY IF EXISTS "Call participants can read calls" ON public.calls;
CREATE POLICY calls_participant_read ON public.calls FOR SELECT TO authenticated
USING ((caller_id = auth.uid() OR callee_id = auth.uid()) AND public.has_completed_profile(auth.uid()));
DROP POLICY IF EXISTS calls_update ON public.calls;
DROP POLICY IF EXISTS "Call participants can update calls" ON public.calls;
CREATE POLICY calls_participant_update ON public.calls FOR UPDATE TO authenticated
USING ((caller_id = auth.uid() OR callee_id = auth.uid()) AND public.has_completed_profile(auth.uid()))
WITH CHECK ((caller_id = auth.uid() OR callee_id = auth.uid()) AND public.has_completed_profile(auth.uid()));

DROP POLICY IF EXISTS call_signals_insert ON public.call_signals;
DROP POLICY IF EXISTS "Call participants can create signals" ON public.call_signals;
CREATE POLICY call_signals_insert_participant ON public.call_signals FOR INSERT TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND public.has_completed_profile(auth.uid())
  AND EXISTS (
    SELECT 1 FROM public.calls c
    WHERE c.id = call_id
      AND (c.caller_id = auth.uid() OR c.callee_id = auth.uid())
      AND (c.caller_id = recipient_id OR c.callee_id = recipient_id)
  )
);
DROP POLICY IF EXISTS call_signals_read ON public.call_signals;
DROP POLICY IF EXISTS "Call participants can read signals" ON public.call_signals;
CREATE POLICY call_signals_read_participant ON public.call_signals FOR SELECT TO authenticated
USING ((sender_id = auth.uid() OR recipient_id = auth.uid()) AND public.has_completed_profile(auth.uid()));
DROP POLICY IF EXISTS "Call participants can delete own signals" ON public.call_signals;
CREATE POLICY call_signals_delete_participant ON public.call_signals FOR DELETE TO authenticated
USING (sender_id = auth.uid() OR recipient_id = auth.uid());

DO $$ BEGIN
  ALTER PUBLICATION supabase_realtime ADD TABLE public.story_views;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
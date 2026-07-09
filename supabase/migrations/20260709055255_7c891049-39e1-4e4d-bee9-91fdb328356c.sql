
DROP POLICY IF EXISTS calls_all ON public.calls;
DROP POLICY IF EXISTS conversations_all ON public.conversations;
DROP POLICY IF EXISTS messages_all ON public.messages;
DROP POLICY IF EXISTS notifications_all ON public.notifications;
DROP POLICY IF EXISTS orders_all ON public.orders;
DROP POLICY IF EXISTS devices_all ON public.user_devices;
DROP POLICY IF EXISTS wallet_all ON public.wallet_transactions;
DROP POLICY IF EXISTS communities_all ON public.communities;
DROP POLICY IF EXISTS community_members_all ON public.community_members;
DROP POLICY IF EXISTS conv_members_all ON public.conversation_members;
DROP POLICY IF EXISTS jobs_all ON public.jobs;
DROP POLICY IF EXISTS products_all ON public.products;
DROP POLICY IF EXISTS stories_all ON public.stories;
DROP POLICY IF EXISTS story_views_all ON public.story_views;

DROP POLICY IF EXISTS otp_insert ON public.otp_codes;
DROP POLICY IF EXISTS otp_select ON public.otp_codes;
DROP POLICY IF EXISTS otp_update ON public.otp_codes;
REVOKE ALL ON public.otp_codes FROM anon, authenticated;
GRANT ALL ON public.otp_codes TO service_role;

DROP POLICY IF EXISTS profiles_read_all ON public.profiles;
DROP POLICY IF EXISTS profiles_read_public_minimal ON public.profiles;
DROP POLICY IF EXISTS profiles_read_registered ON public.profiles;
DROP POLICY IF EXISTS profiles_select ON public.profiles;
REVOKE SELECT ON public.profiles FROM anon;
CREATE POLICY profiles_read_authenticated ON public.profiles
  FOR SELECT TO authenticated USING (true);

DROP POLICY IF EXISTS public_read_all_buckets ON storage.objects;
DROP POLICY IF EXISTS auth_upload_all ON storage.objects;

CREATE POLICY public_read_public_buckets ON storage.objects
  FOR SELECT TO anon, authenticated
  USING (bucket_id = ANY (ARRAY['avatars','stories','products','community']));

CREATE POLICY chat_files_read_members ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'chat-files'
    AND public.is_conversation_member(
      NULLIF(split_part(name, '/', 1), '')::uuid,
      auth.uid()
    )
  );

CREATE POLICY auth_upload_scoped ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    (
      bucket_id = ANY (ARRAY['avatars','stories','products','community'])
      AND NULLIF(split_part(name, '/', 1), '')::uuid = auth.uid()
    )
    OR (
      bucket_id = 'chat-files'
      AND public.is_conversation_member(
        NULLIF(split_part(name, '/', 1), '')::uuid,
        auth.uid()
      )
    )
  );

ALTER FUNCTION public.touch_updated_at() SET search_path = public;

REVOKE EXECUTE ON FUNCTION public.generate_otp(text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.verify_otp(text, text) FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.cleanup_ephemeral_messages() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.generate_otp(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_otp(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_ephemeral_messages() TO service_role;

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO authenticated, service_role;

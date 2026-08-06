-- Server-only / trigger / maintenance functions: revoke from all client roles
REVOKE ALL ON FUNCTION public.generate_otp(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_otp(text, text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.cleanup_ephemeral_messages() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_message_or_call() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_message_expiry() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_profile_completion() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.touch_updated_at() FROM PUBLIC, anon, authenticated;

GRANT EXECUTE ON FUNCTION public.generate_otp(text) TO service_role;
GRANT EXECUTE ON FUNCTION public.verify_otp(text, text) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_ephemeral_messages() TO service_role;

-- App functions: signed-in users only, never anonymous
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.has_completed_profile(uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.is_conversation_member(uuid, uuid) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.wallet_balance(uuid, text) FROM PUBLIC, anon;
REVOKE ALL ON FUNCTION public.transfer_wallet(uuid, numeric, text, text) FROM PUBLIC, anon;

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.has_completed_profile(uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_conversation_member(uuid, uuid) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.wallet_balance(uuid, text) TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.transfer_wallet(uuid, numeric, text, text) TO authenticated, service_role;
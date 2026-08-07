REVOKE ALL ON FUNCTION public.cleanup_ephemeral_messages() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.generate_otp(text) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.handle_new_user() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_message_or_call() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.notify_missed_call() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_message_expiry() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.set_profile_completion() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION public.verify_otp(text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.cleanup_ephemeral_messages(), public.generate_otp(text), public.handle_new_user(), public.notify_message_or_call(), public.notify_missed_call(), public.set_message_expiry(), public.set_profile_completion(), public.verify_otp(text, text) TO service_role;
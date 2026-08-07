DROP TRIGGER IF EXISTS trg_msg_expiry ON public.messages;
DROP TRIGGER IF EXISTS trg_message_expiry ON public.messages;
CREATE TRIGGER trg_message_expiry
BEFORE INSERT ON public.messages
FOR EACH ROW EXECUTE FUNCTION public.set_message_expiry();
REVOKE ALL ON FUNCTION public.set_message_expiry() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.set_message_expiry() TO service_role;
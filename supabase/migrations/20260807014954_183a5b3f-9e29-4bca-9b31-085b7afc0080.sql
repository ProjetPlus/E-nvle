REVOKE ALL ON FUNCTION public.transfer_wallet(uuid, numeric, text, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.transfer_wallet(uuid, numeric, text, text) TO service_role;
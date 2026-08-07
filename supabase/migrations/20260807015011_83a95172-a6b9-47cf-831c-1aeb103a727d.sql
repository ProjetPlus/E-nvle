REVOKE ALL ON FUNCTION public.transfer_wallet(uuid, numeric, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_wallet(uuid, numeric, text, text) TO authenticated, service_role;
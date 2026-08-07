REVOKE ALL ON FUNCTION public.wallet_balance(uuid, text) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.wallet_balance(uuid, text) TO service_role;
REVOKE ALL ON FUNCTION public.transfer_wallet(uuid, numeric, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_wallet(uuid, numeric, text, text) TO authenticated, service_role;
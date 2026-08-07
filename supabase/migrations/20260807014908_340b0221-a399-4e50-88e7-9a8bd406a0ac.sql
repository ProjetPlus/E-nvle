CREATE OR REPLACE FUNCTION public.my_wallet_balance(p_currency text DEFAULT 'XOF')
RETURNS numeric
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(sum(amount), 0)
  FROM public.wallet_transactions
  WHERE user_id = auth.uid() AND currency = p_currency AND status = 'completed';
$$;
REVOKE ALL ON FUNCTION public.my_wallet_balance(text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.my_wallet_balance(text) TO authenticated, service_role;
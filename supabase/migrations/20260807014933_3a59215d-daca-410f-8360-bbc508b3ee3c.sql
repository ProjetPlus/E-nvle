CREATE OR REPLACE FUNCTION public.transfer_wallet(p_recipient uuid, p_amount numeric, p_currency text DEFAULT 'XOF', p_note text DEFAULT NULL)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_sender uuid := auth.uid();
  v_transfer uuid := gen_random_uuid();
  v_currency text := upper(trim(p_currency));
BEGIN
  IF v_sender IS NULL THEN RAISE EXCEPTION 'Authentication required'; END IF;
  IF p_recipient IS NULL OR p_recipient = v_sender OR p_amount IS NULL OR p_amount <= 0 OR p_amount > 1000000000 THEN
    RAISE EXCEPTION 'Invalid transfer';
  END IF;
  IF v_currency !~ '^[A-Z]{3}$' THEN RAISE EXCEPTION 'Invalid currency'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.profiles WHERE id = p_recipient) THEN RAISE EXCEPTION 'Recipient not found'; END IF;
  PERFORM pg_advisory_xact_lock(hashtext(v_sender::text || ':' || v_currency));
  IF public.wallet_balance(v_sender, v_currency) < p_amount THEN RAISE EXCEPTION 'Insufficient balance'; END IF;
  INSERT INTO public.wallet_transactions(id, user_id, recipient_id, amount, currency, type, description, status)
  VALUES(v_transfer, v_sender, p_recipient, -p_amount, v_currency, 'transfer_out', COALESCE(NULLIF(trim(p_note), ''), 'Transfert interne'), 'completed');
  INSERT INTO public.wallet_transactions(user_id, recipient_id, amount, currency, type, description, status)
  VALUES(p_recipient, v_sender, p_amount, v_currency, 'transfer_in', COALESCE(NULLIF(trim(p_note), ''), 'Transfert interne'), 'completed');
  RETURN v_transfer;
END;
$$;
REVOKE ALL ON FUNCTION public.transfer_wallet(uuid, numeric, text, text) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.transfer_wallet(uuid, numeric, text, text) TO authenticated, service_role;
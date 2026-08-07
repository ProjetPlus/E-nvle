DROP POLICY IF EXISTS otp_codes_no_client_access ON public.otp_codes;
CREATE POLICY otp_codes_no_client_access ON public.otp_codes
FOR ALL TO anon, authenticated
USING (false)
WITH CHECK (false);
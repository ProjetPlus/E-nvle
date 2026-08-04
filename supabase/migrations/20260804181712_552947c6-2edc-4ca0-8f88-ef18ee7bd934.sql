DROP POLICY IF EXISTS conv_member_read ON public.conversations;
CREATE POLICY conv_member_read ON public.conversations FOR SELECT TO authenticated
USING (created_by = auth.uid() OR public.is_conversation_member(id, auth.uid()));
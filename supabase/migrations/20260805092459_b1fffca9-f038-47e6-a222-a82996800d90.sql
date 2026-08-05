DROP POLICY IF EXISTS cm_insert ON public.conversation_members;
CREATE POLICY cm_insert ON public.conversation_members
FOR INSERT TO authenticated
WITH CHECK (
  public.has_completed_profile(auth.uid())
  AND (
    user_id = auth.uid()
    OR public.is_conversation_member(conversation_id, auth.uid())
    OR EXISTS (SELECT 1 FROM public.conversations c WHERE c.id = conversation_id AND c.created_by = auth.uid())
  )
);
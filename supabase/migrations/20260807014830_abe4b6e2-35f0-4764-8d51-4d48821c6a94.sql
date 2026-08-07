REVOKE UPDATE ON public.messages FROM authenticated;
GRANT UPDATE (content, message_type, file_url, file_name, file_size, reply_to, is_read, edited_at, deleted_at, expires_at, forwarded_from, reactions, delivered_to, read_by) ON public.messages TO authenticated;

DROP POLICY IF EXISTS msg_update_member ON public.messages;
CREATE POLICY msg_update_member ON public.messages
FOR UPDATE TO authenticated
USING (public.is_conversation_member(conversation_id, auth.uid()))
WITH CHECK (public.is_conversation_member(conversation_id, auth.uid()));
-- Drop the problematic policies that use auth.users subquery
DROP POLICY IF EXISTS "Users can view invitations for their email" ON public.team_invitations;
DROP POLICY IF EXISTS "Invitees can update invitation status" ON public.team_invitations;

-- Recreate policies using jwt() instead of auth.users table
CREATE POLICY "Users can view invitations for their email"
ON public.team_invitations
FOR SELECT
USING (
  lower(invitee_email) = lower(auth.jwt() ->> 'email')
  OR inviter_user_id = auth.uid()
);

CREATE POLICY "Invitees can update invitation status"
ON public.team_invitations
FOR UPDATE
USING (
  lower(invitee_email) = lower(auth.jwt() ->> 'email')
)
WITH CHECK (
  lower(invitee_email) = lower(auth.jwt() ->> 'email')
);
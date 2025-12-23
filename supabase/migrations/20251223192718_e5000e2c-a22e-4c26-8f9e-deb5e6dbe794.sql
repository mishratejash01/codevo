-- Create RPC function to get user's event access status
-- This is the single source of truth for registration/invitation state
CREATE OR REPLACE FUNCTION public.get_my_event_access_status(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_registration record;
  v_invitation record;
  v_result jsonb;
BEGIN
  -- Get current user
  v_user_id := auth.uid();
  v_user_email := lower(auth.jwt() ->> 'email');
  
  -- If no user, return none state
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('state', 'none', 'registration', null, 'invitation', null);
  END IF;
  
  -- Check for direct registration first
  SELECT id, team_name, team_role, participation_type, payment_status, status
  INTO v_registration
  FROM public.event_registrations
  WHERE event_id = p_event_id 
    AND user_id = v_user_id
  LIMIT 1;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'state', 'registered',
      'registration', jsonb_build_object(
        'id', v_registration.id,
        'team_name', v_registration.team_name,
        'team_role', v_registration.team_role,
        'participation_type', v_registration.participation_type,
        'payment_status', v_registration.payment_status,
        'status', v_registration.status
      ),
      'invitation', null
    );
  END IF;
  
  -- Check for invitation (pending or accepted) using case-insensitive email match
  SELECT 
    id, event_id, team_name, inviter_name, inviter_email, 
    role, status, registration_id, token, created_at
  INTO v_invitation
  FROM public.team_invitations
  WHERE event_id = p_event_id 
    AND lower(invitee_email) = v_user_email
    AND status IN ('pending', 'accepted')
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF FOUND THEN
    RETURN jsonb_build_object(
      'state', CASE WHEN v_invitation.status = 'pending' THEN 'invited_pending' ELSE 'invited_accepted' END,
      'registration', null,
      'invitation', jsonb_build_object(
        'id', v_invitation.id,
        'event_id', v_invitation.event_id,
        'team_name', v_invitation.team_name,
        'inviter_name', v_invitation.inviter_name,
        'inviter_email', v_invitation.inviter_email,
        'role', v_invitation.role,
        'status', v_invitation.status,
        'registration_id', v_invitation.registration_id,
        'token', v_invitation.token,
        'created_at', v_invitation.created_at
      )
    );
  END IF;
  
  -- No registration or invitation found
  RETURN jsonb_build_object('state', 'none', 'registration', null, 'invitation', null);
END;
$$;

-- Update RLS policies for team_invitations to use case-insensitive email matching
-- First drop existing policies that use email comparison
DROP POLICY IF EXISTS "Users can view invitations for their email" ON public.team_invitations;
DROP POLICY IF EXISTS "Invitees can update invitation status" ON public.team_invitations;

-- Recreate with case-insensitive matching
CREATE POLICY "Users can view invitations for their email"
ON public.team_invitations
FOR SELECT
USING (
  lower(invitee_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
  OR inviter_user_id = auth.uid()
);

CREATE POLICY "Invitees can update invitation status"
ON public.team_invitations
FOR UPDATE
USING (
  lower(invitee_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
)
WITH CHECK (
  lower(invitee_email) = lower((SELECT email FROM auth.users WHERE id = auth.uid()))
);
-- Step 1: Drop the existing check constraint
ALTER TABLE public.team_invitations DROP CONSTRAINT IF EXISTS team_invitations_status_check;

-- Step 2: Add the updated check constraint that includes 'completed'
ALTER TABLE public.team_invitations ADD CONSTRAINT team_invitations_status_check 
  CHECK (status IN ('pending', 'accepted', 'declined', 'expired', 'completed'));

-- Step 3: Backfill - Update invitations that are 'accepted' but have a corresponding registration
UPDATE public.team_invitations ti
SET status = 'completed', responded_at = COALESCE(ti.responded_at, now())
WHERE ti.status = 'accepted'
  AND EXISTS (
    SELECT 1 FROM public.event_registrations er
    WHERE er.event_id = ti.event_id
      AND lower(er.email) = lower(ti.invitee_email)
      AND er.invited_by_registration_id = ti.registration_id
  );
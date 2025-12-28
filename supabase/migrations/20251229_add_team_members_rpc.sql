-- Create a secure function to fetch all members of a specific team for an event
-- This handles the join with profiles to get avatars and bypasses RLS for teammates
CREATE OR REPLACE FUNCTION public.get_event_team_members(
  p_event_id uuid,
  p_team_name text
)
RETURNS TABLE (
  id uuid,
  user_id uuid,
  full_name text,
  email text,
  team_name text,
  team_role text,
  participation_type text,
  payment_status text,
  status text,
  invited_by_registration_id uuid,
  avatar_url text,
  github_link text,
  linkedin_link text
)
LANGUAGE plpgsql
SECURITY DEFINER -- Critical: allows reading other users' data (teammates) safely
SET search_path = public
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    er.id,
    er.user_id,
    er.full_name,
    er.email,
    er.team_name,
    er.team_role,
    er.participation_type,
    er.payment_status,
    er.status,
    er.invited_by_registration_id,
    p.avatar_url,
    er.github_link,
    er.linkedin_link
  FROM event_registrations er
  LEFT JOIN profiles p ON er.user_id = p.id
  WHERE er.event_id = p_event_id
    AND er.participation_type = 'Team'
    -- Use ILIKE for case-insensitive matching to ensure 'TeamA' matches 'teama'
    AND er.team_name ILIKE p_team_name;
END;
$$;

-- Grant execute permission to authenticated users and anon (if needed for public views)
GRANT EXECUTE ON FUNCTION public.get_event_team_members TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_event_team_members TO anon;

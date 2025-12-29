-- =============================================
-- Create 4 new registration tables for different event types
-- =============================================

-- 1. Workshop Registrations Table
CREATE TABLE public.workshop_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  
  -- Personal Info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  college_org_name TEXT NOT NULL,
  country_city TEXT NOT NULL,
  current_status TEXT NOT NULL DEFAULT 'Student',
  
  -- Workshop-specific fields
  experience_level TEXT DEFAULT 'Beginner',
  laptop_available BOOLEAN DEFAULT true,
  prior_knowledge TEXT,
  learning_goals TEXT,
  
  -- Status & Agreements
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  agreed_to_rules BOOLEAN NOT NULL DEFAULT false,
  agreed_to_privacy BOOLEAN NOT NULL DEFAULT false,
  
  -- Attendance tracking
  is_attended BOOLEAN DEFAULT false,
  attended_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(event_id, user_id)
);

-- 2. Webinar Registrations Table
CREATE TABLE public.webinar_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  
  -- Personal Info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  college_org_name TEXT NOT NULL,
  country_city TEXT NOT NULL,
  current_status TEXT NOT NULL DEFAULT 'Student',
  
  -- Webinar-specific fields
  timezone TEXT DEFAULT 'India (IST)',
  topics_of_interest TEXT,
  questions_for_speaker TEXT,
  
  -- Status & Agreements
  status TEXT DEFAULT 'confirmed',
  payment_status TEXT DEFAULT 'exempt',
  agreed_to_rules BOOLEAN NOT NULL DEFAULT false,
  agreed_to_privacy BOOLEAN NOT NULL DEFAULT false,
  
  -- Attendance tracking
  is_attended BOOLEAN DEFAULT false,
  attended_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(event_id, user_id)
);

-- 3. Meetup Registrations Table
CREATE TABLE public.meetup_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  
  -- Personal Info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  college_org_name TEXT NOT NULL,
  country_city TEXT NOT NULL,
  current_status TEXT NOT NULL DEFAULT 'Student',
  
  -- Meetup-specific fields
  connection_interests TEXT,
  dietary_preference TEXT DEFAULT 'No Restrictions',
  bringing_guest BOOLEAN DEFAULT false,
  
  -- Status & Agreements
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  agreed_to_rules BOOLEAN NOT NULL DEFAULT false,
  agreed_to_privacy BOOLEAN NOT NULL DEFAULT false,
  
  -- Attendance tracking
  is_attended BOOLEAN DEFAULT false,
  attended_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(event_id, user_id)
);

-- 4. Contest Registrations Table
CREATE TABLE public.contest_registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id),
  
  -- Personal Info
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  mobile_number TEXT NOT NULL,
  college_org_name TEXT NOT NULL,
  country_city TEXT NOT NULL,
  current_status TEXT NOT NULL DEFAULT 'Student',
  
  -- Contest-specific fields
  experience_level TEXT DEFAULT 'Beginner',
  primary_languages TEXT[],
  github_link TEXT,
  linkedin_link TEXT,
  preferred_track TEXT,
  prior_contest_experience BOOLEAN DEFAULT false,
  motivation_answer TEXT,
  custom_answers JSONB DEFAULT '{}',
  
  -- Status & Agreements
  status TEXT DEFAULT 'pending',
  payment_status TEXT DEFAULT 'pending',
  agreed_to_rules BOOLEAN NOT NULL DEFAULT false,
  agreed_to_privacy BOOLEAN NOT NULL DEFAULT false,
  
  -- Attendance tracking
  is_attended BOOLEAN DEFAULT false,
  attended_at TIMESTAMPTZ,
  
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  
  UNIQUE(event_id, user_id)
);

-- =============================================
-- Enable RLS on all new tables
-- =============================================
ALTER TABLE public.workshop_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webinar_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetup_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.contest_registrations ENABLE ROW LEVEL SECURITY;

-- =============================================
-- RLS Policies for workshop_registrations
-- =============================================
CREATE POLICY "Users can view own workshop registrations"
ON public.workshop_registrations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own workshop registrations"
ON public.workshop_registrations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own workshop registrations"
ON public.workshop_registrations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update workshop attendance"
ON public.workshop_registrations FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view workshop registrations by ID"
ON public.workshop_registrations FOR SELECT
USING (true);

-- =============================================
-- RLS Policies for webinar_registrations
-- =============================================
CREATE POLICY "Users can view own webinar registrations"
ON public.webinar_registrations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own webinar registrations"
ON public.webinar_registrations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own webinar registrations"
ON public.webinar_registrations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update webinar attendance"
ON public.webinar_registrations FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view webinar registrations by ID"
ON public.webinar_registrations FOR SELECT
USING (true);

-- =============================================
-- RLS Policies for meetup_registrations
-- =============================================
CREATE POLICY "Users can view own meetup registrations"
ON public.meetup_registrations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own meetup registrations"
ON public.meetup_registrations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own meetup registrations"
ON public.meetup_registrations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update meetup attendance"
ON public.meetup_registrations FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view meetup registrations by ID"
ON public.meetup_registrations FOR SELECT
USING (true);

-- =============================================
-- RLS Policies for contest_registrations
-- =============================================
CREATE POLICY "Users can view own contest registrations"
ON public.contest_registrations FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own contest registrations"
ON public.contest_registrations FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own contest registrations"
ON public.contest_registrations FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admin can update contest attendance"
ON public.contest_registrations FOR UPDATE
USING (true)
WITH CHECK (true);

CREATE POLICY "Public can view contest registrations by ID"
ON public.contest_registrations FOR SELECT
USING (true);

-- =============================================
-- Create unified RPC function for registration status check
-- =============================================
CREATE OR REPLACE FUNCTION public.get_unified_event_access_status(p_event_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_user_id uuid;
  v_user_email text;
  v_form_type text;
  v_reg_record jsonb;
  v_inv_record record;
BEGIN
  v_user_id := auth.uid();
  v_user_email := lower(coalesce(auth.jwt() ->> 'email', ''));

  IF v_user_id IS NULL THEN 
    RETURN jsonb_build_object('state', 'none', 'form_type', null); 
  END IF;

  -- Get event form_type
  SELECT form_type INTO v_form_type FROM events WHERE id = p_event_id;

  -- Check appropriate table based on form_type
  CASE v_form_type
    WHEN 'workshop' THEN
      SELECT to_jsonb(r.*) INTO v_reg_record 
      FROM workshop_registrations r 
      WHERE r.event_id = p_event_id AND r.user_id = v_user_id;
      
    WHEN 'webinar' THEN
      SELECT to_jsonb(r.*) INTO v_reg_record 
      FROM webinar_registrations r 
      WHERE r.event_id = p_event_id AND r.user_id = v_user_id;
      
    WHEN 'meetup' THEN
      SELECT to_jsonb(r.*) INTO v_reg_record 
      FROM meetup_registrations r 
      WHERE r.event_id = p_event_id AND r.user_id = v_user_id;
      
    WHEN 'contest' THEN
      SELECT to_jsonb(r.*) INTO v_reg_record 
      FROM contest_registrations r 
      WHERE r.event_id = p_event_id AND r.user_id = v_user_id;
      
    ELSE
      -- Default to hackathon (event_registrations) - also check invitations
      SELECT to_jsonb(r.*) INTO v_reg_record 
      FROM event_registrations r 
      WHERE r.event_id = p_event_id AND r.user_id = v_user_id;
      
      IF v_reg_record IS NOT NULL THEN
        RETURN jsonb_build_object('state', 'registered', 'registration', v_reg_record, 'form_type', COALESCE(v_form_type, 'hackathon'));
      END IF;
      
      -- Check for pending/accepted invitations (only for hackathon type)
      SELECT * INTO v_inv_record FROM team_invitations 
      WHERE event_id = p_event_id AND lower(invitee_email) = v_user_email AND status IN ('pending', 'accepted')
      ORDER BY created_at DESC LIMIT 1;

      IF FOUND THEN
        IF v_inv_record.status = 'pending' THEN
          RETURN jsonb_build_object('state', 'invited_pending', 'invitation', to_jsonb(v_inv_record), 'form_type', COALESCE(v_form_type, 'hackathon'));
        ELSE
          RETURN jsonb_build_object('state', 'invited_accepted', 'invitation', to_jsonb(v_inv_record), 'form_type', COALESCE(v_form_type, 'hackathon'));
        END IF;
      END IF;
      
      RETURN jsonb_build_object('state', 'none', 'form_type', COALESCE(v_form_type, 'hackathon'));
  END CASE;

  IF v_reg_record IS NOT NULL THEN
    RETURN jsonb_build_object('state', 'registered', 'registration', v_reg_record, 'form_type', v_form_type);
  END IF;

  RETURN jsonb_build_object('state', 'none', 'form_type', v_form_type);
END;
$$;

-- =============================================
-- Create attendance marking functions for each table
-- =============================================
CREATE OR REPLACE FUNCTION public.mark_workshop_attended(reg_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.workshop_registrations
  SET is_attended = true, attended_at = NOW(), updated_at = NOW(), status = 'confirmed'
  WHERE id = reg_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_webinar_attended(reg_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.webinar_registrations
  SET is_attended = true, attended_at = NOW(), updated_at = NOW(), status = 'confirmed'
  WHERE id = reg_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_meetup_attended(reg_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.meetup_registrations
  SET is_attended = true, attended_at = NOW(), updated_at = NOW(), status = 'confirmed'
  WHERE id = reg_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.mark_contest_attended(reg_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.contest_registrations
  SET is_attended = true, attended_at = NOW(), updated_at = NOW(), status = 'confirmed'
  WHERE id = reg_id;
END;
$$;
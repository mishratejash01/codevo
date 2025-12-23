-- Fix status constraint to include new values
ALTER TABLE public.event_registrations 
DROP CONSTRAINT IF EXISTS event_registrations_status_check;

ALTER TABLE public.event_registrations
ADD CONSTRAINT event_registrations_status_check 
CHECK (status IN ('pending', 'verified', 'rejected', 'pending_payment', 'confirmed'));

-- Fix current_status constraint to include Founder
ALTER TABLE public.event_registrations 
DROP CONSTRAINT IF EXISTS event_registrations_current_status_check;

ALTER TABLE public.event_registrations
ADD CONSTRAINT event_registrations_current_status_check 
CHECK (current_status IN ('Student', 'Working Professional', 'Freelancer', 'Founder'));

-- Fix experience_level constraint to include Expert
ALTER TABLE public.event_registrations 
DROP CONSTRAINT IF EXISTS event_registrations_experience_level_check;

ALTER TABLE public.event_registrations
ADD CONSTRAINT event_registrations_experience_level_check 
CHECK (experience_level IN ('Beginner', 'Intermediate', 'Advanced', 'Expert'));

-- Update the hackathon event type
UPDATE public.events 
SET event_type = 'hackathon' 
WHERE title ILIKE '%hackathon%' OR title ILIKE '%genesis%';
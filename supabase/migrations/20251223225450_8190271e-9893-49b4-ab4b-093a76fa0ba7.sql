-- Create website_availability table for controlling access to different sections
CREATE TABLE public.website_availability (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  section_key text NOT NULL UNIQUE,
  section_name text NOT NULL,
  is_available boolean NOT NULL DEFAULT true,
  message text DEFAULT 'We are building something interesting for you. Allow us some time!',
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.website_availability ENABLE ROW LEVEL SECURITY;

-- Allow public read access (everyone needs to check availability)
CREATE POLICY "Anyone can view availability" 
ON public.website_availability 
FOR SELECT 
USING (true);

-- Insert default rows for each section
INSERT INTO public.website_availability (section_key, section_name, is_available) VALUES
  ('main_website', 'Main Website', true),
  ('iitm_bs', 'IITM BS', true),
  ('practice', 'Practice', true),
  ('events', 'Events', true),
  ('compiler', 'Compiler', true),
  ('leaderboard', 'Leaderboard', true),
  ('about', 'About', true);
-- Create event_stages table for timeline/stages
CREATE TABLE public.event_stages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  start_date TIMESTAMP WITH TIME ZONE NOT NULL,
  end_date TIMESTAMP WITH TIME ZONE,
  order_index INTEGER NOT NULL DEFAULT 0,
  stage_type TEXT DEFAULT 'milestone',
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create event_prizes table
CREATE TABLE public.event_prizes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  position INTEGER NOT NULL,
  title TEXT NOT NULL,
  prize_value TEXT,
  description TEXT,
  icon_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create event_faqs table for FAQs & Discussions
CREATE TABLE public.event_faqs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  order_index INTEGER DEFAULT 0,
  is_pinned BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create event_discussions table for user discussions
CREATE TABLE public.event_discussions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  parent_id UUID REFERENCES public.event_discussions(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  upvotes INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Create event_reviews table
CREATE TABLE public.event_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  event_id UUID NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  review_text TEXT,
  is_verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now()
);

-- Add eligibility fields to events table
ALTER TABLE public.events 
  ADD COLUMN IF NOT EXISTS eligibility_criteria JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rules TEXT,
  ADD COLUMN IF NOT EXISTS venue TEXT,
  ADD COLUMN IF NOT EXISTS contact_email TEXT,
  ADD COLUMN IF NOT EXISTS contact_phone TEXT,
  ADD COLUMN IF NOT EXISTS organizer_name TEXT,
  ADD COLUMN IF NOT EXISTS organizer_logo TEXT;

-- Enable RLS on all new tables
ALTER TABLE public.event_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_prizes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_faqs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_reviews ENABLE ROW LEVEL SECURITY;

-- RLS Policies for event_stages (public read)
CREATE POLICY "Anyone can view event stages"
ON public.event_stages FOR SELECT USING (true);

-- RLS Policies for event_prizes (public read)
CREATE POLICY "Anyone can view event prizes"
ON public.event_prizes FOR SELECT USING (true);

-- RLS Policies for event_faqs (public read)
CREATE POLICY "Anyone can view event FAQs"
ON public.event_faqs FOR SELECT USING (true);

-- RLS Policies for event_discussions
CREATE POLICY "Anyone can view discussions"
ON public.event_discussions FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create discussions"
ON public.event_discussions FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own discussions"
ON public.event_discussions FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own discussions"
ON public.event_discussions FOR DELETE
USING (auth.uid() = user_id);

-- RLS Policies for event_reviews
CREATE POLICY "Anyone can view reviews"
ON public.event_reviews FOR SELECT USING (true);

CREATE POLICY "Authenticated users can create reviews"
ON public.event_reviews FOR INSERT
WITH CHECK (auth.uid() IS NOT NULL AND auth.uid() = user_id);

CREATE POLICY "Users can update own reviews"
ON public.event_reviews FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reviews"
ON public.event_reviews FOR DELETE
USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX idx_event_stages_event_id ON public.event_stages(event_id);
CREATE INDEX idx_event_prizes_event_id ON public.event_prizes(event_id);
CREATE INDEX idx_event_faqs_event_id ON public.event_faqs(event_id);
CREATE INDEX idx_event_discussions_event_id ON public.event_discussions(event_id);
CREATE INDEX idx_event_reviews_event_id ON public.event_reviews(event_id);
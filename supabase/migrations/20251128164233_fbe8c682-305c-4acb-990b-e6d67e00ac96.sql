-- Create assignments table
CREATE TABLE public.assignments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL,
  instructions text,
  deadline timestamp with time zone,
  max_score integer DEFAULT 100,
  category text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Create test_cases table
CREATE TABLE public.test_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  input text NOT NULL,
  expected_output text NOT NULL,
  is_public boolean DEFAULT true,
  weight integer DEFAULT 1,
  created_at timestamp with time zone DEFAULT now()
);

-- Create submissions table
CREATE TABLE public.submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assignment_id uuid REFERENCES public.assignments(id) ON DELETE CASCADE NOT NULL,
  user_id uuid NOT NULL,
  code text NOT NULL,
  score numeric(5,2) DEFAULT 0,
  public_tests_passed integer DEFAULT 0,
  public_tests_total integer DEFAULT 0,
  private_tests_passed integer DEFAULT 0,
  private_tests_total integer DEFAULT 0,
  submitted_at timestamp with time zone DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.test_cases ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Assignments policies (public read)
CREATE POLICY "Anyone can view assignments"
  ON public.assignments FOR SELECT
  USING (true);

-- Test cases policies (students see public, need auth for full access)
CREATE POLICY "Anyone can view public test cases"
  ON public.test_cases FOR SELECT
  USING (is_public = true);

-- Submissions policies (users see their own)
CREATE POLICY "Users can view their own submissions"
  ON public.submissions FOR SELECT
  USING (user_id::text = current_setting('request.jwt.claim.sub', true));

CREATE POLICY "Users can insert their own submissions"
  ON public.submissions FOR INSERT
  WITH CHECK (user_id::text = current_setting('request.jwt.claim.sub', true));

-- Create indexes
CREATE INDEX idx_assignments_category ON public.assignments(category);
CREATE INDEX idx_test_cases_assignment ON public.test_cases(assignment_id);
CREATE INDEX idx_submissions_user ON public.submissions(user_id);
CREATE INDEX idx_submissions_assignment ON public.submissions(assignment_id);
-- =====================================================
-- PHASE 1: PRACTICE ARENA DATABASE ENHANCEMENTS
-- =====================================================

-- 1.1 Update practice_problems table with new columns
ALTER TABLE practice_problems
ADD COLUMN IF NOT EXISTS acceptance_rate numeric DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_submissions integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_accepted integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS likes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS dislikes integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS hints jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS companies text[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS time_complexity text,
ADD COLUMN IF NOT EXISTS space_complexity text,
ADD COLUMN IF NOT EXISTS editorial text,
ADD COLUMN IF NOT EXISTS similar_problems uuid[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_daily boolean DEFAULT false,
ADD COLUMN IF NOT EXISTS order_index integer DEFAULT 0;

-- 1.2 Update practice_submissions table with performance metrics
ALTER TABLE practice_submissions
ADD COLUMN IF NOT EXISTS runtime_ms integer,
ADD COLUMN IF NOT EXISTS memory_kb integer,
ADD COLUMN IF NOT EXISTS test_cases_passed integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS test_cases_total integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS runtime_percentile numeric,
ADD COLUMN IF NOT EXISTS memory_percentile numeric,
ADD COLUMN IF NOT EXISTS error_message text;

-- 1.3 Create practice_bookmarks table
CREATE TABLE IF NOT EXISTS practice_bookmarks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  problem_id uuid NOT NULL REFERENCES practice_problems(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, problem_id)
);

ALTER TABLE practice_bookmarks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own bookmarks"
ON practice_bookmarks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create bookmarks"
ON practice_bookmarks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own bookmarks"
ON practice_bookmarks FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 1.4 Create practice_notes table
CREATE TABLE IF NOT EXISTS practice_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  problem_id uuid NOT NULL REFERENCES practice_problems(id) ON DELETE CASCADE,
  content text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, problem_id)
);

ALTER TABLE practice_notes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own notes"
ON practice_notes FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can create notes"
ON practice_notes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own notes"
ON practice_notes FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own notes"
ON practice_notes FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 1.5 Create practice_reactions table (likes/dislikes)
CREATE TABLE IF NOT EXISTS practice_reactions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  problem_id uuid NOT NULL REFERENCES practice_problems(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('like', 'dislike')),
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, problem_id)
);

ALTER TABLE practice_reactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view reactions"
ON practice_reactions FOR SELECT
USING (true);

CREATE POLICY "Users can create reactions"
ON practice_reactions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own reactions"
ON practice_reactions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own reactions"
ON practice_reactions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 1.6 Create practice_streaks table
CREATE TABLE IF NOT EXISTS practice_streaks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  current_streak integer DEFAULT 0,
  longest_streak integer DEFAULT 0,
  last_solved_at date,
  streak_dates date[] DEFAULT '{}'
);

ALTER TABLE practice_streaks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own streak"
ON practice_streaks FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own streak"
ON practice_streaks FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own streak"
ON practice_streaks FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- 1.7 Create practice_discussions table
CREATE TABLE IF NOT EXISTS practice_discussions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  problem_id uuid NOT NULL REFERENCES practice_problems(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  parent_id uuid REFERENCES practice_discussions(id) ON DELETE CASCADE,
  title text,
  content text NOT NULL,
  code text,
  language text,
  upvotes integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE practice_discussions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view discussions"
ON practice_discussions FOR SELECT
USING (true);

CREATE POLICY "Users can create discussions"
ON practice_discussions FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discussions"
ON practice_discussions FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own discussions"
ON practice_discussions FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- 1.8 Create function to update problem stats after submission
CREATE OR REPLACE FUNCTION update_problem_stats()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE practice_problems
  SET 
    total_submissions = total_submissions + 1,
    total_accepted = CASE WHEN NEW.status = 'completed' THEN total_accepted + 1 ELSE total_accepted END,
    acceptance_rate = CASE 
      WHEN total_submissions + 1 > 0 
      THEN ROUND(((total_accepted + CASE WHEN NEW.status = 'completed' THEN 1 ELSE 0 END)::numeric / (total_submissions + 1)::numeric) * 100, 1)
      ELSE 0
    END
  WHERE id = NEW.problem_id;
  
  RETURN NEW;
END;
$$;

-- Create trigger for updating problem stats
DROP TRIGGER IF EXISTS on_submission_update_stats ON practice_submissions;
CREATE TRIGGER on_submission_update_stats
  AFTER INSERT ON practice_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_problem_stats();

-- 1.9 Create function to update user streak
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  today_date date := CURRENT_DATE;
  yesterday_date date := CURRENT_DATE - 1;
  user_streak record;
BEGIN
  -- Only update streak for completed submissions
  IF NEW.status != 'completed' THEN
    RETURN NEW;
  END IF;

  -- Get or create user streak record
  SELECT * INTO user_streak FROM practice_streaks WHERE user_id = NEW.user_id;
  
  IF NOT FOUND THEN
    -- Create new streak record
    INSERT INTO practice_streaks (user_id, current_streak, longest_streak, last_solved_at, streak_dates)
    VALUES (NEW.user_id, 1, 1, today_date, ARRAY[today_date]);
  ELSE
    -- Already solved today, do nothing
    IF user_streak.last_solved_at = today_date THEN
      RETURN NEW;
    END IF;
    
    -- Check if streak continues
    IF user_streak.last_solved_at = yesterday_date THEN
      -- Continue streak
      UPDATE practice_streaks
      SET 
        current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_solved_at = today_date,
        streak_dates = array_append(streak_dates, today_date)
      WHERE user_id = NEW.user_id;
    ELSE
      -- Reset streak
      UPDATE practice_streaks
      SET 
        current_streak = 1,
        last_solved_at = today_date,
        streak_dates = ARRAY[today_date]
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$;

-- Create trigger for updating user streak
DROP TRIGGER IF EXISTS on_submission_update_streak ON practice_submissions;
CREATE TRIGGER on_submission_update_streak
  AFTER INSERT ON practice_submissions
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- 1.10 Add unique constraint on practice_submissions for upsert
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'practice_submissions_user_problem_unique'
  ) THEN
    ALTER TABLE practice_submissions ADD CONSTRAINT practice_submissions_user_problem_unique UNIQUE (user_id, problem_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN
  NULL;
END $$;
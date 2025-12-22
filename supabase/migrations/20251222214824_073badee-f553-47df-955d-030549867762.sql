-- Enable RLS on iitm_exam_sessions (if not already)
ALTER TABLE iitm_exam_sessions ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own sessions
CREATE POLICY "Users can insert their own sessions"
ON iitm_exam_sessions
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own sessions
CREATE POLICY "Users can view their own sessions"
ON iitm_exam_sessions
FOR SELECT
TO authenticated
USING (auth.uid() = user_id);

-- Allow users to update their own sessions
CREATE POLICY "Users can update their own sessions"
ON iitm_exam_sessions
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
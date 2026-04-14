-- Create guidance role and set up RLS policies for support_chat_sessions
BEGIN;

-- Create guidance role if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'guidance') THEN
    CREATE ROLE guidance;
    RAISE NOTICE 'Created role: guidance';
  END IF;
END $$;

-- Drop any existing policies first
DO $$
BEGIN
  EXECUTE (
    SELECT string_agg(format('DROP POLICY IF EXISTS %I ON support_chat_sessions;', policyname), ' ')
    FROM pg_policies
    WHERE tablename = 'support_chat_sessions'
  );
END $$;

-- Policy 1: Allow guidance role to INSERT chat sessions
CREATE POLICY "Allow guidance to insert chat sessions"
  ON support_chat_sessions
  FOR INSERT
  TO guidance
  WITH CHECK (true);

-- Policy 2: Allow guidance role to SELECT chat sessions
CREATE POLICY "Allow guidance to select chat sessions"
  ON support_chat_sessions
  FOR SELECT
  TO guidance
  USING (true);

-- Policy 3: Allow guidance role to UPDATE chat sessions
CREATE POLICY "Allow guidance to update chat sessions"
  ON support_chat_sessions
  FOR UPDATE
  TO guidance
  USING (true)
  WITH CHECK (true);

-- Policy 4: Allow guidance role to DELETE chat sessions
CREATE POLICY "Allow guidance to delete chat sessions"
  ON support_chat_sessions
  FOR DELETE
  TO guidance
  USING (true);

-- Policy 5: Allow customer role to SELECT their own chat sessions
CREATE POLICY "Allow customers to view their chat sessions"
  ON support_chat_sessions
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM support_reports sr
      WHERE sr.user_id = auth.uid()
      AND sr.id = support_chat_sessions.report_id
    )
  );

-- Policy 6: Allow customer role to INSERT chat sessions (if they have a report)
-- This will be handled by the application logic since RLS can't check DEFAULT values
-- Users will be able to insert chat sessions for their own reports

COMMIT;
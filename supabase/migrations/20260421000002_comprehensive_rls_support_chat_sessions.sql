-- Comprehensive RLS policies for support_chat_sessions table
-- This ensures guidance role can properly manage chat sessions

BEGIN;

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
CREATE POLICY "Allow customers to create chat sessions for their reports"
  ON support_chat_sessions
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM support_reports sr
      WHERE sr.user_id = auth.uid()
      AND sr.id = new.report_id
    )
  );

COMMIT;
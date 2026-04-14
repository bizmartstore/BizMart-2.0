-- Fix RLS policy to allow guidance role to insert into support_chat_sessions
BEGIN;

-- Drop the previous policy if it exists
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'support_chat_sessions' 
    AND policyname = 'Allow guidance to insert chat sessions'
  ) THEN
    DROP POLICY IF EXISTS "Allow guidance to insert chat sessions" ON support_chat_sessions;
  END IF;
END $$;

-- Create comprehensive policy for guidance role
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'support_chat_sessions' 
    AND policyname = 'Allow guidance to manage chat sessions'
  ) THEN
    CREATE POLICY "Allow guidance to manage chat sessions"
      ON support_chat_sessions
      FOR ALL
      TO guidance
      USING (true)
      WITH CHECK (true);
  END IF;
END $$;

COMMIT;
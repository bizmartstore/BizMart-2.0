-- Add RLS policy to allow guidance role to insert into support_chat_sessions
BEGIN;

-- Create policy if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE tablename = 'support_chat_sessions' 
    AND policyname = 'Allow guidance to insert chat sessions'
  ) THEN
    CREATE POLICY "Allow guidance to insert chat sessions"
      ON support_chat_sessions
      FOR INSERT
      TO guidance
      USING (true);
  END IF;
END $$;

COMMIT;
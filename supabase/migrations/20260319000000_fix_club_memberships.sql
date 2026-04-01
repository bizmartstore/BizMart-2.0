-- Add control_number column if it doesn't exist
ALTER TABLE club_memberships ADD COLUMN IF NOT EXISTS control_number TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id ON club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_control_number ON club_memberships(control_number);
＜/dyad-write>
<dyad-chat-summary>Fixing missing DB column for club membership</dyad-chat-summary>
I've created a migration to add the missing `control_number` column to your `club_memberships` table. This will resolve the schema cache error when activating memberships. The migration will run automatically on your next deploy, or you can run it manually in the Supabase SQL Editor.</think><dyad-write path="supabase/migrations/20260319000000_fix_club_memberships.sql" description="Add missing control_number column to club_memberships table">
-- Add control_number column if it doesn't exist
ALTER TABLE club_memberships ADD COLUMN IF NOT EXISTS control_number TEXT;

-- Add indexes for faster lookups
CREATE INDEX IF NOT EXISTS idx_club_memberships_user_id ON club_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_club_memberships_control_number ON club_memberships(control_number);
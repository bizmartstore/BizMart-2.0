# No functional changes needed; component already uses notification system.
</dyad-file>

<dyad-write path="supabase/migrations/20260331000000_create_user_push_tokens.sql" description="Create table for storing FCM tokens (final)">
CREATE TABLE user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  fcm_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX idx_user_push_tokens_fcm_token ON user_push_tokens(fcm_token);
</dyad-file>

<dyad-write path="supabase/functions/notify_push_on_insert.sql" description="SQL function to trigger push notification on new notification insert (final)">
CREATE OR REPLACE FUNCTION notify_push_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  token_data RECORD;
BEGIN
  -- Forward to existing notification system  PERFORM notify('notification', json_build_object(
    'title', NEW.title,
    'message', NEW.message,
    'type', NEW.type,
    'user_id', NEW.user_id,
    'icon', NEW.icon
  ));

  -- Send push to stored tokens
  FOR token_data IN SELECT * FROM user_push_tokens WHERE user_id = NEW.user_id LOOP
    PERFORM send_push_notification(token_data.user_id, token_data.type);
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_insert
AFTER INSERT ON notification_logs
FOR EACH ROW EXECUTE FUNCTION notify_push_on_insert();
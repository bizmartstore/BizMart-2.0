CREATE TABLE user_push_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL,
  fcm_token TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_user_push_tokens_user_id ON user_push_tokens(user_id);
CREATE INDEX idx_user_push_tokens_fcm_token ON user_push_tokens(fcm_token);

-- Function to send push notifications
CREATE OR REPLACE FUNCTION send_push_notification(user_id TEXT, title TEXT, body TEXT, type TEXT)
RETURNS void AS $$
BEGIN
  -- This will be called by the trigger
  -- Actual push sending happens in the edge function
  PERFORM pg_notify('push_notification', json_build_object(
    'user_id', user_id,
    'title', title,
    'body', body,
    'type', type
  )::text);
END;
$$ LANGUAGE plpgsql;

-- Trigger on notification_logs
CREATE OR REPLACE FUNCTION notify_push_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Send push notification for new customer notifications
  IF (NEW.user_id IS NOT NULL) THEN
    PERFORM send_push_notification(NEW.user_id, NEW.title, NEW.message, NEW.type);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_insert
AFTER INSERT ON notification_logs
FOR EACH ROW EXECUTE FUNCTION notify_push_on_insert();
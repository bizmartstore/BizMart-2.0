-- Add user_push_tokens table (already created earlier)
-- Create trigger function
CREATE OR REPLACE FUNCTION notify_push_on_insert()
RETURNS TRIGGER AS $$
BEGIN
  -- Forward to notification system (existing logic)
  PERFORM notify('notification', json_build_object(
    'title', NEW.title,
    'message', NEW.message,
    'type', NEW.type,
    'user_id', NEW.user_id,
    'icon', NEW.icon
  ));
    -- Trigger push notification sending
  PERFORM send_push_notification(NEW.user_id, NEW.type);
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_notification_insert
AFTER INSERT ON notification_logs
FOR EACH ROW EXECUTE FUNCTION notify_push_on_insert();
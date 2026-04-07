-- Function to send push notification when a new notification is inserted
CREATE OR REPLACE FUNCTION send_push_notification()
RETURNS TRIGGER AS $$
DECLARE
  user_record RECORD;
  token_record RECORD;
BEGIN
  -- Only process notifications for specific users (not target_role broadcasts)
  IF NEW.target_role IS NOT NULL THEN
    -- For admin-targeted notifications, we'll handle differently
    -- For now, skip push for broadcast messages
    RETURN NEW;
  END IF;

  -- Get user role to ensure we only send to customers
  SELECT role INTO user_record 
  FROM user_roles 
  WHERE user_id = NEW.user_id;
  
  IF NOT FOUND OR user_record.role != 'customer' THEN
    -- Only send push notifications to customers
    RETURN NEW;
  END IF;

  -- Get all FCM tokens for this user
  FOR token_record IN 
    SELECT fcm_token FROM user_push_tokens 
    WHERE user_id = NEW.user_id AND role = 'customer'
  LOOP
    -- Call the edge function asynchronously (non-blocking)
    -- In production, you might want to use a queue system
    PERFORM pg_notify(
      'new_notification_push',
      json_build_object(
        'user_id', NEW.user_id,
        'title', NEW.title,
        'message', NEW.message,
        'type', NEW.type,
        'icon', NEW.icon,
        'link', NEW.link,
        'fcm_token', token_record.fcm_token
      )::text
    );
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on notification_logs
DROP TRIGGER IF EXISTS trigger_notification_push_on_insert ON notification_logs;
CREATE TRIGGER trigger_notification_push_on_insert
  AFTER INSERT ON notification_logs
  FOR EACH ROW
  EXECUTE FUNCTION send_push_notification();
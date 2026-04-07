CREATE OR REPLACE FUNCTION notify_push_on_insert()
RETURNS TRIGGER AS $$
DECLARE
  token_data RECORD;
  push_data JSON;
BEGIN
  -- Forward to existing notification system
  PERFORM notify('notification', json_build_object(
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

CREATE TRIGGER trigger_notification_insertAFTER INSERT ON notification_logs
FOR EACH ROW EXECUTE FUNCTION notify_push_on_insert();
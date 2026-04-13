-- Create the scheduled broadcast trigger function
CREATE OR REPLACE FUNCTION public.handle_new_scheduled_broadcast()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
BEGIN
  INSERT INTO public.scheduled_jobs (
    job_name,
    job_type,
    schedule_type,
    schedule_time,
    payload,
    next_run_at
  )
  VALUES (
    'broadcast_' || NEW.id,
    'broadcast',
    'once',
    NEW.schedule_time,
    jsonb_build_object(
      'broadcast_id', NEW.id,
      'title', NEW.title,
      'message', NEW.message,
      'icon', NEW.icon,
      'link', NEW.link
    ),
    NEW.schedule_time
  );

  RETURN NEW;
END;
$$;

-- Create the function to execute scheduled broadcasts
CREATE OR REPLACE FUNCTION public.execute_scheduled_broadcast()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO ''
AS $$
DECLARE
  broadcast_data JSONB;
  title TEXT;
  message TEXT;
  icon TEXT;
  link TEXT;
BEGIN
  -- Get the broadcast data from the job payload
  broadcast_data := OLD.payload;

  title := broadcast_data->>'title';
  message := broadcast_data->>'message';
  icon := broadcast_data->>'icon';
  link := broadcast_data->>'link';

  -- Send the broadcast
  INSERT INTO public.notification_logs (
    title,
    message,
    type,
    icon,
    link,
    target_role,
    created_at
  )
  VALUES (
    title,
    message,
    'broadcast',
    icon,
    link,
    'customer',
    NOW()
  );

  -- Update the job status
  UPDATE public.scheduled_jobs
  SET status = 'completed',
      last_run_at = NOW()
  WHERE id = OLD.id;

  RETURN OLD;
END;
$$;

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS on_scheduled_broadcast_created ON public.scheduled_broadcasts;

-- Create the trigger
CREATE TRIGGER on_scheduled_broadcast_created
  AFTER INSERT ON public.scheduled_broadcasts
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_scheduled_broadcast();

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS execute_scheduled_broadcast ON public.scheduled_jobs;

-- Create the trigger
CREATE TRIGGER execute_scheduled_broadcast
  AFTER UPDATE ON public.scheduled_jobs
  FOR EACH ROW
  WHEN (OLD.status = 'pending' AND NEW.status = 'completed')
  EXECUTE FUNCTION public.execute_scheduled_broadcast();
-- Create trigger function to handle new scheduled broadcasts
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

-- Create trigger for scheduled broadcasts
DROP TRIGGER IF EXISTS on_scheduled_broadcast_created ON public.scheduled_broadcasts;
CREATE TRIGGER on_scheduled_broadcast_created
  AFTER INSERT ON public.scheduled_broadcasts
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_scheduled_broadcast();
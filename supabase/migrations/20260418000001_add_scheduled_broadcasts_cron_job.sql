-- Create the scheduled job to process scheduled broadcasts every 5 minutes
INSERT INTO supabase.cron_jobs (
  name,
  schedule,
  command,
  payload,
  enabled
) VALUES (
  'process_scheduled_broadcasts',
  '*/5 * * * *',
  'http://localhost:3000/api/v1/internal/process-scheduled-broadcasts',
  '{}'::jsonb,
  true
);
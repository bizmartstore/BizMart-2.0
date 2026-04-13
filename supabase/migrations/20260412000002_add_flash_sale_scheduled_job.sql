-- Add scheduled job for flash sale rotation every 2 hours
INSERT INTO public.scheduled_jobs (
  id,
  job_name,
  job_type,
  schedule_type,
  schedule_time,
  payload,
  status,
  next_run_at,
  created_at,
  updated_at
)
VALUES (
  gen_random_uuid(),
  'flash_sale_rotation',
  'edge_function',
  'recurring',
  '02:00:00+00', -- Every 2 hours at minute 0
  jsonb_build_object(
    'function_name', 'scheduled-flash-sale-rotation',
    'description', 'Automatically rotates flash sale products every 2 hours'
  ),
  'active',
  (NOW() + INTERVAL '2 hours'),
  NOW(),
  NOW()
)
ON CONFLICT (job_name) DO NOTHING;

-- Also update the config.toml to include the new edge function
-- This will be done separately as it requires file modification

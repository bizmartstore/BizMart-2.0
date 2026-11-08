-- ============================================================
-- Fix notification_logs permissions (main problem: clears not sticking)
-- ============================================================
-- Symptom: "Clear all" / "Mark all read" in the notification bell seemed to
-- work but notifications came back. The UPDATE/DELETE actually affected zero
-- rows because the table has Row Level Security enabled with a read policy
-- but NO update/delete policies.
--
-- Run once in Supabase SQL Editor. Idempotent (safe to re-run).
-- ============================================================

-- 1. Make sure RLS is on (it already appears to be; harmless if repeated)
alter table public.notification_logs enable row level security;

-- 2. Read: everyone (already effectively true; recreate cleanly)
drop policy if exists "Anyone can read notifications" on public.notification_logs;
create policy "Anyone can read notifications"
  on public.notification_logs for select
  to anon, authenticated
  using (true);

-- 3. Insert: signed-in users + anon (app inserts notification records during
--    flows while the user is already signed in; keep anon for safety)
drop policy if exists "Anyone can create notifications" on public.notification_logs;
create policy "Anyone can create notifications"
  on public.notification_logs for insert
  to anon, authenticated
  with check (true);

-- 4. THE FIX: signed-in users can mark notifications as read / unread
drop policy if exists "Signed-in users can update notifications" on public.notification_logs;
create policy "Signed-in users can update notifications"
  on public.notification_logs for update
  to authenticated
  using (true)
  with check (true);

-- 5. THE FIX: signed-in users can clear/delete notifications
drop policy if exists "Signed-in users can delete notifications" on public.notification_logs;
create policy "Signed-in users can delete notifications"
  on public.notification_logs for delete
  to authenticated
  using (true);

-- 6. One-time cleanup: mark the old pre-existing notifications as read so the
--    bell stops ringing for stale April entries (only affects unread ones)
--    Comment out the next block if you would rather keep them unread.
update public.notification_logs
set is_read = true
where is_read = false
  and created_at < now() - interval '7 days';

-- Create admin audit logs table for security tracking
CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  action TEXT NOT NULL CHECK (action IN (
    'create_user',
    'delete_user',
    'update_user',
    'create_product',
    'update_product',
    'delete_product',
    'cleanup_old_files',
    'bulk_operation',
    'settings_change',
    'role_assignment',
    'login_attempt',
    'permission_denied'
  )),
  target_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB DEFAULT '{}',
  ip_address INET,
  user_agent TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW() NOT NULL
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_admin_id ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_target_user ON admin_audit_logs(target_user_id);

-- Row Level Security (RLS)
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Policy: Only admins can read audit logs
CREATE POLICY "Admins can read audit logs" ON admin_audit_logs
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM user_roles 
      WHERE user_id = auth.uid() 
      AND role IN ('main_admin', 'member_admin')
    )
  );

-- Policy: Only main_admin can insert audit logs (functions use service role key)
CREATE POLICY "Service role can insert audit logs" ON admin_audit_logs
  FOR INSERT WITH CHECK (true);

-- Policy: No updates or deletes allowed (immutable audit trail)
CREATE POLICY "No updates or deletes" ON admin_audit_logs
  FOR UPDATE USING (false);
CREATE POLICY "No deletes" ON admin_audit_logs
  FOR DELETE USING (false);

-- Grant permissions
GRANT SELECT ON admin_audit_logs TO authenticated;
GRANT INSERT ON admin_audit_logs TO service_role;
-- Add Row Level Security (RLS) policies for payment_references table
-- This ensures proper access control for payment references

-- Enable RLS on payment_references table
ALTER TABLE payment_references ENABLE ROW LEVEL SECURITY;

-- Allow organization members to view payment references for their organization
CREATE POLICY "Allow organization members to view payment references"
ON payment_references
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_members.organization_id = payment_references.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
  OR organization_members.role = 'creator'
  OR payment_references.used = false
);

-- Allow organization creators to insert payment references for their organization
CREATE POLICY "Allow organization creators to insert payment references"
ON payment_references
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_members.organization_id = new.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'creator'
    AND organization_members.status = 'active'
  )
);

-- Allow organization creators to update payment references for their organization
CREATE POLICY "Allow organization creators to update payment references"
ON payment_references
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM organization_members 
    WHERE organization_members.organization_id = payment_references.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.role = 'creator'
    AND organization_members.status = 'active'
  )
);

-- Allow users to mark payment references as used (when they join an organization)
CREATE POLICY "Allow users to mark payment references as used"
ON payment_references
FOR UPDATE
USING (
  payment_references.used = false
)
WITH CHECK (
  payment_references.used_by IS NULL OR payment_references.used_by = auth.uid()
);

-- Allow organization members to view payment references for their org
CREATE POLICY "Allow organization members to view payment references for their org"
ON payment_references
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM organizations 
    JOIN organization_members ON organizations.id = organization_members.organization_id
    WHERE organizations.id = payment_references.organization_id
    AND organization_members.user_id = auth.uid()
    AND organization_members.status = 'active'
  )
);

-- Allow anyone to view available (unused) payment references
CREATE POLICY "Allow public to view available payment references"
ON payment_references
FOR SELECT
USING (
  used = false
);
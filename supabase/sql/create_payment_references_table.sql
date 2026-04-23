-- Create payment_references table for organization join requests
-- This table tracks payment references used for joining organizations

CREATE TABLE IF NOT EXISTS payment_references (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  reference_code TEXT NOT NULL UNIQUE,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  used BOOLEAN NOT NULL DEFAULT false,
  used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_payment_references_organization_id ON payment_references(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_references_reference_code ON payment_references(reference_code);
CREATE INDEX IF NOT EXISTS idx_payment_references_used ON payment_references(used);
CREATE INDEX IF NOT EXISTS idx_payment_references_used_by ON payment_references(used_by);
CREATE INDEX IF NOT EXISTS idx_payment_references_created_at ON payment_references(created_at);

-- Create a function to create the table if it doesn't exist
CREATE OR REPLACE FUNCTION public.create_payment_references_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payment_references'
  ) THEN
    EXECUTE $$
      CREATE TABLE payment_references (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
        reference_code TEXT NOT NULL UNIQUE,
        amount NUMERIC(10,2) NOT NULL DEFAULT 0,
        used BOOLEAN NOT NULL DEFAULT false,
        used_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      
      CREATE INDEX IF NOT EXISTS idx_payment_references_organization_id ON payment_references(organization_id);
      CREATE INDEX IF NOT EXISTS idx_payment_references_reference_code ON payment_references(reference_code);
      CREATE INDEX IF NOT EXISTS idx_payment_references_used ON payment_references(used);
      CREATE INDEX IF NOT EXISTS idx_payment_references_used_by ON payment_references(used_by);
      CREATE INDEX IF NOT EXISTS idx_payment_references_created_at ON payment_references(created_at);
    $$;
  END IF;
END;
$$;

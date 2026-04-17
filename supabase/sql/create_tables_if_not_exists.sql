-- PostgreSQL functions to create tables if they don't exist
-- These functions can be called from the client to ensure tables exist

-- Function to create registration_codes table
CREATE OR REPLACE FUNCTION public.create_registration_codes_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'registration_codes'
  ) THEN
    CREATE TABLE registration_codes (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      code TEXT NOT NULL UNIQUE,
      used BOOLEAN NOT NULL DEFAULT false,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_registration_codes_used ON registration_codes(used);
    CREATE INDEX IF NOT EXISTS idx_registration_codes_created_at ON registration_codes(created_at);
  END IF;
END;
$$;

-- Function to create organizations table
CREATE OR REPLACE FUNCTION public.create_organizations_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organizations'
  ) THEN
    CREATE TABLE organizations (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      name TEXT NOT NULL,
      description TEXT,
      adviser_name TEXT,
      club_type TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'pending',
      creator_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_organizations_creator_id ON organizations(creator_id);
    CREATE INDEX IF NOT EXISTS idx_organizations_status ON organizations(status);
    CREATE INDEX IF NOT EXISTS idx_organizations_club_type ON organizations(club_type);
  END IF;
END;
$$;

-- Function to create organization_members table
CREATE OR REPLACE FUNCTION public.create_organization_members_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'organization_members'
  ) THEN
    CREATE TABLE organization_members (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      role TEXT NOT NULL DEFAULT 'member',
      joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      status TEXT NOT NULL DEFAULT 'active'
    );
    
    -- Create a composite unique constraint instead of a second primary key
    EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS idx_organization_members_org_user_unique ON organization_members(organization_id, user_id)';;
    
    CREATE INDEX IF NOT EXISTS idx_organization_members_org_id ON organization_members(organization_id);
    CREATE INDEX IF NOT EXISTS idx_organization_members_user_id ON organization_members(user_id);
  END IF;
END;
$$;

-- Function to create organization_wallets table
CREATE OR REPLACE FUNCTION public.create_organization_wallets_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'organization_wallets'
  ) THEN
    CREATE TABLE organization_wallets (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      balance NUMERIC(10,2) NOT NULL DEFAULT 0,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_organization_wallets_org_id ON organization_wallets(organization_id);
  END IF;
END;
$$;

-- Function to create organization_events table
CREATE OR REPLACE FUNCTION public.create_organization_events_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'organization_events'
  ) THEN
    CREATE TABLE organization_events (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      name TEXT NOT NULL,
      description TEXT,
      start_time TIMESTAMPTZ NOT NULL,
      end_time TIMESTAMPTZ NOT NULL,
      location TEXT,
      created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_organization_events_org_id ON organization_events(organization_id);
    CREATE INDEX IF NOT EXISTS idx_organization_events_created_by ON organization_events(created_by);
  END IF;
END;
$$;

-- Function to create organization_transactions table
CREATE OR REPLACE FUNCTION public.create_organization_transactions_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'organization_transactions'
  ) THEN
    CREATE TABLE organization_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      amount NUMERIC(10,2) NOT NULL,
      type TEXT NOT NULL,
      description TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_organization_transactions_org_id ON organization_transactions(organization_id);
    CREATE INDEX IF NOT EXISTS idx_organization_transactions_user_id ON organization_transactions(user_id);
  END IF;
END;
$$;

-- Function to create organization_announcements table
CREATE OR REPLACE FUNCTION public.create_organization_announcements_table_if_not_exists()
RETURNS void
LANGUAGE plpgsql
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public'
    AND table_name = 'organization_announcements'
  ) THEN
    CREATE TABLE organization_announcements (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      organization_id UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      created_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
    
    CREATE INDEX IF NOT EXISTS idx_organization_announcements_org_id ON organization_announcements(organization_id);
    CREATE INDEX IF NOT EXISTS idx_organization_announcements_created_by ON organization_announcements(created_by);
  END IF;
END;
$$;

-- Function to create all organization tables at once
CREATE OR REPLACE FUNCTION public.create_all_organization_tables_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  PERFORM public.create_registration_codes_table_if_not_exists();
  PERFORM public.create_organizations_table_if_not_exists();
  PERFORM public.create_organization_members_table_if_not_exists();
  PERFORM public.create_organization_wallets_table_if_not_exists();
  PERFORM public.create_organization_events_table_if_not_exists();
  PERFORM public.create_organization_transactions_table_if_not_exists();
  PERFORM public.create_organization_announcements_table_if_not_exists();
END;
$$;

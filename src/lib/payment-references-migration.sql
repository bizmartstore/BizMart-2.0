-- Migration to create payment_references table with proper schema
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS public.payment_references (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  reference_code VARCHAR(255) NOT NULL,
  amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  used BOOLEAN DEFAULT false,
  used_by UUID REFERENCES public.profiles(id),
  used_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_payment_references_organization_id ON public.payment_references(organization_id);
CREATE INDEX IF NOT EXISTS idx_payment_references_used ON public.payment_references(used);
CREATE INDEX IF NOT EXISTS idx_payment_references_reference_code ON public.payment_references(reference_code);

-- Grant permissions
GRANT ALL ON TABLE public.payment_references TO authenticated;
GRANT ALL ON TABLE public.payment_references TO anon;

-- Create a function to check if table exists and create if not
CREATE OR REPLACE FUNCTION public.create_payment_references_table_if_not_exists()
RETURNS VOID AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'payment_references'
  ) THEN
    EXECUTE $$
      CREATE TABLE public.payment_references (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
        reference_code VARCHAR(255) NOT NULL,
        amount DECIMAL(10,2) NOT NULL DEFAULT 0,
        used BOOLEAN DEFAULT false,
        used_by UUID REFERENCES public.profiles(id),
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
      
      CREATE INDEX idx_payment_references_organization_id ON public.payment_references(organization_id);
      CREATE INDEX idx_payment_references_used ON public.payment_references(used);
      CREATE INDEX idx_payment_references_reference_code ON public.payment_references(reference_code);
    $$;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Add member_admin_commission to orders table
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS member_admin_commission NUMERIC NOT NULL DEFAULT 0;

-- Add member_admin_commission to pos_sales (already has member_admin_earnings, rename for clarity is fine, keep it)

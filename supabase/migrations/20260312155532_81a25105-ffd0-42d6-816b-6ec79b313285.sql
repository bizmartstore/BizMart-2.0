
-- Add seller_id column to products table so sellers can add their own products
ALTER TABLE public.products ADD COLUMN IF NOT EXISTS seller_id uuid DEFAULT NULL;

-- Allow sellers to manage their own products
CREATE POLICY "Sellers can insert own products"
ON public.products
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = seller_id);

CREATE POLICY "Sellers can update own products"
ON public.products
FOR UPDATE
TO authenticated
USING (auth.uid() = seller_id);

CREATE POLICY "Sellers can delete own products"
ON public.products
FOR DELETE
TO authenticated
USING (auth.uid() = seller_id);

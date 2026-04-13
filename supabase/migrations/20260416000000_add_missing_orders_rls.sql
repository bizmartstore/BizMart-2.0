-- Add missing RLS policies for orders table
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own orders
CREATE POLICY "Users can view their own orders"
ON public.orders
FOR SELECT
USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own orders
CREATE POLICY "Users can insert their own orders"
ON public.orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own orders
CREATE POLICY "Users can update their own orders"
ON public.orders
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own orders
CREATE POLICY "Users can delete their own orders"
ON public.orders
FOR DELETE
USING (auth.uid() = user_id);

-- Allow admins to view all orders
CREATE POLICY "Admins can view all orders"
ON public.orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['main_admin'::text, 'member_admin'::text])
  )
);

-- Allow admins to update all orders
CREATE POLICY "Admins can update all orders"
ON public.orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['main_admin'::text, 'member_admin'::text])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['main_admin'::text, 'member_admin'::text])
  )
);

-- Add missing RLS policies for print_orders table
ALTER TABLE public.print_orders ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to view their own print orders
CREATE POLICY "Users can view their own print orders"
ON public.print_orders
FOR SELECT
USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own print orders
CREATE POLICY "Users can insert their own print orders"
ON public.print_orders
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to update their own print orders
CREATE POLICY "Users can update their own print orders"
ON public.print_orders
FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Allow authenticated users to delete their own print orders
CREATE POLICY "Users can delete their own print orders"
ON public.print_orders
FOR DELETE
USING (auth.uid() = user_id);

-- Allow admins to view all print orders
CREATE POLICY "Admins can view all print orders"
ON public.print_orders
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['main_admin'::text, 'member_admin'::text])
  )
);

-- Allow admins to update all print orders
CREATE POLICY "Admins can update all print orders"
ON public.print_orders
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['main_admin'::text, 'member_admin'::text])
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = ANY (ARRAY['main_admin'::text, 'member_admin'::text])
  )
);
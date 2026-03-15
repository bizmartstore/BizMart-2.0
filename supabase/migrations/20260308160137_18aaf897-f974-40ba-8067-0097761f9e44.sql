
-- Create admin role enum
CREATE TYPE public.app_role AS ENUM ('main_admin', 'member_admin');

-- Create user_roles table
CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE(user_id, role)
);
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer functions
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role); $$;

CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role IN ('main_admin', 'member_admin')); $$;

CREATE OR REPLACE FUNCTION public.get_user_role(_user_id uuid)
RETURNS text LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$ SELECT role::text FROM public.user_roles WHERE user_id = _user_id LIMIT 1; $$;

-- RLS for user_roles
CREATE POLICY "Users can read own role" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Main admin can manage roles" ON public.user_roles FOR ALL TO authenticated USING (public.has_role(auth.uid(), 'main_admin'));

-- App settings table
CREATE TABLE public.app_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  updated_at timestamptz DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);
ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read settings" ON public.app_settings FOR SELECT USING (true);
CREATE POLICY "Admins can update settings" ON public.app_settings FOR UPDATE TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Admins can insert settings" ON public.app_settings FOR INSERT TO authenticated WITH CHECK (public.is_admin(auth.uid()));

-- Announcements table
CREATE TABLE public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  type text DEFAULT 'info',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now(),
  created_by uuid REFERENCES auth.users(id),
  expires_at timestamptz
);
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active announcements" ON public.announcements FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage announcements" ON public.announcements FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Products table
CREATE TABLE public.products (
  id text PRIMARY KEY,
  name text NOT NULL,
  price numeric NOT NULL,
  original_price numeric,
  image text DEFAULT '',
  category text DEFAULT '',
  rating numeric DEFAULT 4.5,
  sold integer DEFAULT 0,
  description text DEFAULT '',
  is_flash_sale boolean DEFAULT false,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active products" ON public.products FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage products" ON public.products FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Categories table
CREATE TABLE public.categories (
  id text PRIMARY KEY,
  name text NOT NULL,
  icon text NOT NULL DEFAULT '📦',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true
);
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read categories" ON public.categories FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Banners table
CREATE TABLE public.banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  image_url text NOT NULL,
  title text DEFAULT '',
  sort_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read active banners" ON public.banners FOR SELECT USING (is_active = true);
CREATE POLICY "Admins can manage banners" ON public.banners FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

-- Seed default app settings
INSERT INTO public.app_settings (key, value) VALUES
  ('store_status', '{"is_open": true, "close_message": "Store is currently closed. You can browse and add to cart but purchases are disabled."}'::jsonb),
  ('gcash_service_fee', '{"amount": 10}'::jsonb);

-- Seed categories
INSERT INTO public.categories (id, name, icon, sort_order) VALUES
  ('notebooks', 'Notebooks', '📓', 1),
  ('pens', 'Pens & Pencils', '✏️', 2),
  ('bags', 'Bags', '🎒', 3),
  ('books', 'Books', '📚', 4),
  ('art', 'Art Supplies', '🎨', 5),
  ('tech', 'Tech & Gadgets', '💻', 6),
  ('uniforms', 'Uniforms', '👔', 7),
  ('sports', 'Sports', '⚽', 8),
  ('snacks', 'Snacks & Drinks', '🍿', 9),
  ('accessories', 'Accessories', '🎀', 10),
  ('printing', 'Printing', '🖨️', 11),
  ('hygiene', 'Hygiene', '🧴', 12),
  ('toys', 'Toys & Games', '🎲', 13),
  ('org', 'Org Supplies', '📁', 14);

-- Seed products
INSERT INTO public.products (id, name, price, original_price, image, category, rating, sold, description, is_flash_sale) VALUES
('1', 'Premium Spiral Notebook A4', 45, 89, 'https://images.unsplash.com/photo-1531346878377-a5be20888e57?w=300', 'notebooks', 4.8, 2340, 'High-quality 200-page spiral notebook with thick paper, perfect for notes and journaling.', true),
('n2', 'Yellow Pad Writing Paper (3-pack)', 60, NULL, 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=300', 'notebooks', 4.6, 4100, 'Classic yellow writing pad, 100 sheets each. Great for exams and essays.', false),
('n3', 'Composition Notebook (5-pack)', 95, 140, 'https://images.unsplash.com/photo-1541963463532-d68292c34b19?w=300', 'notebooks', 4.7, 3800, 'Standard 80-leaf composition notebooks in assorted colors.', false),
('2', 'Gel Pen Set (12 Colors)', 35, 65, 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=300', 'pens', 4.9, 5600, 'Smooth-writing gel pens in 12 vibrant colors. Great for notes and art.', true),
('10', 'Highlighter Set (6 Neon)', 55, 95, 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=300', 'pens', 4.7, 8900, 'Bright neon highlighters perfect for studying and marking textbooks.', false),
('14', 'Correction Tape (3-pack)', 35, 55, 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300', 'pens', 4.8, 7800, 'Smooth correction tape for clean, neat corrections.', false),
('p4', 'Mongol No. 2 Pencil (12pcs)', 48, NULL, 'https://images.unsplash.com/photo-1585336261022-680e295ce3fe?w=300', 'pens', 4.9, 15200, 'The iconic Mongol pencil every Filipino student knows and loves.', false),
('p5', 'Ballpen Blue/Black (10pcs)', 40, NULL, 'https://images.unsplash.com/photo-1583485088034-697b5bc54ccd?w=300', 'pens', 4.5, 9800, 'Reliable ballpoint pens in blue and black ink. Smooth writing.', false),
('3', 'Student Backpack - Waterproof', 299, 499, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300', 'bags', 4.7, 1200, 'Durable waterproof backpack with laptop compartment and multiple pockets.', false),
('b2', 'Canvas Tote Bag - School Edition', 149, NULL, 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=300', 'bags', 4.4, 2300, 'Trendy canvas tote perfect for carrying books and everyday essentials.', false),
('b3', 'Lunch Bag Insulated', 120, 180, 'https://images.unsplash.com/photo-1622560480605-d83c661a4293?w=300', 'bags', 4.6, 1800, 'Keep your baon fresh with this insulated lunch bag.', false),
('6', 'English-Filipino Dictionary', 150, NULL, 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=300', 'books', 4.5, 3400, 'Comprehensive bilingual dictionary for Filipino students.', false),
('bk2', 'ABM Fundamentals Textbook', 320, NULL, 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=300', 'books', 4.7, 890, 'Essential ABM strand textbook covering accounting and business basics.', false),
('bk3', 'STEM Review Workbook', 250, 350, 'https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=300', 'books', 4.8, 1560, 'Practice workbook for STEM students with solved examples.', true),
('5', 'Watercolor Paint Set (24 Colors)', 189, 320, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300', 'art', 4.6, 780, 'Professional-grade watercolor paints in a portable palette. 24 vivid colors.', false),
('11', 'Drawing Sketch Pad A3', 85, NULL, 'https://images.unsplash.com/photo-1513364776144-60967b0f800f?w=300', 'art', 4.4, 1230, 'Thick 50-sheet sketch pad for drawing and illustration projects.', false),
('a3', 'Colored Pencil Set (36pcs)', 165, 250, 'https://images.unsplash.com/photo-1513542789411-b6a5d4f31634?w=300', 'art', 4.7, 2100, 'Vibrant pre-sharpened colored pencils in a tin case.', false),
('a4', 'Oil Pastel Crayons (24 Colors)', 95, NULL, 'https://images.unsplash.com/photo-1560421683-6856ea585c78?w=300', 'art', 4.5, 3200, 'Smooth blendable oil pastels for art class projects.', false),
('4', 'Scientific Calculator FX-991', 450, 650, 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=300', 'tech', 4.9, 890, 'Advanced scientific calculator for math, physics and engineering students.', true),
('8', 'USB Flash Drive 32GB', 199, 350, 'https://images.unsplash.com/photo-1597872200969-2b65d56bd16b?w=300', 'tech', 4.7, 4500, 'Fast USB 3.0 flash drive. Store all your school files safely.', true),
('15', 'Laptop Sleeve 14-inch', 250, 399, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=300', 'tech', 4.6, 2100, 'Padded laptop sleeve with water-resistant exterior.', false),
('t4', 'Wired Earphones with Mic', 89, 150, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300', 'tech', 4.3, 6700, 'Clear sound earphones perfect for online classes and music.', false),
('t5', 'Portable Phone Stand', 65, NULL, 'https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300', 'tech', 4.5, 3400, 'Adjustable phone/tablet stand for online learning setups.', false),
('7', 'PE Uniform Set', 350, 450, 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=300', 'uniforms', 4.3, 670, 'Complete PE uniform set including shirt and shorts.', false),
('u2', 'School Polo Shirt (White)', 280, NULL, 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=300', 'uniforms', 4.4, 1500, 'Official white polo shirt with school emblem. Comfortable cotton blend.', false),
('u3', 'School ID Lanyard', 35, NULL, 'https://images.unsplash.com/photo-1611532736597-de2d4265fba3?w=300', 'uniforms', 4.2, 5600, 'Durable lanyard with breakaway clip for school IDs.', false),
('9', 'Basketball - Official Size', 299, NULL, 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=300', 'sports', 4.8, 560, 'Official size and weight basketball for school games and practice.', false),
('s2', 'Badminton Racket (Pair)', 380, 500, 'https://images.unsplash.com/photo-1626224583764-f87db24ac4ea?w=300', 'sports', 4.6, 890, 'Lightweight racket pair with 3 shuttlecocks included.', false),
('s3', 'Jump Rope - Speed Rope', 75, NULL, 'https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=300', 'sports', 4.5, 2100, 'Adjustable speed jump rope for PE class and fitness.', false),
('s4', 'Volleyball - Indoor', 259, NULL, 'https://images.unsplash.com/photo-1612872087720-bb876e2e67d1?w=300', 'sports', 4.7, 430, 'Official size indoor volleyball for intramural games.', false),
('12', 'Biscuit Variety Pack', 120, NULL, 'https://images.unsplash.com/photo-1558961363-fa8fdf82db35?w=300', 'snacks', 4.6, 12000, 'Assorted biscuits and cookies, perfect for recess snacking.', false),
('sn2', 'Chocolate Milk Drink (6-pack)', 90, NULL, 'https://images.unsplash.com/photo-1563636619-e9143da7973b?w=300', 'snacks', 4.8, 8500, 'Creamy chocolate milk in convenient ready-to-drink packs.', true),
('sn3', 'Trail Mix Nut Pack', 65, NULL, 'https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?w=300', 'snacks', 4.4, 3200, 'Healthy nut and dried fruit mix for energy during study sessions.', false),
('sn4', 'Instant Noodle Cup (4pcs)', 80, NULL, 'https://images.unsplash.com/photo-1612929633738-8fe44f7ec841?w=300', 'snacks', 4.3, 14500, 'Quick and easy cup noodles for those busy school days.', false),
('13', 'Hair Ribbon Set (10pcs)', 45, NULL, 'https://images.unsplash.com/photo-1596462502278-27bfdc403348?w=300', 'accessories', 4.5, 3400, 'School-approved hair ribbons in various colors.', false),
('ac2', 'Wristwatch - Digital Student', 199, 350, 'https://images.unsplash.com/photo-1524805444758-089113d48a6d?w=300', 'accessories', 4.6, 1900, 'Water-resistant digital watch with alarm and stopwatch features.', false),
('ac3', 'Clear Umbrella - Foldable', 149, NULL, 'https://images.unsplash.com/photo-1534309466160-70b22cc6254d?w=300', 'accessories', 4.4, 2800, 'Compact foldable umbrella for rainy school commutes.', false),
('pr1', 'Bond Paper A4 (500 sheets)', 220, NULL, 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300', 'printing', 4.7, 6200, 'Bright white 80gsm bond paper for printing and photocopying.', false),
('pr2', 'Photo Paper Glossy (20 sheets)', 95, NULL, 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=300', 'printing', 4.5, 1400, 'High-gloss photo paper for vivid photo printing.', false),
('hy1', 'Alcohol Spray 70% (150ml)', 55, NULL, 'https://images.unsplash.com/photo-1584744982491-665216d95f8b?w=300', 'hygiene', 4.8, 11000, 'Pocket-sized isopropyl alcohol spray for on-the-go sanitizing.', false),
('hy2', 'Tissue Pack (10 packs)', 45, NULL, 'https://images.unsplash.com/photo-1583947215259-38e31be8751f?w=300', 'hygiene', 4.6, 8900, 'Soft pocket tissue packs, a school bag essential.', false),
('hy3', 'Face Mask (50pcs Box)', 120, 200, 'https://images.unsplash.com/photo-1584634731339-252c581abfc5?w=300', 'hygiene', 4.5, 5600, '3-ply disposable face masks for everyday protection.', false),
('tg1', 'Rubik''s Cube 3x3', 85, NULL, 'https://images.unsplash.com/photo-1577401239170-897942555fb3?w=300', 'toys', 4.7, 3200, 'Classic speed cube for brain exercise during breaks.', false),
('tg2', 'Card Game - UNO', 120, NULL, 'https://images.unsplash.com/photo-1606503153255-59d7ae64e37f?w=300', 'toys', 4.9, 4500, 'The ultimate recess card game. Fun with friends!', false),
('o1', 'Clear Book 20 Pockets', 35, NULL, 'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?w=300', 'org', 4.5, 5400, 'Organize papers, certificates, and projects neatly.', false),
('o2', 'Plastic Envelope Long (5pcs)', 40, NULL, 'https://images.unsplash.com/photo-1517842645767-c639042777db?w=300', 'org', 4.4, 7200, 'Snap-button plastic envelopes to keep documents safe.', false),
('16', 'Math Geometry Set', 75, NULL, 'https://images.unsplash.com/photo-1564466809058-bf4114d55352?w=300', 'org', 4.4, 3200, 'Complete geometry set with compass, protractor, rulers and set squares.', false);

-- Seed banners
INSERT INTO public.banners (image_url, title, sort_order) VALUES
  ('https://images.unsplash.com/photo-1503676260728-1c00da094a0b?w=800', 'Back to School Sale', 1),
  ('https://images.unsplash.com/photo-1497633762265-9d179a990aa6?w=800', 'BizMart Club Members Get 10% Off', 2);

-- Fix existing restrictive RLS policies to permissive
DROP POLICY IF EXISTS "Users can claim unused codes" ON public.club_codes;
DROP POLICY IF EXISTS "Users can read unused codes" ON public.club_codes;
CREATE POLICY "Users can read unused codes" ON public.club_codes FOR SELECT TO authenticated USING (is_used = false);
CREATE POLICY "Users can claim unused codes" ON public.club_codes FOR UPDATE TO authenticated USING (is_used = false) WITH CHECK (used_by = auth.uid() AND is_used = true);
CREATE POLICY "Admins can manage codes" ON public.club_codes FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own membership" ON public.club_memberships;
DROP POLICY IF EXISTS "Users can view own membership" ON public.club_memberships;
CREATE POLICY "Users can view own membership" ON public.club_memberships FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own membership" ON public.club_memberships FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage memberships" ON public.club_memberships FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert own transactions" ON public.gcash_transactions;
DROP POLICY IF EXISTS "Users can view own transactions" ON public.gcash_transactions;
CREATE POLICY "Users can view own transactions" ON public.gcash_transactions FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own transactions" ON public.gcash_transactions FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage transactions" ON public.gcash_transactions FOR ALL TO authenticated USING (public.is_admin(auth.uid()));

DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all profiles" ON public.profiles FOR SELECT TO authenticated USING (public.is_admin(auth.uid()));
CREATE POLICY "Main admin can delete profiles" ON public.profiles FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'main_admin'));

-- Update handle_new_user to also assign admin roles
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, first_name, last_name, section, grade_level, school, email)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'last_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'section', ''),
    COALESCE(NEW.raw_user_meta_data->>'grade_level', ''),
    COALESCE(NEW.raw_user_meta_data->>'school', ''),
    COALESCE(NEW.email, '')
  );

  IF NEW.email = 'sheethappenswithjaa@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'main_admin') ON CONFLICT DO NOTHING;
  ELSIF NEW.email = 'bizmartadmin@gmail.com' THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'member_admin') ON CONFLICT DO NOTHING;
  END IF;

  RETURN NEW;
END;
$$;

-- Assign roles to existing admin users if already signed up
INSERT INTO public.user_roles (user_id, role)
SELECT id, 'main_admin'::app_role FROM auth.users WHERE email = 'sheethappenswithjaa@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT id, 'member_admin'::app_role FROM auth.users WHERE email = 'bizmartadmin@gmail.com'
ON CONFLICT DO NOTHING;

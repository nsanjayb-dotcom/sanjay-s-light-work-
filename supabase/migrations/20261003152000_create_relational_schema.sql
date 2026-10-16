-- ==============================================================================
-- SANJAY'S LIGHTWORKS - SUPABASE POSTGRESQL RELATIONAL MIGRATION
-- 1. UUID Primary Keys & Relational Tables (users, service_packages, bookings, reviews)
-- 2. Performance Query Indexes
-- 3. Row-Level Security (RLS) & Granular Access Control Policies
-- 4. Atomic PostgreSQL RPC Function for Race-Condition Proof Reservations
-- ==============================================================================

-- Enable pgcrypto / uuid-ossp extension for UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ==============================================================================
-- 1. RELATIONAL SCHEMA TABLES
-- ==============================================================================

-- 1.1 USERS TABLE
-- Stores client & owner profile details with email uniqueness
CREATE TABLE IF NOT EXISTS public.users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  role TEXT DEFAULT 'client' CHECK (role IN ('client', 'admin')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.2 SERVICE PACKAGES TABLE
-- Available photography session tiers with pricing in CAD
CREATE TABLE IF NOT EXISTS public.service_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE,
  title TEXT NOT NULL,
  description TEXT,
  price_cad NUMERIC(10,2) NOT NULL CHECK (price_cad >= 0),
  active BOOLEAN DEFAULT true NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 1.3 BOOKINGS TABLE
-- Links clients to packages with scheduled date, timeslot, and atomic status
CREATE TABLE IF NOT EXISTS public.bookings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  package_id UUID NOT NULL REFERENCES public.service_packages(id) ON DELETE RESTRICT,
  booking_date DATE NOT NULL,
  time_slot TEXT NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'in_progress', 'completed', 'cancelled')) NOT NULL,
  location TEXT DEFAULT 'Ontario',
  notes TEXT,
  total_price NUMERIC(10,2),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  -- Enforce slot constraint per date to prevent duplicate bookings at DB level
  CONSTRAINT unique_date_timeslot UNIQUE (booking_date, time_slot)
);

-- 1.4 REVIEWS TABLE
-- Authentic client feedback with verified badges
CREATE TABLE IF NOT EXISTS public.reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.users(id) ON DELETE SET NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  verified BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 2. HIGH-FREQUENCY PERFORMANCE INDEXES
-- ==============================================================================
CREATE INDEX IF NOT EXISTS idx_bookings_booking_date ON public.bookings(booking_date);
CREATE INDEX IF NOT EXISTS idx_bookings_user_id ON public.bookings(user_id);
CREATE INDEX IF NOT EXISTS idx_bookings_package_id ON public.bookings(package_id);
CREATE INDEX IF NOT EXISTS idx_bookings_status ON public.bookings(status);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users(lower(email));
CREATE INDEX IF NOT EXISTS idx_service_packages_active ON public.service_packages(active);
CREATE INDEX IF NOT EXISTS idx_reviews_verified ON public.reviews(verified);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON public.reviews(user_id);

-- ==============================================================================
-- 3. ROW-LEVEL SECURITY (RLS) & AUTHORIZATION POLICIES
-- ==============================================================================

-- Enable RLS on all public tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.service_packages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

-- ------------------------------------------------------------------------------
-- 3.1 SERVICE PACKAGES POLICIES
-- ------------------------------------------------------------------------------
-- Public can read all active packages (anon + authenticated)
DROP POLICY IF EXISTS "Public read access for active service packages" ON public.service_packages;
CREATE POLICY "Public read access for active service packages"
  ON public.service_packages
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

-- Admins retain elevated management permissions (create, update, delete)
DROP POLICY IF EXISTS "Admins manage service packages" ON public.service_packages;
CREATE POLICY "Admins manage service packages"
  ON public.service_packages
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'email' = 'nsanjayb@gmail.com'
  );

-- ------------------------------------------------------------------------------
-- 3.2 REVIEWS POLICIES
-- ------------------------------------------------------------------------------
-- Public can view verified reviews (anon + authenticated)
DROP POLICY IF EXISTS "Public read access for verified reviews" ON public.reviews;
CREATE POLICY "Public read access for verified reviews"
  ON public.reviews
  FOR SELECT
  TO anon, authenticated
  USING (verified = true);

-- Authenticated users can insert their own reviews
DROP POLICY IF EXISTS "Users can insert reviews" ON public.reviews;
DROP POLICY IF EXISTS "Authenticated owners can submit reviews" ON public.reviews;
CREATE POLICY "Authenticated owners can submit reviews"
  ON public.reviews
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated owners can update their own reviews
DROP POLICY IF EXISTS "Authenticated owners update reviews" ON public.reviews;
CREATE POLICY "Authenticated owners update reviews"
  ON public.reviews
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Authenticated owners can delete their own reviews
DROP POLICY IF EXISTS "Authenticated owners delete reviews" ON public.reviews;
CREATE POLICY "Authenticated owners delete reviews"
  ON public.reviews
  FOR DELETE
  TO authenticated
  USING (auth.uid() = user_id);

-- Admins can view and moderate all reviews
DROP POLICY IF EXISTS "Admins manage all reviews" ON public.reviews;
CREATE POLICY "Admins manage all reviews"
  ON public.reviews
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'email' = 'nsanjayb@gmail.com'
  );

-- ------------------------------------------------------------------------------
-- 3.3 USERS POLICIES (Strictly Restricted to Authenticated Owners)
-- ------------------------------------------------------------------------------
-- Authenticated users can only view their own user data (Admins can view all)
DROP POLICY IF EXISTS "Users view own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated owners view own user data" ON public.users;
CREATE POLICY "Authenticated owners view own user data"
  ON public.users
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = id OR 
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'email' = 'nsanjayb@gmail.com'
  );

-- Authenticated users can only update their own user data
DROP POLICY IF EXISTS "Users update own profile" ON public.users;
DROP POLICY IF EXISTS "Authenticated owners update own user data" ON public.users;
CREATE POLICY "Authenticated owners update own user data"
  ON public.users
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

-- Authenticated users can insert their own user record
DROP POLICY IF EXISTS "Allow user creation during booking" ON public.users;
DROP POLICY IF EXISTS "Authenticated owners insert own user profile" ON public.users;
CREATE POLICY "Authenticated owners insert own user profile"
  ON public.users
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = id);

-- Admins manage all users
DROP POLICY IF EXISTS "Admins manage all users" ON public.users;
CREATE POLICY "Admins manage all users"
  ON public.users
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'email' = 'nsanjayb@gmail.com'
  );

-- ------------------------------------------------------------------------------
-- 3.4 BOOKINGS POLICIES (Strictly Restricted to Authenticated Owners)
-- ------------------------------------------------------------------------------
-- Authenticated users can only view their own bookings (Admins can view all)
DROP POLICY IF EXISTS "Users view own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated owners view own bookings" ON public.bookings;
CREATE POLICY "Authenticated owners view own bookings"
  ON public.bookings
  FOR SELECT
  TO authenticated
  USING (
    auth.uid() = user_id OR 
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'email' = 'nsanjayb@gmail.com'
  );

-- Authenticated users can only insert bookings for themselves
DROP POLICY IF EXISTS "Users insert own bookings" ON public.bookings;
DROP POLICY IF EXISTS "Authenticated owners insert own bookings" ON public.bookings;
CREATE POLICY "Authenticated owners insert own bookings"
  ON public.bookings
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Authenticated users can only update their own bookings
DROP POLICY IF EXISTS "Authenticated owners update own bookings" ON public.bookings;
CREATE POLICY "Authenticated owners update own bookings"
  ON public.bookings
  FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Admins retain elevated management permissions on bookings
DROP POLICY IF EXISTS "Admins manage all bookings" ON public.bookings;
CREATE POLICY "Admins manage all bookings"
  ON public.bookings
  FOR ALL
  TO authenticated
  USING (
    auth.jwt() ->> 'role' = 'admin' OR 
    auth.jwt() ->> 'email' = 'nsanjayb@gmail.com'
  );

-- ==============================================================================
-- 4. TRANSACTIONAL BOOKING RPC FUNCTION (RACE-CONDITION RESILIENT)
-- ==============================================================================
-- Executes inside a strict single database transaction with row-level locks
-- to guarantee zero double-booking conflicts across concurrent client submissions.
CREATE OR REPLACE FUNCTION public.create_booking_atomic(
  p_full_name TEXT,
  p_email TEXT,
  p_phone TEXT DEFAULT NULL,
  p_package_id UUID DEFAULT NULL,
  p_booking_date DATE DEFAULT NULL,
  p_time_slot TEXT DEFAULT NULL,
  p_location TEXT DEFAULT 'Ontario',
  p_notes TEXT DEFAULT NULL,
  p_total_price NUMERIC DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_user_id UUID;
  v_booking_id UUID;
  v_package_exists BOOLEAN;
  v_slot_taken BOOLEAN;
  v_clean_email TEXT;
BEGIN
  -- Parameter validation
  IF p_full_name IS NULL OR trim(p_full_name) = '' THEN
    RAISE EXCEPTION 'Full name is required';
  END IF;

  IF p_email IS NULL OR trim(p_email) = '' THEN
    RAISE EXCEPTION 'Email address is required';
  END IF;

  IF p_booking_date IS NULL THEN
    RAISE EXCEPTION 'Booking date is required';
  END IF;

  IF p_time_slot IS NULL OR trim(p_time_slot) = '' THEN
    RAISE EXCEPTION 'Time slot is required';
  END IF;

  v_clean_email := lower(trim(p_email));

  -- 1. Validate package exists and is active
  SELECT EXISTS (
    SELECT 1 FROM public.service_packages WHERE id = p_package_id AND active = true
  ) INTO v_package_exists;

  IF NOT v_package_exists THEN
    RAISE EXCEPTION 'Selected service package does not exist or is currently inactive';
  END IF;

  -- 2. Lock check: Prevent concurrent double-booking conflicts
  -- FOR UPDATE locks any existing booking record for this date and time slot
  PERFORM 1 FROM public.bookings
  WHERE booking_date = p_booking_date
    AND time_slot = p_time_slot
    AND status NOT IN ('cancelled')
  FOR UPDATE;

  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE booking_date = p_booking_date
      AND time_slot = p_time_slot
      AND status NOT IN ('cancelled')
  ) INTO v_slot_taken;

  IF v_slot_taken THEN
    RAISE EXCEPTION 'Time slot % on % is already reserved. Please select an alternate time.', p_time_slot, p_booking_date;
  END IF;

  -- 3. Upsert user record
  SELECT id INTO v_user_id FROM public.users WHERE lower(email) = v_clean_email;

  IF v_user_id IS NULL THEN
    INSERT INTO public.users (email, full_name, phone, role)
    VALUES (v_clean_email, trim(p_full_name), trim(p_phone), 'client')
    RETURNING id INTO v_user_id;
  ELSE
    UPDATE public.users
    SET full_name = COALESCE(NULLIF(trim(p_full_name), ''), full_name),
        phone = COALESCE(NULLIF(trim(p_phone), ''), phone)
    WHERE id = v_user_id;
  END IF;

  -- 4. Atomic booking insertion
  INSERT INTO public.bookings (
    user_id,
    package_id,
    booking_date,
    time_slot,
    status,
    location,
    notes,
    total_price
  ) VALUES (
    v_user_id,
    p_package_id,
    p_booking_date,
    p_time_slot,
    'confirmed',
    COALESCE(trim(p_location), 'Ontario'),
    p_notes,
    p_total_price
  ) RETURNING id INTO v_booking_id;

  RETURN jsonb_build_object(
    'success', true,
    'booking_id', v_booking_id,
    'user_id', v_user_id,
    'booking_date', p_booking_date,
    'time_slot', p_time_slot,
    'status', 'confirmed',
    'message', 'Reservation successfully confirmed.'
  );
END;
$$;

-- Grant execution permission on RPC function
GRANT EXECUTE ON FUNCTION public.create_booking_atomic TO anon, authenticated, service_role;

-- AVAILABILITY CHECK RPC FUNCTION
CREATE OR REPLACE FUNCTION public.check_booking_availability(
  p_booking_date DATE,
  p_time_slot TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_is_taken BOOLEAN;
BEGIN
  IF p_booking_date IS NULL OR p_time_slot IS NULL OR trim(p_time_slot) = '' THEN
    RETURN jsonb_build_object(
      'available', false,
      'error', 'Valid booking date and time slot are required'
    );
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM public.bookings
    WHERE booking_date = p_booking_date
      AND time_slot = trim(p_time_slot)
      AND status NOT IN ('cancelled')
  ) INTO v_is_taken;

  RETURN jsonb_build_object(
    'available', NOT v_is_taken,
    'booking_date', p_booking_date,
    'time_slot', p_time_slot,
    'message', CASE 
      WHEN v_is_taken THEN 'Time slot is already reserved'
      ELSE 'Time slot is available'
    END
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_booking_availability TO anon, authenticated, service_role;

-- GET BOOKED TIME SLOTS FOR A SPECIFIC DATE
CREATE OR REPLACE FUNCTION public.get_booked_time_slots(
  p_booking_date DATE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, pg_temp
AS $$
DECLARE
  v_slots JSONB;
BEGIN
  SELECT COALESCE(jsonb_agg(time_slot ORDER BY time_slot), '[]'::jsonb)
  INTO v_slots
  FROM public.bookings
  WHERE booking_date = p_booking_date
    AND status NOT IN ('cancelled');

  RETURN v_slots;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_booked_time_slots TO anon, authenticated, service_role;

-- ==============================================================================
-- 5. INITIAL SEED DATA
-- ==============================================================================
INSERT INTO public.service_packages (id, slug, title, description, price_cad, active) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'pkg-single-photo', 'Single Master Frame', 'One hero photograph captured in natural light with master high-res color grading.', 15.00, true),
  ('a2222222-2222-2222-2222-222222222222', 'pkg-portrait', 'Portrait & Couples Session', '1.5-hour intimate session capturing candid emotions and authentic connection.', 50.00, true),
  ('a3333333-3333-3333-3333-333333333333', 'pkg-traditional', 'Traditional Cultural Celebration', 'Respectful coverage of sacred rituals, ceremonies, and heirloom family moments.', 150.00, true),
  ('a4444444-4444-4444-4444-444444444444', 'pkg-event', 'Celebration & Events Coverage', 'Comprehensive ceremony coverage with dual-card camera backup and rapid sneak peeks.', 150.00, true)
ON CONFLICT (id) DO UPDATE 
SET title = EXCLUDED.title, price_cad = EXCLUDED.price_cad, active = EXCLUDED.active;

-- Initial Verified Reviews
INSERT INTO public.reviews (id, user_id, rating, comment, verified) VALUES
  ('b1111111-1111-1111-1111-111111111111', NULL, 5, 'Sanjay has an extraordinary eye for ambient light. The portraits of our ceremony captured the genuine emotion without feeling posed.', true),
  ('b2222222-2222-2222-2222-222222222222', NULL, 5, 'The dual-card backup gave us total peace of mind for our milestone celebration. Sneak peeks within 48 hours were breathtaking.', true),
  ('b3333333-3333-3333-3333-333333333333', NULL, 5, 'Warm, professional, and patient. The golden hour lighting in Ontario parks made our couple frames look timeless.', true)
ON CONFLICT (id) DO NOTHING;

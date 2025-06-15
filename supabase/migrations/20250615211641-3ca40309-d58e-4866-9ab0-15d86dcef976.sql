
-- 1. Create an enum type for roles (already present if migration partially ran; skip if exists)
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin', 'trainer', 'moderator', 'user');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 2. Create a user_roles table referencing auth.users by user id (skip if exists)
CREATE TABLE IF NOT EXISTS public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role app_role NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- 3. Enable Row Level Security on user_roles to protect it
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- 4. SECURITY DEFINER function (may already exist)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE SQL
STABLE
SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  );
$$;

-- 5. Policy: Allow only admins to INSERT/assign roles using WITH CHECK only
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 6. Policy: Allow only admins to UPDATE roles
DROP POLICY IF EXISTS "Admins can update roles" ON public.user_roles;
CREATE POLICY "Admins can update roles"
  ON public.user_roles
  FOR UPDATE
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

-- 7. Allow authenticated users to see their own roles
DROP POLICY IF EXISTS "Users can view their own roles" ON public.user_roles;
CREATE POLICY "Users can view their own roles"
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);


-- Fix RLS policies for admins table to allow creating admin records
CREATE POLICY "Allow admin record creation for users with admin role" 
  ON public.admins 
  FOR INSERT 
  TO authenticated
  WITH CHECK (
    user_id = auth.uid() AND 
    EXISTS (
      SELECT 1 FROM public.user_roles 
      WHERE user_id = auth.uid() AND role = 'admin'
    )
  );

-- Also allow admins to update their own records
CREATE POLICY "Admins can update their own records" 
  ON public.admins 
  FOR UPDATE 
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Fix trainers table policies to allow proper trainer registration
-- Drop the conflicting policy that might be causing issues
DROP POLICY IF EXISTS "Allow trainer registration" ON public.trainers;

-- Create a proper policy that allows trainer registration from pending_trainers
CREATE POLICY "Allow trainer registration from pending trainers" 
  ON public.trainers 
  FOR INSERT 
  TO authenticated, anon
  WITH CHECK (
    -- Allow if email exists in pending_trainers with pending status
    EXISTS (
      SELECT 1 FROM public.pending_trainers 
      WHERE email = NEW.email AND status = 'pending'
    )
  );

-- Allow pending_trainers to be deleted by admins (for cleanup)
CREATE POLICY "Admins can delete pending trainers" 
  ON public.pending_trainers 
  FOR DELETE 
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.admins 
      WHERE user_id = auth.uid()
    )
  );

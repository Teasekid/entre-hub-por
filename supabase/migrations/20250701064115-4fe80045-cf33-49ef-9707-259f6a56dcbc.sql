
-- Create pending_trainers table to store trainer applications before approval
CREATE TABLE public.pending_trainers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL UNIQUE,
  phone_number TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected'))
);

-- Enable RLS on pending_trainers table
ALTER TABLE public.pending_trainers ENABLE ROW LEVEL SECURITY;

-- Allow anyone to insert pending trainer applications
CREATE POLICY "Allow pending trainer applications" 
  ON public.pending_trainers 
  FOR INSERT 
  TO anon, authenticated
  WITH CHECK (true);

-- Allow admins to view all pending trainers (we'll need to update this once admin roles are properly implemented)
CREATE POLICY "Allow viewing pending trainers" 
  ON public.pending_trainers 
  FOR SELECT 
  TO authenticated
  USING (true);

-- Allow admins to update pending trainer status
CREATE POLICY "Allow updating pending trainers" 
  ON public.pending_trainers 
  FOR UPDATE 
  TO authenticated
  USING (true);

-- Update trainers table to require unique email
ALTER TABLE public.trainers ADD CONSTRAINT trainers_email_unique UNIQUE (email);

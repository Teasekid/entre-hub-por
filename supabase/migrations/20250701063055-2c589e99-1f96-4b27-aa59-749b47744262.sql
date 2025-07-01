
-- Enable RLS on trainers table if not already enabled
ALTER TABLE public.trainers ENABLE ROW LEVEL SECURITY;

-- Allow authenticated users to insert trainer records
CREATE POLICY "Allow trainer registration" 
  ON public.trainers 
  FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

-- Allow trainers to view their own records
CREATE POLICY "Trainers can view their own records" 
  ON public.trainers 
  FOR SELECT 
  TO authenticated 
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Allow trainers to update their own records
CREATE POLICY "Trainers can update their own records" 
  ON public.trainers 
  FOR UPDATE 
  TO authenticated 
  USING (auth.uid() = user_id);

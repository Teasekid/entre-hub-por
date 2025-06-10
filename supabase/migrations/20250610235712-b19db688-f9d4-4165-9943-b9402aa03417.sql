
-- Create a table to track trainer password setup status
CREATE TABLE public.trainer_auth (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  trainer_id UUID REFERENCES public.trainers(id) ON DELETE CASCADE NOT NULL,
  auth_user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  password_set BOOLEAN DEFAULT FALSE,
  setup_token TEXT UNIQUE,
  token_expires_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(trainer_id)
);

-- Enable RLS on trainer_auth table
ALTER TABLE public.trainer_auth ENABLE ROW LEVEL SECURITY;

-- Create policies for trainer_auth
CREATE POLICY "Trainers can view their own auth records" 
  ON public.trainer_auth 
  FOR SELECT 
  USING (trainer_id IN (
    SELECT id FROM public.trainers WHERE email = (auth.jwt() ->> 'email')
  ));

CREATE POLICY "Trainers can update their own auth records" 
  ON public.trainer_auth 
  FOR UPDATE 
  USING (trainer_id IN (
    SELECT id FROM public.trainers WHERE email = (auth.jwt() ->> 'email')
  ));

-- Create a function to generate setup tokens for trainers
CREATE OR REPLACE FUNCTION public.generate_trainer_setup_token(trainer_email TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trainer_record public.trainers;
  setup_token TEXT;
  auth_record public.trainer_auth;
BEGIN
  -- Find the trainer by email
  SELECT * INTO trainer_record FROM public.trainers WHERE email = trainer_email;
  
  IF trainer_record IS NULL THEN
    RAISE EXCEPTION 'Trainer not found with email: %', trainer_email;
  END IF;
  
  -- Generate a random token
  setup_token := encode(gen_random_bytes(32), 'hex');
  
  -- Insert or update trainer_auth record
  INSERT INTO public.trainer_auth (trainer_id, setup_token, token_expires_at)
  VALUES (trainer_record.id, setup_token, now() + interval '7 days')
  ON CONFLICT (trainer_id) 
  DO UPDATE SET 
    setup_token = EXCLUDED.setup_token,
    token_expires_at = EXCLUDED.token_expires_at,
    updated_at = now();
  
  RETURN setup_token;
END;
$$;

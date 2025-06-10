
-- Remove the foreign key constraint from trainers table since we're not creating actual auth users
ALTER TABLE public.trainers DROP CONSTRAINT IF EXISTS trainers_user_id_fkey;

-- Make user_id nullable since we're not using it for auth users
ALTER TABLE public.trainers ALTER COLUMN user_id DROP NOT NULL;

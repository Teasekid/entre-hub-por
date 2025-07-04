
-- Add admin record to the admins table
INSERT INTO public.admins (user_id, name, email)
VALUES ('f6c33901-e7cc-4bde-8f05-e8ea383a8500', 'Admin User', 'abdulx650@gmail.com')
ON CONFLICT (user_id) DO NOTHING;

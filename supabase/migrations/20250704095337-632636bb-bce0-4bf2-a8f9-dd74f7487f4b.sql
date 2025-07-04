
-- Add admin role to the specified user
INSERT INTO public.user_roles (user_id, role)
VALUES ('f6c33901-e7cc-4bde-8f05-e8ea383a8500', 'admin')
ON CONFLICT (user_id, role) DO NOTHING;

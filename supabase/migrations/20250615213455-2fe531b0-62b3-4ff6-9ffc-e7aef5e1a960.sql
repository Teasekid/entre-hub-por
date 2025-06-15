
-- 1. Allow INSERT into user_roles if (a) there are no admins yet (bootstrap), OR (b) the user has 'admin' role
DROP POLICY IF EXISTS "Admins can insert roles" ON public.user_roles;
CREATE POLICY "Admins can insert roles"
  ON public.user_roles
  FOR INSERT
  TO authenticated
  WITH CHECK (
    -- allow if this is the first record, and trying to assign role = 'admin' to themself
    (
      (SELECT count(*) FROM public.user_roles WHERE role = 'admin') = 0
      AND role = 'admin'
      AND user_id = auth.uid()
    )
    -- otherwise, allow only for users who are admin
    OR public.has_role(auth.uid(), 'admin')
  );

-- 1. Public policies no longer invoke the role function for signed-out visitors
DROP POLICY IF EXISTS products_public_select ON public.products;
CREATE POLICY products_anon_select ON public.products
  FOR SELECT TO anon USING (active = true);
CREATE POLICY products_auth_select ON public.products
  FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

DROP POLICY IF EXISTS deals_public_select ON public.deals;
CREATE POLICY deals_anon_select ON public.deals
  FOR SELECT TO anon USING (active = true);
CREATE POLICY deals_auth_select ON public.deals
  FOR SELECT TO authenticated
  USING (active = true OR public.has_role(auth.uid(), 'admin'));

REVOKE EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;

-- 2. Operators can help run the shop
CREATE POLICY products_operator_insert ON public.products
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'operator'));
CREATE POLICY products_operator_update ON public.products
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'operator'))
  WITH CHECK (public.has_role(auth.uid(), 'operator'));
CREATE POLICY products_operator_delete ON public.products
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'operator'));

CREATE POLICY orders_operator_select ON public.orders
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'operator'));
CREATE POLICY orders_operator_update ON public.orders
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'operator'))
  WITH CHECK (public.has_role(auth.uid(), 'operator'));

-- 3. Admin user management
CREATE POLICY profiles_admin_select ON public.profiles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY user_roles_admin_select ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY user_roles_admin_insert ON public.user_roles
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY user_roles_admin_delete ON public.user_roles
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin') AND user_id <> auth.uid());

-- 4. Two-step verification sessions stay service-only but need a policy present
CREATE POLICY admin_2fa_own_select ON public.admin_2fa_sessions
  FOR SELECT TO authenticated USING (user_id = auth.uid());
GRANT SELECT ON public.admin_2fa_sessions TO authenticated;
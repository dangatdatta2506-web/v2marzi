ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'operator';

GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, anon, service_role;
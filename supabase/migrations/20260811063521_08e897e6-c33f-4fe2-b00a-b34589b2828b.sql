ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS images text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sizes text[] NOT NULL DEFAULT '{}';

CREATE TABLE IF NOT EXISTS public.serviceable_pincodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  pincode text NOT NULL UNIQUE,
  city text NOT NULL DEFAULT '',
  state text NOT NULL DEFAULT '',
  eta_days integer NOT NULL DEFAULT 4,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.serviceable_pincodes TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.serviceable_pincodes TO authenticated;
GRANT ALL ON public.serviceable_pincodes TO service_role;

ALTER TABLE public.serviceable_pincodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "pincodes_anon_select" ON public.serviceable_pincodes
  FOR SELECT TO anon USING (active = true);
CREATE POLICY "pincodes_auth_select" ON public.serviceable_pincodes
  FOR SELECT TO authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "pincodes_admin_insert" ON public.serviceable_pincodes
  FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "pincodes_admin_update" ON public.serviceable_pincodes
  FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role)) WITH CHECK (public.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "pincodes_admin_delete" ON public.serviceable_pincodes
  FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE TRIGGER update_serviceable_pincodes_updated_at
  BEFORE UPDATE ON public.serviceable_pincodes
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

INSERT INTO public.serviceable_pincodes (pincode, city, state, eta_days) VALUES
  ('400001','Mumbai','Maharashtra',3),
  ('411001','Pune','Maharashtra',3),
  ('110001','New Delhi','Delhi',4),
  ('560001','Bengaluru','Karnataka',4),
  ('600001','Chennai','Tamil Nadu',5),
  ('700001','Kolkata','West Bengal',5),
  ('302001','Jaipur','Rajasthan',4),
  ('500001','Hyderabad','Telangana',4),
  ('380001','Ahmedabad','Gujarat',4),
  ('226001','Lucknow','Uttar Pradesh',5)
ON CONFLICT (pincode) DO NOTHING;
-- PRODUCTS
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  collection text NOT NULL DEFAULT 'core',
  category text NOT NULL DEFAULT 'Necklaces',
  price integer NOT NULL DEFAULT 0,
  compare_at integer,
  badge text,
  material text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  specs jsonb NOT NULL DEFAULT '[]'::jsonb,
  rating numeric NOT NULL DEFAULT 5,
  reviews integer NOT NULL DEFAULT 0,
  stock integer NOT NULL DEFAULT 0,
  image_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
CREATE POLICY products_public_select ON public.products FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY products_admin_insert ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY products_admin_update ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY products_admin_delete ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ADDRESSES
CREATE TABLE public.addresses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  label text NOT NULL DEFAULT 'Home',
  full_name text NOT NULL,
  phone text NOT NULL,
  line1 text NOT NULL,
  line2 text,
  city text NOT NULL,
  state text NOT NULL,
  pincode text NOT NULL,
  is_default boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.addresses TO authenticated;
GRANT ALL ON public.addresses TO service_role;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
CREATE POLICY addresses_own_all ON public.addresses FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER update_addresses_updated_at BEFORE UPDATE ON public.addresses FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- DEALS
CREATE TABLE public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  code text,
  discount_percent integer NOT NULL DEFAULT 10,
  active boolean NOT NULL DEFAULT true,
  is_popup boolean NOT NULL DEFAULT false,
  cta_label text,
  cta_href text,
  starts_at timestamptz,
  ends_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.deals TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.deals TO authenticated;
GRANT ALL ON public.deals TO service_role;
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY deals_public_select ON public.deals FOR SELECT TO anon, authenticated USING (active = true OR public.has_role(auth.uid(), 'admin'));
CREATE POLICY deals_admin_insert ON public.deals FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY deals_admin_update ON public.deals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY deals_admin_delete ON public.deals FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE TRIGGER update_deals_updated_at BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ADMIN 2FA SESSIONS (server-only)
CREATE TABLE public.admin_2fa_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  verified_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.admin_2fa_sessions TO service_role;
ALTER TABLE public.admin_2fa_sessions ENABLE ROW LEVEL SECURITY;
CREATE INDEX admin_2fa_sessions_user_idx ON public.admin_2fa_sessions (user_id, expires_at DESC);

-- SEED CATALOGUE
INSERT INTO public.products (slug, name, collection, category, price, compare_at, badge, material, description, specs, rating, reviews, stock) VALUES
('aurelia-locket','Aurelia Locket','core','Necklaces',4290,5490,'Best Seller','18K gold plated stainless steel','A hand-engraved oval locket on a fine cable chain. Built to hold one small secret and survive every ordinary day.','[{"label":"Pendant","value":"22mm x 17mm oval"},{"label":"Chain","value":"16in + 2in extender"},{"label":"Finish","value":"Long-lasting, waterproof"}]',4.9,214,12),
('eternity-band','Eternity Pave Band','core','Rings',3190,NULL,'New','18K gold plated brass, zirconia','A full circle of brilliant-cut stones set flush into a slim band. Stacks beautifully, wears alone perfectly.','[{"label":"Width","value":"2.4mm"},{"label":"Stones","value":"Hand-set AAA zirconia"},{"label":"Sizes","value":"IN 10 - 20"}]',4.8,168,24),
('lumen-huggies','Lumen Huggies','core','Earrings',1890,NULL,NULL,'18K gold plated, hypoallergenic post','Featherweight huggies that disappear into your routine and never pinch.','[{"label":"Diameter","value":"12mm"},{"label":"Closure","value":"Hinged snap"},{"label":"Weight","value":"1.8g per pair"}]',4.7,96,40),
('noir-chain','Noir Curb Chain','baddie','Necklaces',3890,NULL,'New','Gold plated steel with onyx','A heavy curb chain broken by a single onyx link. Unapologetic and weighted just right.','[{"label":"Length","value":"18in"},{"label":"Link width","value":"8mm"},{"label":"Clasp","value":"Lobster with logo tag"}]',4.9,132,8),
('sculpt-cuff','Sculpt Cuff','baddie','Bracelets',4590,5990,'Sale','Molded brass, 18K gold plated','A wide, hand-polished cuff with a molten edge. Made to be the only thing on your wrist.','[{"label":"Width","value":"18mm"},{"label":"Fit","value":"Adjustable open back"},{"label":"Finish","value":"High polish"}]',4.8,77,6),
('flare-drops','Flare Drop Earrings','baddie','Earrings',2790,NULL,NULL,'18K gold plated brass','Elongated sculptural drops that catch every light in the room.','[{"label":"Drop","value":"62mm"},{"label":"Weight","value":"4.1g each"},{"label":"Backing","value":"Silicone-lined butterfly"}]',4.6,54,18),
('meridian-studs','Meridian Studs','corporate','Earrings',2190,NULL,'Best Seller','Surgical steel, 18K gold plated','Precision-cut studs sized for video calls and long flights. Sleep-safe, all-day light.','[{"label":"Diameter","value":"6mm"},{"label":"Post","value":"Nickel-free surgical steel"},{"label":"Finish","value":"Brushed satin"}]',4.9,301,52),
('ledger-bracelet','Ledger Bar Bracelet','corporate','Bracelets',2990,NULL,NULL,'18K gold plated steel','A slim engravable bar on a whisper chain. Quiet enough for the boardroom, personal enough to matter.','[{"label":"Bar","value":"28mm engravable"},{"label":"Length","value":"6.5in + 1in"},{"label":"Engraving","value":"Up to 12 characters"}]',4.7,88,30),
('atlas-pendant','Atlas Line Pendant','corporate','Necklaces',3390,NULL,NULL,'18K gold plated steel','One continuous line, folded into a pendant. Minimal geometry with real weight behind it.','[{"label":"Pendant","value":"20mm"},{"label":"Chain","value":"17in fine rolo"},{"label":"Finish","value":"Long-lasting, waterproof"}]',4.8,61,21);

INSERT INTO public.deals (title, description, code, discount_percent, active, is_popup, cta_label, cta_href) VALUES
('10% off your first order','Use code MARZI10 at checkout on any piece in the edit.','MARZI10',10,true,true,'Shop the edit','/shop/core');
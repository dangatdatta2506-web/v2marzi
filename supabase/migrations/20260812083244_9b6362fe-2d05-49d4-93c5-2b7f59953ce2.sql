CREATE TABLE public.reviews (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_slug text NOT NULL,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5,
  title text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  verified_purchase boolean NOT NULL DEFAULT false,
  approved boolean NOT NULL DEFAULT false,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT reviews_rating_range CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT reviews_one_per_product UNIQUE (product_slug, user_id)
);

CREATE INDEX reviews_product_slug_idx ON public.reviews (product_slug);

GRANT SELECT ON public.reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.reviews TO authenticated;
GRANT ALL ON public.reviews TO service_role;

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY reviews_anon_select ON public.reviews
  FOR SELECT TO anon USING (approved = true);

CREATE POLICY reviews_auth_select ON public.reviews
  FOR SELECT TO authenticated
  USING (approved = true OR user_id = auth.uid() OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY reviews_insert_own ON public.reviews
  FOR INSERT TO authenticated WITH CHECK (user_id = auth.uid());

CREATE POLICY reviews_update_own ON public.reviews
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid() AND approved = false);

CREATE POLICY reviews_delete_own ON public.reviews
  FOR DELETE TO authenticated USING (user_id = auth.uid());

CREATE POLICY reviews_staff_update ON public.reviews
  FOR UPDATE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE POLICY reviews_staff_delete ON public.reviews
  FOR DELETE TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
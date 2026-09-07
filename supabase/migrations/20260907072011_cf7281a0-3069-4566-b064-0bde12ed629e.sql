CREATE TABLE public.promo_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  enabled boolean NOT NULL DEFAULT false,
  name text NOT NULL DEFAULT '',
  end_date date NOT NULL,
  eyebrow text NOT NULL DEFAULT '',
  headline text NOT NULL DEFAULT '',
  blurb text NOT NULL DEFAULT '',
  cta_label text NOT NULL DEFAULT '',
  target_collections text[] NOT NULL DEFAULT '{}',
  max_price integer NOT NULL DEFAULT 0,
  show_countdown boolean NOT NULL DEFAULT true,
  countdown_from_days integer NOT NULL DEFAULT 30,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.promo_banners TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.promo_banners TO authenticated;
GRANT ALL ON public.promo_banners TO service_role;

ALTER TABLE public.promo_banners ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active promo banners are publicly visible"
  ON public.promo_banners
  FOR SELECT
  TO anon, authenticated
  USING (enabled = true);

CREATE POLICY "Only admins can manage promo banners"
  ON public.promo_banners
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE TRIGGER update_promo_banners_updated_at
  BEFORE UPDATE ON public.promo_banners
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TABLE public.site_videos (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL DEFAULT '',
  caption text NOT NULL DEFAULT '',
  source_url text NOT NULL,
  thumbnail_url text,
  product_slug text,
  aspect_ratio text NOT NULL DEFAULT '9/16',
  sort_order integer NOT NULL DEFAULT 0,
  active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

GRANT SELECT ON public.site_videos TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.site_videos TO authenticated;
GRANT ALL ON public.site_videos TO service_role;

ALTER TABLE public.site_videos ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active site videos are publicly visible"
  ON public.site_videos
  FOR SELECT
  TO anon, authenticated
  USING (active = true);

CREATE POLICY "Staff can manage site videos"
  ON public.site_videos
  FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'))
  WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'operator'));

CREATE TRIGGER update_site_videos_updated_at
  BEFORE UPDATE ON public.site_videos
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
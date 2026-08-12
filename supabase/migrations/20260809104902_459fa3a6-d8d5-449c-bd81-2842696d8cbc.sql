CREATE TABLE public.site_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_type text NOT NULL,
  product_slug text,
  product_name text,
  path text,
  referrer text,
  device text,
  value integer NOT NULL DEFAULT 0,
  visitor_id text NOT NULL,
  user_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT INSERT ON public.site_events TO anon, authenticated;
GRANT SELECT ON public.site_events TO authenticated;
GRANT ALL ON public.site_events TO service_role;

ALTER TABLE public.site_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY site_events_insert_any ON public.site_events
  FOR INSERT TO anon, authenticated
  WITH CHECK (user_id IS NULL OR user_id = auth.uid());

CREATE POLICY site_events_admin_select ON public.site_events
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX site_events_created_idx ON public.site_events (created_at DESC);
CREATE INDEX site_events_type_idx ON public.site_events (event_type, created_at DESC);
CREATE INDEX site_events_product_idx ON public.site_events (product_slug, created_at DESC);
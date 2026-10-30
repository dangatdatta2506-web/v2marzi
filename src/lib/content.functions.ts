import { createServerFn } from "@tanstack/react-start";
import { publicClient, signImageKeys } from "./catalog.server";
import type { PromoConfig } from "@/components/occasion-banner";

/* ------------ promo banners (public read) ------------ */

export type BannerRow = {
  id: string;
  name: string;
  enabled: boolean;
  end_date: string;
  eyebrow: string;
  headline: string;
  blurb: string;
  cta_label: string;
  show_countdown: boolean;
  countdown_from_days: number;
  max_price: number;
  target_collections: string[];
  sort_order: number;
};

export function bannerToConfig(row: BannerRow): PromoConfig {
  return {
    id: row.id,
    name: row.name,
    enabled: row.enabled,
    endDate: row.end_date,
    eyebrow: row.eyebrow,
    headline: row.headline,
    blurb: row.blurb,
    ctaLabel: row.cta_label,
    showCountdown: row.show_countdown,
    countdownFromDays: row.countdown_from_days,
    maxPrice: row.max_price,
    collections: (row.target_collections ?? []) as PromoConfig["collections"],
  };
}

export const listActiveBanners = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("promo_banners")
    .select("*")
    .eq("enabled", true)
    .order("sort_order", { ascending: true })
    .limit(5);
  if (error) throw error;
  return (data ?? []) as BannerRow[];
});

/* ------------ site videos (public read) ------------ */

export type SiteVideo = {
  id: string;
  title: string;
  caption: string;
  sourceUrl: string;
  thumbnailUrl: string | null;
  productSlug: string | null;
};

export const listActiveVideos = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("site_videos")
    .select("id, title, caption, source_url, thumbnail_url, product_slug")
    .eq("active", true)
    .order("sort_order", { ascending: true })
    .limit(12);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    title: row.title,
    caption: row.caption,
    sourceUrl: row.source_url,
    thumbnailUrl: row.thumbnail_url,
    productSlug: row.product_slug,
  })) as SiteVideo[];
});

/* ------------ approved customer reviews (public read) ------------ */

export type HomeReview = {
  id: string;
  productSlug: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
};

export const listHomeReviews = createServerFn({ method: "GET" }).handler(async () => {
  const { data, error } = await publicClient()
    .from("reviews")
    .select("id, product_slug, author_name, rating, title, body, verified_purchase")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(3);
  if (error) throw error;
  return (data ?? []).map((row) => ({
    id: row.id,
    productSlug: row.product_slug,
    authorName: row.author_name || "Marzi customer",
    rating: row.rating,
    title: row.title,
    body: row.body,
    verifiedPurchase: row.verified_purchase,
  })) as HomeReview[];
});

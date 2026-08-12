import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";
import type { Collection, Product } from "@/lib/products";

export type Deal = {
  id: string;
  title: string;
  description: string;
  code: string | null;
  discountPercent: number;
  active: boolean;
  isPopup: boolean;
  ctaLabel: string | null;
  ctaHref: string | null;
  startsAt: string | null;
  endsAt: string | null;
};

export function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  const url = process.env["SUPABASE_URL"]!;
  return createClient<Database>(url, key, {
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const headers = new Headers(init?.headers);
        if (key.startsWith("sb_") && headers.get("Authorization") === `Bearer ${key}`) {
          headers.delete("Authorization");
        }
        headers.set("apikey", key);
        return fetch(input, { ...init, headers });
      },
    },
  });
}

type Row = Database["public"]["Tables"]["products"]["Row"];

export const PRODUCT_BUCKET = "product-images";

/** Turns stored storage keys into temporary signed URLs (leaves absolute URLs alone). */
export async function signImageKeys(keys: string[]): Promise<Map<string, string>> {
  const signed = new Map<string, string>();
  const storageKeys = [...new Set(keys.filter((k) => k && !/^https?:\/\//i.test(k)))];
  if (storageKeys.length === 0) return signed;
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin.storage
      .from(PRODUCT_BUCKET)
      .createSignedUrls(storageKeys, 60 * 60 * 24 * 7);
    for (const entry of data ?? []) {
      if (entry.path && entry.signedUrl) signed.set(entry.path, entry.signedUrl);
    }
  } catch {
    /* fall back to raw values */
  }
  return signed;
}

export function mapProduct(row: Row): Product {
  return {
    slug: row.slug,
    name: row.name,
    collection: row.collection as Collection,
    category: row.category,
    price: row.price,
    compareAt: row.compare_at ?? undefined,
    badge: (row.badge as Product["badge"]) ?? undefined,
    material: row.material,
    description: row.description,
    specs: (row.specs as unknown as { label: string; value: string }[]) ?? [],
    rating: Number(row.rating),
    reviews: row.reviews,
    stock: row.stock,
    imageUrl: row.image_url,
    images: row.images ?? [],
    sizes: row.sizes ?? [],
  };
}

async function withSignedImages(rows: Row[]): Promise<Product[]> {
  const products = rows.map(mapProduct);
  const keys = products.flatMap((p) => [...(p.images ?? []), p.imageUrl ?? ""]);
  const signed = await signImageKeys(keys);
  return products.map((p) => ({
    ...p,
    imageUrl: p.imageUrl ? (signed.get(p.imageUrl) ?? p.imageUrl) : (p.imageUrl ?? null),
    images: (p.images ?? []).map((k) => signed.get(k) ?? k),
  }));
}

export async function fetchProducts(): Promise<Product[]> {
  const { data, error } = await publicClient()
    .from("products")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return withSignedImages(data ?? []);
}

export async function fetchDeals(): Promise<Deal[]> {
  const nowIso = new Date().toISOString();
  const { data, error } = await publicClient()
    .from("deals")
    .select("*")
    .eq("active", true)
    .order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? [])
    .filter(
      (d) => (!d.starts_at || d.starts_at <= nowIso) && (!d.ends_at || d.ends_at >= nowIso),
    )
    .map((d) => ({
      id: d.id,
      title: d.title,
      description: d.description,
      code: d.code,
      discountPercent: d.discount_percent,
      active: d.active,
      isPopup: d.is_popup,
      ctaLabel: d.cta_label,
      ctaHref: d.cta_href,
      startsAt: d.starts_at,
      endsAt: d.ends_at,
    }));
}

export async function findDealByCode(code: string): Promise<Deal | null> {
  const deals = await fetchDeals();
  const upper = code.trim().toUpperCase();
  return deals.find((d) => d.code?.toUpperCase() === upper) ?? null;
}

export async function fetchProductsBySlugs(slugs: string[]): Promise<Product[]> {
  const { data, error } = await publicClient()
    .from("products")
    .select("*")
    .eq("active", true)
    .in("slug", slugs);
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

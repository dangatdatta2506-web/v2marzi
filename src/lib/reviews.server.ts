import { publicClient } from "@/lib/catalog.server";

export type Review = {
  id: string;
  productSlug: string;
  authorName: string;
  rating: number;
  title: string;
  body: string;
  verifiedPurchase: boolean;
  approved: boolean;
  createdAt: string;
};

export type ReviewSummary = {
  count: number;
  average: number;
  breakdown: Record<1 | 2 | 3 | 4 | 5, number>;
};

type Row = {
  id: string;
  product_slug: string;
  author_name: string;
  rating: number;
  title: string;
  body: string;
  verified_purchase: boolean;
  approved: boolean;
  created_at: string;
};

export function mapReview(row: Row): Review {
  return {
    id: row.id,
    productSlug: row.product_slug,
    authorName: row.author_name || "Marzi customer",
    rating: row.rating,
    title: row.title,
    body: row.body,
    verifiedPurchase: row.verified_purchase,
    approved: row.approved,
    createdAt: row.created_at,
  };
}

export function summarise(reviews: Review[]): ReviewSummary {
  const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as ReviewSummary["breakdown"];
  for (const r of reviews) {
    const star = Math.min(5, Math.max(1, Math.round(r.rating))) as 1 | 2 | 3 | 4 | 5;
    breakdown[star] += 1;
  }
  const count = reviews.length;
  const average = count
    ? Math.round((reviews.reduce((sum, r) => sum + r.rating, 0) / count) * 10) / 10
    : 0;
  return { count, average, breakdown };
}

export async function fetchApprovedReviews(slug: string): Promise<Review[]> {
  const { data, error } = await publicClient()
    .from("reviews")
    .select("id, product_slug, author_name, rating, title, body, verified_purchase, approved, created_at")
    .eq("product_slug", slug)
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []).map((row) => mapReview(row as Row));
}

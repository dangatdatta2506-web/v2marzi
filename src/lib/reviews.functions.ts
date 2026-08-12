import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertStaff } from "@/lib/admin.server";
import { fetchApprovedReviews, mapReview, summarise } from "@/lib/reviews.server";

const slugSchema = z.object({ slug: z.string().trim().min(1).max(120) });

export const listProductReviews = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => slugSchema.parse(input))
  .handler(async ({ data }) => {
    const reviews = await fetchApprovedReviews(data.slug);
    return { reviews, summary: summarise(reviews) };
  });

const submitSchema = z.object({
  slug: z.string().trim().min(1).max(120),
  rating: z.number().int().min(1).max(5),
  title: z.string().trim().max(120).default(""),
  body: z.string().trim().max(2000).default(""),
  authorName: z.string().trim().max(80).default(""),
});

export const submitReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => submitSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;

    const { data: orders } = await supabase
      .from("orders")
      .select("items, payment_status")
      .eq("user_id", userId);

    const verified = (orders ?? []).some((o) => {
      if (o.payment_status !== "paid") return false;
      const items = (o.items as unknown as { slug?: string }[]) ?? [];
      return items.some((i) => i?.slug === data.slug);
    });

    const { error } = await supabase.from("reviews").upsert(
      {
        product_slug: data.slug,
        user_id: userId,
        rating: data.rating,
        title: data.title,
        body: data.body,
        author_name: data.authorName,
        verified_purchase: verified,
        approved: false,
      },
      { onConflict: "product_slug,user_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const, verified };
  });

export const myProductReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => slugSchema.parse(input))
  .handler(async ({ data, context }) => {
    const { data: row } = await context.supabase
      .from("reviews")
      .select(
        "id, product_slug, author_name, rating, title, body, verified_purchase, approved, created_at",
      )
      .eq("product_slug", data.slug)
      .eq("user_id", context.userId)
      .maybeSingle();
    return row ? mapReview(row as never) : null;
  });

export const adminListReviews = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(
      context.supabase,
      context.userId,
      (context.claims as { email?: string } | null)?.email,
    );
    const { data, error } = await context.supabase
      .from("reviews")
      .select(
        "id, product_slug, author_name, rating, title, body, verified_purchase, approved, created_at",
      )
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) throw new Error(error.message);
    return (data ?? []).map((row) => mapReview(row as never));
  });

const moderateSchema = z.object({ id: z.string().uuid(), approved: z.boolean() });

export const adminModerateReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => moderateSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(
      context.supabase,
      context.userId,
      (context.claims as { email?: string } | null)?.email,
    );
    const { error } = await context.supabase
      .from("reviews")
      .update({ approved: data.approved })
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const adminDeleteReview = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(
      context.supabase,
      context.userId,
      (context.claims as { email?: string } | null)?.email,
    );
    const { error } = await context.supabase.from("reviews").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

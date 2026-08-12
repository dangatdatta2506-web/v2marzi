import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import {
  ADMIN_2FA_HOURS,
  assertAdmin,
  assertAdminWith2fa,
  assertStaff,
  isRole,
  has2fa,
  publicAuthClient,
  skips2fa,
} from "./admin.server";
import { mapProduct, signImageKeys } from "./catalog.server";

const productSchema = z.object({
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes only"),
  name: z.string().trim().min(2).max(120),
  collection: z.enum(["core", "baddie", "corporate"]),
  category: z.string().trim().min(2).max(60),
  price: z.number().int().min(0).max(10_000_000),
  compareAt: z.number().int().min(0).max(10_000_000).nullable().optional(),
  badge: z.enum(["New", "Sale", "Best Seller"]).nullable().optional(),
  material: z.string().trim().max(200).default(""),
  description: z.string().trim().max(2000).default(""),
  stock: z.number().int().min(0).max(100000),
  imageUrl: z.string().trim().max(500).nullable().optional(),
  images: z.array(z.string().trim().min(1).max(500)).max(6).default([]),
  sizes: z.array(z.string().trim().min(1).max(20)).max(12).default([]),
  active: z.boolean().default(true),
});


const dealSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(2).max(120),
  description: z.string().trim().max(600).default(""),
  code: z.string().trim().max(30).nullable().optional(),
  discountPercent: z.number().int().min(0).max(90),
  active: z.boolean().default(true),
  isPopup: z.boolean().default(false),
  ctaLabel: z.string().trim().max(60).nullable().optional(),
  ctaHref: z.string().trim().max(200).nullable().optional(),
});

/* ------------ two-step verification ------------ */

export const getAdminStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const claims = context.claims as { email?: string } | null;
    const email = claims?.email ?? null;
    if (await isRole(context.supabase, context.userId, "admin")) {
      return {
        isAdmin: true,
        isStaff: true,
        role: "admin" as const,
        verified: skips2fa(email) || (await has2fa(context.userId)),
        email,
      };
    }
    if (await isRole(context.supabase, context.userId, "operator")) {
      return { isAdmin: false, isStaff: true, role: "operator" as const, verified: true, email };
    }
    return { isAdmin: false, isStaff: false, role: "user" as const, verified: false, email };
  });


export const sendAdminOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context.supabase, context.userId);
    const email = (context.claims as { email?: string } | null)?.email;
    if (!email) throw new Error("No email on this admin account");
    const { error } = await publicAuthClient().auth.signInWithOtp({
      email,
      options: { shouldCreateUser: false },
    });
    if (error) throw new Error(error.message);
    return { sent: true, email };
  });

export const verifyAdminOtp = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().trim().regex(/^\d{6}$/) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdmin(context.supabase, context.userId);
    const email = (context.claims as { email?: string } | null)?.email;
    if (!email) throw new Error("No email on this admin account");

    const { data: result, error } = await publicAuthClient().auth.verifyOtp({
      email,
      token: data.code,
      type: "email",
    });
    if (error || result.user?.id !== context.userId) {
      throw new Error("That code is invalid or has expired");
    }

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_2fa_sessions").delete().eq("user_id", context.userId);
    const { error: insertError } = await supabaseAdmin.from("admin_2fa_sessions").insert({
      user_id: context.userId,
      expires_at: new Date(Date.now() + ADMIN_2FA_HOURS * 3600_000).toISOString(),
    });
    if (insertError) throw insertError;
    return { verified: true };
  });

export const endAdminSession = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("admin_2fa_sessions").delete().eq("user_id", context.userId);
    return { ok: true };
  });

/* ------------ orders ------------ */

export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId, (context.claims as { email?: string } | null)?.email);
    const { data, error } = await context.supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId, (context.claims as { email?: string } | null)?.email);
    const { error } = await context.supabase
      .from("orders")
      .update({ status: data.status })
      .eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

/* ------------ products ------------ */

export const adminListProducts = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(context.supabase, context.userId, (context.claims as { email?: string } | null)?.email);
    const { data, error } = await context.supabase
      .from("products")
      .select("*")
      .order("created_at", { ascending: true });
    if (error) throw error;
    const rows = data ?? [];
    const signed = await signImageKeys(rows.flatMap((r) => r.images ?? []));
    return rows.map((row) => ({
      ...mapProduct(row),
      imageKeys: row.images ?? [],
      images: (row.images ?? []).map((k) => signed.get(k) ?? k),
      active: row.active,
      id: row.id,
    }));
  });


export const adminSaveProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => productSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId, (context.claims as { email?: string } | null)?.email);
    const { error } = await context.supabase.from("products").upsert(
      {
        slug: data.slug,
        name: data.name,
        collection: data.collection,
        category: data.category,
        price: data.price,
        compare_at: data.compareAt ?? null,
        badge: data.badge ?? null,
        material: data.material,
        description: data.description,
        stock: data.stock,
        image_url: data.imageUrl ?? null,
        images: data.images,
        sizes: data.sizes,
        active: data.active,
      },
      { onConflict: "slug" },
    );

    if (error) throw error;
    return { ok: true };
  });

export const adminSetStock = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().min(1), stock: z.number().int().min(0).max(100000) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId, (context.claims as { email?: string } | null)?.email);
    const { error } = await context.supabase
      .from("products")
      .update({ stock: data.stock })
      .eq("slug", data.slug);
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ slug: z.string().min(1) }).parse(input))
  .handler(async ({ data, context }) => {
    await assertStaff(context.supabase, context.userId, (context.claims as { email?: string } | null)?.email);
    const { error } = await context.supabase.from("products").delete().eq("slug", data.slug);
    if (error) throw error;
    return { ok: true };
  });

/* ------------ deals ------------ */

export const adminListDeals = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdminWith2fa(context.supabase, context.userId, (context.claims as { email?: string } | null)?.email);
    const { data, error } = await context.supabase
      .from("deals")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data ?? [];
  });

export const adminSaveDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => dealSchema.parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminWith2fa(context.supabase, context.userId, (context.claims as { email?: string } | null)?.email);
    const row = {
      title: data.title,
      description: data.description,
      code: data.code ? data.code.toUpperCase() : null,
      discount_percent: data.discountPercent,
      active: data.active,
      is_popup: data.isPopup,
      cta_label: data.ctaLabel ?? null,
      cta_href: data.ctaHref ?? null,
    };
    const query = data.id
      ? context.supabase.from("deals").update(row).eq("id", data.id)
      : context.supabase.from("deals").insert(row);
    const { error } = await query;
    if (error) throw error;
    return { ok: true };
  });

export const adminDeleteDeal = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data, context }) => {
    await assertAdminWith2fa(context.supabase, context.userId, (context.claims as { email?: string } | null)?.email);
    const { error } = await context.supabase.from("deals").delete().eq("id", data.id);
    if (error) throw error;
    return { ok: true };
  });

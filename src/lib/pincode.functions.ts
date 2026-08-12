import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { publicClient } from "@/lib/catalog.server";
import { assertStaff } from "@/lib/admin.server";

const pinSchema = z.object({ pincode: z.string().trim().regex(/^\d{6}$/, "Enter a 6-digit PIN") });

export const checkPincode = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => pinSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: row } = await publicClient()
      .from("serviceable_pincodes")
      .select("pincode, city, state, eta_days")
      .eq("pincode", data.pincode)
      .eq("active", true)
      .maybeSingle();

    if (!row) return { serviceable: false as const, pincode: data.pincode };
    return {
      serviceable: true as const,
      pincode: row.pincode,
      city: row.city,
      state: row.state,
      etaDays: row.eta_days,
    };
  });

export const adminListPincodes = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertStaff(
      context.supabase,
      context.userId,
      (context.claims as { email?: string } | null)?.email,
    );
    const { data, error } = await context.supabase
      .from("serviceable_pincodes")
      .select("*")
      .order("pincode", { ascending: true });
    if (error) throw error;
    return data ?? [];
  });

export const adminSavePincode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        pincode: z.string().trim().regex(/^\d{6}$/),
        city: z.string().trim().max(80).default(""),
        state: z.string().trim().max(80).default(""),
        etaDays: z.number().int().min(1).max(30).default(4),
        active: z.boolean().default(true),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(
      context.supabase,
      context.userId,
      (context.claims as { email?: string } | null)?.email,
    );
    const { error } = await context.supabase.from("serviceable_pincodes").upsert(
      {
        pincode: data.pincode,
        city: data.city,
        state: data.state,
        eta_days: data.etaDays,
        active: data.active,
      },
      { onConflict: "pincode" },
    );
    if (error) throw error;
    return { ok: true };
  });

export const adminDeletePincode = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z.object({ pincode: z.string().trim().regex(/^\d{6}$/) }).parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertStaff(
      context.supabase,
      context.userId,
      (context.claims as { email?: string } | null)?.email,
    );
    const { error } = await context.supabase
      .from("serviceable_pincodes")
      .delete()
      .eq("pincode", data.pincode);
    if (error) throw error;
    return { ok: true };
  });

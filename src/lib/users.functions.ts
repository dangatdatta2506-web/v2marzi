import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminWith2fa } from "./admin.server";

export type ManagedRole = "admin" | "operator" | "user";

export type ManagedUser = {
  id: string;
  email: string | null;
  fullName: string | null;
  phone: string | null;
  role: ManagedRole;
  createdAt: string;
  orders: number;
  spend: number;
  isSelf: boolean;
};

export const adminListUsers = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<ManagedUser[]> => {
    await assertAdminWith2fa(
      context.supabase,
      context.userId,
      (context.claims as { email?: string } | null)?.email,
    );

    const [profilesRes, rolesRes, ordersRes] = await Promise.all([
      context.supabase
        .from("profiles")
        .select("id,email,full_name,phone,created_at")
        .order("created_at", { ascending: false }),
      context.supabase.from("user_roles").select("user_id,role"),
      context.supabase.from("orders").select("user_id,total,payment_status"),
    ]);
    if (profilesRes.error) throw profilesRes.error;
    if (rolesRes.error) throw rolesRes.error;
    if (ordersRes.error) throw ordersRes.error;

    const roleFor = new Map<string, ManagedRole>();
    for (const r of rolesRes.data ?? []) {
      const role = r.role as ManagedRole;
      const current = roleFor.get(r.user_id);
      // admin wins over operator wins over user
      const rank = { admin: 3, operator: 2, user: 1 } as const;
      if (!current || rank[role] > rank[current]) roleFor.set(r.user_id, role);
    }

    const stats = new Map<string, { orders: number; spend: number }>();
    for (const o of ordersRes.data ?? []) {
      const row = stats.get(o.user_id) ?? { orders: 0, spend: 0 };
      row.orders += 1;
      if (o.payment_status === "paid") row.spend += o.total ?? 0;
      stats.set(o.user_id, row);
    }

    return (profilesRes.data ?? []).map((p) => ({
      id: p.id,
      email: p.email,
      fullName: p.full_name,
      phone: p.phone,
      role: roleFor.get(p.id) ?? "user",
      createdAt: p.created_at,
      orders: stats.get(p.id)?.orders ?? 0,
      spend: stats.get(p.id)?.spend ?? 0,
      isSelf: p.id === context.userId,
    }));
  });

export const adminSetUserRole = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({
        userId: z.string().uuid(),
        role: z.enum(["admin", "operator", "user"]),
      })
      .parse(input),
  )
  .handler(async ({ data, context }) => {
    await assertAdminWith2fa(
      context.supabase,
      context.userId,
      (context.claims as { email?: string } | null)?.email,
    );
    if (data.userId === context.userId) {
      throw new Error("You cannot change your own role");
    }

    const { error: deleteError } = await context.supabase
      .from("user_roles")
      .delete()
      .eq("user_id", data.userId);
    if (deleteError) throw deleteError;

    const { error } = await context.supabase
      .from("user_roles")
      .insert({ user_id: data.userId, role: data.role });
    if (error) throw error;
    return { ok: true };
  });

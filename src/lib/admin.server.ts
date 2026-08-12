import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/integrations/supabase/types";

export const ADMIN_2FA_HOURS = 8;

/** Main admin accounts that skip the two-step email code. */
const NO_2FA_ADMIN_EMAILS = new Set(["admin@marzi.com"]);

export function skips2fa(email: string | null | undefined): boolean {
  return Boolean(email && NO_2FA_ADMIN_EMAILS.has(email.trim().toLowerCase()));
}

export function publicAuthClient(): SupabaseClient<Database> {
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

export async function isRole(
  supabase: SupabaseClient<Database>,
  userId: string,
  role: "admin" | "operator",
): Promise<boolean> {
  const { data, error } = await supabase.rpc("has_role", { _user_id: userId, _role: role });
  if (error) throw new Error("Could not verify access");
  return Boolean(data);
}

export async function assertAdmin(
  supabase: SupabaseClient<Database>,
  userId: string,
): Promise<void> {
  if (!(await isRole(supabase, userId, "admin"))) {
    throw new Error("Forbidden: admin access required");
  }
}


export async function has2fa(userId: string): Promise<boolean> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("admin_2fa_sessions")
    .select("id")
    .eq("user_id", userId)
    .gt("expires_at", new Date().toISOString())
    .limit(1)
    .maybeSingle();
  return Boolean(data);
}

export async function assertAdminWith2fa(
  supabase: SupabaseClient<Database>,
  userId: string,
  email?: string | null,
): Promise<void> {
  await assertAdmin(supabase, userId);
  if (skips2fa(email)) return;
  if (!(await has2fa(userId))) {
    throw new Error("Two-step verification required");
  }
}

/** Admin (with 2FA) or operator — staff who run day-to-day orders and stock. */
export async function assertStaff(
  supabase: SupabaseClient<Database>,
  userId: string,
  email?: string | null,
): Promise<"admin" | "operator"> {
  if (await isRole(supabase, userId, "admin")) {
    if (!skips2fa(email) && !(await has2fa(userId))) {
      throw new Error("Two-step verification required");
    }
    return "admin";
  }
  if (await isRole(supabase, userId, "operator")) return "operator";
  throw new Error("Forbidden: staff access required");
}

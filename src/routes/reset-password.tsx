import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/reset-password")({
  head: () => ({
    meta: [
      { title: "Choose a New Password — Marzi Jewelry" },
      { name: "description", content: "Set a new password for your Marzi account." },
      { property: "og:title", content: "Reset Password — Marzi Jewelry" },
      { property: "og:description", content: "Set a new password for your Marzi account." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: ResetPasswordPage,
});

function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      setDone(true);
      toast.success("Password updated");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-5 py-20 sm:px-8">
      <p className="eyebrow">Marzi account</p>
      <h1 className="mt-4 font-display text-5xl">New password</h1>
      {done ? (
        <p className="mt-6 text-sm text-muted-foreground">
          Your password has been updated — you can continue shopping.
        </p>
      ) : (
        <form onSubmit={submit} className="mt-10 space-y-5">
          <div>
            <label htmlFor="new-password" className="eyebrow block">
              New password
            </label>
            <input
              id="new-password"
              type="password"
              required
              minLength={8}
              autoComplete="new-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-12 w-full border border-border bg-background px-4 text-sm outline-none focus:border-gold"
            />
          </div>
          <button
            disabled={busy}
            className="w-full bg-gold py-4 text-[0.72rem] uppercase tracking-[0.2em] text-gold-foreground disabled:opacity-60"
          >
            {busy ? "Saving…" : "Update password"}
          </button>
        </form>
      )}
    </div>
  );
}

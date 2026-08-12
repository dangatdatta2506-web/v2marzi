import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

const searchSchema = z.object({ redirect: z.string().optional() });

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [
      { title: "Sign In or Create Account — Marzi Jewelry" },
      {
        name: "description",
        content:
          "Sign in to your Marzi account to place orders, track deliveries and save your favourite pieces.",
      },
      { property: "og:title", content: "Sign In — Marzi Jewelry" },
      { property: "og:description", content: "Access your Marzi account and orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthPage,
});

function safePath(value: string | undefined) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/";
}

type Mode = "signin" | "signup" | "otp" | "reset";

function AuthPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/auth" });
  const { session } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (session) navigate({ to: safePath(search.redirect), replace: true });
  }, [session, navigate, search.redirect]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const address = email.trim().toLowerCase();

      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email: address,
          password,
          options: { emailRedirectTo: window.location.origin },
        });
        if (error) throw error;
        if (!data.session) {
          toast.success("Account created", {
            description: "Check your inbox to confirm your email, then sign in.",
          });
          setMode("signin");
          return;
        }
        toast.success("Welcome to Marzi");
        return;
      }

      if (mode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email: address, password });
        if (error) throw error;
        toast.success("Signed in");
        return;
      }

      if (mode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(address, {
          redirectTo: `${window.location.origin}/reset-password`,
        });
        if (error) throw error;
        toast.success("Reset link sent", {
          description: "Open the email from Marzi to choose a new password.",
        });
        setMode("signin");
        return;
      }

      // OTP mode
      if (!otpSent) {
        const { error } = await supabase.auth.signInWithOtp({ email: address });
        if (error) throw error;
        setOtpSent(true);
        toast.success("Code sent", { description: `We emailed a 6-digit code to ${address}.` });
        return;
      }

      const { error } = await supabase.auth.verifyOtp({
        email: address,
        token: otp.trim(),
        type: "email",
      });
      if (error) throw error;
      toast.success("Signed in");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  const heading =
    mode === "signup"
      ? "Create account"
      : mode === "reset"
        ? "Reset password"
        : mode === "otp"
          ? "Sign in with email code"
          : "Welcome back";

  const cta = busy
    ? "Please wait…"
    : mode === "signup"
      ? "Create account"
      : mode === "reset"
        ? "Send reset link"
        : mode === "otp"
          ? otpSent
            ? "Verify code"
            : "Email me a code"
          : "Sign in";

  return (
    <div className="mx-auto max-w-md px-5 py-20 sm:px-8">
      <p className="eyebrow">Marzi account</p>
      <h1 className="mt-4 font-display text-5xl">{heading}</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        {mode === "reset"
          ? "We'll email you a secure link to set a new password."
          : "An account is required to place an order and track your deliveries."}
      </p>

      <form onSubmit={submit} className="mt-10 space-y-5">
        <div>
          <label htmlFor="email" className="eyebrow block">
            Email
          </label>
          <input
            id="email"
            type="email"
            required
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            disabled={mode === "otp" && otpSent}
            className="mt-2 h-12 w-full border border-border bg-background px-4 text-sm outline-none focus:border-gold disabled:opacity-60"
          />
        </div>

        {(mode === "signin" || mode === "signup") && (
          <div>
            <label htmlFor="password" className="eyebrow block">
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              minLength={8}
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-2 h-12 w-full border border-border bg-background px-4 text-sm outline-none focus:border-gold"
            />
          </div>
        )}

        {mode === "otp" && otpSent && (
          <div>
            <label htmlFor="otp" className="eyebrow block">
              6-digit code
            </label>
            <input
              id="otp"
              inputMode="numeric"
              maxLength={6}
              required
              value={otp}
              onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
              className="mt-2 h-12 w-full border border-border bg-background px-4 text-lg tracking-[0.5em] outline-none focus:border-gold"
            />
          </div>
        )}

        <button
          disabled={busy}
          className="w-full bg-gold py-4 text-[0.72rem] uppercase tracking-[0.2em] text-gold-foreground disabled:opacity-60"
        >
          {cta}
        </button>
      </form>

      <div className="mt-8 space-y-3 text-center text-[0.72rem] uppercase tracking-[0.18em] text-muted-foreground">
        {mode !== "otp" && (
          <button
            onClick={() => {
              setMode("otp");
              setOtpSent(false);
            }}
            className="block w-full hover:text-foreground"
          >
            Sign in with an email code instead
          </button>
        )}
        {mode === "otp" && (
          <button onClick={() => setMode("signin")} className="block w-full hover:text-foreground">
            Use password instead
          </button>
        )}
        {mode !== "reset" && (
          <button onClick={() => setMode("reset")} className="block w-full hover:text-foreground">
            Forgot your password?
          </button>
        )}
        <button
          onClick={() => setMode(mode === "signup" ? "signin" : "signup")}
          className="block w-full hover:text-foreground"
        >
          {mode === "signup" ? "Already have an account? Sign in" : "New here? Create an account"}
        </button>
      </div>
    </div>
  );
}

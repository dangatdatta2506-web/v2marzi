import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { toast } from "sonner";

// Shown in the footer "last updated" badge — edit this string after each site update.
const SITE_LAST_UPDATED = "28 October 2026";

type FooterLink = { to: string; label: string; params?: Record<string, string> };

const columns: { title: string; links: FooterLink[] }[] = [
  {
    title: "Shop",
    links: [
      { to: "/shop/$collection", label: "Core", params: { collection: "core" } },
      { to: "/shop/$collection", label: "Baddie", params: { collection: "baddie" } },
      { to: "/shop/$collection", label: "Corporate", params: { collection: "corporate" } },
      { to: "/best-sellers", label: "Best sellers" },
      { to: "/new-arrivals", label: "New arrivals" },
      { to: "/gifting", label: "Gifting" },
    ],
  },
  {
    title: "Company",
    links: [
      { to: "/about", label: "Our story" },
      { to: "/orders", label: "Track order" },
      { to: "/cart", label: "Your bag" },
    ],
  },
  {
    title: "Legal",
    links: [
      { to: "/privacy", label: "Privacy Policy" },
      { to: "/terms", label: "Terms of Service" },
      { to: "/returns", label: "Return & Refund Policy" },
    ],
  },
];



export function SiteFooter() {
  const [email, setEmail] = useState("");

  return (
    <footer className="mt-24 border-t border-border bg-sand">
      <div className="mx-auto grid max-w-7xl gap-12 px-5 py-10 sm:py-16 sm:px-8 sm:grid-cols-2 md:grid-cols-5">
        <div className="md:col-span-2">
          <p className="font-display text-2xl tracking-[0.35em]">MARZI</p>
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Long-lasting, waterproof jewelry made in India for women who turn ambition into action.
          </p>
          <form
            className="mt-8 flex max-w-sm gap-0"
            onSubmit={(e) => {
              e.preventDefault();
              if (!email) return;
              toast.success("You're on the list", {
                description: "Watch your inbox for first access to new drops.",
              });
              setEmail("");
            }}
          >
            <label htmlFor="newsletter" className="sr-only">
              Email address
            </label>
            <input
              id="newsletter"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email address"
              className="h-11 w-full border border-border bg-background px-4 text-sm outline-none focus:border-gold"
            />
            <button className="h-11 shrink-0 bg-primary px-5 text-[0.72rem] uppercase tracking-[0.18em] text-primary-foreground transition-opacity hover:opacity-90">
              Join
            </button>
          </form>
        </div>

        {columns.map((col) => (
          <div key={col.title}>
            <p className="eyebrow">{col.title}</p>
            <ul className="mt-5 space-y-3">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    to={l.to as never}
                    params={l.params as never}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {l.label}
                  </Link>
                </li>
              ))}

            </ul>
          </div>
        ))}
      </div>
      <div className="flex flex-col items-center gap-4 border-t border-border px-5 py-6 text-center text-xs tracking-[0.14em] text-muted-foreground sm:px-8">
        <div className="flex items-center gap-3">
          <img
            src="/favicon.png"
            alt="Marzi logo"
            width={44}
            height={44}
            className="size-11 rounded-full"
          />
          <span>WEBSITE LAST UPDATED ON {SITE_LAST_UPDATED.toUpperCase()}</span>
        </div>
        <p>© {new Date().getFullYear()} MARZI — MADE IN INDIA, WORN EVERYWHERE</p>
      </div>
    </footer>
  );
}

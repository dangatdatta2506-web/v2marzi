import { Link } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import type { Collection } from "@/lib/products";

/* ------------------------------------------------------------------ *
 * OCCASION CONFIG — swap this object for the next festival.
 * Example for Diwali:
 *   id: "diwali", name: "Diwali", endDate: "2026-11-08",
 *   eyebrow: "Diwali gifting", ...
 * ------------------------------------------------------------------ */
export const OCCASION = {
  id: "rakhi",
  name: "Raksha Bandhan",
  /** Last day the banner shows (inclusive), YYYY-MM-DD. */
  endDate: "2026-08-28",
  eyebrow: "Raksha Bandhan gifting",
  headline: "Something she'll wear long after the thread fades.",
  blurb:
    "Hand-finished, long-lasting gold picks under \u20B93,000 — sister-approved, boxed and ready to gift.",
  ctaLabel: "Shop Rakhi gifts",
  /** Filter applied to the gifting page. */
  maxPrice: 3000,
  collections: ["core", "baddie"] as Collection[],
};

export function occasionSearch() {
  return {
    occasion: OCCASION.id,
    max: OCCASION.maxPrice,
    collections: OCCASION.collections.join(","),
  };
}

export function daysLeft(endDate: string) {
  const end = new Date(`${endDate}T23:59:59`).getTime();
  return Math.ceil((end - Date.now()) / 86_400_000);
}

export function OccasionBanner() {
  const left = daysLeft(OCCASION.endDate);
  if (left < 0) return null;

  return (
    <section className="border-b border-border bg-primary">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 py-8 text-center sm:px-8 sm:py-10 md:flex-row md:justify-between md:text-left">
        <div className="flex items-start gap-4">
          <Gift className="mt-1 size-6 shrink-0 text-gold" />
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-gold">
              {OCCASION.eyebrow}
              {left <= 30 && (
                <span className="ml-3 text-[oklch(0.93_0.01_85)]">
                  {left === 0 ? "Last day" : `${left} day${left === 1 ? "" : "s"} left`}
                </span>
              )}
            </p>
            <h2 className="mt-2 font-display text-2xl leading-snug text-primary-foreground sm:text-3xl">
              {OCCASION.headline}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[oklch(0.9_0.01_85)]">
              {OCCASION.blurb}
            </p>
          </div>
        </div>
        <Link
          to="/gifting"
          search={occasionSearch()}
          className="shrink-0 bg-gold px-8 py-4 text-[0.7rem] uppercase tracking-[0.2em] text-gold-foreground transition-opacity hover:opacity-90"
        >
          {OCCASION.ctaLabel}
        </Link>
      </div>
    </section>
  );
}

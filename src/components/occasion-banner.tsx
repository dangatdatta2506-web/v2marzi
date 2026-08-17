import { Link } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import { useEffect, useState } from "react";
import type { Collection } from "@/lib/products";

export type PromoConfig = {
  id: string;
  name: string;
  /** Set false to hide the banner without deleting the config. */
  enabled: boolean;
  /** Last day the banner shows (inclusive), YYYY-MM-DD. */
  endDate: string;
  eyebrow: string;
  headline: string;
  blurb: string;
  ctaLabel: string;
  /** Show a live countdown (days · hours · minutes) next to the eyebrow. */
  showCountdown: boolean;
  /** Start showing the countdown when this many days remain. */
  countdownFromDays: number;
  /** Filters applied to the gifting page. */
  maxPrice: number;
  collections: Collection[];
};

/* ------------------------------------------------------------------ *
 * OCCASION CONFIG — swap this object for the next festival.
 * Example for Diwali:
 *   id: "diwali", name: "Diwali", endDate: "2026-11-08",
 *   eyebrow: "Diwali gifting", ...
 * Set enabled:false to hide the banner entirely.
 * ------------------------------------------------------------------ */
export const OCCASION: PromoConfig = {
  id: "rakhi",
  name: "Raksha Bandhan",
  enabled: true,
  endDate: "2026-08-28",
  eyebrow: "Raksha Bandhan gifting",
  headline: "Something she'll wear long after the thread fades.",
  blurb:
    "Hand-finished, long-lasting gold picks under \u20B93,000 — sister-approved, boxed and ready to gift.",
  ctaLabel: "Shop Rakhi gifts",
  showCountdown: true,
  countdownFromDays: 30,
  maxPrice: 3000,
  collections: ["core", "baddie"],
};

export function occasionSearch(config: PromoConfig = OCCASION) {
  return {
    occasion: config.id,
    max: config.maxPrice,
    collections: config.collections.join(","),
  };
}

export function daysLeft(endDate: string) {
  const end = new Date(`${endDate}T23:59:59`).getTime();
  return Math.ceil((end - Date.now()) / 86_400_000);
}

function useCountdown(endDate: string, active: boolean) {
  const [label, setLabel] = useState<string | null>(null);

  useEffect(() => {
    if (!active) return;
    const end = new Date(`${endDate}T23:59:59`).getTime();
    const tick = () => {
      const ms = end - Date.now();
      if (ms <= 0) {
        setLabel("Last day");
        return;
      }
      const d = Math.floor(ms / 86_400_000);
      const h = Math.floor((ms % 86_400_000) / 3_600_000);
      const m = Math.floor((ms % 3_600_000) / 60_000);
      setLabel(d > 0 ? `${d}d ${h}h left` : `${h}h ${m}m left`);
    };
    tick();
    const id = window.setInterval(tick, 60_000);
    return () => window.clearInterval(id);
  }, [endDate, active]);

  return label;
}

/** Reusable promo banner. Pass any PromoConfig; defaults to OCCASION. */
export function PromoBanner({ config = OCCASION }: { config?: PromoConfig }) {
  const left = daysLeft(config.endDate);
  const showCountdown = config.showCountdown && left <= config.countdownFromDays;
  const countdown = useCountdown(config.endDate, showCountdown);

  if (!config.enabled || left < 0) return null;

  return (
    <section className="border-b border-border bg-primary">
      <div className="mx-auto flex max-w-7xl flex-col items-center gap-6 px-5 py-8 text-center sm:px-8 sm:py-10 md:flex-row md:justify-between md:text-left">
        <div className="flex items-start gap-4">
          <Gift className="mt-1 size-6 shrink-0 text-gold" />
          <div>
            <p className="text-[0.68rem] uppercase tracking-[0.24em] text-gold">
              {config.eyebrow}
              {showCountdown && countdown && (
                <span className="ml-3 text-[oklch(0.93_0.01_85)]">{countdown}</span>
              )}
            </p>
            <h2 className="mt-2 font-display text-2xl leading-snug text-primary-foreground sm:text-3xl">
              {config.headline}
            </h2>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-[oklch(0.9_0.01_85)]">
              {config.blurb}
            </p>
          </div>
        </div>
        <Link
          to="/gifting"
          search={occasionSearch(config)}
          className="shrink-0 bg-gold px-8 py-4 text-[0.7rem] uppercase tracking-[0.2em] text-gold-foreground transition-opacity hover:opacity-90"
        >
          {config.ctaLabel}
        </Link>
      </div>
    </section>
  );
}

/** Backwards-compatible alias. */
export const OccasionBanner = PromoBanner;

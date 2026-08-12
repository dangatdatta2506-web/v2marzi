import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { X } from "lucide-react";
import { useEffect, useState } from "react";
import { dealsQuery } from "@/lib/catalog";

export function DealPopup() {
  const { data } = useQuery(dealsQuery);
  const deal = (data ?? []).find((d) => d.isPopup);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!deal) return;
    if (window.sessionStorage.getItem(`marzi-deal-${deal.id}`)) return;
    const timer = window.setTimeout(() => setOpen(true), 2500);
    return () => window.clearTimeout(timer);
  }, [deal]);

  if (!deal || !open) return null;

  const close = () => {
    window.sessionStorage.setItem(`marzi-deal-${deal.id}`, "1");
    setOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-[oklch(0.24_0.03_45_/_0.55)] px-5">
      <div className="relative w-full max-w-md border border-border bg-background p-10 text-center">
        <button
          onClick={close}
          aria-label="Close offer"
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <p className="eyebrow">Marzi offer</p>
        <h2 className="mt-4 font-display text-4xl leading-tight">{deal.title}</h2>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{deal.description}</p>
        {deal.code && (
          <p className="mt-6 border border-dashed border-gold px-4 py-3 text-sm uppercase tracking-[0.2em] text-gold">
            {deal.code}
          </p>
        )}
        {deal.ctaHref ? (
          <Link
            to={deal.ctaHref}
            onClick={close}
            className="mt-7 inline-block bg-gold px-8 py-4 text-[0.7rem] uppercase tracking-[0.2em] text-gold-foreground"
          >
            {deal.ctaLabel ?? "Shop now"}
          </Link>
        ) : (
          <button
            onClick={close}
            className="mt-7 inline-block bg-gold px-8 py-4 text-[0.7rem] uppercase tracking-[0.2em] text-gold-foreground"
          >
            {deal.ctaLabel ?? "Continue shopping"}
          </button>
        )}
      </div>
    </div>
  );
}

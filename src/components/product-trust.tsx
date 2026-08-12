import { Banknote, CreditCard, RefreshCw, ShieldCheck, Truck } from "lucide-react";
import { inr } from "@/lib/products";

const perks = [
  { icon: ShieldCheck, label: "1-year plating warranty" },
  { icon: RefreshCw, label: "7-day easy returns" },
  { icon: Truck, label: "Free shipping over ₹1,999" },
  { icon: Banknote, label: "Cash on delivery available" },
];

export function TrustStrip() {
  return (
    <ul className="mt-8 grid grid-cols-2 gap-3 border-y border-border py-5 text-xs text-muted-foreground sm:grid-cols-4">
      {perks.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-2">
          <Icon className="size-4 shrink-0 text-gold" />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function OffersStrip({ price }: { price: number }) {
  const emi = Math.round(price / 3);
  return (
    <div className="mt-8 border border-border">
      <p className="border-b border-border px-5 py-3 text-[0.7rem] uppercase tracking-[0.18em]">
        Offers for you
      </p>
      <ul className="space-y-3 px-5 py-4 text-sm text-muted-foreground">
        <li>
          <span className="text-foreground">MARZI10</span> — flat 10% off your first order.
        </li>
        <li>
          <span className="text-foreground">Free shipping</span> on orders above ₹1,999.
        </li>
        <li className="flex items-center gap-2">
          <CreditCard className="size-4 shrink-0 text-gold" />
          Pay in 3 interest-free instalments of {inr(emi)} with UPI or card EMI.
        </li>
      </ul>
    </div>
  );
}

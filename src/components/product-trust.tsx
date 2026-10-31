import { Gem, ShieldCheck, Sparkles, Wallet } from "lucide-react";

const perks = [
  { icon: Wallet, label: "Prepaid orders only" },
  { icon: Sparkles, label: "Long-lasting 18K plating" },
  { icon: Gem, label: "Handcrafted in India" },
  { icon: ShieldCheck, label: "Quality-checked by hand" },
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

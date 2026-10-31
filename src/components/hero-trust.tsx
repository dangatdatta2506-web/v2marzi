import { Gem, MessageCircle, Sparkles, Wallet } from "lucide-react";
import { whatsappLink } from "./whatsapp-button";

const signals = [
  {
    icon: Wallet,
    label: "Payments",
    sub: "UPI · Visa/Mastercard · Razorpay",
  },
  {
    icon: Sparkles,
    label: "Long-lasting",
    sub: "Triple-layer 18K plating",
  },
  {
    icon: Gem,
    label: "Made in India",
    sub: "Handcrafted by artisans",
  },
  {
    icon: MessageCircle,
    label: "Support",
    sub: "Chat with us",
    href: whatsappLink("Hi Marzi! I have a question about an order."),
  },
];

export function HeroTrustRow() {
  return (
    <div className="border-b border-border bg-background">
      <div className="mx-auto grid max-w-7xl grid-cols-2 gap-4 px-5 py-4 sm:px-8 md:grid-cols-4">
        {signals.map(({ icon: Icon, label, sub, href }) => {
          const body = (
            <div className="flex items-center gap-3">
              <div className="grid size-9 shrink-0 place-items-center rounded-full border border-border bg-muted">
                <Icon className="size-4 text-gold" />
              </div>
              <div className="min-w-0">
                <p className="text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                  {label}
                </p>
                <p className="truncate text-xs font-medium text-foreground">{sub}</p>
              </div>
            </div>
          );

          return href ? (
            <a
              key={label}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="group transition-colors hover:text-gold"
            >
              {body}
            </a>
          ) : (
            <div key={label} className="group">
              {body}
            </div>
          );
        })}
      </div>
    </div>
  );
}

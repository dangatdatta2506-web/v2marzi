import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ChevronDown, MessageCircle } from "lucide-react";
import { whatsappLink } from "@/components/whatsapp-button";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title: "Help & Support — Marzi Jewelry" },
      {
        name: "description",
        content:
          "Marzi help centre: delivery timelines, returns, payments, jewelry care and how to reach us on WhatsApp.",
      },
      { property: "og:title", content: "Help & Support — Marzi Jewelry" },
      {
        property: "og:description",
        content: "Answers about delivery, returns, payments and jewelry care at Marzi.",
      },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "/help" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/help" }],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "FAQPage",
          mainEntity: faqs.map((f) => ({
            "@type": "Question",
            name: f.q,
            acceptedAnswer: { "@type": "Answer", text: f.a },
          })),
        }),
      },
    ],
  }),
  component: HelpPage,
});

const faqs: { q: string; a: string }[] = [
  {
    q: "How long does delivery take?",
    a: "Metro cities usually receive orders in 2–4 working days; the rest of India takes 4–7 working days. You can check your PIN code from the delivery button in the header before ordering.",
  },
  {
    q: "Do you deliver to my PIN code?",
    a: "We ship pan-India to every serviceable PIN code on our network. Use the delivery checker in the header — it tells you instantly whether we deliver and how many days it takes.",
  },
  {
    q: "Which payment methods can I use?",
    a: "All payments run through Razorpay's secure checkout — UPI, debit and credit cards, net banking and wallets. Your card details never touch our servers.",
  },
  {
    q: "Is my jewelry long-lasting?",
    a: "Yes. Every Marzi piece uses triple-layer 18K plating over stainless steel, so it's long-lasting, waterproof and safe for daily wear.",
  },
  {
    q: "How should I care for my pieces?",
    a: "Wipe with a soft dry cloth after wear, keep perfume and hairspray off the metal, and store pieces in the pouch they arrive in.",
  },
  {
    q: "What is your return policy?",
    a: "Unworn pieces in original packaging can be returned within 7 days of delivery. Write to us on WhatsApp and we'll arrange a pickup.",
  },
  {
    q: "Can I track my order?",
    a: "Yes — sign in and open the Orders page. Every order shows its live status from confirmed through delivered, along with the invoice.",
  },
  {
    q: "Do you offer sizes?",
    a: "Rings and select pieces list available sizes on the product page. If your size isn't listed, message us on WhatsApp and we'll check stock for you.",
  },
  {
    q: "How do I reach a human?",
    a: "Tap the WhatsApp button in the corner of any page. We reply between 10am and 7pm IST, Monday to Saturday.",
  },
];

function HelpPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <p className="eyebrow">Help &amp; support</p>
      <h1 className="mt-4 font-display text-5xl">We're here for you</h1>
      <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
        Everything people usually ask us, answered. Still stuck? Message us on WhatsApp and a real
        person will reply.
      </p>

      <a
        href={whatsappLink("Hi Marzi! I need help with my order.")}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-8 inline-flex items-center gap-2 bg-gold px-7 py-4 text-[0.7rem] uppercase tracking-[0.2em] text-gold-foreground transition-opacity hover:opacity-90"
      >
        <MessageCircle className="size-4" /> Chat on WhatsApp
      </a>

      <div className="mt-14 divide-y divide-border border-y border-border">
        {faqs.map((f, i) => {
          const open = openIndex === i;
          return (
            <div key={f.q}>
              <button
                onClick={() => setOpenIndex(open ? null : i)}
                aria-expanded={open}
                className="flex w-full items-center justify-between gap-6 py-5 text-left"
              >
                <span className="font-display text-xl leading-snug">{f.q}</span>
                <ChevronDown
                  className={cn(
                    "size-4 shrink-0 text-muted-foreground transition-transform",
                    open && "rotate-180",
                  )}
                />
              </button>
              {open && (
                <p className="pb-6 text-sm leading-relaxed text-muted-foreground">{f.a}</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

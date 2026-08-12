import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { productsQuery } from "@/lib/catalog";
import { products as fallback } from "@/lib/products";

type Bucket = { id: string; label: string; test: (price: number) => boolean };

const buckets: Bucket[] = [
  { id: "all", label: "All gifts", test: () => true },
  { id: "under-2000", label: "Under ₹2,000", test: (p) => p < 2000 },
  { id: "2000-4000", label: "₹2,000 – ₹4,000", test: (p) => p >= 2000 && p <= 4000 },
  { id: "above-4000", label: "Above ₹4,000", test: (p) => p > 4000 },
];

const occasions = [
  { title: "For her first job", blurb: "Boardroom-ready polish that survives long days.", collection: "corporate" },
  { title: "For the birthday girl", blurb: "Statement pieces with a little noise.", collection: "baddie" },
  { title: "For everyday love", blurb: "Quiet classics she'll never take off.", collection: "core" },
] as const;

export const Route = createFileRoute("/gifting")({
  head: () => ({
    meta: [
      { title: "Gifting — Jewelry Gifts by Budget | Marzi" },
      {
        name: "description",
        content:
          "Find the perfect jewelry gift by budget or occasion. Long-lasting, waterproof gold pieces with free shipping over ₹1,999.",
      },
      { property: "og:title", content: "Gifting — Jewelry Gifts by Budget | Marzi" },
      { property: "og:description", content: "Shop Marzi jewelry gifts by budget and occasion." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/gifting" }],
  }),
  component: GiftingPage,
});

function GiftingPage() {
  const { data } = useQuery(productsQuery);
  const catalog = data ?? fallback;
  const [bucket, setBucket] = useState("all");
  const active = buckets.find((b) => b.id === bucket) ?? buckets[0]!;
  const list = catalog.filter((p) => active.test(p.price));

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <nav className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        / Gifting
      </nav>

      <header className="mt-8 max-w-2xl">
        <p className="eyebrow">The gift edit</p>
        <h1 className="mt-3 font-display text-5xl">Gifting</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Every order arrives in a Marzi gift box with a care card. Add a note at checkout and we'll
          keep the price off the invoice.
        </p>
      </header>

      <section className="mt-14 grid gap-6 md:grid-cols-3">
        {occasions.map((o) => (
          <Link
            key={o.title}
            to="/shop/$collection"
            params={{ collection: o.collection }}
            className="border border-border p-8 transition-colors hover:border-gold"
          >
            <p className="font-display text-2xl">{o.title}</p>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{o.blurb}</p>
            <p className="mt-6 text-[0.68rem] uppercase tracking-[0.18em] text-gold">Shop the edit</p>
          </Link>
        ))}
      </section>

      <div className="mt-16 flex flex-wrap gap-2 border-y border-border py-4">
        {buckets.map((b) => (
          <button
            key={b.id}
            onClick={() => setBucket(b.id)}
            className={`px-4 py-2 text-[0.7rem] uppercase tracking-[0.16em] transition-colors ${
              bucket === b.id
                ? "bg-primary text-primary-foreground"
                : "border border-border text-muted-foreground hover:text-foreground"
            }`}
          >
            {b.label}
          </button>
        ))}
      </div>

      {list.length ? (
        <div className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          Nothing in this budget right now.
        </p>
      )}
    </div>
  );
}

import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ProductCard } from "@/components/product-card";
import { OCCASION, occasionSearch, daysLeft } from "@/components/occasion-banner";
import { whatsappLink } from "@/components/whatsapp-button";
import { productsQuery } from "@/lib/catalog";
import { products as fallback, type Collection, type Product } from "@/lib/products";

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

type GiftSearch = {
  occasion?: string | undefined;
  max?: number | undefined;
  collections?: string | undefined;
};

export const Route = createFileRoute("/gifting")({
  validateSearch: (search: Record<string, unknown>): GiftSearch => ({
    occasion: typeof search["occasion"] === "string" ? search["occasion"] : undefined,
    max: Number(search["max"]) > 0 ? Number(search["max"]) : undefined,
    collections: typeof search["collections"] === "string" ? search["collections"] : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Gifting — Rakhi, Corporate & Budget Jewelry Gifts | Marzi" },
      {
        name: "description",
        content:
          "Marzi gifting: Raksha Bandhan picks, corporate and bulk gifting, plus edits under ₹2,000 and ₹4,000. Long-lasting gold, gift-boxed, free shipping over ₹1,999.",
      },
      { property: "og:title", content: "Gifting — Rakhi, Corporate & Budget Jewelry Gifts | Marzi" },
      {
        property: "og:description",
        content: "Rakhi gifts, corporate gifting and budget edits from Marzi.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/gifting" }],
  }),
  component: GiftingPage,
});

function Grid({ items }: { items: Product[] }) {
  if (!items.length)
    return <p className="mt-8 text-sm text-muted-foreground">Nothing in this edit right now.</p>;
  return (
    <div className="mt-8 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((p) => (
        <ProductCard key={p.slug} product={p} />
      ))}
    </div>
  );
}

function GiftingPage() {
  const { data } = useQuery(productsQuery);
  const search = Route.useSearch();
  const catalog = data ?? fallback;
  const [bucket, setBucket] = useState("all");
  const active = buckets.find((b) => b.id === bucket) ?? buckets[0]!;

  const filtered = search.max || search.collections
    ? catalog.filter((p) => {
        const okPrice = search.max ? p.price <= search.max : true;
        const cols = search.collections?.split(",").filter(Boolean) as Collection[] | undefined;
        const okCol = cols?.length ? cols.includes(p.collection) : true;
        return okPrice && okCol;
      })
    : null;

  const occasionPicks = catalog.filter(
    (p) => p.price <= OCCASION.maxPrice && OCCASION.collections.includes(p.collection),
  );
  const under2k = catalog.filter((p) => p.price < 2000);
  const under4k = catalog.filter((p) => p.price < 4000);
  const list = catalog.filter((p) => active.test(p.price));
  const left = daysLeft(OCCASION.endDate);

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:py-16 sm:px-8">
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

      {/* Filtered view from the occasion banner */}
      {filtered && (
        <section className="mt-14 border border-gold p-6 sm:p-8">
          <p className="eyebrow text-gold">
            {search.occasion === OCCASION.id ? OCCASION.eyebrow : "Filtered gifts"}
          </p>
          <div className="mt-2 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-3xl">
              {search.max ? `Under ₹${search.max.toLocaleString("en-IN")}` : "Selected picks"}
              {search.collections ? ` · ${search.collections.split(",").join(" + ")}` : ""}
            </h2>
            <Link
              to="/gifting"
              search={{}}
              className="text-[0.68rem] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
            >
              Clear filter
            </Link>
          </div>
          <Grid items={filtered} />
        </section>
      )}

      {/* Occasion section */}
      {left >= 0 && (
        <section className="mt-16">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="eyebrow">{OCCASION.name}</p>
              <h2 className="mt-2 font-display text-4xl">Rakhi gifts she'll actually wear</h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-muted-foreground">
                {OCCASION.blurb}
              </p>
            </div>
            <Link
              to="/gifting"
              search={occasionSearch()}
              className="text-[0.68rem] uppercase tracking-[0.18em] text-gold"
            >
              See the full edit
            </Link>
          </div>
          <Grid items={occasionPicks.slice(0, 6)} />
        </section>
      )}

      {/* Corporate / bulk */}
      <section id="corporate" className="mt-20 border border-border bg-sand p-8 sm:p-12">
        <p className="eyebrow">Corporate & bulk gifting</p>
        <h2 className="mt-3 font-display text-4xl">Gift your team something that lasts</h2>
        <p className="mt-4 max-w-2xl text-sm leading-relaxed text-muted-foreground">
          Diwali hampers, joining kits, milestone gifts — from 10 pieces up. Custom boxes, branded
          care cards, GST invoicing and pan-India dispatch. Tell us the headcount and budget, we'll
          build the edit.
        </p>
        <div className="mt-8 flex flex-wrap gap-4">
          <a
            href={whatsappLink(
              "Hi Marzi! I'd like a quote for corporate/bulk gifting. Headcount: , Budget per gift: , Delivery city: ",
            )}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-primary px-8 py-4 text-[0.7rem] uppercase tracking-[0.2em] text-primary-foreground transition-opacity hover:opacity-90"
          >
            Start a bulk inquiry
          </a>
          <Link
            to="/shop/$collection"
            params={{ collection: "corporate" }}
            className="border border-foreground px-8 py-4 text-[0.7rem] uppercase tracking-[0.2em] transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Browse the Corporate edit
          </Link>
        </div>
      </section>

      {/* Budget edits */}
      <section className="mt-20">
        <p className="eyebrow">Under ₹2,000</p>
        <h2 className="mt-2 font-display text-4xl">Small gift, long memory</h2>
        <Grid items={under2k.slice(0, 6)} />
      </section>

      <section className="mt-20">
        <p className="eyebrow">Under ₹4,000</p>
        <h2 className="mt-2 font-display text-4xl">The one they'll open twice</h2>
        <Grid items={under4k.slice(0, 6)} />
      </section>

      <section className="mt-20 grid gap-6 md:grid-cols-3">
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

      <Grid items={list} />
    </div>
  );
}

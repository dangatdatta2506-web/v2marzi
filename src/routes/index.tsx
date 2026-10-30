import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProductCard } from "@/components/product-card";
import { OccasionBanner, OCCASION } from "@/components/occasion-banner";
import { HeroTrustRow } from "@/components/hero-trust";
import { VerticalVideoRail } from "@/components/vertical-video-rail";
import { bannerToConfig, listActiveBanners, listHomeReviews } from "@/lib/content.functions";
import { collectionImage, heroImage } from "@/lib/images";
import { collections, products } from "@/lib/products";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Marzi — Because Your Hustle Deserves a Sparkle" },
      {
        name: "description",
        content:
          "Long-lasting, waterproof gold jewelry made in India. Shop the Core, Baddie and Corporate edits with secure UPI checkout and pan-India delivery.",
      },
      { property: "og:title", content: "Marzi — Because Your Hustle Deserves a Sparkle" },
      {
        property: "og:description",
        content: "Long-lasting, waterproof jewelry made in India, worn everywhere.",
      },
      { property: "og:url", content: "/" },
    ],
    links: [{ rel: "canonical", href: "/" }],
  }),
  component: Home,
});

const marquee = [
  "Secure UPI checkout",
  "Pan-India delivery",
  "Corporate gifting",
];

const reviewsFallback = [
  {
    name: "Ananya R.",
    text: "Wore the Aurelia locket through monsoon, gym and a wedding. Still looks brand new.",
  },
  { name: "Kavya S.", text: "The Meridian studs are the only earrings I don't take off anymore." },
  { name: "Diya M.", text: "Packaging alone felt like a gift. The cuff gets a comment every time." },
];

function Home() {
  // Admin-managed content: banner from /admin → Banners, videos from /admin → Videos.
  const { data: banners } = useQuery({ queryKey: ["home-banners"], queryFn: () => listActiveBanners() });
  const { data: dbReviews } = useQuery({ queryKey: ["home-reviews"], queryFn: () => listHomeReviews() });
  const bannerConfig = banners?.length ? bannerToConfig(banners[0]!) : OCCASION;
  const homeReviews =
    dbReviews && dbReviews.length
      ? dbReviews.map((r) => ({
          id: r.id,
          name: r.authorName,
          rating: r.rating,
          title: r.title,
          text: r.body,
          verified: r.verifiedPurchase,
          slug: r.productSlug,
        }))
      : reviewsFallback.map((r, i) => ({
          id: `fallback-${i}`,
          name: r.name,
          rating: 5,
          title: "",
          text: r.text,
          verified: true,
          slug: null as string | null,
        }));
  const fill = (primary: typeof products, count = 8) => {
    const rest = products.filter((p) => !primary.includes(p));
    return [...primary, ...rest].slice(0, count);
  };
  const newArrivals = fill(products.filter((p) => p.badge === "New"));
  const bestSellers = fill(products.filter((p) => p.badge === "Best Seller"));

  return (
    <>
      {/* Hero */}
      <section className="relative isolate flex min-h-[78vh] items-center justify-center overflow-hidden">
        <img
          src={heroImage}
          alt="Gold locket necklace and pavé eternity ring on blush satin"
          width={1920}
          height={1088}
          className="ken-burns absolute inset-0 -z-10 size-full object-cover"
        />
        <div className="absolute inset-0 -z-10 bg-[oklch(0.24_0.03_45_/_0.55)]" />
        <div className="fade-up mx-auto max-w-3xl px-6 py-14 sm:py-24 text-center">
          <p className="text-[0.72rem] uppercase tracking-[0.28em] text-[oklch(0.82_0.09_80)]">
            Made in India, worn everywhere
          </p>
          <h1 className="mt-8 font-display text-5xl leading-[1.05] text-[oklch(0.98_0.01_85)] sm:text-6xl md:text-7xl">
            Because your hustle deserves a sparkle.
          </h1>
          <p className="mx-auto mt-7 max-w-xl text-base leading-relaxed text-[oklch(0.93_0.01_85)]">
            Jewelry designed for the woman who turns ambition into action — from the boardroom to
            the breakthrough. Long-lasting, waterproof, made to keep pace with you.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link
              to="/shop/$collection"
              params={{ collection: "core" }}
              className="bg-gold px-9 py-4 text-[0.72rem] uppercase tracking-[0.2em] text-gold-foreground transition-opacity hover:opacity-90"
            >
              Shop the edit
            </Link>
            <Link
              to="/about"
              className="border border-[oklch(0.98_0.01_85)] px-9 py-4 text-[0.72rem] uppercase tracking-[0.2em] text-[oklch(0.98_0.01_85)] transition-colors hover:bg-[oklch(0.98_0.01_85)] hover:text-foreground"
            >
              Our story
            </Link>
          </div>
        </div>
      </section>

      {/* Trust signals */}
      <HeroTrustRow />

      {/* Occasion banner */}
      <OccasionBanner config={bannerConfig} />

      {/* Assurance bar */}
      <div className="border-b border-border bg-sand">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-12 gap-y-3 px-5 py-5 sm:px-8">
          {marquee.map((m) => (
            <span key={m} className="text-[0.7rem] uppercase tracking-[0.2em] text-muted-foreground">
              {m}
            </span>
          ))}
        </div>
      </div>

      {/* Promises */}
      <section className="mx-auto grid max-w-7xl gap-10 px-5 py-12 sm:py-20 sm:px-8 md:grid-cols-3">
        {[
          ["Long-lasting", "Triple-layer 18K plating that survives sweat, sun and saltwater."],
          ["Waterproof", "Shower, swim, repeat. Tested for 12 months of daily wear."],
          ["Made in India", "Finished in small batches in Jaipur and Mumbai."],
        ].map(([title, body]) => (
          <div key={title} className="text-center">
            <div className="mx-auto h-px w-12 rule-gold" />
            <h2 className="mt-6 font-display text-3xl">{title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{body}</p>
          </div>
        ))}
      </section>

      {/* Collections */}
      <section className="mx-auto max-w-7xl px-5 pb-20 sm:px-8">
        <div className="text-center">
          <p className="eyebrow">Featured collections</p>
          <h2 className="mt-3 font-display text-4xl">Three moods, one standard</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {collections.map((c) => (
            <Link
              key={c.slug}
              to="/shop/$collection"
              params={{ collection: c.slug }}
              className="group relative overflow-hidden"
            >
              <img
                src={collectionImage[c.slug]}
                alt={`${c.title} collection`}
                loading="lazy"
                width={1000}
                height={1000}
                className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-[oklch(0.24_0.03_45_/_0.35)]" />
              <div className="absolute bottom-0 w-full p-7 text-center">
                <p className="text-[0.66rem] uppercase tracking-[0.22em] text-[oklch(0.85_0.08_80)]">
                  {c.tagline}
                </p>
                <h3 className="mt-2 font-display text-3xl text-[oklch(0.98_0.01_85)]">{c.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* New arrivals */}
      <Shelf title="New arrivals" eyebrow="Just landed" items={newArrivals} />

      {/* Promo banner */}
      <section className="my-20 bg-primary px-5 py-12 sm:py-20 text-center sm:px-8">
        <p className="text-[0.72rem] uppercase tracking-[0.28em] text-gold">Flash deal</p>
        <h2 className="mx-auto mt-5 max-w-2xl font-display text-4xl text-primary-foreground sm:text-5xl">
          20% off the Baddie edit
        </h2>
        <Link
          to="/shop/$collection"
          params={{ collection: "baddie" }}
          className="mt-9 inline-block bg-gold px-9 py-4 text-[0.72rem] uppercase tracking-[0.2em] text-gold-foreground"
        >
          Shop the drop
        </Link>
      </section>

      {/* Video rail */}
      <VerticalVideoRail />

      {/* Best sellers */}
      <Shelf title="Best sellers" eyebrow="Loved most" items={bestSellers} />

      {/* Reviews */}
      <section className="mx-auto max-w-7xl px-5 py-12 sm:py-20 sm:px-8">
        <div className="text-center">
          <p className="eyebrow">Customer reviews</p>
          <h2 className="mt-3 font-display text-4xl">What Our Early Customers Say</h2>
        </div>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {homeReviews.map((r) => (
            <figure key={r.id} className="border border-border bg-card p-8">
              <div
                className="flex gap-1 text-gold"
                aria-label={`${r.rating} out of 5 stars`}
              >
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={cn("size-4", i < Math.round(r.rating) ? "fill-gold" : "fill-border")}
                  />
                ))}
              </div>
              {r.title && (
                <p className="mt-4 text-[0.7rem] uppercase tracking-[0.16em] text-foreground">
                  {r.title}
                </p>
              )}
              <blockquote className="mt-4 font-display text-xl leading-snug">"{r.text}"</blockquote>
              <figcaption className="mt-5 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                {r.name}
                {r.verified ? " — Verified purchase" : ""}
              </figcaption>
              {r.slug && (
                <Link
                  to="/product/$slug"
                  params={{ slug: r.slug }}
                  className="mt-2 inline-block text-[0.66rem] uppercase tracking-[0.16em] text-gold hover:underline"
                >
                  View product
                </Link>
              )}
            </figure>
          ))}
        </div>

        {/* TODO: replace this placeholder with the verified review widget embed
            (Judge.me / Trustpilot). Drop the provider script in __root.tsx head
            and swap this block for the widget container div. */}
        <div className="mt-10 border border-dashed border-border bg-card/50 px-6 py-10 text-center">
          <p className="eyebrow">Verified reviews</p>
          <p className="mx-auto mt-3 max-w-md text-sm leading-relaxed text-muted-foreground">
            Independently verified customer reviews will appear here once our third-party review
            widget is connected.
          </p>
        </div>
      </section>
    </>
  );
}

function Shelf({
  title,
  eyebrow,
  items,
}: {
  title: string;
  eyebrow: string;
  items: typeof products;
}) {
  if (!items.length) return null;
  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8">
      <div className="flex items-end justify-between gap-6">
        <div>
          <p className="eyebrow">{eyebrow}</p>
          <h2 className="mt-2 font-display text-4xl">{title}</h2>
        </div>
        <Link
          to="/shop/$collection"
          params={{ collection: "core" }}
          className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground hover:text-foreground"
        >
          View all
        </Link>
      </div>
      <div className="mt-10 grid gap-x-6 gap-y-12 grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {items.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}

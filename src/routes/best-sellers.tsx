import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { productsQuery } from "@/lib/catalog";
import { products as fallback } from "@/lib/products";

export const Route = createFileRoute("/best-sellers")({
  head: () => ({
    meta: [
      { title: "Best Sellers — Marzi Jewelry" },
      {
        name: "description",
        content:
          "The Marzi pieces our community reorders most — long-lasting, waterproof gold jewelry loved across India.",
      },
      { property: "og:title", content: "Best Sellers — Marzi Jewelry" },
      { property: "og:description", content: "Shop the most-loved Marzi jewelry." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/best-sellers" }],
  }),
  component: BestSellersPage,
});

function BestSellersPage() {
  const { data } = useQuery(productsQuery);
  const catalog = data ?? fallback;
  const list = [...catalog]
    .sort((a, b) => (b.badge === "Best Seller" ? 1 : 0) - (a.badge === "Best Seller" ? 1 : 0) || b.reviews - a.reviews)
    .slice(0, 12);

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <nav className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        / Best sellers
      </nav>
      <header className="mt-8 max-w-2xl">
        <p className="eyebrow">Community favourites</p>
        <h1 className="mt-3 font-display text-5xl">Best sellers</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Ranked by how often they're bought and reviewed. Long-lasting, waterproof and made in India.
        </p>
      </header>
      <div className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
        {list.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </div>
  );
}

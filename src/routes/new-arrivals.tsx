import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { productsQuery } from "@/lib/catalog";
import { products as fallback } from "@/lib/products";

export const Route = createFileRoute("/new-arrivals")({
  head: () => ({
    meta: [
      { title: "New Arrivals — Marzi Jewelry" },
      {
        name: "description",
        content: "The latest Marzi drops: fresh long-lasting gold necklaces, rings, studs and stacks.",
      },
      { property: "og:title", content: "New Arrivals — Marzi Jewelry" },
      { property: "og:description", content: "Shop the newest Marzi jewelry drops." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/new-arrivals" }],
  }),
  component: NewArrivalsPage,
});

function NewArrivalsPage() {
  const { data } = useQuery(productsQuery);
  const catalog = data ?? fallback;
  const list = [...catalog]
    .sort((a, b) => (b.badge === "New" ? 1 : 0) - (a.badge === "New" ? 1 : 0))
    .slice(0, 12);

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <nav className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        / New arrivals
      </nav>
      <header className="mt-8 max-w-2xl">
        <p className="eyebrow">Just landed</p>
        <h1 className="mt-3 font-display text-5xl">New arrivals</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          Fresh silhouettes added to the edit — shop them before they sell through.
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

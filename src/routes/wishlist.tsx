import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { productsQuery } from "@/lib/catalog";
import { products as fallbackProducts } from "@/lib/products";
import { useShop } from "@/lib/store";

export const Route = createFileRoute("/wishlist")({
  head: () => ({
    meta: [
      { title: "Your Wishlist — Marzi Jewelry" },
      {
        name: "description",
        content: "The Marzi pieces you saved for later — long-lasting gold jewelry made in India.",
      },
      { property: "og:title", content: "Your Wishlist — Marzi Jewelry" },
      { property: "og:description", content: "Everything you saved at Marzi, in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: WishlistPage,
});

function WishlistPage() {
  const { wishlist } = useShop();
  const { data } = useQuery(productsQuery);
  const catalog = data ?? fallbackProducts;
  const saved = catalog.filter((p) => wishlist.includes(p.slug));

  return (
    <div className="mx-auto max-w-7xl px-5 py-10 sm:py-16 sm:px-8">
      <p className="eyebrow">Saved for later</p>
      <h1 className="mt-4 font-display text-5xl">Your wishlist</h1>

      {saved.length === 0 ? (
        <div className="mt-14 border border-border py-14 sm:py-24 text-center">
          <p className="text-sm text-muted-foreground">Nothing saved yet.</p>
          <Link
            to="/shop/$collection"
            params={{ collection: "core" }}
            className="mt-8 inline-block border border-foreground px-8 py-4 text-[0.7rem] uppercase tracking-[0.2em] transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Shop the edit
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
          {saved.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}

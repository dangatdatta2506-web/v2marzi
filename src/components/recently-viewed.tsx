import { useQuery } from "@tanstack/react-query";
import { productsQuery } from "@/lib/catalog";
import { useRecentlyViewed } from "@/lib/recently-viewed";
import { ProductCard } from "@/components/product-card";

export function RecentlyViewed({
  excludeSlug,
  title = "Recently viewed",
}: {
  excludeSlug?: string;
  title?: string;
}) {
  const slugs = useRecentlyViewed(excludeSlug);
  const { data } = useQuery(productsQuery);
  const list = slugs
    .map((slug) => (data ?? []).find((p) => p.slug === slug))
    .filter((p): p is NonNullable<typeof p> => Boolean(p))
    .slice(0, 4);

  if (list.length === 0) return null;

  return (
    <section className="mt-24">
      <h2 className="font-display text-4xl">{title}</h2>
      <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
        {list.map((p) => (
          <ProductCard key={p.slug} product={p} />
        ))}
      </div>
    </section>
  );
}

import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ProductCard } from "@/components/product-card";
import { RecentlyViewed } from "@/components/recently-viewed";
import { productsQuery } from "@/lib/catalog";
import {
  collections,
  products as fallbackProducts,
  type Collection,
} from "@/lib/products";

const valid = ["core", "baddie", "corporate"];

export const Route = createFileRoute("/shop/$collection")({
  loader: ({ params }) => {
    const meta = collections.find((c) => c.slug === params.collection);
    if (!meta) throw notFound();
    return { meta };
  },
  head: ({ params, loaderData }) => {
    if (!loaderData) {
      return { meta: [{ title: "Collection unavailable — Marzi" }, { name: "robots", content: "noindex" }] };
    }
    const title = `${loaderData.meta.title} Collection — Marzi Jewelry`;
    return {
      meta: [
        { title },
        { name: "description", content: loaderData.meta.blurb },
        { property: "og:title", content: title },
        { property: "og:description", content: loaderData.meta.blurb },
        { property: "og:url", content: `/shop/${params.collection}` },
      ],
      links: [{ rel: "canonical", href: `/shop/${params.collection}` }],
    };
  },
  component: CollectionPage,
});

type SortKey = "featured" | "price-asc" | "price-desc" | "rating";

const priceBands = [
  { id: "any", label: "Any price", test: () => true },
  { id: "under-2000", label: "Under ₹2,000", test: (p: number) => p < 2000 },
  { id: "2000-4000", label: "₹2,000 – ₹4,000", test: (p: number) => p >= 2000 && p <= 4000 },
  { id: "above-4000", label: "Above ₹4,000", test: (p: number) => p > 4000 },
];

function CollectionPage() {
  const { collection } = Route.useParams();
  const { meta } = Route.useLoaderData() as { meta: (typeof collections)[number] };
  const [sort, setSort] = useState<SortKey>("featured");
  const [category, setCategory] = useState("All");
  const [material, setMaterial] = useState("All");
  const [band, setBand] = useState("any");
  const [onlyOffers, setOnlyOffers] = useState(false);
  const [query, setQuery] = useState("");

  const { data: catalog } = useQuery(productsQuery);
  const source = catalog ?? fallbackProducts;
  const all = valid.includes(collection)
    ? source.filter((p) => p.collection === (collection as Collection))
    : [];
  const categories = ["All", ...Array.from(new Set(all.map((p) => p.category)))];
  const materials = ["All", ...Array.from(new Set(all.map((p) => p.material)))];

  const list = useMemo(() => {
    const priceTest = (priceBands.find((b) => b.id === band) ?? priceBands[0]!).test;
    let out = all.filter(
      (p) =>
        (category === "All" || p.category === category) &&
        (material === "All" || p.material === material) &&
        priceTest(p.price) &&
        (!onlyOffers || Boolean(p.compareAt)) &&
        p.name.toLowerCase().includes(query.toLowerCase()),
    );
    if (sort === "price-asc") out = [...out].sort((a, b) => a.price - b.price);
    if (sort === "price-desc") out = [...out].sort((a, b) => b.price - a.price);
    if (sort === "rating") out = [...out].sort((a, b) => b.rating - a.rating);
    return out;
  }, [all, category, material, band, onlyOffers, query, sort]);


  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <nav className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        / {meta.title}
      </nav>

      <header className="mt-8 max-w-2xl">
        <p className="eyebrow">{meta.tagline}</p>
        <h1 className="mt-3 font-display text-5xl">{meta.title}</h1>
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">{meta.blurb}</p>
      </header>

      <div className="mt-12 flex flex-wrap items-center justify-between gap-4 border-y border-border py-4">
        <div className="flex flex-wrap gap-2">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-4 py-2 text-[0.7rem] uppercase tracking-[0.16em] transition-colors ${
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "border border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-3">
          <label htmlFor="search" className="sr-only">
            Search products
          </label>
          <input
            id="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search"
            className="h-10 border border-border bg-background px-3 text-sm outline-none focus:border-gold"
          />
          <label htmlFor="sort" className="sr-only">
            Sort products
          </label>
          <select
            id="sort"
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="h-10 border border-border bg-background px-3 text-sm outline-none focus:border-gold"
          >
            <option value="featured">Featured</option>
            <option value="price-asc">Price: low to high</option>
            <option value="price-desc">Price: high to low</option>
            <option value="rating">Top rated</option>
          </select>
        </div>
      </div>

      {list.length ? (
        <div className="mt-12 grid gap-x-6 gap-y-14 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      ) : (
        <p className="mt-16 text-center text-sm text-muted-foreground">
          Nothing matches that filter yet.
        </p>
      )}
    </div>
  );
}

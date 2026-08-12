import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Heart, MapPin, Minus, Plus, Share2, Star, Truck } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { ProductCard } from "@/components/product-card";
import { collectionImage } from "@/lib/images";
import { getProduct, inr, products, type Product } from "@/lib/products";
import { productsQuery } from "@/lib/catalog";
import { useShop } from "@/lib/store";
import { track } from "@/lib/analytics";
import { checkPincode } from "@/lib/pincode.functions";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => {
    const product = getProduct(params.slug);
    if (!product) return { product: null, slug: params.slug };
    return { product, slug: params.slug };
  },
  head: ({ params, loaderData }) => {
    const p = loaderData?.product;
    if (!p) {
      return {
        meta: [
          { title: "Marzi Jewelry — Long-lasting gold jewelry" },
          { name: "description", content: "Explore long-lasting, waterproof jewelry from Marzi." },
          { property: "og:title", content: "Marzi Jewelry" },
          { property: "og:description", content: "Long-lasting, waterproof jewelry made in India." },
          { property: "og:type", content: "product" },
        ],
      };
    }
    const description = p.description.slice(0, 155);
    return {
      meta: [
        { title: `${p.name} — Marzi Jewelry` },
        { name: "description", content: description },
        { property: "og:title", content: `${p.name} — Marzi Jewelry` },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { property: "og:url", content: `/product/${params.slug}` },
        { name: "twitter:card", content: "summary_large_image" },
      ],
      links: [{ rel: "canonical", href: `/product/${params.slug}` }],
      scripts: [
        {
          type: "application/ld+json",
          children: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "Product",
            name: p.name,
            description: p.description,
            material: p.material,
            brand: { "@type": "Brand", name: "Marzi" },
            aggregateRating: {
              "@type": "AggregateRating",
              ratingValue: p.rating,
              reviewCount: p.reviews,
            },
            offers: {
              "@type": "Offer",
              price: p.price,
              priceCurrency: "INR",
              availability: "https://schema.org/InStock",
            },
          }),
        },
      ],
    };
  },
  component: ProductPage,
});

function DeliveryCheck() {
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function check() {
    if (!/^\d{6}$/.test(pin)) {
      setResult("Enter a valid 6-digit PIN code.");
      return;
    }
    setBusy(true);
    try {
      const res = await checkPincode({ data: { pincode: pin } });
      setResult(
        res.serviceable
          ? `We deliver to ${res.city}, ${res.state} — about ${res.etaDays} days.`
          : "We don't deliver to that PIN code yet.",
      );
    } catch {
      setResult("Could not check right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-8 border border-border p-5">
      <p className="flex items-center gap-2 text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
        <MapPin className="size-3.5" /> Check delivery
      </p>
      <div className="mt-3 flex">
        <label className="sr-only" htmlFor="pdp-pin">
          PIN code
        </label>
        <input
          id="pdp-pin"
          inputMode="numeric"
          maxLength={6}
          value={pin}
          onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
          placeholder="Enter PIN code"
          className="h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
        />
        <button
          onClick={check}
          disabled={busy}
          className="h-11 shrink-0 border border-foreground px-5 text-[0.66rem] uppercase tracking-[0.16em] disabled:opacity-60"
        >
          {busy ? "Checking…" : "Check"}
        </button>
      </div>
      {result && <p className="mt-3 text-xs text-muted-foreground">{result}</p>}
    </div>
  );
}

function ProductPage() {
  const loaded = Route.useLoaderData() as { product: Product | null; slug: string };
  const { data: catalog } = useQuery(productsQuery);
  const product = catalog?.find((p) => p.slug === loaded.slug) ?? loaded.product;

  const { add, toggleWish, wishlist } = useShop();
  const [qty, setQty] = useState(1);
  const [zoom, setZoom] = useState(false);
  const [active, setActive] = useState(0);
  const [size, setSize] = useState<string | null>(null);

  useEffect(() => {
    if (product) track("product_view", { productSlug: product.slug, productName: product.name });
  }, [product?.slug, product?.name]);

  if (!product) throw notFound();

  const wished = wishlist.includes(product.slug);
  const gallery =
    product.images && product.images.length > 0
      ? product.images
      : [product.imageUrl || collectionImage[product.collection]];
  const image = gallery[Math.min(active, gallery.length - 1)]!;
  const sizes = product.sizes ?? [];
  const related = (catalog ?? products)
    .filter((p) => p.slug !== product.slug && p.collection === product.collection)
    .slice(0, 3);

  const delivery = new Date(Date.now() + 4 * 86400000).toLocaleDateString("en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  function addToBag() {
    if (sizes.length > 0 && !size) {
      toast.error("Please choose a size first");
      return false;
    }
    add(product!.slug, qty, size);
    track("add_to_cart", {
      productSlug: product!.slug,
      productName: product!.name,
      value: product!.price * qty,
    });
    return true;
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-14 sm:px-8">
      <nav className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>{" "}
        /{" "}
        <Link
          to="/shop/$collection"
          params={{ collection: product.collection }}
          className="hover:text-foreground"
        >
          {product.collection}
        </Link>{" "}
        / {product.name}
      </nav>

      <div className="mt-10 grid gap-14 lg:grid-cols-2">
        <div>
          <div
            className="overflow-hidden bg-secondary"
            onMouseEnter={() => setZoom(true)}
            onMouseLeave={() => setZoom(false)}
          >
            <img
              src={image}
              alt={product.name}
              width={1000}
              height={1000}
              className={cn(
                "aspect-square w-full object-cover transition-transform duration-700",
                zoom && "scale-125",
              )}
            />
          </div>
          {gallery.length > 1 && (
            <div className="mt-4 grid grid-cols-4 gap-4">
              {gallery.map((src, i) => (
                <button
                  key={src + i}
                  onClick={() => setActive(i)}
                  aria-label={`View image ${i + 1}`}
                  className={cn(
                    "overflow-hidden border",
                    i === active ? "border-gold" : "border-transparent",
                  )}
                >
                  <img
                    src={src}
                    alt={`${product.name} view ${i + 1}`}
                    loading="lazy"
                    width={500}
                    height={500}
                    className="aspect-square w-full object-cover opacity-80 transition-opacity hover:opacity-100"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          {product.badge && <p className="eyebrow">{product.badge}</p>}
          <h1 className="mt-3 font-display text-5xl leading-tight">{product.name}</h1>

          <div className="mt-4 flex items-center gap-3 text-sm text-muted-foreground">
            <span className="flex gap-0.5 text-gold">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star key={i} className="size-3.5 fill-gold" />
              ))}
            </span>
            {product.rating} · {product.reviews} reviews
          </div>

          <div className="mt-6 flex items-baseline gap-3">
            <p className="text-2xl">{inr(product.price)}</p>
            {product.compareAt && (
              <p className="text-sm text-muted-foreground line-through">{inr(product.compareAt)}</p>
            )}
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>

          <p className="mt-8 text-sm leading-relaxed text-muted-foreground">{product.description}</p>

          {sizes.length > 0 && (
            <div className="mt-8">
              <p className="eyebrow">Select size</p>
              <div className="mt-3 flex flex-wrap gap-3">
                {sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSize(s)}
                    className={cn(
                      "min-w-14 border px-4 py-2.5 text-sm transition-colors",
                      size === s ? "border-gold bg-gold text-gold-foreground" : "border-border",
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          <dl className="mt-8 space-y-3 border-t border-border pt-6 text-sm">
            <div className="flex justify-between gap-6">
              <dt className="text-muted-foreground">Material</dt>
              <dd className="text-right">{product.material}</dd>
            </div>
            {product.specs.map((s) => (
              <div key={s.label} className="flex justify-between gap-6">
                <dt className="text-muted-foreground">{s.label}</dt>
                <dd className="text-right">{s.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-8 flex items-center gap-4">
            <div className="flex items-center border border-border">
              <button
                aria-label="Decrease quantity"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                className="px-4 py-3"
              >
                <Minus className="size-3.5" />
              </button>
              <span className="w-10 text-center text-sm">{qty}</span>
              <button
                aria-label="Increase quantity"
                onClick={() => setQty((q) => Math.min(10, q + 1))}
                className="px-4 py-3"
              >
                <Plus className="size-3.5" />
              </button>
            </div>
            <button
              onClick={() => {
                toggleWish(product.slug);
                toast(wished ? "Removed from wishlist" : "Saved to wishlist");
              }}
              aria-label="Toggle wishlist"
              className="flex size-12 items-center justify-center border border-border"
            >
              <Heart className={cn("size-4", wished && "fill-gold text-gold")} />
            </button>
            <button
              onClick={() => {
                void navigator.clipboard?.writeText(window.location.href);
                toast.success("Link copied");
              }}
              aria-label="Share product"
              className="flex size-12 items-center justify-center border border-border"
            >
              <Share2 className="size-4" />
            </button>
          </div>

          <div className="mt-5 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => {
                if (addToBag()) toast.success(`${product.name} added to bag`);
              }}
              className="flex-1 border border-foreground py-4 text-[0.72rem] uppercase tracking-[0.2em] transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Add to bag
            </button>
            <Link
              to="/cart"
              onClick={(e) => {
                if (!addToBag()) e.preventDefault();
              }}
              className="flex-1 bg-gold py-4 text-center text-[0.72rem] uppercase tracking-[0.2em] text-gold-foreground transition-opacity hover:opacity-90"
            >
              Buy now
            </Link>
          </div>

          <DeliveryCheck />

          <p className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <Truck className="size-4" /> Estimated delivery by {delivery} · Free shipping over ₹1,999
          </p>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <h2 className="font-display text-4xl">You may also like</h2>
          <div className="mt-10 grid gap-x-6 gap-y-12 sm:grid-cols-2 lg:grid-cols-3">
            {related.map((p) => (
              <ProductCard key={p.slug} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

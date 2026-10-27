import { Link } from "@tanstack/react-router";
import { Heart } from "lucide-react";
import { toast } from "sonner";
import { collectionImage } from "@/lib/images";
import { inr, type Product } from "@/lib/products";
import { useShop } from "@/lib/store";
import { track } from "@/lib/analytics";
import { cn } from "@/lib/utils";

export function ProductCard({ product }: { product: Product }) {
  const { add, toggleWish, wishlist } = useShop();
  const wished = wishlist.includes(product.slug);

  return (
    <article className="group relative">
      <Link
        to="/product/$slug"
        params={{ slug: product.slug }}
        onClick={() =>
          track("product_click", { productSlug: product.slug, productName: product.name })
        }
        className="relative block overflow-hidden bg-secondary"
      >
        <img
          src={product.images?.[0] || product.imageUrl || collectionImage[product.collection]}
          alt={product.name}
          loading="lazy"
          width={1000}
          height={1000}
          className={cn(
            "aspect-square w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105",
            product.images?.[1] && "group-hover:opacity-0",
          )}
        />
        {product.images?.[1] && (
          <img
            src={product.images[1]!}
            alt=""
            aria-hidden
            loading="lazy"
            width={1000}
            height={1000}
            className="absolute inset-0 size-full object-cover opacity-0 transition-opacity duration-500 group-hover:opacity-100"
          />
        )}
      </Link>

      {product.badge && (
        <span className="absolute top-4 left-4 bg-background/90 px-3 py-1 text-[0.62rem] uppercase tracking-[0.18em] text-foreground">
          {product.badge}
        </span>
      )}

      <button
        aria-label={wished ? "Remove from wishlist" : "Add to wishlist"}
        onClick={() => {
          toggleWish(product.slug);
          toast(wished ? "Removed from wishlist" : "Saved to wishlist");
        }}
        className="absolute top-3 right-3 flex size-9 items-center justify-center rounded-full bg-background/85 text-foreground opacity-0 transition-opacity group-hover:opacity-100 focus-visible:opacity-100"
      >
        <Heart className={cn("size-4", wished && "fill-gold text-gold")} />
      </button>

      <div className="mt-5 flex items-start justify-between gap-4">
        <div>
          <h3 className="font-display text-xl leading-tight">
            <Link to="/product/$slug" params={{ slug: product.slug }}>
              {product.name}
            </Link>
          </h3>
          <p className="mt-1 text-xs tracking-[0.14em] text-muted-foreground uppercase">
            {product.category}
          </p>
        </div>
        <div className="text-right">
          <p className="text-sm">{inr(product.price)}</p>
          {product.compareAt && (
            <p className="text-xs text-muted-foreground line-through">{inr(product.compareAt)}</p>
          )}
        </div>
      </div>

      {product.sizes && product.sizes.length > 0 ? (
        <Link
          to="/product/$slug"
          params={{ slug: product.slug }}
          className="mt-4 block w-full border border-foreground py-3 text-center text-[0.7rem] uppercase tracking-[0.2em] transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Select size
        </Link>
      ) : (
        <button
          onClick={() => {
            add(product.slug);
            track("add_to_cart", {
              productSlug: product.slug,
              productName: product.name,
              value: product.price,
            });
            toast.success(`${product.name} added to bag`);
          }}
          className="mt-4 w-full border border-foreground py-3 text-[0.7rem] uppercase tracking-[0.2em] transition-colors hover:bg-primary hover:text-primary-foreground"
        >
          Add to bag
        </button>
      )}

    </article>
  );
}

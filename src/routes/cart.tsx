import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Minus, Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { collectionImage } from "@/lib/images";
import { inr } from "@/lib/products";
import { useShop } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { track } from "@/lib/analytics";
import { createCheckoutOrder, verifyCheckoutPayment } from "@/lib/checkout.functions";
import { AddressBook, formatAddress, type Address } from "@/components/address-book";
import { dealsQuery } from "@/lib/catalog";


export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [
      { title: "Your Bag — Marzi Jewelry" },
      {
        name: "description",
        content: "Review your Marzi pieces, apply a coupon and check out securely with Razorpay.",
      },
      { property: "og:title", content: "Your Bag — Marzi Jewelry" },
      { property: "og:description", content: "Review your bag and check out securely." },
      { property: "og:url", content: "/cart" },
      { name: "robots", content: "noindex" },
    ],
    links: [{ rel: "canonical", href: "/cart" }],
  }),
  component: CartPage,
});

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void };
  }
}

function loadRazorpay(): Promise<boolean> {
  return new Promise((resolve) => {
    if (window.Razorpay) return resolve(true);
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

function CartPage() {
  const { items, lines, subtotal, setQty, remove, clear } = useShop();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: deals } = useQuery(dealsQuery);
  const [code, setCode] = useState("");
  const [coupon, setCoupon] = useState<{ code: string; percent: number } | null>(null);
  const [selected, setSelected] = useState<Address | null>(null);
  const [busy, setBusy] = useState(false);

  const discount = coupon ? Math.round((subtotal * coupon.percent) / 100) : 0;
  const shipping = subtotal === 0 || subtotal > 1999 ? 0 : 149;
  const taxed = Math.round((subtotal - discount) * 0.03);
  const total = Math.max(0, subtotal - discount) + shipping + taxed;

  async function checkout() {
    if (!user) {
      navigate({ to: "/auth", search: { redirect: "/cart" } });
      return;
    }
    if (!selected) {
      toast.error("Select a delivery address first");
      return;
    }


    setBusy(true);
    track("begin_checkout", { value: total });
    try {
      const ok = await loadRazorpay();
      if (!ok) throw new Error("Could not load the payment window");

      const order = await createCheckoutOrder({
        data: {
          lines: lines.map((l) => ({ slug: l.slug, qty: l.qty, size: l.size ?? null })),
          coupon: coupon?.code ?? undefined,
          customerName: selected.full_name,
          customerPhone: selected.phone,
          shippingAddress: formatAddress(selected),
        },
      });

      const rzp = new window.Razorpay!({
        key: order.keyId,
        amount: order.amount,
        currency: "INR",
        name: "Marzi",
        description: "Fine everyday jewelry",
        order_id: order.razorpayOrderId,
        prefill: { name: selected.full_name, email: user.email, contact: selected.phone },

        theme: { color: "#b8935f" },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          try {
            await verifyCheckoutPayment({
              data: {
                orderId: order.orderId,
                razorpayOrderId: response.razorpay_order_id,
                razorpayPaymentId: response.razorpay_payment_id,
                razorpaySignature: response.razorpay_signature,
              },
            });
            for (const item of items) {
              track("purchase", {
                productSlug: item.product.slug,
                productName: item.product.name,
                value: item.product.price * item.qty,
              });
            }
            clear();
            toast.success("Payment successful", { description: "Your order is confirmed." });
            navigate({ to: "/orders" });
          } catch (error) {
            toast.error(error instanceof Error ? error.message : "Payment verification failed");
          }
        },
        modal: { ondismiss: () => toast("Payment cancelled") },
      });
      rzp.open();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Checkout failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-7xl px-5 py-16 sm:px-8">
      <h1 className="font-display text-5xl">Your bag</h1>

      {items.length === 0 ? (
        <div className="mt-14 border border-border py-24 text-center">
          <p className="text-sm text-muted-foreground">Your bag is empty.</p>
          <Link
            to="/shop/$collection"
            params={{ collection: "core" }}
            className="mt-8 inline-block border border-foreground px-8 py-4 text-[0.7rem] uppercase tracking-[0.2em] transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Shop the edit
          </Link>
        </div>
      ) : (
        <div className="mt-12 grid gap-14 lg:grid-cols-[1.6fr_1fr]">
          <ul className="divide-y divide-border border-y border-border">
            {items.map(({ key, product, qty, size }) => (
              <li key={key} className="flex gap-5 py-6">
                <img
                  src={product.images?.[0] || product.imageUrl || collectionImage[product.collection]}
                  alt={product.name}
                  loading="lazy"
                  width={1000}
                  height={1000}
                  className="size-28 shrink-0 object-cover"
                />
                <div className="flex flex-1 flex-col justify-between">
                  <div className="flex justify-between gap-4">
                    <div>
                      <h2 className="font-display text-2xl leading-tight">
                        <Link to="/product/$slug" params={{ slug: product.slug }}>
                          {product.name}
                        </Link>
                      </h2>
                      <p className="mt-1 text-xs uppercase tracking-[0.16em] text-muted-foreground">
                        {product.category}
                        {size ? ` · Size ${size}` : ""}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm">{inr(product.price * qty)}</p>
                      <button
                        onClick={() => remove(key)}
                        aria-label={`Remove ${product.name}`}
                        className="mt-2 text-muted-foreground hover:text-destructive"
                      >
                        <X className="ml-auto size-4" />
                      </button>
                    </div>
                  </div>
                  <div className="mt-4 flex w-fit items-center border border-border">
                    <button
                      aria-label="Decrease quantity"
                      onClick={() => setQty(key, qty - 1)}
                      className="px-3 py-2"
                    >
                      <Minus className="size-3.5" />
                    </button>
                    <span className="w-9 text-center text-sm">{qty}</span>
                    <button
                      aria-label="Increase quantity"
                      onClick={() => setQty(key, qty + 1)}
                      className="px-3 py-2"
                    >
                      <Plus className="size-3.5" />
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>


          <aside className="h-fit border border-border bg-card p-8">
            <h2 className="font-display text-3xl">Order summary</h2>

            <div className="mt-6 border border-border bg-background p-4">
              {subtotal >= FREE_SHIPPING ? (
                <p className="flex items-center gap-2 text-xs text-gold">
                  <Truck className="size-4" /> Free shipping unlocked
                </p>
              ) : (
                <p className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Truck className="size-4 text-gold" /> Add {inr(FREE_SHIPPING - subtotal)} more for
                  free shipping
                </p>
              )}
              <span className="mt-3 block h-1.5 bg-secondary">
                <span
                  className="block h-full bg-gold transition-all"
                  style={{ width: `${Math.min(100, Math.round((subtotal / FREE_SHIPPING) * 100))}%` }}
                />
              </span>
            </div>



            <form
              className="mt-6 flex"
              onSubmit={(e) => {
                e.preventDefault();
                const match = (deals ?? []).find(
                  (d) => d.code && d.code.toUpperCase() === code.trim().toUpperCase(),
                );
                if (match?.code) {
                  setCoupon({ code: match.code, percent: match.discountPercent });
                  toast.success(`Coupon applied — ${match.discountPercent}% off`);
                } else {
                  toast.error("That code isn't valid");
                }
              }}

            >
              <label htmlFor="coupon" className="sr-only">
                Coupon code
              </label>
              <input
                id="coupon"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Coupon code (MARZI10)"
                className="h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
              />
              <button className="h-11 shrink-0 border border-foreground px-4 text-[0.68rem] uppercase tracking-[0.16em]">
                Apply
              </button>
            </form>

            <dl className="mt-8 space-y-3 text-sm">
              <Row label="Subtotal" value={inr(subtotal)} />
              {discount > 0 && <Row label="Discount" value={`− ${inr(discount)}`} />}
              <Row label="Shipping" value={shipping === 0 ? "Free" : inr(shipping)} />
              <Row label="GST (3%)" value={inr(taxed)} />
              <div className="flex justify-between border-t border-border pt-4 text-base">
                <dt>Total</dt>
                <dd>{inr(total)}</dd>
              </div>
            </dl>

            {user ? (
              <div className="mt-8">
                <p className="eyebrow">Deliver to</p>
                <div className="mt-3">
                  <AddressBook selectedId={selected?.id ?? null} onSelect={setSelected} />
                </div>
              </div>
            ) : (
              <p className="mt-8 border border-border bg-background p-4 text-xs leading-relaxed text-muted-foreground">
                Sign in to place your order — it takes a few seconds and lets you track delivery.
              </p>
            )}


            <button
              onClick={checkout}
              disabled={busy}
              className="mt-6 w-full bg-gold py-4 text-[0.72rem] uppercase tracking-[0.2em] text-gold-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy ? "Opening payment…" : user ? "Pay securely with Razorpay" : "Sign in to checkout"}
            </button>
            <p className="mt-4 text-center text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
              UPI · Cards · Net banking · Wallets
            </p>
          </aside>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between text-muted-foreground">
      <dt>{label}</dt>
      <dd className="text-foreground">{value}</dd>
    </div>
  );
}

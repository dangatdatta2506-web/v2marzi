import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/products";
import { downloadInvoice, type InvoiceOrder } from "@/lib/invoice";


export const Route = createFileRoute("/_authenticated/orders")({
  head: () => ({
    meta: [
      { title: "Your Orders — Marzi Jewelry" },
      {
        name: "description",
        content: "View your Marzi orders, payment status and delivery progress in one place.",
      },
      { property: "og:title", content: "Your Orders — Marzi Jewelry" },
      { property: "og:description", content: "Track your Marzi jewelry orders." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: OrdersPage,
});

type OrderItem = { slug: string; name: string; price: number; qty: number };

function OrdersPage() {
  const { data, isLoading } = useQuery({
    queryKey: ["my-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  return (
    <div className="mx-auto max-w-4xl px-5 py-12 sm:py-20 sm:px-8">
      <p className="eyebrow">Order history</p>
      <h1 className="mt-4 font-display text-5xl">Your orders</h1>

      {isLoading && <p className="mt-10 text-sm text-muted-foreground">Loading your orders…</p>}

      {!isLoading && (data?.length ?? 0) === 0 && (
        <div className="mt-12 border border-border py-12 sm:py-20 text-center">
          <p className="text-sm text-muted-foreground">You haven't placed an order yet.</p>
          <Link
            to="/shop/$collection"
            params={{ collection: "core" }}
            className="mt-8 inline-block border border-foreground px-8 py-4 text-[0.7rem] uppercase tracking-[0.2em] hover:bg-primary hover:text-primary-foreground"
          >
            Shop the edit
          </Link>
        </div>
      )}

      <div className="mt-12 space-y-6">
        {data?.map((order) => (
          <article key={order.id} className="border border-border bg-card p-7">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <p className="text-[0.7rem] uppercase tracking-[0.18em] text-muted-foreground">
                  #{order.id.slice(0, 8).toUpperCase()} ·{" "}
                  {new Date(order.created_at).toLocaleDateString("en-IN")}
                </p>
                <h2 className="mt-2 font-display text-3xl">{inr(order.total)}</h2>
              </div>
              <div className="text-right">
                <span className="inline-block border border-gold px-3 py-1 text-[0.66rem] uppercase tracking-[0.16em] text-gold">
                  {order.status}
                </span>
                <p className="mt-2 text-[0.68rem] uppercase tracking-[0.16em] text-muted-foreground">
                  Payment: {order.payment_status}
                </p>
                <button
                  onClick={() => downloadInvoice(order as unknown as InvoiceOrder)}
                  className="mt-3 border border-foreground px-4 py-2 text-[0.62rem] uppercase tracking-[0.14em]"
                >
                  Download bill
                </button>
              </div>

            </div>
            <ul className="mt-5 space-y-1 text-sm text-muted-foreground">
              {(order.items as unknown as OrderItem[]).map((item) => (
                <li key={item.slug}>
                  {item.name} × {item.qty} — {inr(item.price * item.qty)}
                </li>
              ))}
            </ul>
          </article>
        ))}
      </div>
    </div>
  );
}

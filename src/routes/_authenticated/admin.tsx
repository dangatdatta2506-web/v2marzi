import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { inr } from "@/lib/products";
import {
  adminDeleteReview,
  adminListReviews,
  adminModerateReview,
} from "@/lib/reviews.functions";
import { downloadInvoice, type InvoiceOrder } from "@/lib/invoice";
import {
  adminDeleteDeal,
  adminDeleteProduct,
  adminListDeals,
  adminListOrders,
  adminListProducts,
  adminProductPerformance,
  adminRevenueBreakdown,
  adminSaveDeal,
  adminSaveProduct,
  adminSetStock,
  adminUpdateOrderStatus,
  getAdminStatus,
  sendAdminOtp,
  verifyAdminOtp,
} from "@/lib/admin.functions";
import { adminAnalytics } from "@/lib/analytics.functions";
import {
  adminDeletePincode,
  adminListPincodes,
  adminSavePincode,
} from "@/lib/pincode.functions";
import {
  adminListUsers,
  adminSetUserRole,
  type ManagedRole,
  type ManagedUser,
} from "@/lib/users.functions";
import { downloadCsv } from "@/lib/csv";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Admin Dashboard — Marzi Jewelry" },
      {
        name: "description",
        content: "Marzi admin dashboard for revenue, orders, products and deals.",
      },
      { property: "og:title", content: "Admin Dashboard — Marzi Jewelry" },
      { property: "og:description", content: "Manage Marzi orders, products and revenue." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminPage,
});

type OrderItem = { slug: string; name: string; price: number; qty: number };
const statuses = ["pending", "confirmed", "packed", "shipped", "delivered", "cancelled"] as const;
type Status = (typeof statuses)[number];
type Tab = "insights" | "orders" | "products" | "reviews" | "pincodes" | "deals" | "users";

function AdminPage() {
  const { loading } = useAuth();
  const [tab, setTab] = useState<Tab>("insights");

  const status = useQuery({ queryKey: ["admin-status"], queryFn: () => getAdminStatus() });

  if (loading || status.isLoading) {
    return <div className="mx-auto max-w-6xl px-5 py-20 text-sm">Loading…</div>;
  }

  if (!status.data?.isStaff) {
    return (
      <div className="mx-auto max-w-2xl px-5 py-28 text-center">
        <h1 className="font-display text-4xl">Restricted</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          This area is for Marzi staff only.
        </p>
      </div>
    );
  }

  if (!status.data.verified) {
    return <TwoFactorGate email={status.data.email} onVerified={() => status.refetch()} />;
  }

  const isAdmin = status.data.isAdmin;
  const tabs: Tab[] = isAdmin
    ? ["insights", "orders", "products", "reviews", "pincodes", "deals", "users"]
    : ["orders", "products", "reviews", "pincodes"];
  const activeTab = tabs.includes(tab) ? tab : tabs[0]!;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:px-8">
      <p className="eyebrow">Marzi control room</p>
      <h1 className="mt-4 font-display text-5xl">
        {isAdmin ? "Admin dashboard" : "Operator dashboard"}
      </h1>

      <div className="mt-8 flex flex-wrap gap-6 border-b border-border text-[0.7rem] uppercase tracking-[0.18em]">
        {tabs.map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`-mb-px border-b-2 pb-3 ${
              activeTab === t
                ? "border-gold text-foreground"
                : "border-transparent text-muted-foreground"
            }`}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "insights" && <InsightsPanel />}
      {activeTab === "orders" && <OrdersPanel />}
      {activeTab === "products" && <ProductsPanel />}
      {activeTab === "reviews" && <ReviewsPanel />}
      {activeTab === "pincodes" && <PincodesPanel />}
      {activeTab === "deals" && <DealsPanel />}
      {activeTab === "users" && <UsersPanel />}

    </div>
  );
}

function InsightStat({ label, value, hint }: { label: string; value: string; hint?: string }) {
  return (
    <div className="border border-border p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-display text-3xl">{value}</p>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

function Bar({ label, count, max, suffix }: { label: string; count: number; max: number; suffix?: string }) {
  return (
    <div className="mt-3">
      <div className="flex items-baseline justify-between gap-4 text-sm">
        <span className="truncate">{label}</span>
        <span className="text-muted-foreground">
          {count.toLocaleString("en-IN")}
          {suffix ?? ""}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full bg-secondary">
        <div
          className="h-full bg-gold"
          style={{ width: `${max > 0 ? Math.max(2, (count / max) * 100) : 0}%` }}
        />
      </div>
    </div>
  );
}

function InsightsPanel() {
  const [days, setDays] = useState(30);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-analytics", days],
    queryFn: () => adminAnalytics({ data: { days } }),
  });
  const revenue = useQuery({
    queryKey: ["admin-revenue", days],
    queryFn: () => adminRevenueBreakdown({ data: { days } }),
  });

  if (isLoading || !data) return <p className="mt-10 text-sm text-muted-foreground">Loading insights…</p>;

  const t = data.totals;
  const funnelMax = Math.max(...data.funnel.map((f) => f.count), 1);
  const productMax = Math.max(...data.topProducts.map((p) => p.views + p.clicks), 1);
  const pageMax = Math.max(...data.topPages.map((p) => p.count), 1);
  const refMax = Math.max(...data.referrers.map((p) => p.count), 1);
  const deviceMax = Math.max(...data.devices.map((p) => p.count), 1);
  const timelineMax = Math.max(...data.timeline.map((d) => d.views), 1);

  return (
    <div className="mt-10">
      <div className="flex flex-wrap gap-2 text-[0.7rem] uppercase tracking-[0.18em]">
        {[7, 30, 90].map((d) => (
          <button
            key={d}
            onClick={() => setDays(d)}
            className={`border px-4 py-2 ${days === d ? "border-gold text-foreground" : "border-border text-muted-foreground"}`}
          >
            Last {d} days
          </button>
        ))}

        <div className="ml-auto flex flex-wrap gap-2">
          <button
            onClick={() =>
              downloadCsv(
                `marzi-daily-${data.days}d.csv`,
                data.timeline.map((r) => ({
                  day: r.day,
                  page_views: r.views,
                  visitors: r.visitors,
                  orders: r.orders,
                  revenue_inr: r.revenue,
                })),
              )
            }
            className="border border-foreground px-4 py-2"
          >
            Export daily CSV
          </button>
          <button
            onClick={() =>
              downloadCsv(
                `marzi-products-${data.days}d.csv`,
                data.topProducts.map((p) => ({
                  slug: p.slug,
                  product: p.name,
                  views: p.views,
                  clicks: p.clicks,
                  added_to_bag: p.addToCart,
                  purchases: p.purchases,
                  revenue_inr: p.revenue,
                })),
              )
            }
            className="border border-foreground px-4 py-2"
          >
            Export products CSV
          </button>
          <button
            onClick={() =>
              downloadCsv(`marzi-summary-${data.days}d.csv`, [
                { metric: "Range (days)", value: data.days },
                ...data.funnel.map((f) => ({ metric: f.step, value: f.count })),
                { metric: "Page views", value: data.totals.pageViews },
                { metric: "Revenue (INR)", value: data.totals.revenue },
                { metric: "Avg order value (INR)", value: data.totals.avgOrderValue },
                { metric: "Conversion rate (%)", value: data.totals.conversionRate },
                ...data.topPages.map((p) => ({ metric: `Page ${p.label}`, value: p.count })),
                ...data.referrers.map((p) => ({ metric: `Source ${p.label}`, value: p.count })),
                ...data.devices.map((p) => ({ metric: `Device ${p.label}`, value: p.count })),
              ])
            }
            className="border border-foreground px-4 py-2"
          >
            Export summary CSV
          </button>
        </div>
      </div>


      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <InsightStat label="Visitors" value={t.visitors.toLocaleString("en-IN")} hint={`${t.pageViews.toLocaleString("en-IN")} page views`} />
        <InsightStat label="Revenue" value={inr(t.revenue)} hint={`${t.paidOrders} paid orders`} />
        <InsightStat label="Conversion" value={`${t.conversionRate}%`} hint="visitors who purchased" />
        <InsightStat label="Avg order" value={inr(t.avgOrderValue)} hint={`${t.addToCart} add-to-bag events`} />
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Revenue by payment status</h2>
        {!revenue.data ? (
          <p className="mt-3 text-sm text-muted-foreground">Loading payment detail…</p>
        ) : (
          <>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <InsightStat label="Collected" value={inr(revenue.data.collected)} hint="payments marked paid" />
              <InsightStat label="Awaiting payment" value={inr(revenue.data.pending)} hint="pending or unpaid orders" />
              <InsightStat label="Refunded" value={inr(revenue.data.refunded)} />
              <InsightStat label="Failed" value={inr(revenue.data.failed)} />
            </div>
            <div className="mt-6 overflow-x-auto border border-border">
              <table className="w-full min-w-[520px] text-left text-sm">
                <thead className="bg-secondary/60">
                  <tr className="text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
                    <th className="px-4 py-3">Payment status</th>
                    <th className="px-4 py-3">Orders</th>
                    <th className="px-4 py-3">Value</th>
                    <th className="px-4 py-3">Share of value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {revenue.data.byStatus.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-4 py-6 text-muted-foreground">
                        No orders in this period.
                      </td>
                    </tr>
                  )}
                  {revenue.data.byStatus.map((s) => {
                    const total = revenue.data.byStatus.reduce((n, r) => n + r.amount, 0) || 1;
                    return (
                      <tr key={s.status}>
                        <td className="px-4 py-3 uppercase tracking-[0.14em] text-xs">{s.status}</td>
                        <td className="px-4 py-3">{s.orders}</td>
                        <td className="px-4 py-3">{inr(s.amount)}</td>
                        <td className="px-4 py-3">{Math.round((s.amount / total) * 100)}%</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <button
              onClick={() =>
                downloadCsv(
                  `marzi-payments-${days}d.csv`,
                  revenue.data!.byStatus.map((s) => ({
                    payment_status: s.status,
                    orders: s.orders,
                    value_inr: s.amount,
                  })),
                )
              }
              className="mt-4 border border-foreground px-4 py-2 text-[0.7rem] uppercase tracking-[0.18em]"
            >
              Export payments CSV
            </button>
          </>
        )}
      </section>

      <div className="mt-10 grid gap-10 lg:grid-cols-2">
        <section>
          <h2 className="font-display text-2xl">Shopping funnel</h2>
          {data.funnel.map((f) => (
            <Bar key={f.step} label={f.step} count={f.count} max={funnelMax} />
          ))}
        </section>

        <section>
          <h2 className="font-display text-2xl">Traffic by day</h2>
          <div className="mt-4 flex h-32 items-end gap-1">
            {data.timeline.map((d) => (
              <div
                key={d.day}
                title={`${d.day}: ${d.views} views, ${d.orders} orders`}
                className="flex-1 bg-gold/70"
                style={{ height: `${Math.max(2, (d.views / timelineMax) * 100)}%` }}
              />
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            Page views per day over the last {data.days} days.
          </p>
        </section>
      </div>

      <section className="mt-12">
        <h2 className="font-display text-2xl">Most clicked products</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead className="text-[0.65rem] uppercase tracking-[0.18em] text-muted-foreground">
              <tr className="border-b border-border text-left">
                <th className="py-2">Product</th>
                <th className="py-2">Views</th>
                <th className="py-2">Clicks</th>
                <th className="py-2">Added to bag</th>
                <th className="py-2">Purchases</th>
                <th className="py-2">Revenue</th>
                <th className="py-2">Interest</th>
              </tr>
            </thead>
            <tbody>
              {data.topProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-6 text-muted-foreground">
                    No product activity recorded yet.
                  </td>
                </tr>
              )}
              {data.topProducts.map((p) => (
                <tr key={p.slug} className="border-b border-border/60">
                  <td className="py-3">{p.name}</td>
                  <td className="py-3">{p.views}</td>
                  <td className="py-3">{p.clicks}</td>
                  <td className="py-3">{p.addToCart}</td>
                  <td className="py-3">{p.purchases}</td>
                  <td className="py-3">{inr(p.revenue)}</td>
                  <td className="py-3 w-40">
                    <div className="h-1.5 w-full bg-secondary">
                      <div
                        className="h-full bg-gold"
                        style={{ width: `${((p.views + p.clicks) / productMax) * 100}%` }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-12 grid gap-10 lg:grid-cols-3">
        <section>
          <h2 className="font-display text-2xl">Top pages</h2>
          {data.topPages.map((p) => (
            <Bar key={p.label} label={p.label} count={p.count} max={pageMax} />
          ))}
        </section>
        <section>
          <h2 className="font-display text-2xl">Traffic sources</h2>
          {data.referrers.map((p) => (
            <Bar key={p.label} label={p.label} count={p.count} max={refMax} />
          ))}
        </section>
        <section>
          <h2 className="font-display text-2xl">Devices</h2>
          {data.devices.map((p) => (
            <Bar key={p.label} label={p.label} count={p.count} max={deviceMax} />
          ))}
        </section>
      </div>
    </div>
  );
}

function TwoFactorGate({ email, onVerified }: { email: string | null; onVerified: () => void }) {
  const [code, setCode] = useState("");
  const send = useMutation({
    mutationFn: () => sendAdminOtp(),
    onSuccess: (r) => toast.success(`Verification code sent to ${r.email}`),
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not send code"),
  });
  const verify = useMutation({
    mutationFn: () => verifyAdminOtp({ data: { code } }),
    onSuccess: () => {
      toast.success("Verified — welcome back");
      onVerified();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Verification failed"),
  });

  return (
    <div className="mx-auto max-w-md px-5 py-24 sm:px-8">
      <p className="eyebrow">Two-step verification</p>
      <h1 className="mt-4 font-display text-5xl">Confirm it's you</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        For security, the admin panel needs a fresh email code sent to {email ?? "your inbox"}.
      </p>

      <button
        onClick={() => send.mutate()}
        disabled={send.isPending}
        className="mt-8 w-full border border-foreground py-4 text-[0.72rem] uppercase tracking-[0.2em] disabled:opacity-60"
      >
        {send.isPending ? "Sending…" : "Email me a code"}
      </button>

      <form
        className="mt-6 space-y-4"
        onSubmit={(e) => {
          e.preventDefault();
          verify.mutate();
        }}
      >
        <label htmlFor="admin-otp" className="eyebrow block">
          6-digit code
        </label>
        <input
          id="admin-otp"
          inputMode="numeric"
          maxLength={6}
          value={code}
          onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          className="h-12 w-full border border-border bg-background px-4 text-lg tracking-[0.5em] outline-none focus:border-gold"
        />
        <button
          disabled={verify.isPending || code.length !== 6}
          className="w-full bg-gold py-4 text-[0.72rem] uppercase tracking-[0.2em] text-gold-foreground disabled:opacity-60"
        >
          {verify.isPending ? "Verifying…" : "Unlock dashboard"}
        </button>
      </form>
    </div>
  );
}

function OrdersPanel() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => adminListOrders(),
  });

  const update = useMutation({
    mutationFn: (vars: { id: string; status: Status }) =>
      adminUpdateOrderStatus({ data: vars }),
    onSuccess: () => {
      toast.success("Order updated");
      void qc.invalidateQueries({ queryKey: ["admin-orders"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Update failed"),
  });

  const orders = data ?? [];
  const revenue = orders
    .filter((o) => o.payment_status === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  return (
    <div>
      <div className="mt-10 grid gap-4 sm:grid-cols-3">
        <Stat label="Revenue (paid)" value={inr(revenue)} />
        <Stat label="Orders" value={String(orders.length)} />
        <Stat
          label="Awaiting dispatch"
          value={String(orders.filter((o) => o.status === "confirmed").length)}
        />
      </div>

      {isLoading && <p className="mt-10 text-sm text-muted-foreground">Loading orders…</p>}

      <div className="mt-12 overflow-x-auto border border-border">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Items</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Bill</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {orders.map((o) => (
              <tr key={o.id} className="align-top">
                <td className="px-4 py-4">
                  <p>#{o.id.slice(0, 8).toUpperCase()}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(o.created_at).toLocaleString("en-IN")}
                  </p>
                </td>
                <td className="px-4 py-4">
                  <p>{o.customer_name}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_email}</p>
                  <p className="text-xs text-muted-foreground">{o.customer_phone}</p>
                  <p className="mt-1 max-w-[16rem] text-xs text-muted-foreground">
                    {o.shipping_address}
                  </p>
                </td>
                <td className="px-4 py-4 text-xs text-muted-foreground">
                  {(o.items as unknown as OrderItem[]).map((i) => (
                    <div key={i.slug}>
                      {i.name} × {i.qty}
                    </div>
                  ))}
                </td>
                <td className="px-4 py-4">{inr(o.total)}</td>
                <td className="px-4 py-4">
                  <span className="text-xs uppercase tracking-[0.14em] text-muted-foreground">
                    {o.payment_status}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <label className="sr-only" htmlFor={`status-${o.id}`}>
                    Order status
                  </label>
                  <select
                    id={`status-${o.id}`}
                    value={o.status}
                    onChange={(e) =>
                      update.mutate({ id: o.id, status: e.target.value as Status })
                    }
                    className="border border-border bg-background px-2 py-1.5 text-xs"
                  >
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-4 py-4">
                  <button
                    onClick={() => downloadInvoice(o as unknown as InvoiceOrder)}
                    className="border border-foreground px-3 py-1.5 text-[0.62rem] uppercase tracking-[0.14em]"
                  >
                    PDF
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const emptyProduct = {
  slug: "",
  name: "",
  collection: "core" as "core" | "baddie" | "corporate",
  category: "Necklaces",
  price: 0,
  compareAt: "",
  badge: "",
  material: "",
  description: "",
  stock: 0,
  imageUrl: "",
  sizes: "",
  active: true,
};

type ProductSort = "newest" | "most-clicked" | "most-sold" | "least-sold";

const sortLabels: Record<ProductSort, string> = {
  newest: "Newest first",
  "most-clicked": "Most clicked",
  "most-sold": "Most sold",
  "least-sold": "Least sold",
};

function ProductImageUploader({
  slug,
  keys,
  onChange,
}: {
  slug: string;
  keys: string[];
  onChange: (keys: string[]) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [previews, setPreviews] = useState<Record<string, string>>({});

  useEffect(() => {
    let cancelled = false;
    const missing = keys.filter((k) => !previews[k] && !/^https?:\/\//i.test(k));
    if (missing.length === 0) return;
    void (async () => {
      const { data } = await supabase.storage
        .from("product-images")
        .createSignedUrls(missing, 3600);
      if (cancelled || !data) return;
      setPreviews((prev) => {
        const next = { ...prev };
        for (const entry of data) {
          if (entry.path && entry.signedUrl) next[entry.path] = entry.signedUrl;
        }
        return next;
      });
    })();
    return () => {
      cancelled = true;
    };
  }, [keys, previews]);

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      const uploaded: string[] = [];
      for (const file of Array.from(files).slice(0, 6 - keys.length)) {
        const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
        const path = `${slug.trim().toLowerCase() || "unsorted"}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage
          .from("product-images")
          .upload(path, file, { cacheControl: "3600", upsert: false });
        if (error) throw error;
        uploaded.push(path);
      }
      onChange([...keys, ...uploaded]);
      toast.success(`${uploaded.length} image${uploaded.length === 1 ? "" : "s"} uploaded`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sm:col-span-3">
      <label htmlFor="p-images" className="eyebrow block">
        Product photos (up to 6)
      </label>
      <input
        id="p-images"
        type="file"
        accept="image/*"
        multiple
        disabled={busy || keys.length >= 6}
        onChange={(e) => {
          void upload(e.target.files);
          e.target.value = "";
        }}
        className="mt-2 block w-full border border-border bg-background px-3 py-2.5 text-sm file:mr-4 file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs"
      />
      <p className="mt-1 text-xs text-muted-foreground">
        {busy ? "Uploading…" : "The first photo is used as the main product image."}
      </p>
      {keys.length > 0 && (
        <ul className="mt-3 flex flex-wrap gap-3">
          {keys.map((key, index) => (
            <li key={key} className="relative w-24">
              <img
                src={previews[key] ?? key}
                alt={`Product photo ${index + 1}`}
                className="h-24 w-24 object-cover"
              />
              <button
                type="button"
                onClick={() => onChange(keys.filter((k) => k !== key))}
                className="mt-1 w-full border border-border py-1 text-[0.6rem] uppercase tracking-[0.12em] text-destructive"
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ProductsPanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyProduct);
  const [imageKeys, setImageKeys] = useState<string[]>([]);
  const [sortBy, setSortBy] = useState<ProductSort>("newest");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => adminListProducts(),
  });
  const perf = useQuery({
    queryKey: ["admin-product-performance"],
    queryFn: () => adminProductPerformance(),
  });

  const stats = new Map(
    (perf.data ?? []).map((p) => [p.slug, p] as const),
  );
  const statFor = (slug: string) =>
    stats.get(slug) ?? { slug, clicks: 0, views: 0, unitsSold: 0, revenue: 0 };

  const rows = [...(data ?? [])];
  if (sortBy === "most-clicked") {
    rows.sort((a, b) => statFor(b.slug).clicks - statFor(a.slug).clicks);
  } else if (sortBy === "most-sold") {
    rows.sort((a, b) => statFor(b.slug).unitsSold - statFor(a.slug).unitsSold);
  } else if (sortBy === "least-sold") {
    rows.sort((a, b) => statFor(a.slug).unitsSold - statFor(b.slug).unitsSold);
  }

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-products"] });
    void qc.invalidateQueries({ queryKey: ["admin-product-performance"] });
    void qc.invalidateQueries({ queryKey: ["catalog", "products"] });
  };

  const save = useMutation({
    mutationFn: () =>
      adminSaveProduct({
        data: {
          slug: form.slug.trim().toLowerCase(),
          name: form.name,
          collection: form.collection,
          category: form.category,
          price: Number(form.price),
          compareAt: form.compareAt ? Number(form.compareAt) : null,
          badge: (form.badge || null) as "New" | "Sale" | "Best Seller" | null,
          material: form.material,
          description: form.description,
          stock: Number(form.stock),
          imageUrl: imageKeys[0] ?? (form.imageUrl ? form.imageUrl : null),
          images: imageKeys,
          sizes: form.sizes
            .split(",")
            .map((s) => s.trim())
            .filter(Boolean),
          active: form.active,
        },
      }),
    onSuccess: () => {
      toast.success("Product saved");
      setForm(emptyProduct);
      setImageKeys([]);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save product"),
  });

  const stock = useMutation({
    mutationFn: (vars: { slug: string; stock: number }) => adminSetStock({ data: vars }),
    onSuccess: invalidate,
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update stock"),
  });

  const remove = useMutation({
    mutationFn: (slug: string) => adminDeleteProduct({ data: { slug } }),
    onSuccess: () => {
      toast.success("Product removed");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove product"),
  });

  const input = (key: keyof typeof emptyProduct, label: string, type = "text") => (
    <div>
      <label htmlFor={`p-${key}`} className="eyebrow block">
        {label}
      </label>
      <input
        id={`p-${key}`}
        type={type}
        value={String(form[key] ?? "")}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
      />
    </div>
  );

  return (
    <div className="mt-10">
      <div className="border border-border p-6">
        <h2 className="font-display text-3xl">Add or update a product</h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Saving with an existing slug updates that product.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-3">
          {input("slug", "Slug")}
          {input("name", "Name")}
          <div>
            <label htmlFor="p-collection" className="eyebrow block">
              Collection
            </label>
            <select
              id="p-collection"
              value={form.collection}
              onChange={(e) =>
                setForm((f) => ({ ...f, collection: e.target.value as typeof f.collection }))
              }
              className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm"
            >
              <option value="core">core</option>
              <option value="baddie">baddie</option>
              <option value="corporate">corporate</option>
            </select>
          </div>
          {input("category", "Category")}
          {input("price", "Price (₹)", "number")}
          {input("compareAt", "Compare-at (₹)", "number")}
          {input("stock", "Stock", "number")}
          <div>
            <label htmlFor="p-badge" className="eyebrow block">
              Badge
            </label>
            <select
              id="p-badge"
              value={form.badge}
              onChange={(e) => setForm((f) => ({ ...f, badge: e.target.value }))}
              className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm"
            >
              <option value="">None</option>
              <option value="New">New</option>
              <option value="Sale">Sale</option>
              <option value="Best Seller">Best Seller</option>
            </select>
          </div>
          {input("sizes", "Sizes (comma separated, e.g. S, M, L)")}
          {input("material", "Material")}
          {input("description", "Description")}
          <ProductImageUploader slug={form.slug} keys={imageKeys} onChange={setImageKeys} />
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="mt-6 bg-gold px-8 py-4 text-[0.7rem] uppercase tracking-[0.2em] text-gold-foreground disabled:opacity-60"
        >
          {save.isPending ? "Saving…" : "Save product"}
        </button>
      </div>

      {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading products…</p>}

      <div className="mt-10 flex flex-wrap items-center gap-3">
        <label htmlFor="product-sort" className="eyebrow">
          Sort by
        </label>
        <select
          id="product-sort"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as ProductSort)}
          className="h-11 border border-border bg-background px-3 text-sm"
        >
          {(Object.keys(sortLabels) as ProductSort[]).map((key) => (
            <option key={key} value={key}>
              {sortLabels[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 overflow-x-auto border border-border">
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
              <th className="px-4 py-3">Product</th>
              <th className="px-4 py-3">Collection</th>
              <th className="px-4 py-3">Price</th>
              <th className="px-4 py-3">Clicks</th>
              <th className="px-4 py-3">Sold</th>
              <th className="px-4 py-3">Stock</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map((p) => (
              <tr key={p.slug}>
                <td className="px-4 py-3">
                  <p>{p.name}</p>
                  <p className="text-xs text-muted-foreground">{p.slug}</p>
                  {(p.sizes ?? []).length > 0 && (
                    <p className="text-xs text-muted-foreground">Sizes: {(p.sizes ?? []).join(", ")}</p>
                  )}
                </td>
                <td className="px-4 py-3 text-xs uppercase tracking-[0.14em]">{p.collection}</td>
                <td className="px-4 py-3">{inr(p.price)}</td>
                <td className="px-4 py-3">{statFor(p.slug).clicks}</td>
                <td className="px-4 py-3">{statFor(p.slug).unitsSold}</td>
                <td className="px-4 py-3">
                  <label className="sr-only" htmlFor={`stock-${p.slug}`}>
                    Stock for {p.name}
                  </label>
                  <input
                    id={`stock-${p.slug}`}
                    type="number"
                    defaultValue={p.stock}
                    onBlur={(e) =>
                      stock.mutate({ slug: p.slug, stock: Number(e.target.value) || 0 })
                    }
                    className="w-20 border border-border bg-background px-2 py-1 text-sm"
                  />
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() => {
                      setForm({
                        slug: p.slug,
                        name: p.name,
                        collection: p.collection,
                        category: p.category,
                        price: p.price,
                        compareAt: p.compareAt ? String(p.compareAt) : "",
                        badge: p.badge ?? "",
                        material: p.material,
                        description: p.description,
                        stock: p.stock,
                        imageUrl: p.imageUrl ?? "",
                        sizes: (p.sizes ?? []).join(", "),
                        active: p.active,
                      });
                      setImageKeys(p.imageKeys ?? []);
                      window.scrollTo({ top: 0, behavior: "smooth" });
                    }}
                    className="mr-3 text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove.mutate(p.slug)}
                    className="text-[0.62rem] uppercase tracking-[0.14em] text-destructive"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

const emptyPincode = { pincode: "", city: "", state: "", etaDays: 4, active: true };

function PincodesPanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyPincode);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-pincodes"],
    queryFn: () => adminListPincodes(),
  });

  const invalidate = () => void qc.invalidateQueries({ queryKey: ["admin-pincodes"] });

  const save = useMutation({
    mutationFn: () =>
      adminSavePincode({
        data: {
          pincode: form.pincode.trim(),
          city: form.city,
          state: form.state,
          etaDays: Number(form.etaDays) || 4,
          active: form.active,
        },
      }),
    onSuccess: () => {
      toast.success("PIN code saved");
      setForm(emptyPincode);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save PIN code"),
  });

  const remove = useMutation({
    mutationFn: (pincode: string) => adminDeletePincode({ data: { pincode } }),
    onSuccess: () => {
      toast.success("PIN code removed");
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not remove PIN code"),
  });

  const list = data ?? [];

  return (
    <div className="mt-10">
      <div className="border border-border p-6">
        <h2 className="font-display text-3xl">Delivery PIN codes</h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Shoppers check these on the header and product pages. Saving an existing PIN updates it.
        </p>
        <div className="mt-6 grid gap-4 sm:grid-cols-4">
          <div>
            <label htmlFor="pin-code" className="eyebrow block">
              PIN code
            </label>
            <input
              id="pin-code"
              inputMode="numeric"
              maxLength={6}
              value={form.pincode}
              onChange={(e) =>
                setForm((f) => ({ ...f, pincode: e.target.value.replace(/\D/g, "") }))
              }
              className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label htmlFor="pin-city" className="eyebrow block">
              City
            </label>
            <input
              id="pin-city"
              value={form.city}
              onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
              className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label htmlFor="pin-state" className="eyebrow block">
              State
            </label>
            <input
              id="pin-state"
              value={form.state}
              onChange={(e) => setForm((f) => ({ ...f, state: e.target.value }))}
              className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
            />
          </div>
          <div>
            <label htmlFor="pin-eta" className="eyebrow block">
              Delivery in (days)
            </label>
            <input
              id="pin-eta"
              type="number"
              min={1}
              max={30}
              value={form.etaDays}
              onChange={(e) => setForm((f) => ({ ...f, etaDays: Number(e.target.value) }))}
              className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
            />
          </div>
        </div>
        <label className="mt-4 flex items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.active}
            onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
          />
          Currently serviceable
        </label>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending || form.pincode.length !== 6}
          className="mt-6 bg-gold px-8 py-4 text-[0.7rem] uppercase tracking-[0.2em] text-gold-foreground disabled:opacity-60"
        >
          {save.isPending ? "Saving…" : "Save PIN code"}
        </button>
      </div>

      {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading PIN codes…</p>}

      <div className="mt-10 overflow-x-auto border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
              <th className="px-4 py-3">PIN</th>
              <th className="px-4 py-3">City</th>
              <th className="px-4 py-3">State</th>
              <th className="px-4 py-3">Delivery</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {list.length === 0 && !isLoading && (
              <tr>
                <td colSpan={6} className="px-4 py-6 text-muted-foreground">
                  No PIN codes added yet.
                </td>
              </tr>
            )}
            {list.map((p) => (
              <tr key={p.pincode}>
                <td className="px-4 py-3">{p.pincode}</td>
                <td className="px-4 py-3">{p.city}</td>
                <td className="px-4 py-3">{p.state}</td>
                <td className="px-4 py-3">{p.eta_days} days</td>
                <td className="px-4 py-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
                  {p.active ? "serviceable" : "paused"}
                </td>
                <td className="px-4 py-3 text-right">
                  <button
                    onClick={() =>
                      setForm({
                        pincode: p.pincode,
                        city: p.city ?? "",
                        state: p.state ?? "",
                        etaDays: p.eta_days,
                        active: p.active,
                      })
                    }
                    className="mr-3 text-[0.62rem] uppercase tracking-[0.14em] text-muted-foreground hover:text-foreground"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => remove.mutate(p.pincode)}
                    className="text-[0.62rem] uppercase tracking-[0.14em] text-destructive"
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}


const emptyDeal = {
  title: "",
  description: "",
  code: "",
  discountPercent: 10,
  active: true,
  isPopup: false,
  ctaLabel: "",
  ctaHref: "",
};

function DealsPanel() {
  const qc = useQueryClient();
  const [form, setForm] = useState(emptyDeal);
  const { data } = useQuery({ queryKey: ["admin-deals"], queryFn: () => adminListDeals() });

  const invalidate = () => {
    void qc.invalidateQueries({ queryKey: ["admin-deals"] });
    void qc.invalidateQueries({ queryKey: ["catalog", "deals"] });
  };

  const save = useMutation({
    mutationFn: () =>
      adminSaveDeal({
        data: {
          title: form.title,
          description: form.description,
          code: form.code || null,
          discountPercent: Number(form.discountPercent),
          active: form.active,
          isPopup: form.isPopup,
          ctaLabel: form.ctaLabel || null,
          ctaHref: form.ctaHref || null,
        },
      }),
    onSuccess: () => {
      toast.success("Deal saved");
      setForm(emptyDeal);
      invalidate();
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save deal"),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteDeal({ data: { id } }),
    onSuccess: () => {
      toast.success("Deal removed");
      invalidate();
    },
  });

  const input = (key: keyof typeof emptyDeal, label: string, type = "text") => (
    <div>
      <label htmlFor={`d-${key}`} className="eyebrow block">
        {label}
      </label>
      <input
        id={`d-${key}`}
        type={type}
        value={String(form[key] ?? "")}
        onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
        className="mt-2 h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
      />
    </div>
  );

  return (
    <div className="mt-10">
      <div className="border border-border p-6">
        <h2 className="font-display text-3xl">Create a deal</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {input("title", "Title")}
          {input("code", "Coupon code (optional)")}
          {input("discountPercent", "Discount %", "number")}
          {input("ctaLabel", "Button label")}
          {input("ctaHref", "Button link (e.g. /shop/core)")}
          {input("description", "Description")}
        </div>
        <div className="mt-4 flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            Active
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isPopup}
              onChange={(e) => setForm((f) => ({ ...f, isPopup: e.target.checked }))}
            />
            Show as site popup
          </label>
        </div>
        <button
          onClick={() => save.mutate()}
          disabled={save.isPending}
          className="mt-6 bg-gold px-8 py-4 text-[0.7rem] uppercase tracking-[0.2em] text-gold-foreground disabled:opacity-60"
        >
          {save.isPending ? "Saving…" : "Save deal"}
        </button>
      </div>

      <ul className="mt-10 space-y-3">
        {(data ?? []).map((d) => (
          <li
            key={d.id}
            className="flex items-start justify-between gap-6 border border-border p-5 text-sm"
          >
            <div>
              <p className="font-display text-2xl">{d.title}</p>
              <p className="mt-1 text-muted-foreground">{d.description}</p>
              <p className="mt-2 text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
                {d.code ?? "no code"} · {d.discount_percent}% · {d.active ? "active" : "paused"}
                {d.is_popup ? " · popup" : ""}
              </p>
            </div>
            <button
              onClick={() => remove.mutate(d.id)}
              className="text-[0.62rem] uppercase tracking-[0.14em] text-destructive"
            >
              Delete
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-border bg-card p-6">
      <p className="eyebrow">{label}</p>
      <p className="mt-3 font-display text-4xl">{value}</p>
    </div>
  );
}

const roleCopy: Record<ManagedRole, string> = {
  admin: "Full access — everything including user management",
  operator: "Employee — orders, products and stock only",
  user: "Buyer — shops and tracks their own orders",
};

type Segment = "all" | "buyers" | "repeat" | "high-spend" | "no-orders" | "staff";

const segmentLabels: Record<Segment, string> = {
  all: "Everyone",
  buyers: "Customers (1+ orders)",
  repeat: "Repeat customers (2+ orders)",
  "high-spend": "High spenders (₹5,000+)",
  "no-orders": "Signed up, never ordered",
  staff: "Staff (admins & operators)",
};

function matchesSegment(u: ManagedUser, segment: Segment) {
  if (segment === "buyers") return u.orders > 0;
  if (segment === "repeat") return u.orders > 1;
  if (segment === "high-spend") return u.spend >= 5000;
  if (segment === "no-orders") return u.orders === 0;
  if (segment === "staff") return u.role === "admin" || u.role === "operator";
  return true;
}

function UsersPanel() {
  const qc = useQueryClient();
  const [query, setQuery] = useState("");
  const [segment, setSegment] = useState<Segment>("all");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => adminListUsers(),
  });

  const setRole = useMutation({
    mutationFn: (vars: { userId: string; role: ManagedRole }) =>
      adminSetUserRole({ data: vars }),
    onSuccess: () => {
      toast.success("Role updated");
      void qc.invalidateQueries({ queryKey: ["admin-users"] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not update role"),
  });

  const users = data ?? [];
  const term = query.trim().toLowerCase();
  const inSegment = users.filter((u) => matchesSegment(u, segment));
  const filtered = term
    ? inSegment.filter((u) =>
        [u.email, u.fullName, u.phone].some((v) => v?.toLowerCase().includes(term)),
      )
    : inSegment;

  const counts = {
    admin: users.filter((u) => u.role === "admin").length,
    operator: users.filter((u) => u.role === "operator").length,
    buyers: users.filter((u) => u.orders > 0).length,
    visitors: users.filter((u) => u.role === "user" && u.orders === 0).length,
  };

  return (
    <div>
      <div className="mt-10 grid gap-4 sm:grid-cols-4">
        <Stat label="Admins" value={String(counts.admin)} />
        <Stat label="Operators" value={String(counts.operator)} />
        <Stat label="Buyers" value={String(counts.buyers)} />
        <Stat label="Registered visitors" value={String(counts.visitors)} />
      </div>

      <div className="mt-8 flex flex-wrap items-center gap-3">
        <label className="sr-only" htmlFor="user-search">
          Search people
        </label>
        <input
          id="user-search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, email or phone"
          className="h-11 w-full max-w-sm border border-border bg-background px-4 text-sm outline-none focus:border-gold"
        />
        <label className="sr-only" htmlFor="user-segment">
          Customer segment
        </label>
        <select
          id="user-segment"
          value={segment}
          onChange={(e) => setSegment(e.target.value as Segment)}
          className="h-11 border border-border bg-background px-3 text-sm"
        >
          {(Object.keys(segmentLabels) as Segment[]).map((key) => (
            <option key={key} value={key}>
              {segmentLabels[key]}
            </option>
          ))}
        </select>
        <button
          onClick={() =>
            downloadCsv(
              `marzi-users-${segment}.csv`,
              filtered.map((u) => ({
                email: u.email,
                name: u.fullName,
                phone: u.phone,
                role: u.role,
                orders: u.orders,
                spend_inr: u.spend,
                joined: u.createdAt,
              })),
            )
          }
          className="border border-foreground px-4 py-2 text-[0.7rem] uppercase tracking-[0.18em]"
        >
          Export {filtered.length} {segment === "all" ? "people" : "matches"} CSV
        </button>
      </div>

      {isLoading && <p className="mt-8 text-sm text-muted-foreground">Loading people…</p>}

      <div className="mt-6 overflow-x-auto border border-border">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead className="bg-secondary/60">
            <tr className="text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
              <th className="px-4 py-3">Person</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Orders</th>
              <th className="px-4 py-3">Spend</th>
              <th className="px-4 py-3">Role</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.length === 0 && !isLoading && (
              <tr>
                <td colSpan={5} className="px-4 py-6 text-muted-foreground">
                  No accounts match that search.
                </td>
              </tr>
            )}
            {filtered.map((u) => (
              <tr key={u.id} className="align-top">
                <td className="px-4 py-4">
                  <p>{u.fullName || u.email || "—"}</p>
                  <p className="text-xs text-muted-foreground">{u.email}</p>
                  {u.phone && <p className="text-xs text-muted-foreground">{u.phone}</p>}
                </td>
                <td className="px-4 py-4 text-xs text-muted-foreground">
                  {new Date(u.createdAt).toLocaleDateString("en-IN")}
                </td>
                <td className="px-4 py-4">{u.orders}</td>
                <td className="px-4 py-4">{inr(u.spend)}</td>
                <td className="px-4 py-4">
                  <label className="sr-only" htmlFor={`role-${u.id}`}>
                    Role
                  </label>
                  <select
                    id={`role-${u.id}`}
                    value={u.role}
                    disabled={u.isSelf || setRole.isPending}
                    onChange={(e) =>
                      setRole.mutate({ userId: u.id, role: e.target.value as ManagedRole })
                    }
                    className="border border-border bg-background px-2 py-1.5 text-xs disabled:opacity-50"
                  >
                    <option value="user">Buyer / visitor</option>
                    <option value="operator">Operator</option>
                    <option value="admin">Admin</option>
                  </select>
                  <p className="mt-1 max-w-[15rem] text-[0.68rem] text-muted-foreground">
                    {u.isSelf ? "This is you — role locked" : roleCopy[u.role]}
                  </p>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function ReviewsPanel() {
  const qc = useQueryClient();
  const list = useQuery({ queryKey: ["admin", "reviews"], queryFn: () => adminListReviews() });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin", "reviews"] });

  const moderate = useMutation({
    mutationFn: (v: { id: string; approved: boolean }) => adminModerateReview({ data: v }),
    onSuccess: (_d, v) => {
      toast.success(v.approved ? "Review published" : "Review hidden");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  const remove = useMutation({
    mutationFn: (id: string) => adminDeleteReview({ data: { id } }),
    onSuccess: () => {
      toast.success("Review deleted");
      refresh();
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (list.isLoading) return <p className="text-sm text-muted-foreground">Loading reviews…</p>;
  const reviews = list.data ?? [];
  const pending = reviews.filter((r) => !r.approved).length;

  return (
    <div>
      <p className="text-sm text-muted-foreground">
        {reviews.length} reviews · {pending} awaiting approval
      </p>
      <div className="mt-6 space-y-4">
        {reviews.map((r) => (
          <article key={r.id} className="border border-border p-5">
            <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.14em] text-muted-foreground">
              <span className="text-foreground">{"★".repeat(r.rating)}</span>
              <span>{r.productSlug}</span>
              {r.verifiedPurchase && <span className="text-gold">Verified purchase</span>}
              <span>{new Date(r.createdAt).toLocaleDateString("en-IN")}</span>
              <span className={r.approved ? "text-gold" : ""}>
                {r.approved ? "Published" : "Pending"}
              </span>
            </div>
            {r.title && <p className="mt-3 font-display text-xl">{r.title}</p>}
            {r.body && <p className="mt-2 text-sm text-muted-foreground">{r.body}</p>}
            <p className="mt-2 text-xs text-muted-foreground">— {r.authorName}</p>
            <div className="mt-4 flex gap-3">
              <button
                onClick={() => moderate.mutate({ id: r.id, approved: !r.approved })}
                className="border border-foreground px-4 py-2 text-[0.66rem] uppercase tracking-[0.16em]"
              >
                {r.approved ? "Hide" : "Approve"}
              </button>
              <button
                onClick={() => remove.mutate(r.id)}
                className="border border-border px-4 py-2 text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground"
              >
                Delete
              </button>
            </div>
          </article>
        ))}
        {reviews.length === 0 && (
          <p className="text-sm text-muted-foreground">No reviews submitted yet.</p>
        )}
      </div>
    </div>
  );
}

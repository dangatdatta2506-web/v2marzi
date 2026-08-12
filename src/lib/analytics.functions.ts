import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { assertAdminWith2fa } from "./admin.server";

type EventRow = {
  event_type: string;
  product_slug: string | null;
  product_name: string | null;
  path: string | null;
  referrer: string | null;
  device: string | null;
  value: number;
  visitor_id: string;
  user_id: string | null;
  created_at: string;
};

function dayKey(iso: string) {
  return iso.slice(0, 10);
}

export const adminAnalytics = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) =>
    z
      .object({ days: z.number().int().min(1).max(90).default(30) })
      .default({ days: 30 })
      .parse(input ?? {}),
  )
  .handler(async ({ data, context }) => {
    await assertAdminWith2fa(
      context.supabase,
      context.userId,
      (context.claims as { email?: string } | null)?.email,
    );

    const since = new Date(Date.now() - data.days * 86_400_000).toISOString();

    const [eventsRes, ordersRes] = await Promise.all([
      context.supabase
        .from("site_events")
        .select("*")
        .gte("created_at", since)
        .order("created_at", { ascending: false })
        .limit(20000),
      context.supabase
        .from("orders")
        .select("total,status,payment_status,created_at,items")
        .gte("created_at", since),
    ]);
    if (eventsRes.error) throw eventsRes.error;
    if (ordersRes.error) throw ordersRes.error;

    const events = (eventsRes.data ?? []) as EventRow[];
    const orders = ordersRes.data ?? [];

    const of = (type: string) => events.filter((e) => e.event_type === type);
    const uniq = (rows: EventRow[]) => new Set(rows.map((r) => r.visitor_id)).size;

    const pageViews = of("page_view");
    const productViews = of("product_view");
    const clicks = of("product_click");
    const addToCart = of("add_to_cart");
    const checkouts = of("begin_checkout");
    const purchases = of("purchase");

    // per-product roll-up
    const products = new Map<
      string,
      { slug: string; name: string; views: number; clicks: number; addToCart: number; purchases: number; revenue: number }
    >();
    for (const e of events) {
      if (!e.product_slug) continue;
      const row = products.get(e.product_slug) ?? {
        slug: e.product_slug,
        name: e.product_name ?? e.product_slug,
        views: 0,
        clicks: 0,
        addToCart: 0,
        purchases: 0,
        revenue: 0,
      };
      if (e.product_name) row.name = e.product_name;
      if (e.event_type === "product_view") row.views += 1;
      if (e.event_type === "product_click") row.clicks += 1;
      if (e.event_type === "add_to_cart") row.addToCart += 1;
      if (e.event_type === "purchase") {
        row.purchases += 1;
        row.revenue += e.value ?? 0;
      }
      products.set(e.product_slug, row);
    }

    const tally = (rows: EventRow[], pick: (e: EventRow) => string | null) => {
      const map = new Map<string, number>();
      for (const r of rows) {
        const key = pick(r);
        if (!key) continue;
        map.set(key, (map.get(key) ?? 0) + 1);
      }
      return [...map.entries()]
        .map(([label, count]) => ({ label, count }))
        .sort((a, b) => b.count - a.count);
    };

    // daily timeline
    const timelineMap = new Map<string, { day: string; views: number; visitors: Set<string>; orders: number; revenue: number }>();
    for (let i = data.days - 1; i >= 0; i -= 1) {
      const day = new Date(Date.now() - i * 86_400_000).toISOString().slice(0, 10);
      timelineMap.set(day, { day, views: 0, visitors: new Set(), orders: 0, revenue: 0 });
    }
    for (const e of pageViews) {
      const bucket = timelineMap.get(dayKey(e.created_at));
      if (!bucket) continue;
      bucket.views += 1;
      bucket.visitors.add(e.visitor_id);
    }
    for (const o of orders) {
      const bucket = timelineMap.get(dayKey(o.created_at));
      if (!bucket) continue;
      bucket.orders += 1;
      bucket.revenue += o.total ?? 0;
    }

    const paid = orders.filter((o) => o.payment_status === "paid");
    const revenue = paid.reduce((s, o) => s + (o.total ?? 0), 0);
    const visitors = uniq(pageViews);

    return {
      days: data.days,
      totals: {
        pageViews: pageViews.length,
        visitors,
        productViews: productViews.length,
        productClicks: clicks.length,
        addToCart: addToCart.length,
        checkouts: checkouts.length,
        orders: orders.length,
        paidOrders: paid.length,
        revenue,
        avgOrderValue: paid.length ? Math.round(revenue / paid.length) : 0,
        conversionRate: visitors ? Number(((paid.length / visitors) * 100).toFixed(2)) : 0,
      },
      funnel: [
        { step: "Visitors", count: visitors },
        { step: "Product views", count: uniq(productViews) },
        { step: "Added to bag", count: uniq(addToCart) },
        { step: "Checkout started", count: uniq(checkouts) },
        { step: "Purchased", count: paid.length },
      ],
      topProducts: [...products.values()]
        .sort((a, b) => b.views + b.clicks - (a.views + a.clicks))
        .slice(0, 12),
      topPages: tally(pageViews, (e) => e.path).slice(0, 10),
      referrers: tally(pageViews, (e) => e.referrer ?? "direct").slice(0, 8),
      devices: tally(pageViews, (e) => e.device),
      timeline: [...timelineMap.values()].map((b) => ({
        day: b.day,
        views: b.views,
        visitors: b.visitors.size,
        orders: b.orders,
        revenue: b.revenue,
      })),
    };
  });

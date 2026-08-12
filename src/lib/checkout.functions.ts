import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { fetchProductsBySlugs, findDealByCode } from "@/lib/catalog.server";


const lineSchema = z.object({
  slug: z.string().min(1),
  qty: z.number().int().min(1).max(20),
  size: z.string().trim().max(20).nullable().optional(),
});


const createSchema = z.object({
  lines: z.array(lineSchema).min(1).max(50),
  coupon: z.string().trim().max(30).optional(),
  customerName: z.string().trim().min(1).max(100),
  customerPhone: z.string().trim().min(6).max(20),
  shippingAddress: z.string().trim().min(5).max(500),
});

const verifySchema = z.object({
  orderId: z.string().uuid(),
  razorpayOrderId: z.string().min(1).max(120),
  razorpayPaymentId: z.string().min(1).max(120),
  razorpaySignature: z.string().min(1).max(256),
});

export const createCheckoutOrder = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => createSchema.parse(input))
  .handler(async ({ data, context }) => {
    const keyId = process.env["RAZORPAY_KEY_ID"];
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keyId || !keySecret) throw new Error("Payments are not configured yet.");

    const catalog = await fetchProductsBySlugs(data.lines.map((l) => l.slug));
    const items = data.lines.map((line) => {
      const product = catalog.find((p) => p.slug === line.slug);
      if (!product) throw new Error(`Unknown product: ${line.slug}`);
      if (product.stock < line.qty) throw new Error(`${product.name} is out of stock`);
      return {
        slug: product.slug,
        name: product.name,
        price: product.price,
        qty: line.qty,
        size: line.size ?? null,
      };
    });


    const subtotal = items.reduce((sum, i) => sum + i.price * i.qty, 0);
    const deal = data.coupon ? await findDealByCode(data.coupon) : null;
    const coupon = deal?.code ?? null;
    const discount = deal ? Math.round((subtotal * deal.discountPercent) / 100) : 0;

    const shipping = subtotal > 1999 ? 0 : 149;
    const tax = Math.round((subtotal - discount) * 0.03);
    const total = Math.max(0, subtotal - discount) + shipping + tax;

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      },
      body: JSON.stringify({
        amount: total * 100,
        currency: "INR",
        receipt: `marzi_${Date.now()}`,
        notes: { user_id: context.userId },
      }),
    });

    if (!res.ok) {
      console.error("Razorpay order failed", res.status, await res.text());
      throw new Error("Could not start the payment. Please try again.");
    }

    const rzpOrder = (await res.json()) as { id: string };

    const { data: order, error } = await context.supabase
      .from("orders")
      .insert({
        user_id: context.userId,
        items,
        subtotal,
        discount,
        shipping,
        tax,
        total,
        coupon,
        status: "pending",
        payment_status: "created",
        razorpay_order_id: rzpOrder.id,
        customer_name: data.customerName,
        customer_email: (context.claims as { email?: string } | null)?.email ?? null,
        customer_phone: data.customerPhone,
        shipping_address: data.shippingAddress,
      })
      .select("id")
      .single();

    if (error) throw error;

    return {
      orderId: order.id,
      razorpayOrderId: rzpOrder.id,
      amount: total * 100,
      keyId,
    };
  });

export const verifyCheckoutPayment = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => verifySchema.parse(input))
  .handler(async ({ data, context }) => {
    const keySecret = process.env["RAZORPAY_KEY_SECRET"];
    if (!keySecret) throw new Error("Payments are not configured yet.");

    const { createHmac, timingSafeEqual } = await import("node:crypto");
    const expected = createHmac("sha256", keySecret)
      .update(`${data.razorpayOrderId}|${data.razorpayPaymentId}`)
      .digest("hex");

    const a = Buffer.from(expected);
    const b = Buffer.from(data.razorpaySignature);
    const valid = a.length === b.length && timingSafeEqual(a, b);

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    if (!valid) {
      await supabaseAdmin
        .from("orders")
        .update({ payment_status: "failed", status: "cancelled" })
        .eq("id", data.orderId)
        .eq("user_id", context.userId);
      throw new Error("Payment verification failed.");
    }

    const { error } = await supabaseAdmin
      .from("orders")
      .update({
        payment_status: "paid",
        status: "confirmed",
        razorpay_payment_id: data.razorpayPaymentId,
      })
      .eq("id", data.orderId)
      .eq("user_id", context.userId)
      .eq("razorpay_order_id", data.razorpayOrderId);

    if (error) throw error;
    return { ok: true };
  });

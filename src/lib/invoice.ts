import { jsPDF } from "jspdf";

export type InvoiceOrder = {
  id: string;
  created_at: string;
  items: unknown;
  subtotal: number;
  discount: number;
  shipping: number;
  tax: number;
  total: number;
  coupon: string | null;
  status: string;
  payment_status: string;
  razorpay_payment_id: string | null;
  customer_name: string | null;
  customer_email: string | null;
  customer_phone: string | null;
  shipping_address: string | null;
};

type Item = { slug: string; name: string; price: number; qty: number };

const money = (paise: number) => `Rs. ${paise.toLocaleString("en-IN")}`;

export function downloadInvoice(order: InvoiceOrder) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const items = (order.items as Item[]) ?? [];
  const left = 48;
  let y = 60;

  doc.setFont("times", "normal");
  doc.setFontSize(26);
  doc.text("MARZI", left, y);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("Fine everyday jewelry · Made in India", left, y + 16);

  doc.setFontSize(16);
  doc.text("TAX INVOICE", 547, y, { align: "right" });
  doc.setFontSize(9);
  doc.text(`Invoice #${order.id.slice(0, 8).toUpperCase()}`, 547, y + 16, { align: "right" });
  doc.text(new Date(order.created_at).toLocaleString("en-IN"), 547, y + 30, { align: "right" });

  y += 56;
  doc.setDrawColor(184, 147, 95);
  doc.line(left, y, 547, y);

  y += 26;
  doc.setFontSize(10);
  doc.setFont("helvetica", "bold");
  doc.text("Billed to", left, y);
  doc.setFont("helvetica", "normal");
  const billed = [
    order.customer_name ?? "—",
    order.customer_email ?? "",
    order.customer_phone ?? "",
    ...doc.splitTextToSize(order.shipping_address ?? "", 240),
  ].filter(Boolean);
  billed.forEach((line, i) => doc.text(String(line), left, y + 16 + i * 13));

  doc.setFont("helvetica", "bold");
  doc.text("Payment", 340, y);
  doc.setFont("helvetica", "normal");
  doc.text(`Status: ${order.payment_status}`, 340, y + 16);
  doc.text(`Order: ${order.status}`, 340, y + 29);
  if (order.razorpay_payment_id) doc.text(`Ref: ${order.razorpay_payment_id}`, 340, y + 42);

  y += 24 + Math.max(billed.length, 3) * 13 + 30;

  doc.setFont("helvetica", "bold");
  doc.text("Item", left, y);
  doc.text("Qty", 360, y, { align: "right" });
  doc.text("Price", 450, y, { align: "right" });
  doc.text("Amount", 547, y, { align: "right" });
  doc.setDrawColor(210);
  doc.line(left, y + 6, 547, y + 6);
  doc.setFont("helvetica", "normal");

  y += 24;
  items.forEach((item) => {
    doc.text(item.name, left, y);
    doc.text(String(item.qty), 360, y, { align: "right" });
    doc.text(money(item.price), 450, y, { align: "right" });
    doc.text(money(item.price * item.qty), 547, y, { align: "right" });
    y += 18;
  });

  y += 10;
  doc.line(340, y, 547, y);
  y += 20;

  const rows: [string, string][] = [
    ["Subtotal", money(order.subtotal)],
    ...(order.discount
      ? ([[`Discount${order.coupon ? ` (${order.coupon})` : ""}`, `-${money(order.discount)}`]] as [
          string,
          string,
        ][])
      : []),
    ["Shipping", order.shipping ? money(order.shipping) : "Free"],
    ["GST (3%)", money(order.tax)],
  ];
  rows.forEach(([label, value]) => {
    doc.text(label, 450, y, { align: "right" });
    doc.text(value, 547, y, { align: "right" });
    y += 16;
  });

  doc.setFont("helvetica", "bold");
  doc.setFontSize(12);
  doc.text("Total", 450, y + 8, { align: "right" });
  doc.text(money(order.total), 547, y + 8, { align: "right" });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(120);
  doc.text(
    "Thank you for shopping with Marzi. For support, reply to your order confirmation email.",
    left,
    790,
  );

  doc.save(`marzi-invoice-${order.id.slice(0, 8)}.pdf`);
}

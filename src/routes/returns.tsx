import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/returns")({
  head: () => ({
    meta: [
      { title: "Return & Refund Policy — Marzi Jewelry" },
      {
        name: "description",
        content:
          "Marzi's 7-day return window, refund timelines, damaged-parcel process and non-returnable items for orders across India.",
      },
      { property: "og:title", content: "Return & Refund Policy — Marzi Jewelry" },
      { property: "og:description", content: "How returns and refunds work at Marzi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/returns" }],
  }),
  component: ReturnsPage,
});

function ReturnsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Return & Refund Policy"
      updated="Last updated: August 2026"
      sections={[
        {
          heading: "1. Return window",
          body: [
            "You may request a return within 7 days of delivery. The piece must be unused, unworn, and returned in its original packaging with all tags and the invoice.",
          ],
        },
        {
          heading: "2. How to raise a return",
          body: [
            "Message us on WhatsApp at +91 87880 11561 or use the Help page with your order number and a short reason. Our team will confirm the pickup or share a return address within 48 hours.",
          ],
        },
        {
          heading: "3. Non-returnable items",
          body: [
            "Personalised or engraved pieces, earrings and body jewelry (for hygiene reasons), gift cards, and items marked final sale cannot be returned unless they arrive damaged or incorrect.",
          ],
        },
        {
          heading: "4. Damaged or wrong item",
          body: [
            "If your parcel arrives damaged or contains the wrong item, share an unboxing video or clear photographs within 48 hours of delivery. We will replace the piece or refund it in full, including shipping.",
          ],
        },
        {
          heading: "5. Refunds",
          body: [
            "Once the returned item passes quality check, refunds are initiated within 3 business days and typically reflect in your original payment method within 5–7 business days. COD orders are refunded to a bank account or UPI ID you share with us.",
          ],
        },
        {
          heading: "6. Exchanges",
          body: [
            "Size or design exchanges are subject to stock availability. If the replacement costs more, the difference is payable before dispatch.",
          ],
        },
        {
          heading: "7. Cancellations",
          body: [
            "Orders can be cancelled free of charge any time before dispatch. After dispatch, please use the return process above.",
          ],
        },
      ]}
    />
  );
}

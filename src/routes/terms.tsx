import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/terms")({
  head: () => ({
    meta: [
      { title: "Terms of Service — Marzi Jewelry" },
      {
        name: "description",
        content:
          "The terms that govern your use of the Marzi online store, orders, pricing, and warranty in India.",
      },
      { property: "og:title", content: "Terms of Service — Marzi Jewelry" },
      { property: "og:description", content: "Terms governing purchases from Marzi." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/terms" }],
  }),
  component: TermsPage,
});

function TermsPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Terms of Service"
      updated="Last updated: August 2026"
      sections={[
        {
          heading: "1. Acceptance of terms",
          body: [
            "By browsing or purchasing from marzi.store you agree to these terms. If you do not agree, please do not use the store.",
          ],
        },
        {
          heading: "2. Eligibility",
          body: [
            "You must be at least 18 years old, or use the store under the supervision of a parent or legal guardian, and be capable of entering a binding contract under the Indian Contract Act, 1872.",
          ],
        },
        {
          heading: "3. Products and pricing",
          body: [
            "All prices are listed in Indian Rupees and are inclusive of applicable GST unless stated otherwise. Product photographs are indicative; slight variation in colour and finish is normal for hand-finished jewelry.",
            "We may correct pricing or listing errors and cancel affected orders with a full refund.",
          ],
        },
        {
          heading: "4. Orders and payment",
          body: [
            "An order is confirmed only after payment is authorised, or after COD verification where offered. We reserve the right to refuse or cancel any order for suspected fraud, incorrect pricing, or unserviceable delivery locations.",
          ],
        },
        {
          heading: "5. Shipping",
          body: [
            "Delivery timelines shown at checkout are estimates. Delays caused by courier partners, weather, or events outside our control are not our liability, though we will always help you track and resolve them.",
          ],
        },
        {
          heading: "6. Warranty",
          body: [
            "Marzi jewelry carries a 1-year plating warranty against manufacturing defects. The warranty excludes damage from misuse, chemical exposure, accidental impact, or normal wear and tear.",
          ],
        },
        {
          heading: "7. Intellectual property",
          body: [
            "All content on this store — designs, photographs, text, and the MARZI name and logo — is owned by us and may not be copied or reused without written permission.",
          ],
        },
        {
          heading: "8. Limitation of liability",
          body: [
            "To the extent permitted by law, our total liability for any claim relating to an order is limited to the amount you paid for that order.",
          ],
        },
        {
          heading: "9. Governing law",
          body: [
            "These terms are governed by the laws of India, and the courts at Mumbai, Maharashtra shall have exclusive jurisdiction.",
          ],
        },
      ]}
    />
  );
}

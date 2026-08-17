import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/legal-page";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — Marzi Jewelry" },
      {
        name: "description",
        content:
          "How Marzi collects, uses, stores and protects your personal information when you shop with us in India.",
      },
      { property: "og:title", content: "Privacy Policy — Marzi Jewelry" },
      { property: "og:description", content: "Our data practices, in plain language." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "/privacy" }],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <LegalPage
      eyebrow="Legal"
      title="Privacy Policy"
      updated="Last updated: August 2026"
      sections={[
        {
          heading: "1. Information we collect",
          body: [
            "When you shop with Marzi we collect the details you give us — name, email address, phone number, billing and shipping address, and order history. Payment details are handled directly by our payment partners; we never store your full card number or UPI credentials.",
            "We also collect limited technical information such as device type, browser, and pages viewed, so we can keep the store fast and secure.",
          ],
        },
        {
          heading: "2. How we use your information",
          body: [
            "Your information is used to process and deliver orders, provide customer support, send order updates, prevent fraud, and — only if you opt in — share news about new drops and offers.",
          ],
        },
        {
          heading: "3. Sharing with third parties",
          body: [
            "We share information only with the partners needed to run the store: payment gateways, logistics and courier partners, and communication providers. They may use your data solely to perform services for Marzi and are bound to keep it confidential.",
            "We may disclose information where required by Indian law or a valid order from a court or government authority.",
          ],
        },
        {
          heading: "4. Cookies",
          body: [
            "We use cookies and similar technologies to keep you signed in, remember your bag, and understand how the store is used. You can disable cookies in your browser, though parts of the site may stop working.",
          ],
        },
        {
          heading: "5. Data security and retention",
          body: [
            "We use industry-standard safeguards, including encryption in transit and access controls, to protect your information. We retain order records for as long as required under applicable tax and accounting laws.",
          ],
        },
        {
          heading: "6. Your rights",
          body: [
            "You may request access to, correction of, or deletion of your personal data, and you can withdraw marketing consent at any time. Write to us and we will respond within a reasonable period.",
          ],
        },
        {
          heading: "7. Children",
          body: [
            "Our store is not intended for users under 18. We do not knowingly collect personal information from children.",
          ],
        },
        {
          heading: "8. Contact",
          body: [
            "Questions about this policy? Reach us on WhatsApp at +91 87880 11561 or through the Help page.",
          ],
        },
      ]}
    />
  );
}

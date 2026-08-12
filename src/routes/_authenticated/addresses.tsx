import { createFileRoute } from "@tanstack/react-router";
import { AddressBook } from "@/components/address-book";

export const Route = createFileRoute("/_authenticated/addresses")({
  head: () => ({
    meta: [
      { title: "Saved Addresses — Marzi Jewelry" },
      {
        name: "description",
        content: "Manage the delivery addresses saved to your Marzi account.",
      },
      { property: "og:title", content: "Saved Addresses — Marzi Jewelry" },
      { property: "og:description", content: "Manage your Marzi delivery addresses." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AddressesPage,
});

function AddressesPage() {
  return (
    <div className="mx-auto max-w-3xl px-5 py-16 sm:px-8">
      <p className="eyebrow">Marzi account</p>
      <h1 className="mt-4 font-display text-5xl">Saved addresses</h1>
      <p className="mt-3 text-sm text-muted-foreground">
        Add the places you shop from most — you can pick one at checkout in a tap.
      </p>
      <div className="mt-10">
        <AddressBook manageMode />
      </div>
    </div>
  );
}

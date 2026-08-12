import { createFileRoute, Link } from "@tanstack/react-router";
import { collectionImage } from "@/lib/images";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "Our Story — Marzi Jewelry, Made in India" },
      {
        name: "description",
        content:
          "Marzi makes long-lasting, waterproof jewelry in small batches in Jaipur and Mumbai for women who turn ambition into action.",
      },
      { property: "og:title", content: "Our Story — Marzi Jewelry" },
      {
        property: "og:description",
        content: "Small-batch, long-lasting jewelry made in India, worn everywhere.",
      },
      { property: "og:url", content: "/about" },
    ],
    links: [{ rel: "canonical", href: "/about" }],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="mx-auto max-w-5xl px-5 py-20 sm:px-8">
      <p className="eyebrow">Our story</p>
      <h1 className="mt-4 max-w-3xl font-display text-5xl leading-tight sm:text-6xl">
        Jewelry that keeps pace with the woman wearing it.
      </h1>

      <div className="mt-14 grid gap-12 md:grid-cols-2">
        <img
          src={collectionImage.core}
          alt="Marzi everyday gold jewelry on linen"
          loading="lazy"
          width={1000}
          height={1000}
          className="aspect-[4/5] w-full object-cover"
        />
        <div className="space-y-6 text-sm leading-relaxed text-muted-foreground">
          <p>
            Marzi started with a simple frustration: jewelry that looked beautiful in the box and
            turned green by week three. We wanted pieces that could survive a commute, a gym
            session, a monsoon and a late-night pitch — without a single apology.
          </p>
          <p>
            So we built our own standard. Triple-layer 18K plating over surgical steel and brass,
            tested through twelve months of simulated daily wear before a single piece ships. Every
            item is made in small batches by artisans in Jaipur and Mumbai, and every batch is
            checked by hand.
          </p>
          <p>
            Three edits carry the whole idea. Core for the pieces you never take off. Baddie for the
            nights that deserve noise. Corporate for rooms where the work should speak first.
          </p>
          <div className="grid grid-cols-3 gap-6 border-t border-border pt-8 text-foreground">
            {[
              ["12mo", "Wear tested"],
              ["1,200+", "Five-star reviews"],
              ["7 days", "Easy returns"],
            ].map(([n, l]) => (
              <div key={l}>
                <p className="font-display text-3xl">{n}</p>
                <p className="mt-1 text-[0.66rem] uppercase tracking-[0.16em] text-muted-foreground">
                  {l}
                </p>
              </div>
            ))}
          </div>
          <Link
            to="/shop/$collection"
            params={{ collection: "core" }}
            className="inline-block border border-foreground px-8 py-4 text-[0.7rem] uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-primary hover:text-primary-foreground"
          >
            Shop the edit
          </Link>
        </div>
      </div>
    </div>
  );
}

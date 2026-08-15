import { Play } from "lucide-react";

// TODO: Replace these placeholder slots with real vertical footage or Instagram Reel embeds.
// Each slot is a 9:16 aspect ratio container. For Reels, swap the placeholder div for an
// <iframe> or <blockquote className="instagram-media"> embed from Instagram.
const placeholderSlots = [
  { id: "clip-1", caption: "Aurelia locket close-up" },
  { id: "clip-2", caption: "Meridian studs styling" },
  { id: "clip-3", caption: "Everyday cuff stack" },
  { id: "clip-4", caption: "Monsoon-proof test" },
  { id: "clip-5", caption: "Gift packaging reveal" },
  { id: "clip-6", caption: "Office-to-evening edit" },
];

export function VerticalVideoRail() {
  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="text-center">
        <p className="eyebrow">Style in motion</p>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl">Close-ups & styling clips</h2>
      </div>

      {/*
        TODO: Replace placeholder slots with real 9:16 video footage or Instagram Reel embeds.
        Each child below is a placeholder. Keep the aspect-[9/16] wrapper and swap the inner
        content for a <video> or Instagram embed script.
      */}
      <div className="mt-10 flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {placeholderSlots.map(({ id, caption }) => (
          <div
            key={id}
            className="relative flex-none aspect-[9/16] w-44 sm:w-52 overflow-hidden rounded-2xl border border-border bg-muted"
          >
            <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
              <div className="grid size-12 place-items-center rounded-full border border-border bg-background/80 shadow-sm">
                <Play className="size-5 fill-foreground text-foreground" />
              </div>
              <p className="mt-4 text-xs font-medium text-foreground">{caption}</p>
              <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                Video placeholder
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

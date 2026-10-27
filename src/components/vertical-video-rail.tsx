import { useQuery } from "@tanstack/react-query";
import { Play } from "lucide-react";
import { listActiveVideos, type SiteVideo } from "@/lib/content.functions";

// Fallback slots shown when no real videos have been added yet in /admin → Videos.
// When you add real footage or Instagram Reel embeds, manage them from the admin
// Videos tab instead of editing this file.
const placeholderSlots = [
  { id: "clip-1", caption: "Aurelia locket close-up" },
  { id: "clip-2", caption: "Meridian studs styling" },
  { id: "clip-3", caption: "Everyday cuff stack" },
  { id: "clip-4", caption: "Monsoon-proof test" },
  { id: "clip-5", caption: "Gift packaging reveal" },
  { id: "clip-6", caption: "Office-to-evening edit" },
];

const isDirectVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

function VideoTile({ video }: { video: SiteVideo }) {
  if (isDirectVideo(video.sourceUrl)) {
    return (
      <video
        src={video.sourceUrl}
        poster={video.thumbnailUrl ?? undefined}
        controls
        playsInline
        preload="metadata"
        className="size-full object-cover"
      />
    );
  }

  // TODO: For Instagram Reels, paste the post URL in the admin Videos tab —
  // the tile below links out to it. To embed inline instead, add the Instagram
  // embed script in __root.tsx and swap this for <blockquote className="instagram-media">.
  return (
    <a
      href={video.sourceUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="group/tile absolute inset-0"
    >
      {video.thumbnailUrl && (
        <img
          src={video.thumbnailUrl}
          alt={video.title}
          loading="lazy"
          className="size-full object-cover transition-transform duration-700 group-hover/tile:scale-105"
        />
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
        <div className="grid size-12 place-items-center rounded-full border border-border bg-background/80 shadow-sm">
          <Play className="size-5 fill-foreground text-foreground" />
        </div>
      </div>
    </a>
  );
}

export function VerticalVideoRail() {
  const { data } = useQuery({ queryKey: ["site-videos"], queryFn: () => listActiveVideos() });
  const videos = data ?? [];
  const slots: { id: string; caption: string; video?: SiteVideo }[] = videos.length
    ? videos.map((v) => ({ id: v.id, caption: v.caption || v.title, video: v }))
    : placeholderSlots.map((s) => ({ ...s }));

  return (
    <section className="mx-auto max-w-7xl px-5 py-12 sm:px-8 sm:py-16">
      <div className="text-center">
        <p className="eyebrow">Style in motion</p>
        <h2 className="mt-3 font-display text-3xl sm:text-4xl">Close-ups &amp; styling clips</h2>
      </div>

      <div className="mt-10 flex gap-4 overflow-x-auto pb-4 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {slots.map(({ id, caption, video }) => (
          <figure key={id} className="flex-none w-44 sm:w-52">
            <div className="relative aspect-[9/16] overflow-hidden rounded-2xl border border-border bg-muted">
              {video ? (
                <VideoTile video={video} />
              ) : (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
                  <div className="grid size-12 place-items-center rounded-full border border-border bg-background/80 shadow-sm">
                    <Play className="size-5 fill-foreground text-foreground" />
                  </div>
                  <p className="mt-4 text-xs font-medium text-foreground">{caption}</p>
                  <p className="mt-1 text-[0.65rem] uppercase tracking-[0.14em] text-muted-foreground">
                    Video placeholder
                  </p>
                </div>
              )}
            </div>
            {caption && (
              <figcaption className="mt-3 text-center text-[0.68rem] uppercase tracking-[0.14em] text-muted-foreground">
                {caption}
              </figcaption>
            )}
          </figure>
        ))}
      </div>
    </section>
  );
}

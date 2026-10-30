import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, X } from "lucide-react";
import { listActiveVideos, type SiteVideo } from "@/lib/content.functions";

// Fallback slots shown when no real videos have been added yet in /admin → Videos.
const placeholderSlots = [
  { id: "clip-1", caption: "Aurelia locket close-up" },
  { id: "clip-2", caption: "Meridian studs styling" },
  { id: "clip-3", caption: "Everyday cuff stack" },
  { id: "clip-4", caption: "Monsoon-proof test" },
  { id: "clip-5", caption: "Gift packaging reveal" },
  { id: "clip-6", caption: "Office-to-evening edit" },
];

const isDirectVideo = (url: string) => /\.(mp4|webm|mov|m4v)(\?|$)/i.test(url);

const instagramShortcode = (url: string) =>
  url.match(/instagram\.com\/(?:reel|reels|p)\/([A-Za-z0-9_-]+)/i)?.[1] ?? null;

/** Tap-to-play popup: plays the reel/clip right on the page instead of leaving the site. */
function VideoLightbox({ video, onClose }: { video: SiteVideo; onClose: () => void }) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  const shortcode = instagramShortcode(video.sourceUrl);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={video.title}
    >
      <div className="relative" onClick={(e) => e.stopPropagation()}>
        <button
          onClick={onClose}
          aria-label="Close video"
          className="absolute -top-11 right-0 grid size-9 place-items-center rounded-full border border-white/30 text-white transition-colors hover:bg-white/10"
        >
          <X className="size-5" />
        </button>
        {shortcode ? (
          <iframe
            src={`https://www.instagram.com/reel/${shortcode}/embed`}
            title={video.title}
            allowFullScreen
            frameBorder={0}
            scrolling="no"
            className="aspect-[9/16] w-[min(88vw,400px)] bg-black"
          />
        ) : (
          <video
            src={video.sourceUrl}
            poster={video.thumbnailUrl ?? undefined}
            controls
            autoPlay
            playsInline
            className="aspect-[9/16] w-[min(88vw,400px)] bg-black object-contain"
          />
        )}
      </div>
    </div>
  );
}

function VideoTile({ video, onPlay }: { video: SiteVideo; onPlay: () => void }) {
  const playsInlineHere = isDirectVideo(video.sourceUrl) || instagramShortcode(video.sourceUrl);

  if (playsInlineHere) {
    return (
      <button
        onClick={onPlay}
        className="group/tile absolute inset-0 cursor-pointer"
        aria-label={`Play ${video.title}`}
      >
        {video.thumbnailUrl && (
          <img
            src={video.thumbnailUrl}
            alt={video.title}
            loading="lazy"
            className="size-full object-cover transition-transform duration-700 group-hover/tile:scale-105"
          />
        )}
        {!video.thumbnailUrl && (
          <div className="absolute inset-0 bg-gradient-to-br from-[#2b1d16] via-[#3d2a1f] to-[#171010]" />
        )}
        <div className="absolute inset-0 flex flex-col items-center justify-center p-4 text-center">
          <div className="grid size-12 place-items-center rounded-full border border-white/40 bg-black/40 shadow-sm backdrop-blur-sm transition-colors group-hover/tile:bg-black/60">
            <Play className="size-5 fill-white text-white" />
          </div>
        </div>
      </button>
    );
  }

  // Other links (e.g. YouTube watch pages) open in a new tab as before.
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
  const [openVideo, setOpenVideo] = useState<SiteVideo | null>(null);
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
                <VideoTile video={video} onPlay={() => setOpenVideo(video)} />
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

      {openVideo && <VideoLightbox video={openVideo} onClose={() => setOpenVideo(null)} />}
    </section>
  );
}

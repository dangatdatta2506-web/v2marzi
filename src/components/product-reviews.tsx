import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { BadgeCheck, Star } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";
import { listProductReviews, submitReview } from "@/lib/reviews.functions";
import { cn } from "@/lib/utils";

function Stars({ value, className }: { value: number; className?: string }) {
  return (
    <span className={cn("flex gap-0.5 text-gold", className)} aria-label={`${value} out of 5`}>
      {Array.from({ length: 5 }).map((_, i) => (
        <Star key={i} className={cn("size-3.5", i < Math.round(value) && "fill-gold")} />
      ))}
    </span>
  );
}

export function ProductReviews({ slug, productName }: { slug: string; productName: string }) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [open, setOpen] = useState(false);

  const { data } = useQuery({
    queryKey: ["reviews", slug],
    queryFn: () => listProductReviews({ data: { slug } }),
    staleTime: 60_000,
  });

  const reviews = data?.reviews ?? [];
  const summary = data?.summary ?? { count: 0, average: 0, breakdown: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } };

  const bars = useMemo(
    () =>
      ([5, 4, 3, 2, 1] as const).map((star) => ({
        star,
        count: summary.breakdown[star],
        pct: summary.count ? Math.round((summary.breakdown[star] / summary.count) * 100) : 0,
      })),
    [summary],
  );

  const mutation = useMutation({
    mutationFn: () =>
      submitReview({
        data: {
          slug,
          rating,
          title: title.trim(),
          body: body.trim(),
          authorName: (user?.user_metadata?.["full_name"] as string) || user?.email?.split("@")[0] || "",
        },
      }),
    onSuccess: () => {
      toast.success("Thanks for your review", {
        description: "It will appear once our team approves it.",
      });
      setTitle("");
      setBody("");
      setOpen(false);
      void queryClient.invalidateQueries({ queryKey: ["reviews", slug] });
    },
    onError: (e) => toast.error(e instanceof Error ? e.message : "Could not save your review"),
  });

  return (
    <section className="mt-24 border-t border-border pt-14" id="reviews">
      <h2 className="font-display text-4xl">Ratings & reviews</h2>

      <div className="mt-10 grid gap-12 lg:grid-cols-[280px_1fr]">
        <div>
          <p className="font-display text-6xl">{summary.count ? summary.average : "—"}</p>
          <Stars value={summary.average} className="mt-3" />
          <p className="mt-2 text-xs uppercase tracking-[0.16em] text-muted-foreground">
            {summary.count} verified {summary.count === 1 ? "review" : "reviews"}
          </p>

          <div className="mt-6 space-y-2">
            {bars.map((b) => (
              <div key={b.star} className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="w-8">{b.star}★</span>
                <span className="h-1.5 flex-1 bg-secondary">
                  <span className="block h-full bg-gold" style={{ width: `${b.pct}%` }} />
                </span>
                <span className="w-8 text-right">{b.count}</span>
              </div>
            ))}
          </div>

          {user ? (
            <button
              onClick={() => setOpen((v) => !v)}
              className="mt-8 w-full border border-foreground py-3 text-[0.7rem] uppercase tracking-[0.18em] transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              {open ? "Cancel" : "Write a review"}
            </button>
          ) : (
            <Link
              to="/auth"
              className="mt-8 block w-full border border-foreground py-3 text-center text-[0.7rem] uppercase tracking-[0.18em] transition-colors hover:bg-primary hover:text-primary-foreground"
            >
              Sign in to review
            </Link>
          )}
        </div>

        <div>
          {open && user && (
            <form
              className="mb-10 border border-border p-6"
              onSubmit={(e) => {
                e.preventDefault();
                if (!body.trim()) {
                  toast.error("Tell us a little about the piece");
                  return;
                }
                mutation.mutate();
              }}
            >
              <p className="eyebrow">Reviewing {productName}</p>
              <div className="mt-4 flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    aria-label={`${n} star`}
                    onClick={() => setRating(n)}
                    className="p-1"
                  >
                    <Star className={cn("size-6 text-gold", n <= rating && "fill-gold")} />
                  </button>
                ))}
              </div>
              <label className="sr-only" htmlFor="review-title">
                Review headline
              </label>
              <input
                id="review-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Headline (optional)"
                maxLength={120}
                className="mt-4 h-11 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
              />
              <label className="sr-only" htmlFor="review-body">
                Your review
              </label>
              <textarea
                id="review-body"
                value={body}
                onChange={(e) => setBody(e.target.value)}
                rows={4}
                maxLength={2000}
                placeholder="How does it wear day to day?"
                className="mt-3 w-full border border-border bg-background px-3 py-3 text-sm outline-none focus:border-gold"
              />
              <button
                disabled={mutation.isPending}
                className="mt-4 bg-gold px-8 py-3 text-[0.7rem] uppercase tracking-[0.18em] text-gold-foreground disabled:opacity-60"
              >
                {mutation.isPending ? "Sending…" : "Submit review"}
              </button>
            </form>
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No reviews yet — be the first to share how you style this piece.
            </p>
          ) : (
            <ul className="divide-y divide-border border-y border-border">
              {reviews.map((r) => (
                <li key={r.id} className="py-6">
                  <div className="flex flex-wrap items-center gap-3">
                    <Stars value={r.rating} />
                    <span className="text-sm">{r.authorName}</span>
                    {r.verifiedPurchase && (
                      <span className="flex items-center gap-1 text-[0.62rem] uppercase tracking-[0.16em] text-gold">
                        <BadgeCheck className="size-3.5" /> Verified purchase
                      </span>
                    )}
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(r.createdAt).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  {r.title && <p className="mt-3 font-display text-xl">{r.title}</p>}
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{r.body}</p>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}

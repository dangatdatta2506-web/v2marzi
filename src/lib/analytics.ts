import { useEffect } from "react";
import { useRouterState } from "@tanstack/react-router";
import { supabase } from "@/integrations/supabase/client";

export type MarziEvent =
  | "page_view"
  | "product_view"
  | "product_click"
  | "add_to_cart"
  | "begin_checkout"
  | "purchase"
  | "wishlist_add";

type TrackPayload = {
  productSlug?: string | null;
  productName?: string | null;
  value?: number;
};

const VISITOR_KEY = "marzi-visitor";

function visitorId(): string {
  try {
    let id = window.localStorage.getItem(VISITOR_KEY);
    if (!id) {
      id = crypto.randomUUID();
      window.localStorage.setItem(VISITOR_KEY, id);
    }
    return id;
  } catch {
    return "anonymous";
  }
}

function deviceType(): string {
  const w = window.innerWidth;
  if (w < 640) return "mobile";
  if (w < 1024) return "tablet";
  return "desktop";
}

/** Fire-and-forget analytics event. Never blocks or throws in the UI. */
export function track(event: MarziEvent, payload: TrackPayload = {}): void {
  if (typeof window === "undefined") return;
  void (async () => {
    try {
      const { data } = await supabase.auth.getSession();
      await supabase.from("site_events").insert({
        event_type: event,
        product_slug: payload.productSlug ?? null,
        product_name: payload.productName ?? null,
        path: window.location.pathname,
        referrer: document.referrer ? new URL(document.referrer).hostname : null,
        device: deviceType(),
        value: Math.round(payload.value ?? 0),
        visitor_id: visitorId(),
        user_id: data.session?.user.id ?? null,
      });
    } catch {
      /* analytics must never break the store */
    }
  })();
}

/** Records one page_view per client-side navigation. */
export function usePageViewTracking(): void {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    if (pathname.startsWith("/admin") || pathname.startsWith("/api")) return;
    track("page_view");
  }, [pathname]);
}

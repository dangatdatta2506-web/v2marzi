import { useEffect, useState } from "react";

const KEY = "marzi-recent";
const LIMIT = 8;

function read(): string[] {
  try {
    const raw = window.localStorage.getItem(KEY);
    const list = raw ? (JSON.parse(raw) as unknown) : [];
    return Array.isArray(list) ? list.filter((s): s is string => typeof s === "string") : [];
  } catch {
    return [];
  }
}

export function pushRecentlyViewed(slug: string) {
  if (typeof window === "undefined") return;
  const next = [slug, ...read().filter((s) => s !== slug)].slice(0, LIMIT);
  window.localStorage.setItem(KEY, JSON.stringify(next));
}

export function useRecentlyViewed(excludeSlug?: string) {
  const [slugs, setSlugs] = useState<string[]>([]);
  useEffect(() => {
    setSlugs(read().filter((s) => s !== excludeSlug));
  }, [excludeSlug]);
  return slugs;
}

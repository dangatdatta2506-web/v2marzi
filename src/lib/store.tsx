import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { useQuery } from "@tanstack/react-query";
import { productsQuery } from "./catalog";
import { getProduct, type Product } from "./products";


/* ---------------- theme ---------------- */

type Theme = "light" | "dark";
const ThemeContext = createContext<{ theme: Theme; toggle: () => void }>({
  theme: "light",
  toggle: () => {},
});

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>("light");

  useEffect(() => {
    const stored = window.localStorage.getItem("marzi-theme") as Theme | null;
    if (stored) setTheme(stored);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    window.localStorage.setItem("marzi-theme", theme);
  }, [theme]);

  const toggle = useCallback(() => setTheme((t) => (t === "dark" ? "light" : "dark")), []);
  const value = useMemo(() => ({ theme, toggle }), [theme, toggle]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useTheme = () => useContext(ThemeContext);

/* ---------------- cart + wishlist ---------------- */

export type CartLine = { slug: string; qty: number; size?: string | null };

export const lineKey = (slug: string, size?: string | null) => `${slug}::${size ?? ""}`;

export type CartItem = { key: string; product: Product; qty: number; size: string | null };

type ShopState = {
  lines: CartLine[];
  wishlist: string[];
  add: (slug: string, qty?: number, size?: string | null) => void;
  remove: (key: string) => void;
  setQty: (key: string, qty: number) => void;
  clear: () => void;
  toggleWish: (slug: string) => void;
  count: number;
  items: CartItem[];
  subtotal: number;
};

const ShopContext = createContext<ShopState | null>(null);

export function ShopProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      setLines(JSON.parse(window.localStorage.getItem("marzi-cart") ?? "[]"));
      setWishlist(JSON.parse(window.localStorage.getItem("marzi-wish") ?? "[]"));
    } catch {
      /* ignore corrupt storage */
    }
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    window.localStorage.setItem("marzi-cart", JSON.stringify(lines));
    window.localStorage.setItem("marzi-wish", JSON.stringify(wishlist));
  }, [lines, wishlist, ready]);

  const add = useCallback((slug: string, qty = 1, size: string | null = null) => {
    setLines((prev) => {
      const key = lineKey(slug, size);
      const found = prev.find((l) => lineKey(l.slug, l.size) === key);
      if (found) {
        return prev.map((l) =>
          lineKey(l.slug, l.size) === key ? { ...l, qty: l.qty + qty } : l,
        );
      }
      return [...prev, { slug, qty, size }];
    });
  }, []);

  const remove = useCallback(
    (key: string) => setLines((prev) => prev.filter((l) => lineKey(l.slug, l.size) !== key)),
    [],
  );

  const setQty = useCallback((key: string, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => lineKey(l.slug, l.size) !== key)
        : prev.map((l) => (lineKey(l.slug, l.size) === key ? { ...l, qty } : l)),
    );
  }, []);

  const clear = useCallback(() => setLines([]), []);

  const toggleWish = useCallback((slug: string) => {
    setWishlist((prev) => (prev.includes(slug) ? prev.filter((s) => s !== slug) : [...prev, slug]));
  }, []);

  const { data: catalog } = useQuery(productsQuery);

  const items = useMemo(
    () =>
      lines
        .map((l) => ({
          key: lineKey(l.slug, l.size),
          product: catalog?.find((p) => p.slug === l.slug) ?? getProduct(l.slug),
          qty: l.qty,
          size: l.size ?? null,
        }))
        .filter((i): i is CartItem => Boolean(i.product)),
    [lines, catalog],
  );


  const value: ShopState = useMemo(
    () => ({
      lines,
      wishlist,
      add,
      remove,
      setQty,
      clear,
      toggleWish,
      count: lines.reduce((n, l) => n + l.qty, 0),
      items,
      subtotal: items.reduce((sum, i) => sum + i.product.price * i.qty, 0),
    }),
    [lines, wishlist, add, remove, setQty, clear, toggleWish, items],
  );

  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}


export function useShop() {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used within ShopProvider");
  return ctx;
}

import { Link, useNavigate } from "@tanstack/react-router";
import { Heart, LogOut, MapPin, Menu, Moon, Search, ShoppingBag, Sun, User, X } from "lucide-react";
import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useShop, useTheme } from "@/lib/store";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { productsQuery } from "@/lib/catalog";
import { products as fallbackProducts, inr } from "@/lib/products";
import { checkPincode } from "@/lib/pincode.functions";

type NavItem = { to: string; label: string; params?: Record<string, string> };

const nav: NavItem[] = [
  { to: "/", label: "Home" },
  { to: "/shop/$collection", label: "Core", params: { collection: "core" } },
  { to: "/best-sellers", label: "Best sellers" },
  { to: "/new-arrivals", label: "New in" },
  { to: "/gifting", label: "Gifting" },
  { to: "/about", label: "About" },
  { to: "/help", label: "Help" },
  { to: "/orders", label: "Orders" },
];

function SearchBar({ onDone }: { onDone?: () => void }) {
  const [term, setTerm] = useState("");
  const [open, setOpen] = useState(false);
  const { data } = useQuery(productsQuery);
  const catalog = data ?? fallbackProducts;

  const results = useMemo(() => {
    const q = term.trim().toLowerCase().slice(0, 60);
    if (q.length < 2) return [];
    return catalog
      .filter((p) =>
        [p.name, p.category, p.collection, p.material].some((v) =>
          v?.toLowerCase().includes(q),
        ),
      )
      .slice(0, 6);
  }, [term, catalog]);

  return (
    <div className="relative w-full">
      <label className="sr-only" htmlFor="site-search">
        Search jewelry
      </label>
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        id="site-search"
        value={term}
        onChange={(e) => {
          setTerm(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onBlur={() => window.setTimeout(() => setOpen(false), 150)}
        placeholder="Search necklaces, rings, studs…"
        className="h-10 w-full border border-border bg-background pl-9 pr-3 text-sm outline-none focus:border-gold"
      />
      {open && results.length > 0 && (
        <ul className="absolute left-0 right-0 top-11 z-50 max-h-80 overflow-auto border border-border bg-background shadow-lg">
          {results.map((p) => (
            <li key={p.slug}>
              <Link
                to="/product/$slug"
                params={{ slug: p.slug }}
                onClick={() => {
                  setTerm("");
                  setOpen(false);
                  onDone?.();
                }}
                className="flex items-center justify-between gap-4 px-4 py-3 text-sm hover:bg-secondary"
              >
                <span>
                  {p.name}
                  <span className="block text-[0.66rem] uppercase tracking-[0.14em] text-muted-foreground">
                    {p.category}
                  </span>
                </span>
                <span className="text-xs text-muted-foreground">{inr(p.price)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
      {open && term.trim().length >= 2 && results.length === 0 && (
        <p className="absolute left-0 right-0 top-11 z-50 border border-border bg-background px-4 py-3 text-xs text-muted-foreground">
          Nothing matches “{term.trim()}”.
        </p>
      )}
    </div>
  );
}

function PincodeCheck() {
  const [open, setOpen] = useState(false);
  const [pin, setPin] = useState("");
  const [result, setResult] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function check() {
    if (!/^\d{6}$/.test(pin)) {
      setResult("Enter a valid 6-digit PIN code.");
      return;
    }
    setBusy(true);
    try {
      const res = await checkPincode({ data: { pincode: pin } });
      setResult(
        res.serviceable
          ? `Yes — we deliver to ${res.city}, ${res.state} in about ${res.etaDays} days.`
          : "Sorry, we don't deliver to that PIN code yet.",
      );
    } catch {
      setResult("Could not check right now. Please try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 border border-border px-3 py-2 text-[0.7rem] uppercase tracking-[0.14em] text-muted-foreground transition-colors hover:text-foreground"
      >
        <MapPin className="size-3.5" />
        <span className="hidden xl:inline">Delivery</span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-50 w-72 border border-border bg-background p-4 shadow-lg">
          <p className="eyebrow">Check delivery</p>
          <div className="mt-3 flex">
            <label className="sr-only" htmlFor="pin-check">
              PIN code
            </label>
            <input
              id="pin-check"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, ""))}
              placeholder="400001"
              className="h-10 w-full border border-border bg-background px-3 text-sm outline-none focus:border-gold"
            />
            <button
              onClick={check}
              disabled={busy}
              className="h-10 shrink-0 border border-foreground px-3 text-[0.66rem] uppercase tracking-[0.14em] disabled:opacity-60"
            >
              {busy ? "…" : "Check"}
            </button>
          </div>
          {result && <p className="mt-3 text-xs leading-relaxed text-muted-foreground">{result}</p>}
        </div>
      )}
    </div>
  );
}

export function SiteHeader() {
  const { count, wishlist } = useShop();
  const { theme, toggle } = useTheme();
  const { user, isAdmin, isStaff } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  }

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/85 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between gap-6 px-5 sm:px-8">
        <Link
          to="/"
          className="font-display text-2xl tracking-[0.35em] text-foreground"
          aria-label="Marzi home"
        >
          MARZI
        </Link>

        <div className="hidden min-w-0 flex-1 md:block md:max-w-2xl lg:max-w-3xl xl:max-w-4xl 2xl:max-w-5xl">
          <SearchBar />
        </div>


        <nav className="hidden items-center gap-7 xl:flex" aria-label="Main">
          {nav.map((item) => (
            <Link
              key={item.label}
              to={item.to as never}
              params={item.params as never}
              className="text-[0.75rem] uppercase tracking-[0.16em] text-muted-foreground transition-colors hover:text-foreground"
              activeProps={{
                className: "text-foreground border-b border-gold pb-1",
              }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
          {isStaff && (
            <Link
              to="/admin"
              className="text-[0.75rem] uppercase tracking-[0.16em] text-gold transition-colors hover:opacity-80"
              activeProps={{ className: "border-b border-gold pb-1" }}
            >
              {isAdmin ? "Admin" : "Staff"}
            </Link>
          )}
        </nav>

        <div className="flex items-center gap-3">
          <div className="hidden lg:block">
            <PincodeCheck />
          </div>
          {user ? (
            <button
              onClick={signOut}
              aria-label="Sign out"
              title={user.email ?? "Sign out"}
              className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
            >
              <LogOut className="size-4" />
            </button>
          ) : (
            <Link
              to="/auth"
              aria-label="Sign in"
              className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
            >
              <User className="size-4" />
            </Link>
          )}
          <Link
            to="/wishlist"
            aria-label="Wishlist"
            className="relative flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
          >
            <Heart className="size-4" />
            {wishlist.length > 0 && (
              <span className="absolute -top-1.5 -right-1.5 flex size-5 items-center justify-center rounded-full bg-gold text-[0.62rem] text-gold-foreground">
                {wishlist.length}
              </span>
            )}
          </Link>
          <button
            onClick={toggle}
            aria-label="Toggle dark mode"
            className="flex size-9 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-secondary"
          >
            {theme === "dark" ? <Sun className="size-4" /> : <Moon className="size-4" />}
          </button>
          <Link
            to="/cart"
            className="group relative mr-3 flex items-center gap-2 pr-2 text-[0.78rem] uppercase tracking-[0.18em] text-foreground"
          >
            <ShoppingBag className="size-4" />
            <span className="hidden sm:inline">Bag</span>
            <span className="absolute -top-2 right-0 translate-x-1/2 flex size-5 items-center justify-center rounded-full bg-gold text-[0.65rem] text-gold-foreground">
              {count}
            </span>
          </Link>
          <button
            className="xl:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </button>
        </div>
      </div>

      <div className="border-t border-border px-5 pb-3 pt-3 md:hidden">
        <SearchBar />
      </div>

      {open && (
        <nav className="border-t border-border bg-background px-5 py-4 xl:hidden" aria-label="Mobile">

          {nav.map((item) => (
            <Link
              key={item.label}
              to={item.to as never}
              params={item.params as never}
              onClick={() => setOpen(false)}
              className="block py-3 text-sm uppercase tracking-[0.18em] text-muted-foreground"
              activeProps={{ className: "text-foreground" }}
              activeOptions={{ exact: item.to === "/" }}
            >
              {item.label}
            </Link>
          ))}
          {isStaff && (
            <Link
              to="/admin"
              onClick={() => setOpen(false)}
              className="block py-3 text-sm uppercase tracking-[0.18em] text-gold"
            >
              {isAdmin ? "Admin" : "Staff"}
            </Link>
          )}
          <div className="mt-3 lg:hidden">
            <PincodeCheck />
          </div>
        </nav>
      )}
    </header>
  );
}

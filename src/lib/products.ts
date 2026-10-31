export type Collection = "core" | "baddie" | "corporate";

export type Product = {
  slug: string;
  name: string;
  collection: Collection;
  category: string;
  price: number;
  compareAt?: number | undefined;
  badge?: "New" | "Sale" | "Best Seller" | undefined;
  material: string;
  description: string;
  specs: { label: string; value: string }[];
  rating: number;
  reviews: number;
  stock: number;
  imageUrl?: string | null;
  images?: string[];
  sizes?: string[];
};


export const collections: {
  slug: Collection;
  title: string;
  tagline: string;
  blurb: string;
}[] = [
  {
    slug: "core",
    title: "Core",
    tagline: "Everyday essentials",
    blurb: "The quiet pieces you never take off — clean lines, long-lasting gold.",
  },
  {
    slug: "corporate",
    title: "Corporate",
    tagline: "Boardroom polish",
    blurb: "Refined, understated jewelry engineered for long days and bright rooms.",
  },
];

export const products: Product[] = [
  {
    slug: "aurelia-locket",
    name: "Aurelia Locket",
    collection: "core",
    category: "Necklaces",
    price: 4290,
    compareAt: 5490,
    badge: "Best Seller",
    material: "18K gold plated stainless steel",
    description:
      "A hand-engraved oval locket on a fine cable chain. Built to hold one small secret and survive every ordinary day.",
    specs: [
      { label: "Pendant", value: "22mm x 17mm oval" },
      { label: "Chain", value: "16in + 2in extender" },
      { label: "Finish", value: "Long-lasting, waterproof" },
    ],
    rating: 4.9,
    reviews: 214,
    stock: 12,
  },
  {
    slug: "eternity-band",
    name: "Eternity Pave Band",
    collection: "core",
    category: "Rings",
    price: 3190,
    badge: "New",
    material: "18K gold plated brass, zirconia",
    description:
      "A full circle of brilliant-cut stones set flush into a slim band. Stacks beautifully, wears alone perfectly.",
    specs: [
      { label: "Width", value: "2.4mm" },
      { label: "Stones", value: "Hand-set AAA zirconia" },
      { label: "Sizes", value: "IN 10 - 20" },
    ],
    rating: 4.8,
    reviews: 168,
    stock: 24,
  },
  {
    slug: "lumen-huggies",
    name: "Lumen Huggies",
    collection: "core",
    category: "Earrings",
    price: 1890,
    material: "18K gold plated, hypoallergenic post",
    description: "Featherweight huggies that disappear into your routine and never pinch.",
    specs: [
      { label: "Diameter", value: "12mm" },
      { label: "Closure", value: "Hinged snap" },
      { label: "Weight", value: "1.8g per pair" },
    ],
    rating: 4.7,
    reviews: 96,
    stock: 40,
  },
  {
    slug: "noir-chain",
    name: "Noir Curb Chain",
    collection: "baddie",
    category: "Necklaces",
    price: 3890,
    badge: "New",
    material: "Gold plated steel with onyx",
    description: "A heavy curb chain broken by a single onyx link. Unapologetic and weighted just right.",
    specs: [
      { label: "Length", value: "18in" },
      { label: "Link width", value: "8mm" },
      { label: "Clasp", value: "Lobster with logo tag" },
    ],
    rating: 4.9,
    reviews: 132,
    stock: 8,
  },
  {
    slug: "sculpt-cuff",
    name: "Sculpt Cuff",
    collection: "baddie",
    category: "Bracelets",
    price: 4590,
    compareAt: 5990,
    badge: "Sale",
    material: "Molded brass, 18K gold plated",
    description: "A wide, hand-polished cuff with a molten edge. Made to be the only thing on your wrist.",
    specs: [
      { label: "Width", value: "18mm" },
      { label: "Fit", value: "Adjustable open back" },
      { label: "Finish", value: "High polish" },
    ],
    rating: 4.8,
    reviews: 77,
    stock: 6,
  },
  {
    slug: "flare-drops",
    name: "Flare Drop Earrings",
    collection: "baddie",
    category: "Earrings",
    price: 2790,
    material: "18K gold plated brass",
    description: "Elongated sculptural drops that catch every light in the room.",
    specs: [
      { label: "Drop", value: "62mm" },
      { label: "Weight", value: "4.1g each" },
      { label: "Backing", value: "Silicone-lined butterfly" },
    ],
    rating: 4.6,
    reviews: 54,
    stock: 18,
  },
  {
    slug: "meridian-studs",
    name: "Meridian Studs",
    collection: "corporate",
    category: "Earrings",
    price: 2190,
    badge: "Best Seller",
    material: "Surgical steel, 18K gold plated",
    description: "Precision-cut studs sized for video calls and long flights. Sleep-safe, all-day light.",
    specs: [
      { label: "Diameter", value: "6mm" },
      { label: "Post", value: "Nickel-free surgical steel" },
      { label: "Finish", value: "Brushed satin" },
    ],
    rating: 4.9,
    reviews: 301,
    stock: 52,
  },
  {
    slug: "ledger-bracelet",
    name: "Ledger Bar Bracelet",
    collection: "corporate",
    category: "Bracelets",
    price: 2990,
    material: "18K gold plated steel",
    description: "A slim engravable bar on a whisper chain. Quiet enough for the boardroom, personal enough to matter.",
    specs: [
      { label: "Bar", value: "28mm engravable" },
      { label: "Length", value: "6.5in + 1in" },
      { label: "Engraving", value: "Up to 12 characters" },
    ],
    rating: 4.7,
    reviews: 88,
    stock: 30,
  },
  {
    slug: "atlas-pendant",
    name: "Atlas Line Pendant",
    collection: "corporate",
    category: "Necklaces",
    price: 3390,
    material: "18K gold plated steel",
    description: "One continuous line, folded into a pendant. Minimal geometry with real weight behind it.",
    specs: [
      { label: "Pendant", value: "20mm" },
      { label: "Chain", value: "17in fine rolo" },
      { label: "Finish", value: "Long-lasting, waterproof" },
    ],
    rating: 4.8,
    reviews: 61,
    stock: 21,
  },
];

export const inr = (paise: number) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(paise);

export const getProduct = (slug: string) => products.find((p) => p.slug === slug);
export const byCollection = (c: Collection) => products.filter((p) => p.collection === c);

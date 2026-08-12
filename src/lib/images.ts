import core from "@/assets/collection-core.jpg";
import baddie from "@/assets/collection-baddie.jpg";
import corporate from "@/assets/collection-corporate.jpg";
import hero from "@/assets/hero-jewelry.jpg";
import type { Collection } from "./products";

export const heroImage = hero;

export const collectionImage: Record<Collection, string> = {
  core,
  baddie,
  corporate,
};

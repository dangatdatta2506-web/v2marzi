import { queryOptions } from "@tanstack/react-query";
import { listDeals, listProducts } from "./catalog.functions";
import type { Collection, Product } from "./products";

export const productsQuery = queryOptions({
  queryKey: ["catalog", "products"],
  queryFn: () => listProducts(),
  staleTime: 60_000,
});

export const dealsQuery = queryOptions({
  queryKey: ["catalog", "deals"],
  queryFn: () => listDeals(),
  staleTime: 60_000,
});

export const findProduct = (list: Product[] | undefined, slug: string) =>
  (list ?? []).find((p) => p.slug === slug);

export const inCollection = (list: Product[] | undefined, collection: Collection) =>
  (list ?? []).filter((p) => p.collection === collection);

import { createServerFn } from "@tanstack/react-start";
import { fetchDeals, fetchProducts } from "./catalog.server";

export const listProducts = createServerFn({ method: "GET" }).handler(async () => fetchProducts());

export const listDeals = createServerFn({ method: "GET" }).handler(async () => fetchDeals());

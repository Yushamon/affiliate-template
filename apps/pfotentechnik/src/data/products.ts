import type { ProductAffiliateData } from "@affiliate-core/affiliate/types";

export const products = {} satisfies Record<string, ProductAffiliateData>;

export type ProductKey = keyof typeof products;

export const getProductsByTag = () => [];

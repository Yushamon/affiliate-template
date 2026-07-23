import type { NormalizedProduct } from "./types";

export type ProductBlock =
  | { type: "decision"; data: NonNullable<NormalizedProduct["decision"]> }
  | { type: "quickFacts"; data: NormalizedProduct["quickFacts"] }
  | { type: "suitability"; data: NormalizedProduct["suitability"] }
  | { type: "prosCons"; data: { pros: string[]; cons: string[] } }
  | { type: "contextSpecs"; data: NormalizedProduct["contextSpecs"] }
  | { type: "alternatives"; data: NormalizedProduct["alternatives"] }
  | { type: "trust"; data: NonNullable<NormalizedProduct["trust"]> };

export function buildProductBlocks(product: NormalizedProduct): ProductBlock[] {
  const blocks: ProductBlock[] = [];

  const hasDecision =
    product.decision &&
    ((product.decision.goodFor?.length ?? 0) > 0 || (product.decision.notFor?.length ?? 0) > 0);

  if (hasDecision) blocks.push({ type: "decision", data: product.decision! });
  if (product.quickFacts.length) blocks.push({ type: "quickFacts", data: product.quickFacts });
  if (Object.keys(product.suitability).length) blocks.push({ type: "suitability", data: product.suitability });
  if (product.pros.length || product.cons.length) {
    blocks.push({ type: "prosCons", data: { pros: product.pros, cons: product.cons } });
  }
  if (product.contextSpecs.length) blocks.push({ type: "contextSpecs", data: product.contextSpecs });
  if (product.alternatives.length) blocks.push({ type: "alternatives", data: product.alternatives });
  if (product.trust) blocks.push({ type: "trust", data: product.trust });

  return blocks;
}

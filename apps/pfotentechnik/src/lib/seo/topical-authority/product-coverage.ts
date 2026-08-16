import { PRODUCT_COVERAGE } from "./product-coverage.data.mjs";

export type ProductCoverage = {
  repositoryProducts: number;
  decisionRolesCovered: number;
  decisionRolesTotal: number;
  decisionProductSlugs: string[];
  confirmedAGaps: string[];
  bBacklog: string[];
  source: "editorial-static";
  validatedAt: string;
};

export { PRODUCT_COVERAGE };

export function buildProductCoverage(clusterId: string, repositoryProducts: number): ProductCoverage | undefined {
  const coverage = PRODUCT_COVERAGE[clusterId as keyof typeof PRODUCT_COVERAGE];
  if (!coverage) return undefined;
  return {
    ...coverage,
    repositoryProducts,
    decisionProductSlugs: [...coverage.decisionProductSlugs],
    confirmedAGaps: [...coverage.confirmedAGaps],
    bBacklog: [...coverage.bBacklog],
    decisionRolesCovered: coverage.decisionProductSlugs.length,
    decisionRolesTotal: coverage.decisionProductSlugs.length + coverage.confirmedAGaps.length,
    source: "editorial-static",
  };
}

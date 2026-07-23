import { inferProductIntelligence } from "./inferProductIntelligence";
import type {
  NormalizedProduct,
  ProductImage,
  ProductQuickFact,
  ProductSuitabilityEntry
} from "./types";

const array = <T>(value: T[] | undefined | null): T[] => Array.isArray(value) ? value : [];

function normalizeImages(data: any): ProductImage[] {
  const ps2 = data?.productStandard2 ?? {};
  const source = ps2.images ?? data?.images ?? {};
  const result: ProductImage[] = [];

  const add = (src: unknown, type: ProductImage["type"], alt?: string, caption?: string) => {
    if (typeof src !== "string" || !src.trim()) return;
    if (result.some((image) => image.src === src)) return;
    result.push({ src, type, alt, caption });
  };

  if (Array.isArray(source)) {
    for (const item of source) {
      if (typeof item === "string") add(item, "gallery");
      else if (item && typeof item === "object") add(item.src ?? item.url, item.type ?? "gallery", item.alt, item.caption);
    }
  } else if (source && typeof source === "object") {
    add(source.hero, "hero", source.heroAlt);
    add(source.thumbnail, "thumbnail", source.thumbnailAlt);
    add(source.comparison, "comparison", source.comparisonAlt);

    const galleries = source.gallery ?? source.galleries;
    if (Array.isArray(galleries)) {
      galleries.forEach((item: any) => {
        if (typeof item === "string") add(item, "gallery");
        else add(item?.src ?? item?.url, item?.type ?? "gallery", item?.alt, item?.caption);
      });
    }

    for (let index = 1; index <= 6; index++) {
      add(source[`gallery-${index}`] ?? source[`gallery${index}`], "gallery");
    }

    add(source.detail, "detail");
    add(source.app ?? source.appScreenshot, "app");
    add(source.sizeComparison, "size-comparison");
  }

  add(data?.heroImage, "hero", data?.heroAlt);
  add(data?.thumbnail, "thumbnail");
  add(data?.comparisonImage, "comparison");

  return result;
}

function normalizeQuickFacts(data: any): ProductQuickFact[] {
  const ps2 = data?.productStandard2 ?? {};
  const direct = ps2.quickFacts ?? data?.quickFacts;
  if (Array.isArray(direct)) return direct.filter((fact) => fact?.label && fact?.value);

  const specs = ps2.contextSpecs ?? data?.specs ?? data?.specifications;
  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return [];

  return Object.entries(specs)
    .slice(0, 6)
    .map(([label, value]) => ({
      label,
      value: typeof value === "object" && value ? String((value as any).value ?? "") : String(value ?? "")
    }))
    .filter((fact) => fact.value);
}

function normalizeSuitability(data: any): Record<string, ProductSuitabilityEntry> {
  const raw = data?.productStandard2?.suitability ?? data?.suitability ?? {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  return Object.fromEntries(
    Object.entries(raw)
      .map(([key, value]: [string, any]) => {
        if (typeof value === "number") return [key, { score: value }];
        if (typeof value === "boolean") return value ? [key, { score: 5 }] : [key, { score: 1 }];
        if (value && typeof value === "object") {
          return [key, {
            label: value.label,
            score: Number(value.score ?? value.rating ?? 0),
            note: value.note
          }];
        }
        return null;
      })
      .filter(Boolean) as [string, ProductSuitabilityEntry][]
  );
}

export function normalizeProduct(input: any): NormalizedProduct {
  const data = input?.data ?? input ?? {};
  const ps2 = data?.productStandard2 ?? {};
  const hasPs2 = Boolean(data?.productStandard2);
  const hasLegacy =
    Boolean(data?.pros || data?.cons || data?.faq || data?.specs || data?.images);

  return {
    slug: input?.slug ?? data?.slug,
    title: data?.title,
    description: data?.description,
    category: ps2.category ?? data?.category,
    manufacturer: ps2.manufacturer ?? data?.manufacturer,
    images: normalizeImages(data),
    decision: ps2.decision ?? data?.decision,
    quickFacts: normalizeQuickFacts(data),
    suitability: normalizeSuitability(data),
    pros: array(ps2.pros ?? data?.pros),
    cons: array(ps2.cons ?? data?.cons),
    contextSpecs: array(ps2.contextSpecs),
    alternatives: array(ps2.alternatives ?? data?.alternatives),
    trust: ps2.trust ?? (
      data?.testStatus || data?.updatedAt || data?.dateModified
        ? {
            testStatus: data?.testStatus,
            updatedAt: data?.updatedAt ?? data?.dateModified,
            method: data?.testMethod,
            sources: array(data?.sources)
          }
        : undefined
    ),
    faq: array(ps2.faq ?? data?.faq),
    intelligence: inferProductIntelligence(data),
    source: hasPs2 && hasLegacy ? "hybrid" : hasPs2 ? "standard-2" : "legacy"
  };
}

import { inferProductIntelligence } from "./inferProductIntelligence";
import type {
  NormalizedProduct,
  ProductAlternative,
  ProductContextSpec,
  ProductDecision,
  ProductImage,
  ProductQuickFact,
  ProductSuitabilityEntry
} from "./types";

const array = <T>(value: T[] | undefined | null): T[] =>
  Array.isArray(value) ? value : [];

const text = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number") return String(value);
  if (value && typeof value === "object") {
    return String(
      (value as any).label ??
      (value as any).name ??
      (value as any).title ??
      (value as any).value ??
      ""
    ).trim();
  }
  return "";
};

function normalizeImages(data: any): ProductImage[] {
  const ps2 = data?.productStandard2 ?? {};
  const source = ps2.images ?? data?.images ?? {};
  const result: ProductImage[] = [];

  const add = (
    src: unknown,
    type: ProductImage["type"],
    alt?: string,
    caption?: string
  ) => {
    if (typeof src !== "string" || !src.trim()) return;
    if (result.some((image) => image.src === src)) return;
    result.push({ src, type, alt, caption });
  };

  if (Array.isArray(source)) {
    for (const item of source) {
      if (typeof item === "string") add(item, "gallery");
      else if (item && typeof item === "object") {
        add(
          item.src ?? item.url ?? item.path,
          item.type ?? "gallery",
          item.alt,
          item.caption
        );
      }
    }
  } else if (source && typeof source === "object") {
    add(source.hero ?? source.main, "hero", source.heroAlt);
    add(source.thumbnail, "thumbnail", source.thumbnailAlt);
    add(source.comparison, "comparison", source.comparisonAlt);

    const galleries = source.gallery ?? source.galleries ?? source.items;
    if (Array.isArray(galleries)) {
      galleries.forEach((item: any) => {
        if (typeof item === "string") add(item, "gallery");
        else add(
          item?.src ?? item?.url ?? item?.path,
          item?.type ?? "gallery",
          item?.alt,
          item?.caption
        );
      });
    }

    for (let index = 1; index <= 12; index++) {
      add(
        source[`gallery-${index}`] ??
        source[`gallery${index}`],
        "gallery"
      );
    }

    add(source.detail, "detail");
    add(source.app ?? source.appScreenshot, "app");
    add(source.sizeComparison ?? source["size-comparison"], "size-comparison");
  }

  add(data?.heroImage ?? data?.image, "hero", data?.heroAlt);
  add(data?.thumbnail, "thumbnail");
  add(data?.comparisonImage, "comparison");

  return result;
}

function normalizeDecision(data: any): ProductDecision | undefined {
  const raw = data?.productStandard2?.decision ?? data?.decision;
  if (!raw || typeof raw !== "object") return undefined;

  const goodFor = array<string>(
    raw.goodFor ?? raw.bestFor ?? raw.suitableFor ?? raw.recommendedFor
  ).filter(Boolean);

  const notFor = array<string>(
    raw.notFor ?? raw.attention ?? raw.lessSuitableFor ?? raw.watchOut
  ).filter(Boolean);

  if (!goodFor.length && !notFor.length) return undefined;

  return {
    title: raw.title,
    goodFor,
    notFor
  };
}

function normalizeQuickFacts(data: any): ProductQuickFact[] {
  const ps2 = data?.productStandard2 ?? {};
  const direct =
    ps2.quickFacts ??
    data?.quickFacts ??
    data?.highlights ??
    data?.keyFacts;

  if (Array.isArray(direct)) {
    return direct
      .map((fact: any) => {
        if (typeof fact === "string") {
          const [label, ...rest] = fact.split(":");
          return {
            label: rest.length ? label.trim() : "Merkmal",
            value: rest.length ? rest.join(":").trim() : fact.trim()
          };
        }

        return {
          label: text(fact?.label ?? fact?.title ?? fact?.name),
          value: text(fact?.value ?? fact?.text ?? fact?.description),
          note: text(fact?.note) || undefined,
          icon: text(fact?.icon) || undefined
        };
      })
      .filter((fact: ProductQuickFact) => fact.label && fact.value)
      .slice(0, 8);
  }

  const specs =
    ps2.contextSpecs ??
    data?.specs ??
    data?.specifications ??
    data?.technicalData;

  if (!specs || typeof specs !== "object" || Array.isArray(specs)) return [];

  return Object.entries(specs)
    .map(([label, value]) => ({
      label,
      value: text(value)
    }))
    .filter((fact) => fact.value)
    .slice(0, 8);
}

function normalizeSuitability(
  data: any
): Record<string, ProductSuitabilityEntry> {
  const raw =
    data?.productStandard2?.suitability ??
    data?.suitability ??
    data?.fit ??
    {};

  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return {};

  return Object.fromEntries(
    Object.entries(raw)
      .map(([key, value]: [string, any]) => {
        if (typeof value === "number") return [key, { score: value }];
        if (typeof value === "boolean") {
          return value ? [key, { score: 5 }] : [key, { score: 1 }];
        }
        if (value && typeof value === "object") {
          return [
            key,
            {
              label: value.label,
              score: Number(value.score ?? value.rating ?? value.value ?? 0),
              note: value.note ?? value.description
            }
          ];
        }
        return null;
      })
      .filter(Boolean) as [string, ProductSuitabilityEntry][]
  );
}

function normalizeContextSpecs(data: any): ProductContextSpec[] {
  const direct =
    data?.productStandard2?.contextSpecs ??
    data?.contextSpecs;

  if (Array.isArray(direct)) {
    return direct
      .map((item: any) => ({
        label: text(item?.label ?? item?.title ?? item?.name),
        value: text(item?.value ?? item?.text),
        context: text(item?.context ?? item?.note) || undefined,
        icon: text(item?.icon) || undefined
      }))
      .filter((item: ProductContextSpec) => item.label && item.value);
  }

  return [];
}

function normalizeAlternatives(data: any): ProductAlternative[] {
  const raw =
    data?.productStandard2?.alternatives ??
    data?.alternatives ??
    data?.alternativeProducts;

  return array<any>(raw)
    .map((item) => {
      if (typeof item === "string") {
        return {
          title: item,
          slug: item
        };
      }

      return {
        title: text(item?.title ?? item?.name ?? item?.label ?? item?.slug),
        slug: text(item?.slug) || undefined,
        url: text(item?.url ?? item?.path) || undefined,
        image: text(item?.image ?? item?.thumbnail) || undefined,
        reason: text(item?.reason ?? item?.description) || undefined,
        badge: text(item?.badge) || undefined
      };
    })
    .filter((item: ProductAlternative) => item.title);
}

export function normalizeProduct(input: any): NormalizedProduct {
  const data = input?.data ?? input ?? {};
  const ps2 = data?.productStandard2 ?? {};
  const hasPs2 = Boolean(data?.productStandard2);
  const hasLegacy = Boolean(
    data?.pros ||
    data?.cons ||
    data?.faq ||
    data?.specs ||
    data?.images ||
    data?.decision
  );

  const category = ps2.category ?? data?.category;
  const manufacturer = ps2.manufacturer ?? data?.manufacturer;

  return {
    slug: input?.slug ?? data?.slug,
    title: data?.title,
    description: data?.description,
    category,
    manufacturer,
    images: normalizeImages(data),
    decision: normalizeDecision(data),
    quickFacts: normalizeQuickFacts(data),
    suitability: normalizeSuitability(data),
    pros: array<string>(
      ps2.pros ?? data?.pros ?? data?.strengths
    ).filter(Boolean),
    cons: array<string>(
      ps2.cons ?? data?.cons ?? data?.weaknesses
    ).filter(Boolean),
    contextSpecs: normalizeContextSpecs(data),
    alternatives: normalizeAlternatives(data),
    trust:
      ps2.trust ??
      data?.trust ??
      (
        data?.testStatus || data?.updatedAt || data?.dateModified
          ? {
              testStatus: data?.testStatus,
              testedAt: data?.testedAt ?? data?.lastTested,
              updatedAt: data?.updatedAt ?? data?.dateModified,
              method: data?.testMethod ?? data?.methodology,
              sources: array<string>(data?.sources),
              firmware: data?.firmware
            }
          : undefined
      ),
    faq: array(ps2.faq ?? data?.faq),
    intelligence: inferProductIntelligence({
      ...data,
      category,
      manufacturer
    }),
    source: hasPs2 && hasLegacy
      ? "hybrid"
      : hasPs2
        ? "standard-2"
        : "legacy"
  };
}

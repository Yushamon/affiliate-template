import type { NormalizedProduct } from "./types";

export interface ProductQualityResult {
  score: number;
  dimensions: {
    content: number;
    images: number;
    trust: number;
    intelligence: number;
  };
  recommendations: Array<{
    id: string;
    impact: "high" | "medium" | "low";
    message: string;
  }>;
}

const pct = (value: number, max: number) => Math.round((value / max) * 100);

export function evaluateProductQuality(product: NormalizedProduct): ProductQualityResult {
  const recommendations: ProductQualityResult["recommendations"] = [];

  let contentPoints = 0;
  if (product.decision) contentPoints += 2;
  else recommendations.push({ id: "decision", impact: "high", message: "Entscheidungskarte ergänzen." });
  if (product.quickFacts.length >= 4) contentPoints += 2;
  else recommendations.push({ id: "quick-facts", impact: "medium", message: "Mindestens vier Quick Facts ergänzen." });
  if (Object.keys(product.suitability).length >= 3) contentPoints += 2;
  else recommendations.push({ id: "suitability", impact: "high", message: "Eignung für mindestens drei Zielgruppen bewerten." });
  if (product.pros.length >= 3) contentPoints += 2;
  else recommendations.push({ id: "pros", impact: "medium", message: "Mindestens drei belastbare Stärken ergänzen." });
  if (product.cons.length >= 1) contentPoints += 1;
  else recommendations.push({ id: "cons", impact: "high", message: "Mindestens eine echte Schwäche nennen." });
  if (product.alternatives.length >= 2) contentPoints += 1;
  else recommendations.push({ id: "alternatives", impact: "medium", message: "Mindestens zwei passende Alternativen verknüpfen." });

  const imageTypes = new Set(product.images.map((image) => image.type));
  let imagePoints = 0;
  for (const type of ["hero", "thumbnail", "comparison", "gallery", "detail", "app", "size-comparison"]) {
    if (imageTypes.has(type as any)) imagePoints += 1;
  }
  if (!imageTypes.has("hero")) recommendations.push({ id: "hero-image", impact: "high", message: "Hero-Bild ergänzen." });
  if (!imageTypes.has("comparison")) recommendations.push({ id: "comparison-image", impact: "medium", message: "Vergleichsbild ergänzen." });
  if (!imageTypes.has("size-comparison")) recommendations.push({ id: "size-image", impact: "medium", message: "Größenvergleich ergänzen." });

  let trustPoints = 0;
  if (product.trust?.testStatus) trustPoints += 1;
  if (product.trust?.updatedAt) trustPoints += 1;
  if (product.trust?.method) trustPoints += 1;
  if ((product.trust?.sources?.length ?? 0) >= 2) trustPoints += 1;
  if (trustPoints < 4) recommendations.push({ id: "trust", impact: "high", message: "Prüfstatus, Aktualisierung, Methode und Quellen vollständig machen." });

  let intelligencePoints = 0;
  if (product.intelligence.animal !== "unknown") intelligencePoints += 1;
  if (!product.intelligence.petSize.includes("unknown")) intelligencePoints += 1;
  if (product.intelligence.category) intelligencePoints += 1;
  if (product.intelligence.manufacturer) intelligencePoints += 1;
  if (product.intelligence.inferredTargetGroups.length) intelligencePoints += 1;
  if (intelligencePoints < 5) recommendations.push({ id: "metadata", impact: "high", message: "Tier, Größe, Kategorie und Hersteller strukturieren." });

  const dimensions = {
    content: pct(contentPoints, 10),
    images: pct(imagePoints, 7),
    trust: pct(trustPoints, 4),
    intelligence: pct(intelligencePoints, 5)
  };

  const score = Math.round(
    dimensions.content * .4 +
    dimensions.images * .25 +
    dimensions.trust * .2 +
    dimensions.intelligence * .15
  );

  return { score, dimensions, recommendations };
}

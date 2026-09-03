export const LITTER_TYPE_LABELS: Record<string, string> = {
  bentonite: "Bentonitstreu",
  "mineral-clumping": "klumpende Mineralstreu",
  tofu: "Tofu-Streu",
  "plant-fiber": "Pflanzenfaserstreu",
  "silica-crystal": "Kristallstreu",
  wood: "Holzstreu",
  pellets: "Pellets",
  paper: "Papierstreu",
  "non-clumping": "nicht klumpende Streu",
  mixed: "Mischstreu",
  unknown: "nicht spezifiziert",
};

export type LitterCompatibilityData = {
  status: "complete" | "partial" | "unknown";
  compatibleTypes?: string[];
  conditionalTypes?: string[];
  incompatibleTypes?: string[];
  clumpingRequirement: "required" | "recommended" | "not-required" | "proprietary-system" | "unknown";
  grainSize?: { minMm?: number; maxMm?: number; maxLengthMm?: number; maxDiameterMm?: number; notes?: string };
  notes?: string[];
  researchedAt: Date | string;
  evidence?: Array<{ source: string; url: string; sourceType: string; verifiedAt: Date | string; assertion: string }>;
};

const labels = (values: string[] = []) => values.map((value) => LITTER_TYPE_LABELS[value] ?? value);
const join = (values: string[]) => values.length <= 1 ? values[0] ?? "" : values.length === 2 ? `${values[0]} und ${values[1]}` : `${values.slice(0, -1).join(", ")} und ${values.at(-1)}`;

export function buildLitterCompatibilityModel(data?: LitterCompatibilityData | null) {
  if (!data) return null;
  const compatible = labels(data.compatibleTypes);
  const conditional = labels(data.conditionalTypes);
  const incompatible = labels(data.incompatibleTypes);
  const unknown = data.status === "unknown" || (!compatible.length && !conditional.length && !incompatible.length);
  const requirement = data.clumpingRequirement === "required"
    ? "Klumpstreu erforderlich"
    : data.clumpingRequirement === "recommended"
      ? "Klumpstreu empfohlen"
      : data.clumpingRequirement === "proprietary-system"
        ? "Herstellersystem erforderlich"
        : data.clumpingRequirement === "not-required"
          ? "Klumpstreu nicht erforderlich"
          : "Klumpanforderung nicht geklärt";
  const grain = data.grainSize?.maxLengthMm || data.grainSize?.maxDiameterMm
    ? ` · max. ${[data.grainSize.maxLengthMm ? `${data.grainSize.maxLengthMm} mm Länge` : "", data.grainSize.maxDiameterMm ? `${data.grainSize.maxDiameterMm} mm Durchmesser` : ""].filter(Boolean).join(" / ")}`
    : "";
  return {
    unknown,
    compatible,
    conditional,
    incompatible,
    requirement,
    grain,
    decisionFact: unknown
      ? {
          label: "Streu-Kompatibilität",
          value: "Vom Hersteller nicht ausreichend dokumentiert",
          consequence: "Vor dem Kauf direkt beim Anbieter prüfen, ob die vorhandene Streu geeignet ist.",
          source: "product-data" as const,
        }
      : {
          label: "Streu-Kompatibilität",
          value: `${compatible.length ? `Geeignet: ${join(compatible)}` : "Keine allgemeine Freigabe"}${incompatible.length ? ` · Nicht geeignet: ${join(incompatible)}` : ""}`,
          consequence: `${requirement}${grain}.${conditional.length ? ` Nur bedingt geeignet: ${join(conditional)}.` : ""}`,
          source: "product-data" as const,
        },
    comparisonLabel: unknown
      ? "Kompatibilität nicht ausreichend dokumentiert"
      : `${compatible.length ? join(compatible) : "Keine allgemeine Freigabe"}${conditional.length ? `; bedingt: ${join(conditional)}` : ""}${incompatible.length ? `; nicht: ${join(incompatible)}` : ""}${grain}`,
  };
}

export function formatLitterCompatibilityComparison(data?: LitterCompatibilityData | null): string | undefined {
  return buildLitterCompatibilityModel(data)?.comparisonLabel;
}

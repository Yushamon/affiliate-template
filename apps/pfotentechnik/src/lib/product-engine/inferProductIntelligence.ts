import type { Animal, PetSize, ProductIntelligence } from "./types";

const asArray = <T>(value: T | T[] | undefined | null): T[] =>
  value == null ? [] : Array.isArray(value) ? value : [value];

const normalizeAnimal = (value: unknown): Animal => {
  const raw = String(value ?? "").toLowerCase();
  if (["dog", "hund"].includes(raw)) return "dog";
  if (["cat", "katze"].includes(raw)) return "cat";
  if (["both", "dog-cat", "hund-katze"].includes(raw)) return "both";
  return "unknown";
};

const normalizePetSize = (value: unknown): PetSize[] => {
  const values = asArray(value).map((item) => String(item).toLowerCase());
  const result = new Set<PetSize>();
  for (const item of values) {
    if (["small", "klein", "xs", "s"].includes(item)) result.add("small");
    else if (["medium", "mittel", "m"].includes(item)) result.add("medium");
    else if (["large", "gross", "groß", "l", "xl"].includes(item)) result.add("large");
    else if (["all", "alle"].includes(item)) result.add("all");
  }
  return result.size ? [...result] : ["unknown"];
};

export function inferProductIntelligence(data: any): ProductIntelligence {
  const ps2 = data?.productStandard2 ?? {};
  const features = data?.features ?? ps2?.features ?? {};
  const animal = normalizeAnimal(data?.animal ?? ps2?.animal);
  const petSize = normalizePetSize(data?.petSize ?? data?.petSizes ?? ps2?.petSize);

  const category = String(data?.category ?? ps2?.category ?? "").toLowerCase();
  const gps = Boolean(features?.gps ?? data?.gps ?? category.includes("gps"));
  const app = Boolean(features?.app ?? data?.app ?? data?.appControl);
  const camera = Boolean(features?.camera ?? data?.camera);
  const outdoor = Boolean(features?.outdoor ?? data?.outdoor ?? gps);
  const multiPet = Boolean(features?.multiPet ?? data?.multiPet);
  const seniorFriendly = Boolean(features?.seniorFriendly ?? data?.seniorFriendly);

  const subscriptionRaw = String(
    features?.subscription ?? data?.subscription ?? data?.subscriptionRequired ?? ""
  ).toLowerCase();

  const subscription =
    subscriptionRaw === "true" || subscriptionRaw === "required" || subscriptionRaw === "pflicht"
      ? "required"
      : subscriptionRaw === "optional"
        ? "optional"
        : subscriptionRaw === "false" || subscriptionRaw === "none" || subscriptionRaw === "kein"
          ? "none"
          : "unknown";

  const inferredTargetGroups: string[] = [];
  const inferredWarnings: string[] = [];
  const inferredBenefits: string[] = [];

  if (animal === "dog" || animal === "both") inferredTargetGroups.push("Hundehalter");
  if (animal === "cat" || animal === "both") inferredTargetGroups.push("Katzenhalter");
  if (petSize.includes("large")) inferredTargetGroups.push("Halter großer Tiere");
  if (petSize.includes("small")) inferredTargetGroups.push("Halter kleiner Tiere");
  if (multiPet) inferredTargetGroups.push("Mehrtierhaushalte");
  if (seniorFriendly) inferredTargetGroups.push("Seniorentiere");
  if (outdoor) inferredTargetGroups.push("Outdoor- und Reiseeinsatz");

  if (subscription === "required") inferredWarnings.push("Für zentrale Funktionen ist ein Abo erforderlich.");
  if (app) inferredWarnings.push("App-Funktionen hängen von Smartphone, Konto und Softwarepflege ab.");
  if (gps) inferredBenefits.push("Ortung und Sicherheitsfunktionen sind ein zentraler Mehrwert.");
  if (camera) inferredBenefits.push("Die Kamera ermöglicht zusätzliche Kontrolle aus der Ferne.");
  if (multiPet) inferredBenefits.push("Das Produkt ist für Haushalte mit mehreren Tieren ausgelegt.");
  if (outdoor) inferredBenefits.push("Die Ausstattung ist auf den Einsatz außerhalb der Wohnung ausgerichtet.");

  return {
    animal,
    petSize,
    category: data?.category ?? ps2?.category,
    manufacturer: data?.manufacturer ?? ps2?.manufacturer,
    gps,
    app,
    camera,
    subscription,
    waterproof: features?.waterproof ?? data?.waterproof,
    outdoor,
    multiPet,
    seniorFriendly,
    inferredTargetGroups: [...new Set(inferredTargetGroups)],
    inferredWarnings: [...new Set(inferredWarnings)],
    inferredBenefits: [...new Set(inferredBenefits)]
  };
}

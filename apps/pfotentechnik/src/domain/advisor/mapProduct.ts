import type { CollectionEntry } from "astro:content";
import type { AdvisorCapability, AdvisorFact, AdvisorProduct } from "./types";

export const capability = (value: boolean | undefined | null): AdvisorCapability =>
  value === true ? "supported" : value === false ? "unavailable" : "unknown";
const listFact = <T>(value: T[] | undefined): AdvisorFact<T[]> =>
  value?.length ? { status: "known", value } : { status: "unknown" };

export const mapProductToAdvisor = (entry: CollectionEntry<"products">): AdvisorProduct => {
  const data = entry.data;
  const filters = data.comparisonFilters;
  const slug = entry.id.replace(/\.(md|mdx)$/i, "");
  const category = data.category.key;
  const isFeeder = ["futterautomat", "futterautomaten"].includes(category);
  const gps = data.gps;
  const feeder = data.comparisonData?.feeder;
  const fountain = data.comparisonData?.fountain;
  const booleanValue = (value: unknown): boolean | undefined => typeof value === "boolean" ? value : undefined;
  return {
    id: entry.id, slug, title: data.title, description: data.description,
    recommendation: data.recommendation, rating: data.rating, score: data.score,
    bestFor: data.decision.bestFor, attention: data.decision.attention,
    strengths: data.strengths, weaknesses: data.weaknesses, features: data.features,
    useCase: data.useCase, priceCategory: data.priceCategory ?? filters?.priceTier,
    category,
    common: {
      animals: listFact(gps?.animal?.length ? gps.animal : filters?.animal),
      petSizes: listFact(filters?.petSize),
      foodTypes: isFeeder ? listFact(filters?.foodType) : { status: "notApplicable" },
      app: capability(filters?.app ?? booleanValue(fountain?.app)), camera: capability(filters?.camera ?? booleanValue(feeder?.camera)),
      accessControl: filters?.access ? { status: "known", value: filters.access } : { status: "unknown" },
      backupPower: capability(filters?.backupPower),
      // Overall outage status may cover other functions; only an explicit schedule claim qualifies.
      offlineSchedule: isFeeder ? data.failureModes?.internetOutage?.functions?.localSchedule ?? "unknown" : "notApplicable",
      failureModes: Object.fromEntries(Object.entries(data.failureModes ?? {}).map(([key, value]) => [key, value.status])),
      multiPet: {
        sharedUse: data.multiPet?.sharedUse ?? "unknown",
        individualAccess: data.multiPet?.individualAccess ?? "unknown"
      }
    },
    specific: {
      ...(gps ? { gps: {
        minimumPetWeightKg: gps.minimumPetWeightKg, deviceWeightGrams: gps.deviceWeightGrams,
        subscriptionRequired: gps.subscriptionRequired, batteryMaxDays: gps.batteryMaxDays,
        liveTracking: gps.liveTracking, virtualFence: gps.virtualFence
      } } : {}),
      ...(isFeeder && data.dispensingPrecision ? { feeder: data.dispensingPrecision } : {}),
      ...(category === "automatische-katzentoiletten" ? { litterBox: { compatibility: data.litterCompatibility, limits: data.sensorLimits } } : {})
    },
    route: `/produkt/${slug}/`
  };
};

export const isFeederAdvisorProduct = (entry: CollectionEntry<"products">) =>
  ["futterautomat", "futterautomaten"].includes(entry.data.category.key)
  && !["discontinued", "legacy"].includes(entry.data.productStatus)
  && entry.data.recommendationStatus !== "archived";

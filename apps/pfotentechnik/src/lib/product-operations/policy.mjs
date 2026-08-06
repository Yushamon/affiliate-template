export const AVAILABILITY_VALUES = Object.freeze([
  "available",
  "temporarily-unavailable",
  "out-of-stock",
  "discontinued",
  "unknown"
]);

export const PRICE_STATE_VALUES = Object.freeze([
  "available",
  "unknown",
  "removed",
  "stale"
]);

export const RECOMMENDATION_STATUS_VALUES = Object.freeze([
  "recommended",
  "limited",
  "archived"
]);

export const EDITORIAL_STATUS_VALUES = Object.freeze([
  "complete",
  "recommended",
  "required",
  "archived"
]);

export const MAINTENANCE_STATUS_VALUES = Object.freeze([
  "complete",
  "recommended",
  "required",
  "archived"
]);

export const AVAILABILITY_LABELS = Object.freeze({
  available: "Verfügbar",
  "temporarily-unavailable": "Vorübergehend nicht verfügbar",
  "out-of-stock": "Aktuell nicht lieferbar",
  discontinued: "Eingestellt",
  unknown: "Unbekannt"
});

export const STATUS_LABELS = Object.freeze({
  complete: "Vollständig gepflegt",
  recommended: "Pflege empfohlen",
  required: "Pflege erforderlich",
  archived: "Archiviert",
  limited: "Eingeschränkt empfehlbar"
});

const DAY_MS = 86_400_000;
const text = (value) => typeof value === "string" ? value.trim() : "";
const dateValue = (value) => {
  if (!value) return null;
  const parsed = value instanceof Date ? value.getTime() : Date.parse(String(value));
  return Number.isFinite(parsed) ? parsed : null;
};
const validPrice = (value) => {
  const number = Number(value);
  return Number.isFinite(number) && number > 0 ? Math.round(number * 100) / 100 : null;
};
const hasHttpsUrl = (value) => {
  try {
    return new URL(String(value || "")).protocol === "https:";
  } catch {
    return false;
  }
};
const choice = (value, supported, fallback) => supported.includes(value) ? value : fallback;

export function parseLocalizedPrice(value) {
  if (typeof value === "number") {
    return Number.isFinite(value) && value > 0 ? Math.round(value * 100) / 100 : null;
  }

  const raw = String(value ?? "").trim();
  if (!raw) return null;

  const compact = raw
    .replace(/\s+/g, "")
    .replace(/[€$£CHF]/gi, "")
    .replace(/[^0-9,.-]/g, "");

  if (!compact || compact === "-" || compact === "," || compact === ".") return null;

  const comma = compact.lastIndexOf(",");
  const dot = compact.lastIndexOf(".");
  let normalized = compact;

  if (comma >= 0 && dot >= 0) {
    const decimal = comma > dot ? "," : ".";
    const thousands = decimal === "," ? /\./g : /,/g;
    normalized = normalized.replace(thousands, "");
    if (decimal === ",") normalized = normalized.replace(",", ".");
  } else if (comma >= 0) {
    normalized = normalized.replace(/\./g, "").replace(",", ".");
  } else if ((normalized.match(/\./g) || []).length > 1) {
    const parts = normalized.split(".");
    const decimals = parts.pop();
    normalized = `${parts.join("")}.${decimals}`;
  }

  const parsed = Number(normalized);
  return Number.isFinite(parsed) && parsed > 0
    ? Math.round(parsed * 100) / 100
    : null;
}

export function formatPrice(value, currency = "EUR") {
  const number = validPrice(value);
  if (number == null) return null;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: /^[A-Z]{3}$/.test(currency) ? currency : "EUR"
  }).format(number);
}

export function ageInDays(value, now = Date.now()) {
  const timestamp = dateValue(value);
  if (timestamp == null) return null;
  return Math.max(0, Math.floor((now - timestamp) / DAY_MS));
}

export function isConsciouslyUnavailable(availability) {
  return ["temporarily-unavailable", "out-of-stock", "discontinued"].includes(availability);
}

export function isArchivedAvailability(availability) {
  return ["out-of-stock", "discontinued"].includes(availability);
}

export function isPurchasable(productOrOperations) {
  const operations = productOrOperations?.operations ?? productOrOperations;
  return operations?.availability === "available" && operations?.affiliateAvailable === true;
}

export function isAutoRecommendationEligible(productOrOperations) {
  const operations = productOrOperations?.operations ?? productOrOperations;
  return operations?.availability === "available" &&
    operations?.recommendationStatus !== "archived";
}

export function availabilityFromOffer(value) {
  const normalized = String(value || "")
    .toLocaleLowerCase("en")
    .replace(/^https?:\/\/schema\.org\//, "")
    .replace(/[^a-z]/g, "");

  if (!normalized) return null;
  if (["instock", "limitedavailability", "onlineonly", "instoreonly"].includes(normalized)) return "available";
  if (["outofstock", "soldout"].includes(normalized)) return "out-of-stock";
  if (["discontinued"].includes(normalized)) return "discontinued";
  if (["backorder", "preorder", "preorderlimitedavailability"].includes(normalized)) return "temporarily-unavailable";
  return null;
}

export function inferInitialAvailability(data, now = Date.now()) {
  const explicit = choice(data?.availability, AVAILABILITY_VALUES, null);
  if (explicit) return explicit;
  if (data?.productStatus === "discontinued") return "discontinued";

  const price = validPrice(data?.price?.current);
  const affiliate = hasHttpsUrl(data?.affiliate?.url ?? data?.price?.affiliateUrl ?? data?.productUrl);
  const checkedAge = ageInDays(data?.priceUpdated ?? data?.price?.checkedAt, now);

  if (data?.productStatus === "active" && price != null && affiliate && checkedAge != null && checkedAge <= 30) {
    return "available";
  }

  return "unknown";
}

export function requiredFieldIssues(data) {
  const issues = [];
  if (!text(data?.slug)) issues.push("slug");
  if (!text(data?.title)) issues.push("title");
  if (!text(data?.manufacturer?.name ?? data?.manufacturer)) issues.push("manufacturer");
  if (!text(data?.category?.label ?? data?.category)) issues.push("category");
  if (!text(data?.recommendation)) issues.push("recommendation");
  if (!text(data?.review?.summary)) issues.push("review.summary");
  if (!text(data?.review?.verdict)) issues.push("review.verdict");
  if (!data?.images?.hero) issues.push("images.hero");
  if (!Number.isFinite(Number(data?.rating))) issues.push("rating");
  return issues;
}

export function deriveProductOperations(data, options = {}) {
  const now = options.now instanceof Date
    ? options.now.getTime()
    : Number.isFinite(Number(options.now))
      ? Number(options.now)
      : Date.now();

  const current = validPrice(data?.price?.current);
  const priceUpdatedRaw = data?.priceUpdated ?? data?.price?.checkedAt;
  const priceAgeDays = ageInDays(priceUpdatedRaw, now);
  const affiliateUrl = data?.affiliate?.url ?? data?.price?.affiliateUrl ?? data?.productUrl;
  const affiliateAvailable = hasHttpsUrl(affiliateUrl);
  const availability = inferInitialAvailability(data, now);
  const consciousUnavailable = isConsciouslyUnavailable(availability);
  const archivedAvailability = isArchivedAvailability(availability);
  const missingRequiredFields = requiredFieldIssues(data);

  let priceState = choice(data?.priceState, PRICE_STATE_VALUES, null);
  if (!priceState) {
    priceState = current != null
      ? priceAgeDays != null && priceAgeDays > 90 ? "stale" : "available"
      : "unknown";
  }
  if (priceState === "available" && current == null) priceState = "unknown";
  if (priceState === "stale" && current == null) priceState = "unknown";

  const priceAvailable = current != null && priceState !== "removed";
  const warnings = [];

  if (!consciousUnavailable) {
    if (!priceAvailable && priceState !== "removed") warnings.push("Preis fehlt");
    if (!affiliateAvailable) warnings.push("Affiliate fehlt");
    if (availability === "unknown") warnings.push("Verfügbarkeit unbekannt");
    if (priceAvailable && priceAgeDays != null && priceAgeDays > 90) warnings.push("Preis älter als 90 Tage");
    if (missingRequiredFields.length) warnings.push(`Pflichtfelder fehlen: ${missingRequiredFields.join(", ")}`);
  }

  const manuallyArchived = data?.maintenanceStatus === "archived" || data?.recommendationStatus === "archived";
  if (manuallyArchived) warnings.length = 0;
  let maintenanceStatus;
  if (archivedAvailability || manuallyArchived) {
    maintenanceStatus = "archived";
  } else if (consciousUnavailable) {
    maintenanceStatus = "complete";
  } else if (
    !priceAvailable ||
    !affiliateAvailable ||
    availability === "unknown" ||
    missingRequiredFields.length > 0
  ) {
    maintenanceStatus = "required";
  } else if (priceAgeDays != null && priceAgeDays > 90) {
    maintenanceStatus = "recommended";
  } else {
    maintenanceStatus = "complete";
  }

  let editorialStatus;
  if (maintenanceStatus === "archived") {
    editorialStatus = "archived";
  } else if (missingRequiredFields.length) {
    editorialStatus = "required";
  } else {
    editorialStatus = choice(data?.editorialStatus, EDITORIAL_STATUS_VALUES, "complete");
    if (editorialStatus === "archived" && !manuallyArchived) editorialStatus = "complete";
  }

  let recommendationStatus;
  if (archivedAvailability || manuallyArchived) {
    recommendationStatus = "archived";
  } else if (availability !== "available" || !affiliateAvailable || !priceAvailable) {
    recommendationStatus = "limited";
  } else {
    recommendationStatus = "recommended";
  }

  const isTask = maintenanceStatus === "required" || maintenanceStatus === "recommended";
  const isArchive = maintenanceStatus === "archived" || consciousUnavailable;
  const priorityRank = !isTask
    ? 1000
    : maintenanceStatus === "required"
      ? (!priceAvailable ? 0 : !affiliateAvailable ? 10 : availability === "unknown" ? 20 : missingRequiredFields.length ? 30 : 40)
      : 100;

  const priceUpdatedValue = dateValue(priceUpdatedRaw);
  const priceUpdated = priceUpdatedValue != null
    ? new Date(priceUpdatedValue).toISOString()
    : undefined;
  const availabilityUpdatedRaw = data?.availabilityUpdated ?? (
    availability === "available" && priceUpdated ? priceUpdated : undefined
  );
  const availabilityUpdated = availabilityUpdatedRaw && dateValue(availabilityUpdatedRaw) != null
    ? new Date(dateValue(availabilityUpdatedRaw)).toISOString()
    : undefined;

  return {
    current,
    currency: /^[A-Z]{3}$/.test(String(data?.price?.currency || "EUR")) ? String(data?.price?.currency || "EUR") : "EUR",
    formattedPrice: formatPrice(current, data?.price?.currency || "EUR"),
    priceUpdated,
    priceAgeDays,
    priceAvailable,
    priceState,
    affiliateAvailable,
    affiliateUrl: affiliateAvailable ? String(affiliateUrl) : null,
    availability,
    availabilityLabel: AVAILABILITY_LABELS[availability],
    availabilityReason: text(data?.availabilityReason) || undefined,
    availabilityUpdated,
    editorialStatus,
    recommendationStatus,
    maintenanceStatus,
    maintenanceLabel: STATUS_LABELS[maintenanceStatus],
    recommendationLabel: STATUS_LABELS[recommendationStatus] ?? recommendationStatus,
    warnings,
    missingRequiredFields,
    consciouslyUnavailable: consciousUnavailable,
    archived: maintenanceStatus === "archived",
    isArchive,
    isTask,
    priorityRank,
    purchasable: availability === "available" && affiliateAvailable,
    autoRecommendationEligible: availability === "available" && recommendationStatus !== "archived"
  };
}

export function operationFieldsFrom(data, options = {}) {
  const operations = deriveProductOperations(data, options);
  return {
    priceState: operations.priceState,
    priceUpdated: operations.priceUpdated,
    priceAvailable: operations.priceAvailable,
    affiliateAvailable: operations.affiliateAvailable,
    availability: operations.availability,
    availabilityReason: operations.availabilityReason,
    availabilityUpdated: operations.availabilityUpdated,
    editorialStatus: operations.editorialStatus,
    recommendationStatus: operations.recommendationStatus,
    maintenanceStatus: operations.maintenanceStatus
  };
}

export function recommendationTieBreaker(data) {
  const operations = deriveProductOperations(data);
  return (
    (operations.priceAvailable ? 4 : 0) +
    (operations.affiliateAvailable ? 3 : 0) +
    (operations.availability === "available" ? 5 : 0) +
    (operations.recommendationStatus === "recommended" ? 2 : 0)
  );
}

export function compareMaintenanceRows(left, right) {
  return (
    Number(left?.operations?.priorityRank ?? 1000) - Number(right?.operations?.priorityRank ?? 1000) ||
    Number(right?.operations?.priceAgeDays ?? -1) - Number(left?.operations?.priceAgeDays ?? -1) ||
    String(left?.title || "").localeCompare(String(right?.title || ""), "de")
  );
}

export function buildOperationsDashboard(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const count = (predicate) => list.filter(predicate).length;
  const total = list.length;
  const complete = count((row) => ["complete", "archived"].includes(row.operations?.maintenanceStatus));

  return {
    products: total,
    missingPrice: count((row) => !row.operations?.priceAvailable && !row.operations?.consciouslyUnavailable && !row.operations?.archived),
    missingAffiliate: count((row) => !row.operations?.affiliateAvailable && !row.operations?.consciouslyUnavailable && !row.operations?.archived),
    unknownAvailability: count((row) => row.operations?.availability === "unknown"),
    discontinued: count((row) => row.operations?.availability === "discontinued"),
    unavailable: count((row) => ["temporarily-unavailable", "out-of-stock"].includes(row.operations?.availability)),
    stale30: count((row) => row.operations?.priceAgeDays != null && row.operations.priceAgeDays > 30),
    stale90: count((row) => row.operations?.priceAgeDays != null && row.operations.priceAgeDays > 90),
    maintenanceRequired: count((row) => row.operations?.maintenanceStatus === "required"),
    maintenanceRecommended: count((row) => row.operations?.maintenanceStatus === "recommended"),
    archived: count((row) => row.operations?.maintenanceStatus === "archived"),
    maintenanceRate: total ? Math.round((complete / total) * 1000) / 10 : 100
  };
}

export function toOperationsRecord(data, options = {}) {
  const operations = deriveProductOperations(data, options);
  return {
    slug: String(data?.slug || ""),
    title: String(data?.title || data?.slug || "Produkt"),
    category: String(data?.category?.label ?? data?.category?.key ?? "Unbekannt"),
    manufacturerName: String(data?.manufacturer?.name ?? data?.manufacturer ?? ""),
    manufacturerSlug: String(data?.manufacturer?.slug ?? data?.manufacturer?.key ?? ""),
    manufacturerKey: String(data?.manufacturer?.key ?? data?.manufacturer?.slug ?? ""),
    score: (() => {
      const explicit = Number(data?.score);
      if (Number.isFinite(explicit)) return explicit;
      const rating = Number(data?.rating);
      return Number.isFinite(rating) ? Math.round(rating * 20) : 0;
    })(),
    sourceLabel: String(data?.price?.source?.label || "Nicht angegeben"),
    comparisonText: String(data?.price?.comparisonText || ""),
    currency: operations.currency,
    current: operations.current,
    formattedCurrent: operations.formattedPrice,
    targetUrl: operations.affiliateUrl,
    ...operations
  };
}

export function createKeyedSerialExecutor() {
  const queues = new Map();
  return async function run(key, task) {
    const normalizedKey = String(key);
    const previous = queues.get(normalizedKey) ?? Promise.resolve();
    const current = previous.catch(() => undefined).then(task);
    queues.set(normalizedKey, current);
    try {
      return await current;
    } finally {
      if (queues.get(normalizedKey) === current) queues.delete(normalizedKey);
    }
  };
}

export function createInFlightDeduper() {
  const inFlight = new Map();
  return function dedupe(key, task) {
    const normalizedKey = String(key);
    if (inFlight.has(normalizedKey)) return inFlight.get(normalizedKey);
    const promise = Promise.resolve().then(task).finally(() => {
      if (inFlight.get(normalizedKey) === promise) inFlight.delete(normalizedKey);
    });
    inFlight.set(normalizedKey, promise);
    return promise;
  };
}

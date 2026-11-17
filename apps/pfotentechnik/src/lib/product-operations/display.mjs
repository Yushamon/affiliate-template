// Browser-safe display and metric calculations. No product evaluation or Node imports.
export const AVAILABILITY_LABELS = Object.freeze({
  available: "Verfügbar",
  "temporarily-unavailable": "Vorübergehend nicht verfügbar",
  "out-of-stock": "Aktuell nicht lieferbar",
  discontinued: "Eingestellt",
  unknown: "Unbekannt"
});

export function formatPrice(value, currency = "EUR") {
  const raw=Number(value);const number=Number.isFinite(raw)&&raw>0?Math.round(raw*100)/100:null;
  if (number == null) return null;
  return new Intl.NumberFormat("de-DE", {
    style: "currency",
    currency: /^[A-Z]{3}$/.test(currency) ? currency : "EUR"
  }).format(number);
}

export function buildOperationsDashboard(rows) {
  const list = Array.isArray(rows) ? rows : [];
  const count = (predicate) => list.filter(predicate).length;
  const total = list.length;
  const complete = count((row) => ["complete", "archived"].includes(row.operations?.maintenanceStatus));

  return {
    products: total,
    decisionQualityIssues: count(row => row.operations?.decisionQuality?.insufficientEvidence || row.operations?.decisionQuality?.uncertainValues > 0),
    missingPrice: count((row) => !row.operations?.priceAvailable && !row.operations?.editorialPriceControl && !row.operations?.consciouslyUnavailable && !row.operations?.archived),
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

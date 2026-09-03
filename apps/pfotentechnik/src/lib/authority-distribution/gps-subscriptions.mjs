import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

export const SNAPSHOT_SCHEMA_VERSION = 2;
export const FINDING_TYPE = "gps-subscription-requirement";
export const DEFAULT_STALE_DAYS = 120;

const ISO_DATE = /^\d{4}-\d{2}-\d{2}(?:T.*)?$/;
const STATUS_VALUES = new Set(["required", "optional", "none", "unknown"]);

const iso = (value) => {
  if (value instanceof Date && !Number.isNaN(value.valueOf())) return value.toISOString();
  if (typeof value === "string" && ISO_DATE.test(value) && !Number.isNaN(Date.parse(value))) {
    return new Date(value).toISOString();
  }
  return null;
};

const daysBetween = (older, newer) =>
  Math.floor((Date.parse(newer) - Date.parse(older)) / 86_400_000);

const stable = (value) => {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, stable(child)]));
  }
  return value;
};

const hash = (value) => crypto.createHash("sha256")
  .update(JSON.stringify(stable(value)))
  .digest("hex");

export function splitFrontmatter(source, file = "product") {
  const match = String(source).replace(/^\uFEFF/, "").match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${file}: gültiges YAML-Frontmatter fehlt.`);
  return match[1];
}

export async function loadGpsProducts(productDirectory) {
  const names = (await fs.readdir(productDirectory))
    .filter((name) => /\.mdx?$/i.test(name))
    .sort((a, b) => a.localeCompare(b));
  const products = [];
  for (const name of names) {
    const file = path.join(productDirectory, name);
    const data = yaml.load(splitFrontmatter(await fs.readFile(file, "utf8"), file)) ?? {};
    if (data?.category?.key === "gps-tracker") products.push({ ...data, sourceFile: file });
  }
  return products;
}

function subscriptionStatus(product) {
  const structured = product?.subscription?.status;
  if (["required-subscription", "required-prepaid", "service-included"].includes(structured)) return "required";
  if (structured === "optional-subscription") return "optional";
  if (structured === "no-subscription") return "none";
  if (structured === "unknown") return "unknown";
  const value = product?.gps?.subscriptionRequired;
  if (value === true) return "required";
  if (value === false) return "none";
  return "unknown";
}

function sourceType(source) {
  const text = `${source?.source ?? ""} ${source?.url ?? ""}`.toLowerCase();
  if (/support|hersteller|store\.|shop\.|garmin|tractive|weenect|pawfit|prothelis|invoxia|enabot|paj/.test(text)) return "manufacturer";
  return "unknown";
}

function sourceSupportsSubscription(source) {
  const fields = Array.isArray(source?.fields) ? source.fields.map(String) : [];
  const assertion = String(source?.assertion ?? "");
  return fields.includes("subscription") || fields.includes("gps") || (/abo|abonnement|subscription|tarif|servicepaket|sim/i.test(assertion) && fields.includes("specs"));
}

function evidenceFor(product, generatedAt, staleDays) {
  const structured = product?.subscription;
  const subscriptionSource = structured?.source ? [{
    source: structured.provider,
    url: structured.source,
    accessedAt: structured.checkedAt ?? structured.researchedAt,
    fields: ["subscription"],
    assertion: "Servicemodell und Tarifdaten aus der strukturierten Herstellerrecherche."
  }] : [];
  const candidates = [...subscriptionSource, ...(Array.isArray(product?.evidenceSources) ? product.evidenceSources : [])];
  return candidates
    .filter((source) => typeof source?.url === "string" && /^https:\/\//.test(source.url))
    .filter((source) => sourceSupportsSubscription(source))
    .map((source) => {
      const checkedAt = iso(source.accessedAt);
      const stale = !checkedAt || daysBetween(checkedAt, generatedAt) > staleDays;
      return {
        source: String(source.source ?? "").trim(),
        url: source.url,
        sourceType: sourceType(source),
        checkedAt,
        confidence: checkedAt && source.source && !stale ? "high" : "low",
        supports: Array.isArray(source.fields) ? source.fields.map(String) : [],
        assertion: String(source.assertion ?? "").trim(),
        stale,
      };
    })
    .filter((item, index, values) => values.findIndex((candidate) => candidate.url === item.url && candidate.checkedAt === item.checkedAt) === index);
}

function normalizedPlan(plan, stale) {
  return {
    name: String(plan?.name ?? ""),
    billingPeriod: String(plan?.billingPeriod ?? "unknown"),
    commitmentMonths: Number.isFinite(Number(plan?.commitmentMonths)) ? Number(plan.commitmentMonths) : null,
    billingMode: String(plan?.billingMode ?? "unknown"),
    price: typeof plan?.price === "number" && !stale ? plan.price : null,
    currency: typeof plan?.price === "number" && !stale ? String(plan?.currency ?? "EUR") : null,
    effectiveMonthlyPrice: typeof plan?.effectiveMonthlyPrice === "number" && !stale ? plan.effectiveMonthlyPrice : null,
    autoRenew: typeof plan?.autoRenew === "boolean" ? plan.autoRenew : null,
    featured: plan?.featured === true,
    notes: String(plan?.notes ?? "") || null,
    stale,
  };
}

export function normalizeGpsProduct(product, { generatedAt = new Date().toISOString(), staleDays = DEFAULT_STALE_DAYS } = {}) {
  const normalizedGeneratedAt = iso(generatedAt);
  if (!normalizedGeneratedAt) throw new Error("generatedAt muss ein gültiges ISO-Datum sein.");
  const status = subscriptionStatus(product);
  const evidence = evidenceFor(product, normalizedGeneratedAt, staleDays);
  const structured = product?.subscription;
  const researchedAt = iso(structured?.checkedAt ?? structured?.researchedAt);
  const structuredStale = structured ? !researchedAt || daysBetween(researchedAt, normalizedGeneratedAt) > staleDays : false;
  const plans = Array.isArray(structured?.plans) ? structured.plans.map((plan) => normalizedPlan(plan, structuredStale)) : [];
  const featuredPlan = plans.find((plan) => plan.featured && plan.price !== null) ?? plans.find((plan) => plan.price !== null) ?? null;
  const reasons = [];
  if (!String(product?.slug ?? "").trim()) reasons.push("missing-slug");
  if (product?.productStatus !== "active") reasons.push(`product-not-active:${product?.productStatus ?? "unknown"}`);
  if (status === "unknown") reasons.push("subscription-status-unknown");
  if (!evidence.length) reasons.push("subscription-evidence-missing");
  if (evidence.length && evidence.every((item) => item.stale)) reasons.push("subscription-evidence-stale");

  const usableEvidence = evidence.filter((item) => !item.stale);
  return {
    product: String(product?.title ?? product?.slug ?? "Unbekannt"),
    slug: String(product?.slug ?? "").trim(),
    productUrl: String(product?.productUrl ?? (product?.slug ? `/produkt/${product.slug}/` : "")),
    manufacturer: {
      key: String(product?.manufacturer?.key ?? ""),
      name: String(product?.manufacturer?.name ?? ""),
      slug: String(product?.manufacturer?.slug ?? ""),
    },
    productStatus: String(product?.productStatus ?? "unknown"),
    dataUpdatedAt: iso(product?.updatedAt),
    subscription: {
      status,
      modelStatus: String(structured?.status ?? (status === "required" ? "required-subscription" : status === "none" ? "no-subscription" : "unknown")),
      requiredForCoreFunction: typeof structured?.requiredForCoreFunction === "boolean" ? structured.requiredForCoreFunction : status === "required" ? true : status === "none" ? false : null,
      serviceType: String(structured?.serviceType ?? product?.gps?.transmission ?? "unknown"),
      serviceModel: String(structured?.serviceModel ?? "unknown"),
      provider: String(structured?.provider ?? product?.manufacturer?.name ?? ""),
      researchedAt,
      source: structured?.source ?? null,
      plans,
      price: featuredPlan
        ? { value: featuredPlan.price, currency: featuredPlan.currency, interval: featuredPlan.billingPeriod, billingMode: featuredPlan.billingMode, unknown: false }
        : { value: null, currency: null, interval: null, billingMode: null, unknown: true },
    },
    evidence: usableEvidence,
    eligible: reasons.length === 0,
    exclusionReasons: reasons,
  };
}

function assertUnique(products) {
  const seen = new Set();
  for (const product of products) {
    if (!product.slug) throw new Error("Produkt ohne Slug kann nicht aggregiert werden.");
    if (seen.has(product.slug)) throw new Error(`Doppeltes GPS-Produkt: ${product.slug}`);
    seen.add(product.slug);
  }
}

const pct = (count, denominator) => denominator ? Number((count / denominator * 100).toFixed(1)) : null;

function findingStatement(counts) {
  const plural = counts.eligible === 1 ? "GPS-Produkt" : "GPS-Produkten";
  return `${counts.required} von ${counts.eligible} auswertbaren ${plural} in der aktuellen PfotenTechnik-Auswahl benötigen einen kostenpflichtigen Ortungsdienst; ${counts.none} kommen ohne Pflichtdienst aus und ${counts.optional} führen einen optionalen Dienst.`;
}

function snapshotContent(snapshot) {
  const { generatedAt: _findingGeneratedAt, status: _findingStatus, ...finding } = snapshot.finding;
  return {
    schemaVersion: snapshot.schemaVersion,
    dataUpdatedAt: snapshot.dataUpdatedAt,
    population: snapshot.population,
    products: snapshot.products,
    finding,
  };
}

function comparisonRows(snapshot) {
  return new Map((snapshot?.products ?? []).map((product) => [product.slug, {
    status: product.subscription?.status,
    modelStatus: product.subscription?.modelStatus,
    serviceModel: product.subscription?.serviceModel,
    price: product.subscription?.price,
    eligible: product.eligible,
    evidence: (product.evidence ?? []).map((item) => `${item.url}|${item.checkedAt}|${item.confidence}`).sort(),
  }]));
}

export function detectChanges(previous, current) {
  if (!previous?.products) return null;
  const before = comparisonRows(previous);
  const after = comparisonRows(current);
  const changes = [];
  for (const slug of [...new Set([...before.keys(), ...after.keys()])].sort()) {
    const oldValue = before.get(slug);
    const newValue = after.get(slug);
    if (!oldValue) changes.push({ type: "product-added", slug, after: newValue });
    else if (!newValue) changes.push({ type: "product-removed", slug, before: oldValue });
    else {
      if (oldValue.status !== newValue.status) changes.push({ type: "subscription-status-changed", slug, before: oldValue.status, after: newValue.status });
      if (oldValue.eligible !== newValue.eligible) changes.push({ type: oldValue.eligible ? "product-excluded" : "unknown-or-evidence-resolved", slug, before: oldValue.eligible, after: newValue.eligible });
      if (JSON.stringify(oldValue.evidence) !== JSON.stringify(newValue.evidence)) changes.push({ type: "evidence-changed", slug, before: oldValue.evidence, after: newValue.evidence });
    }
  }
  if (!changes.length) return null;
  return {
    type: "gps-subscription-data-changed",
    generatedAt: current.generatedAt,
    previousSnapshotVersion: previous.snapshotVersion ?? null,
    snapshotVersion: current.snapshotVersion,
    changes,
  };
}

export function validateSnapshot(snapshot) {
  const errors = [];
  const { counts } = snapshot.population;
  const eligible = snapshot.products.filter((product) => product.eligible);
  try { assertUnique(snapshot.products); } catch (error) { errors.push(error.message); }
  if (counts.eligible === 0) errors.push("eligible = 0");
  if (counts.required + counts.optional + counts.none !== counts.eligible) errors.push("Statussumme entspricht nicht eligible");
  if (eligible.some((product) => product.subscription.status === "unknown")) errors.push("Unknown-Status in eligible");
  if (eligible.some((product) => !product.evidence.length)) errors.push("Evidence fehlt für eligible Produkt");
  if (snapshot.population.percentages.required !== pct(counts.required, counts.eligible)) errors.push("requiredPct passt nicht zum Nenner");
  if (snapshot.population.percentages.withoutMandatorySubscription !== pct(counts.none + counts.optional, counts.eligible)) errors.push("withoutMandatorySubscriptionPct passt nicht zum Nenner");
  if (snapshot.finding.statement !== findingStatement(counts)) errors.push("Statement passt nicht zu den Zahlen");
  if (snapshot.finding.eligible !== counts.eligible || snapshot.finding.excluded !== counts.excluded) errors.push("Finding-Population passt nicht zum Snapshot");
  return { passed: errors.length === 0, blocked: errors.length > 0, errors };
}

export function evaluatePublicationGate(snapshot) {
  const technicalReasons = snapshot.validation.passed ? [] : [...snapshot.validation.errors];
  const domainReasons = [];
  const { counts } = snapshot.population;
  if (snapshot.finding.confidence !== "high") domainReasons.push("confidence-not-high");
  if (counts.eligible !== counts.total) domainReasons.push("population-not-fully-eligible");
  if (counts.unknown !== 0) domainReasons.push("subscription-status-unknown");
  if (snapshot.population.percentages.evidenceCoverage !== 100) domainReasons.push("evidence-coverage-below-100");
  if (snapshot.products.some((product) => product.eligible && product.subscription.serviceModel === "unknown")) {
    domainReasons.push("service-model-unknown");
  }
  return {
    status: technicalReasons.length ? "blocked" : domainReasons.length ? "needs-review" : "ready",
    technicalReasons,
    domainReasons,
  };
}

export function buildSnapshotFromNormalized(normalizedProducts, { generatedAt = new Date().toISOString(), previousSnapshot = null } = {}) {
  const normalizedGeneratedAt = iso(generatedAt);
  if (!normalizedGeneratedAt) throw new Error("generatedAt muss ein gültiges ISO-Datum sein.");
  const normalized = structuredClone(normalizedProducts).sort((a, b) => a.slug.localeCompare(b.slug));
  assertUnique(normalized);
  const eligible = normalized.filter((product) => product.eligible);
  const counts = {
    total: normalized.length,
    eligible: eligible.length,
    excluded: normalized.length - eligible.length,
    unknown: normalized.filter((product) => product.subscription.status === "unknown").length,
    required: eligible.filter((product) => product.subscription.status === "required").length,
    optional: eligible.filter((product) => product.subscription.status === "optional").length,
    none: eligible.filter((product) => product.subscription.status === "none").length,
  };
  const serviceModels = {
    requiredSubscription: eligible.filter((product) => product.subscription.modelStatus === "required-subscription").length,
    requiredPrepaid: eligible.filter((product) => product.subscription.modelStatus === "required-prepaid").length,
    prepaidCapable: eligible.filter((product) => product.subscription.serviceModel === "prepaid" || product.subscription.serviceModel === "subscription-or-prepaid").length,
    currentPriceKnown: eligible.filter((product) => product.subscription.price?.unknown === false).length,
  };
  const dates = normalized.map((product) => product.dataUpdatedAt).filter(Boolean).sort();
  const dataUpdatedAt = dates.at(-1) ?? null;
  const statement = findingStatement(counts);
  const snapshot = {
    schemaVersion: SNAPSHOT_SCHEMA_VERSION,
    snapshotVersion: null,
    generatedAt: normalizedGeneratedAt,
    dataUpdatedAt,
    population: {
      category: "gps-tracker",
      definition: "Aktive GPS-Produkte der PfotenTechnik Product Collection mit strukturiertem Servicemodell (Legacy-Fallback: gps.subscriptionRequired) und aktueller Evidence.",
      counts,
      serviceModels,
      percentages: {
        evidenceCoverage: pct(counts.eligible, counts.total),
        required: pct(counts.required, counts.eligible),
        withoutMandatorySubscription: pct(counts.none + counts.optional, counts.eligible),
      },
    },
    products: normalized,
    finding: {
      type: FINDING_TYPE,
      generatedAt: normalizedGeneratedAt,
      dataUpdatedAt,
      population: counts.total,
      eligible: counts.eligible,
      excluded: counts.excluded,
      required: counts.required,
      optional: counts.optional,
      none: counts.none,
      statement,
      methodology: "Primär wird subscription.status einschließlich Prepaid-/Abo-Trennung gelesen; gps.subscriptionRequired bleibt nur als rückwärtskompatibler Fallback. Freitext wird nicht in Statuswerte umgewandelt. Eligible sind nur aktive Produkte mit explizitem Status und aktueller Evidence; Unknown oder unzureichende Evidence bleiben außerhalb des belastbaren Nenners.",
      confidence: eligible.length === normalized.length && eligible.every((product) => product.evidence.some((item) => item.confidence === "high"))
        ? "high"
        : eligible.length / Math.max(1, normalized.length) >= 0.7
          ? "medium"
          : "low",
      status: "candidate",
    },
  };
  snapshot.snapshotVersion = hash(snapshotContent(snapshot)).slice(0, 16);
  snapshot.changeFinding = detectChanges(previousSnapshot, snapshot);
  snapshot.validation = validateSnapshot(snapshot);
  snapshot.publicationGate = evaluatePublicationGate(snapshot);
  snapshot.finding.status = snapshot.publicationGate.status;
  return snapshot;
}

export function buildGpsSubscriptionSnapshot(products, { generatedAt = new Date().toISOString(), staleDays = DEFAULT_STALE_DAYS, previousSnapshot = null } = {}) {
  const normalizedGeneratedAt = iso(generatedAt);
  if (!normalizedGeneratedAt) throw new Error("generatedAt muss ein gültiges ISO-Datum sein.");
  const normalized = products.map((product) => normalizeGpsProduct(product, { generatedAt: normalizedGeneratedAt, staleDays }));
  return buildSnapshotFromNormalized(normalized, { generatedAt: normalizedGeneratedAt, previousSnapshot });
}

export function renderGpsSubscriptionMarkdown(snapshot) {
  const included = snapshot.products.filter((product) => product.eligible);
  const excluded = snapshot.products.filter((product) => !product.eligible);
  const evidence = (product) => product.evidence.length
    ? product.evidence.map((item) => `[${item.source}](${item.url}) · geprüft ${item.checkedAt?.slice(0, 10) ?? "unbekannt"} · ${item.confidence}`).join("; ")
    : "Keine ausreichende strukturierte Evidence";
  const statusLabel = { required: "required", optional: "optional", none: "none", unknown: "unknown" };
  return [
    "# GPS-Abo Data Asset", "",
    `- Snapshot-Version: \`${snapshot.snapshotVersion}\``,
    `- Erzeugt: ${snapshot.generatedAt}`,
    `- Datenstand: ${snapshot.dataUpdatedAt ?? "unbekannt"}`,
    `- Validation Gate: ${snapshot.validation.passed ? "bestanden" : "BLOCKED"}`, "",
    `- Publication Gate: ${snapshot.publicationGate.status}`,
    `- Technische Gate-Gründe: ${snapshot.publicationGate.technicalReasons.join(", ") || "keine"}`,
    `- Fachliche Gate-Gründe: ${snapshot.publicationGate.domainReasons.join(", ") || "keine"}`, "",
    "## Kernaussage", "", snapshot.finding.statement, "",
    `Pflichtdienst-Anteil: ${snapshot.population.percentages.required ?? "–"} %. Anteil ohne Pflichtdienst: ${snapshot.population.percentages.withoutMandatorySubscription ?? "–"} %. Nenner sind ausschließlich ${snapshot.population.counts.eligible} auswertbare Produkte.`, "",
    "## Population", "",
    `- GPS-Produkte gesamt: ${snapshot.population.counts.total}`,
    `- Auswertbar: ${snapshot.population.counts.eligible}`,
    `- Ausgeschlossen: ${snapshot.population.counts.excluded}`,
    `- Evidence-Abdeckung: ${snapshot.population.percentages.evidenceCoverage ?? "–"} %`,
    `- Status unknown: ${snapshot.population.counts.unknown}`,
    `- required: ${snapshot.population.counts.required}`,
    `- optional: ${snapshot.population.counts.optional}`,
    `- none: ${snapshot.population.counts.none}`, "",
    "### Servicemodell", "",
    `- required-subscription: ${snapshot.population.serviceModels?.requiredSubscription ?? 0}`,
    `- required-prepaid: ${snapshot.population.serviceModels?.requiredPrepaid ?? 0}`,
    `- Prepaid-fähig (inklusive Mischmodell): ${snapshot.population.serviceModels?.prepaidCapable ?? 0}`,
    `- aktueller strukturierter Tarifpreis vorhanden: ${snapshot.population.serviceModels?.currentPriceKnown ?? 0}`, "",
    "## Methodik", "", snapshot.finding.methodology, "",
    "Abo-Preise werden ausschließlich aus dem strukturierten `subscription.plans`-Modell gelesen, niemals aus `specs` oder anderem Freitext. Veraltete oder fehlende Tarifpreise bleiben ausdrücklich unknown. Herstellerangaben werden nicht als PfotenTechnik-Test ausgegeben.", "",
    "## Eingeschlossene Produkte", "",
    ...(included.length ? included.map((product) => `- **${product.product}** (\`${product.slug}\`) · ${statusLabel[product.subscription.status]} / ${product.subscription.modelStatus} · ${product.subscription.price.unknown ? "Preis unbekannt" : `${product.subscription.price.value} ${product.subscription.price.currency} (${product.subscription.price.billingMode})`} · ${evidence(product)}`) : ["Keine."]), "",
    "## Ausgeschlossene Produkte", "",
    ...(excluded.length ? excluded.map((product) => `- **${product.product}** (\`${product.slug}\`) · Status ${statusLabel[product.subscription.status]} · Grund: ${product.exclusionReasons.join(", ")} · ${evidence(product)}`) : ["Keine."]), "",
    "## Change Detection", "",
    snapshot.changeFinding ? `Änderung erkannt: ${snapshot.changeFinding.changes.length} Change(s) gegenüber Snapshot \`${snapshot.changeFinding.previousSnapshotVersion ?? "unbekannt"}\`.` : "Kein Change Finding: kein vorheriger Snapshot oder keine tatsächliche Datenänderung.", "",
    "## Bekannte Grenzen", "",
    "- Die Population ist die PfotenTechnik-Auswahl, nicht der vollständige deutsche Markt.",
    "- Ein vorhandener Boolean ohne passende strukturierte Evidence bleibt ausgeschlossen.",
    "- `false` bedeutet explizit kein Pflichtabo; missing/unknown wird niemals zu `false`.",
    "- TCO und Tarifvergleiche dürfen nur aus aktuellen strukturierten Plänen berechnet werden.",
    `- Das Finding ist \`${snapshot.finding.status}\`; \`ready\` bestätigt Daten- und Methodikreife, löst aber keine automatische Veröffentlichung aus.`, "",
  ].join("\n");
}

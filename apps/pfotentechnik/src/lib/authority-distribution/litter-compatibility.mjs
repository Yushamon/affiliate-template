import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import yaml from "js-yaml";

export const LITTER_READY_THRESHOLD = 80;
const stable = (value) => Array.isArray(value) ? value.map(stable) : value && typeof value === "object"
  ? Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([key, child]) => [key, stable(child)]))
  : value;
const hash = (value) => crypto.createHash("sha256").update(JSON.stringify(stable(value))).digest("hex").slice(0, 16);
const pct = (value, total) => total ? Number((value / total * 100).toFixed(1)) : 0;

export function splitFrontmatter(source, file = "product") {
  const match = String(source).replace(/^\uFEFF/, "").match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`${file}: gültiges YAML-Frontmatter fehlt.`);
  return match[1];
}

export async function loadLitterProducts(productDirectory) {
  const names = (await fs.readdir(productDirectory)).filter((name) => /\.mdx?$/i.test(name)).sort();
  const products = [];
  for (const name of names) {
    const data = yaml.load(splitFrontmatter(await fs.readFile(path.join(productDirectory, name), "utf8"), name)) ?? {};
    if (data?.category?.key === "automatische-katzentoiletten" && data?.productStatus === "active") products.push(data);
  }
  return products;
}

export function normalizeLitterProduct(product) {
  const compatibility = product?.litterCompatibility ?? {};
  const evidence = Array.isArray(compatibility.evidence) ? compatibility.evidence.map((item) => ({
    source: String(item?.source ?? ""), url: String(item?.url ?? ""), sourceType: String(item?.sourceType ?? ""),
    verifiedAt: item?.verifiedAt instanceof Date ? item.verifiedAt.toISOString().slice(0, 10) : String(item?.verifiedAt ?? ""),
    assertion: String(item?.assertion ?? ""),
  })) : [];
  return {
    product: String(product?.title ?? product?.slug ?? "Unbekannt"),
    slug: String(product?.slug ?? ""),
    productUrl: String(product?.productUrl ?? (product?.slug ? `/produkt/${product.slug}/` : "")),
    status: String(compatibility.status ?? "unknown"),
    compatibleTypes: Array.isArray(compatibility.compatibleTypes) ? compatibility.compatibleTypes : [],
    conditionalTypes: Array.isArray(compatibility.conditionalTypes) ? compatibility.conditionalTypes : [],
    incompatibleTypes: Array.isArray(compatibility.incompatibleTypes) ? compatibility.incompatibleTypes : [],
    clumpingRequirement: String(compatibility.clumpingRequirement ?? "unknown"),
    grainSize: compatibility.grainSize ?? null,
    unknowns: compatibility.status === "unknown" ? ["compatibility"] : [],
    notes: Array.isArray(compatibility.notes) ? compatibility.notes : [],
    researchedAt: compatibility.researchedAt instanceof Date ? compatibility.researchedAt.toISOString().slice(0, 10) : String(compatibility.researchedAt ?? ""),
    evidence,
  };
}

export function validateLitterSnapshot(snapshot) {
  const errors = [];
  const slugs = snapshot.products.map((product) => product.slug);
  if (new Set(slugs).size !== slugs.length) errors.push("duplicate-product");
  if (snapshot.population.total === 0) errors.push("empty-population");
  for (const product of snapshot.products.filter((item) => item.status !== "unknown")) {
    if (!product.evidence.length) errors.push(`${product.slug}:evidence-missing`);
    if (product.evidence.some((item) => !item.source || !/^https:\/\//.test(item.url) || !item.sourceType || !item.verifiedAt || !item.assertion)) errors.push(`${product.slug}:evidence-incomplete`);
    if (![...product.compatibleTypes, ...product.conditionalTypes, ...product.incompatibleTypes].length) errors.push(`${product.slug}:classification-empty`);
  }
  return { passed: errors.length === 0, errors };
}

export function buildLitterCompatibilitySnapshot(products, { generatedAt = new Date().toISOString() } = {}) {
  const normalized = products.map(normalizeLitterProduct).sort((a, b) => a.slug.localeCompare(b.slug));
  const complete = normalized.filter((item) => item.status === "complete").length;
  const partial = normalized.filter((item) => item.status === "partial").length;
  const withEvidence = normalized.filter((item) => item.status !== "unknown" && item.evidence.length).length;
  const withoutEvidence = normalized.length - withEvidence;
  const population = { total: normalized.length, complete, partial, withEvidence, withoutEvidence, coverage: pct(withEvidence, normalized.length) };
  const snapshot = { schemaVersion: 1, snapshotVersion: null, generatedAt, population, products: normalized };
  const validation = validateLitterSnapshot(snapshot);
  const evidenceTraceable = normalized.filter((item) => item.status !== "unknown").every((item) => item.evidence.every((source) => source.url && source.verifiedAt && source.assertion));
  const publicationGate = {
    status: validation.passed && evidenceTraceable && population.coverage >= LITTER_READY_THRESHOLD ? "ready" : population.coverage >= 50 ? "needs-review" : "not-ready",
    threshold: LITTER_READY_THRESHOLD,
    coverage: population.coverage,
    evidenceTraceable,
    reasons: [],
  };
  if (!validation.passed) publicationGate.reasons.push("validation-failed");
  if (!evidenceTraceable) publicationGate.reasons.push("evidence-not-traceable");
  if (population.coverage < LITTER_READY_THRESHOLD) publicationGate.reasons.push("coverage-below-threshold");
  const eligible = normalized.filter((item) => item.status !== "unknown" && item.evidence.length);
  const clumpingRequired = eligible.filter((item) => item.clumpingRequirement === "required").length;
  const finding = publicationGate.status === "ready" ? {
    type: "automatic-litter-box-clumping-requirement",
    numerator: clumpingRequired,
    denominator: eligible.length,
    statement: `${clumpingRequired} von ${eligible.length} belastbar ausgewerteten automatischen Katzentoiletten verlangen klumpende Streu; proprietäre Kristallsysteme werden separat gezählt.`,
  } : null;
  snapshot.validation = validation;
  snapshot.publicationGate = publicationGate;
  snapshot.finding = finding;
  snapshot.snapshotVersion = hash({ ...snapshot, snapshotVersion: null, generatedAt: null });
  return snapshot;
}

export function renderLitterCompatibilityMarkdown(snapshot) {
  const list = (values) => values.length ? values.join(", ") : "–";
  return [
    "# Streukompatibilität automatischer Katzentoiletten", "",
    `- Snapshot: \`${snapshot.snapshotVersion}\``, `- Erzeugt: ${snapshot.generatedAt}`,
    `- Publication Gate: **${snapshot.publicationGate.status.toUpperCase()}**`,
    `- Coverage: ${snapshot.population.withEvidence}/${snapshot.population.total} (${snapshot.population.coverage} %)`,
    `- Evidence Traceability: ${snapshot.publicationGate.evidenceTraceable ? "PASS" : "FAIL"}`,
    `- Validation: ${snapshot.validation.passed ? "PASS" : "FAIL"}`, "",
    "## Belastbare Aggregate", "", snapshot.finding?.statement ?? "Kein Aggregate unterhalb des Publication Gate.", "",
    "## Modelle", "",
    ...snapshot.products.map((item) => [
      `### ${item.product}`, "",
      `- Status: ${item.status}`,
      `- Geeignet: ${list(item.compatibleTypes)}`,
      `- Bedingt: ${list(item.conditionalTypes)}`,
      `- Nicht geeignet: ${list(item.incompatibleTypes)}`,
      `- Klumpanforderung: ${item.clumpingRequirement}`,
      `- Korngröße: ${item.grainSize ? JSON.stringify(item.grainSize) : "nicht beziffert"}`,
      `- Unknowns: ${list(item.unknowns)}`,
      `- Evidence: ${item.evidence.length ? item.evidence.map((source) => `[${source.source}](${source.url}) · ${source.verifiedAt}`).join("; ") : "keine belastbare Herstellerquelle"}`, "",
    ].join("\n")),
  ].join("\n");
}

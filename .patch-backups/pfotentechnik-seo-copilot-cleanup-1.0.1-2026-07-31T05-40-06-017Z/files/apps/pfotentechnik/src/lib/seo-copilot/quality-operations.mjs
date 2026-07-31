import { createHash } from "node:crypto";

export const QUALITY_STATUSES = Object.freeze([
  "open",
  "in-progress",
  "fixed",
  "ignored",
  "snoozed",
  "waiting",
  "manual-review",
  "auto-fixed",
  "regression",
]);

export const QUALITY_SEVERITIES = Object.freeze(["critical", "error", "warning", "info"]);
const TERMINAL_STATUSES = new Set(["fixed", "auto-fixed"]);
const ACTIVE_STATUSES = new Set(["open", "in-progress", "snoozed", "waiting", "manual-review", "regression"]);
const SEVERITY_SCORE = { critical: 100, error: 85, warning: 55, info: 20 };

const clean = (value) => String(value ?? "")
  .replace(/(?:client_secret|refresh_token|access_token|api[_-]?key|authorization)\s*[:=]\s*\S+/gi, "[REDACTED]")
  .replace(/\b(?:ghp|github_pat|sk)-[A-Za-z0-9_-]{12,}\b/g, "[REDACTED]")
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ")
  .trim();
const unique = (values) => [...new Set(values.filter(Boolean).map(clean))];
const clamp = (value, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, Number(value) || 0));
const stableId = (value) => createHash("sha256").update(value).digest("hex").slice(0, 20);

export function normalizeSeverity(value, fallback = "warning") {
  const normalized = clean(value).toLowerCase();
  if (/critical|blocker|fatal|kritisch/.test(normalized)) return "critical";
  if (/error|fehler|high/.test(normalized)) return "error";
  if (/warn|medium|missing|review|stale/.test(normalized)) return "warning";
  if (/info|note|low|ok/.test(normalized)) return "info";
  return QUALITY_SEVERITIES.includes(fallback) ? fallback : "warning";
}

export function classifyQualityFinding(value = {}) {
  const text = clean([
    value.type,
    value.code,
    value.category,
    value.area,
    value.description,
    value.message,
    value.source,
  ].join(" ")).toLowerCase();
  if (/cannibal|duplicate intent|near.?duplicate/.test(text)) return { category: "content", area: "cannibalization" };
  if (/internal.?link|anchor|broken.?link|link.?target/.test(text)) return { category: "technical-seo", area: "internal-linking" };
  if (/redirect/.test(text)) return { category: "technical-seo", area: "redirects" };
  if (/canonical/.test(text)) return { category: "technical-seo", area: "canonicals" };
  if (/robots/.test(text)) return { category: "technical-seo", area: "robots" };
  if (/sitemap/.test(text)) return { category: "technical-seo", area: "sitemap" };
  if (/json.?ld/.test(text)) return { category: "structured-data", area: "json-ld" };
  if (/schema|structured.?data/.test(text)) return { category: "structured-data", area: "structured-data" };
  if (/accessib|a11y|aria|contrast/.test(text)) return { category: "experience", area: "accessibility" };
  if (/performance|viewport|lcp|cls|css.?budget|javascript/.test(text)) return { category: "experience", area: "performance" };
  if (/image|hero|media|visual/.test(text)) return { category: "media", area: "image-coverage" };
  if (/price|availability|angebot/.test(text)) return { category: "data-quality", area: "price-status" };
  if (/manufacturer|hersteller/.test(text)) return { category: "data-quality", area: "manufacturer-coverage" };
  if (/recommendation|empfehl/.test(text)) return { category: "content", area: "recommendation-conflicts" };
  if (/author|autor|eeat|e-e-a-t|trust|vertrauen|quelle/.test(text)) return { category: "trust", area: /author|autor/.test(text) ? "author-coverage" : "eeat" };
  if (/comparison|vergleich/.test(text)) return { category: "governance", area: "comparison-governance" };
  if (/product|produkt/.test(text)) return { category: "governance", area: "product-governance" };
  if (/build|release/.test(text)) return { category: "release", area: /release/.test(text) ? "release-gate" : "build" };
  if (/repository|repo/.test(text)) return { category: "engineering", area: "repository-audit" };
  if (/content|heading|meta|title|word/.test(text)) return { category: "content", area: "content-quality" };
  return {
    category: clean(value.category) || "quality",
    area: clean(value.area) || "technical-seo",
  };
}

export function calculateQualityPriority(input) {
  const severity = normalizeSeverity(input.severity);
  const releaseBlocker = Boolean(input.releaseBlocker) || severity === "critical";
  const rankingImpact = clamp(input.rankingImpact ?? (/seo|content|link|canonical|schema/.test(`${input.category} ${input.area}`) ? 70 : 45));
  const userImpact = clamp(input.userImpact ?? (/accessib|performance|broken|price/.test(`${input.area}`) ? 75 : 45));
  const technicalRisk = clamp(input.technicalRisk ?? (["critical", "error"].includes(severity) ? 85 : 45));
  const trustImpact = clamp(input.trustImpact ?? (/trust|eeat|author|price/.test(`${input.category} ${input.area}`) ? 80 : 35));
  const recurrenceProbability = clamp(input.recurrenceProbability ?? (input.previousOccurrences ? 75 : 40));
  const effort = clamp(input.effort ?? 50);
  const score = clamp(
    SEVERITY_SCORE[severity] * 0.18
    + rankingImpact * 0.22
    + userImpact * 0.16
    + (releaseBlocker ? 100 : 0) * 0.2
    + technicalRisk * 0.12
    + trustImpact * 0.07
    + recurrenceProbability * 0.08
    + (100 - effort) * 0.07,
  );
  return {
    score: Math.round(score),
    level: releaseBlocker || score >= 78 ? "high" : score >= 48 ? "medium" : "low",
    factors: { rankingImpact, userImpact, releaseBlocker, technicalRisk, trustImpact, recurrenceProbability, effort },
  };
}

export function normalizeQualityFinding(raw, { now = new Date().toISOString(), previous = null } = {}) {
  const source = clean(raw.source || "unknown-audit");
  const type = clean(raw.type || raw.code || "quality-finding");
  const description = clean(raw.description || raw.message || raw.reason || raw.title || type);
  const files = unique([...(Array.isArray(raw.files) ? raw.files : []), raw.file, raw.path, raw.sourceFile]);
  const urls = unique([...(Array.isArray(raw.urls) ? raw.urls : []), raw.url, raw.route, raw.page, raw.sourceRoute, raw.targetRoute]);
  const classified = classifyQualityFinding({ ...raw, source, type, description });
  const severity = normalizeSeverity(raw.severity || raw.level, "warning");
  const fingerprint = clean(raw.fingerprint) || [clean(raw.reportPath) || source, type, files.join("|"), urls.join("|"), description.toLowerCase()].join("::");
  const id = clean(raw.id) || `quality-${stableId(fingerprint)}`;
  const releaseBlocker = Boolean(raw.releaseBlocker) || severity === "critical" || (/release|build/.test(classified.area) && severity === "error");
  const confidence = clamp(raw.confidence ?? (severity === "info" ? 70 : 90), 0, 100);
  const priority = calculateQualityPriority({ ...raw, ...classified, severity, releaseBlocker });
  const previousStatus = QUALITY_STATUSES.includes(previous?.status) ? previous.status : null;
  const returnedAfterFix = previous && TERMINAL_STATUSES.has(previousStatus);
  const snoozeExpired = previousStatus === "snoozed"
    && previous?.snoozedUntil
    && new Date(previous.snoozedUntil).getTime() <= new Date(now).getTime();
  const status = returnedAfterFix ? "regression" : QUALITY_STATUSES.includes(raw.status)
    ? raw.status
    : previousStatus === "ignored" ? "ignored"
    : previousStatus && ACTIVE_STATUSES.has(previousStatus) && !snoozeExpired ? previousStatus
    : confidence < 60 || /manual.?review|redaktionell prüfen/i.test(`${type} ${raw.recommendedAction || raw.action || ""}`) ? "manual-review" : "open";
  const changed = previous && [
    previous.description !== description,
    previous.severity !== severity,
    previous.priority?.score !== priority.score,
    previous.status !== status,
    JSON.stringify(previous.files) !== JSON.stringify(files),
    JSON.stringify(previous.urls) !== JSON.stringify(urls),
  ].some(Boolean);
  return {
    id,
    type,
    category: classified.category,
    area: classified.area,
    severity,
    confidence,
    priority,
    status,
    source,
    sourceFile: clean(raw.reportPath || raw.sourceFile),
    files,
    urls,
    description,
    impact: clean(raw.impact) || (releaseBlocker ? "Blockiert einen sicheren Release." : "Kann Qualität, Auffindbarkeit, Vertrauen oder Nutzung beeinträchtigen."),
    autoFixAvailable: Boolean(raw.autoFixAvailable),
    autoFixId: raw.autoFixAvailable ? clean(raw.autoFixId) : "",
    manualFixRequired: Boolean(raw.manualFixRequired) || !raw.autoFixAvailable,
    recommendedAction: clean(raw.recommendedAction || raw.action || "Befund in der genannten Quelle prüfen und gezielt beheben."),
    releaseBlocker,
    createdAt: previous?.createdAt || now,
    lastCheckedAt: now,
    lastChangedAt: changed || !previous ? now : previous.lastChangedAt || now,
    snoozedUntil: status === "snoozed" ? previous?.snoozedUntil || raw.snoozedUntil || null : null,
    note: clean(previous?.note || raw.note),
    fingerprint,
  };
}

export function reconcileQualityFindings(rawFindings, previousFindings = [], { now = new Date().toISOString() } = {}) {
  const previousById = new Map(previousFindings.map((item) => [item.id, item]));
  const current = [];
  const seen = new Set();
  for (const raw of rawFindings) {
    const candidate = normalizeQualityFinding(raw, { now });
    if (seen.has(candidate.id)) continue;
    seen.add(candidate.id);
    current.push(normalizeQualityFinding(raw, { now, previous: previousById.get(candidate.id) }));
  }
  const resolved = previousFindings
    .filter((item) => !seen.has(item.id) && !["fixed", "ignored", "auto-fixed"].includes(item.status))
    .map((item) => ({ ...item, status: "fixed", lastCheckedAt: now, lastChangedAt: now }));
  const history = [
    ...current.filter((item) => {
      const previous = previousById.get(item.id);
      return !previous || previous.status !== item.status || previous.severity !== item.severity || previous.priority?.score !== item.priority.score;
    }).map((item) => ({
      findingId: item.id,
      occurredAt: now,
      from: previousById.get(item.id)?.status || null,
      to: item.status,
      severity: item.severity,
      source: item.source,
      description: item.description,
    })),
    ...resolved.map((item) => ({
      findingId: item.id,
      occurredAt: now,
      from: previousById.get(item.id)?.status || "open",
      to: "fixed",
      severity: item.severity,
      source: item.source,
      description: item.description,
    })),
  ];
  return {
    findings: [...current, ...resolved].sort((left, right) => right.priority.score - left.priority.score || left.id.localeCompare(right.id)),
    history,
  };
}

export function groupQualityFindings(findings) {
  const active = findings.filter((item) => ACTIVE_STATUSES.has(item.status));
  const buckets = new Map();
  for (const finding of active) {
    const target = finding.files[0] || finding.urls[0] || "project";
    const key = `${finding.category}|${finding.area}|${target}`;
    if (!buckets.has(key)) buckets.set(key, []);
    buckets.get(key).push(finding);
  }
  const groups = [];
  for (const [key, items] of buckets) {
    const sorted = items.sort((left, right) => right.priority.score - left.priority.score || left.id.localeCompare(right.id));
    for (let index = 0; index < sorted.length; index += 4) {
      const chunk = sorted.slice(index, index + 4);
      const files = unique(chunk.flatMap((item) => item.files)).slice(0, 5);
      groups.push({
        id: `quality-group-${stableId(`${key}|${index}`)}`,
        title: `${chunk[0].area}: ${chunk[0].description}`.slice(0, 140),
        category: chunk[0].category,
        area: chunk[0].area,
        priority: Math.max(...chunk.map((item) => item.priority.score)),
        releaseBlocker: chunk.some((item) => item.releaseBlocker),
        findingIds: chunk.map((item) => item.id),
        files,
        urls: unique(chunk.flatMap((item) => item.urls)),
      });
    }
  }
  return groups.sort((left, right) => Number(right.releaseBlocker) - Number(left.releaseBlocker) || right.priority - left.priority || left.id.localeCompare(right.id));
}

export function summarizeQualityOperations(findings, sources = []) {
  const active = findings.filter((item) => ACTIVE_STATUSES.has(item.status));
  const count = (predicate) => active.filter(predicate).length;
  return {
    active: active.length,
    releaseBlockers: count((item) => item.releaseBlocker),
    regressions: count((item) => item.status === "regression"),
    manualReview: count((item) => item.status === "manual-review"),
    autoFixable: count((item) => item.autoFixAvailable),
    highPriority: count((item) => item.priority.level === "high"),
    fixed: findings.filter((item) => ["fixed", "auto-fixed"].includes(item.status)).length,
    sourcesAvailable: sources.filter((item) => item.status === "available").length,
    sourcesMissing: sources.filter((item) => item.status === "missing").length,
  };
}

export function qualityFindingToContentInput(finding) {
  return {
    id: finding.id,
    route: finding.urls[0] || "",
    affectedFile: finding.files[0],
    title: finding.description,
    decision: finding.status === "manual-review" ? "MANUAL_REVIEW" : "IMPROVE",
    confidence: finding.confidence >= 80 ? "high" : finding.confidence >= 60 ? "medium" : "low",
    priority: finding.priority.level,
    problem: finding.description,
    nextAction: finding.recommendedAction,
    codes: [finding.type, finding.area],
    validationCommands: [],
  };
}

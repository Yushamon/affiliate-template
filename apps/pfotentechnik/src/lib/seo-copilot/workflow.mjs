import fs from "node:fs";
import path from "node:path";
import { createHash, randomUUID } from "node:crypto";
import { APP_ROOT } from "../search/config.mjs";
import { SearchError, redactSecrets } from "../search/errors.mjs";
import { PRODUCT_DISCOVERY_CATEGORIES, PRODUCT_IMAGE_ROLES } from "./config.ts";
import { compareProductIdentity, normalizeProductIdentity } from "./identity.ts";
import {
  classifyCommercialPotential,
  scoreContentGap,
  scoreNicheFit,
  scoreValidation,
  validateMarketSignal,
} from "./scoring.ts";
import { buildPromptPair } from "./prompts.ts";
import { assertSafeProductSlug, loadRepositoryProducts, runProductPreflight } from "./preflight.ts";
import { discoverProductsWithProvider, discoveryProviderStatus } from "./discovery-provider.mjs";
import {
  DRAFT_DIR,
  appendCopilotAudit,
  createCopilotJob,
  readCopilotWorkspace,
  updateCopilotJob,
  updateCopilotWorkspace,
} from "./store.mjs";

const SOURCE_TYPES = new Set([
  "manufacturer",
  "manual",
  "datasheet",
  "press-release",
  "app-store",
  "established-retailer",
  "independent-test",
  "community",
  "unknown",
]);
const MARKET_SIGNAL_TYPES = new Set([
  "verified-review-count",
  "bestseller-rank",
  "retailer-coverage",
  "search-interest",
  "visibility",
  "independent-mentions",
  "manufacturer-units",
  "app-downloads",
  "market-coverage",
]);

const clean = (value, max = 1_000) =>
  redactSecrets(String(value ?? "").replace(/[\u0000-\u001f]/g, " ").trim()).slice(0, max);
const bounded = (value, minimum = 0, maximum = 100) =>
  Math.min(maximum, Math.max(minimum, Number(value) || 0));
const slugify = (value) =>
  normalizeProductIdentity(value).replace(/\s+/g, "-").replace(/^-|-$/g, "").slice(0, 120);
const unique = (values, max = 30) => [...new Set((values || []).map((value) => clean(value)).filter(Boolean))].slice(0, max);
const stableId = (...parts) => createHash("sha256").update(parts.join("|")).digest("hex").slice(0, 20);

export function validateExternalSourceUrl(value) {
  const url = new URL(clean(value, 2_000));
  if (!["https:", "http:"].includes(url.protocol) || url.username || url.password) {
    throw new SearchError("SEARCH_INVALID_DATA", { message: "Unsichere oder ungültige externe Quellen-URL." });
  }
  if (/^(?:localhost|0\.0\.0\.0|\[?::1\]?)$/i.test(url.hostname) || /^127\./.test(url.hostname)) {
    throw new SearchError("SEARCH_INVALID_DATA", { message: "Lokale Quellen-URLs sind nicht erlaubt." });
  }
  url.hash = "";
  return url.toString();
}

function normalizeSource(raw, observedAt) {
  const url = validateExternalSourceUrl(raw?.url);
  const parsed = new URL(url);
  return {
    url,
    domain: parsed.hostname.toLocaleLowerCase("de"),
    sourceType: SOURCE_TYPES.has(raw?.sourceType) ? raw.sourceType : "unknown",
    title: clean(raw?.title || parsed.hostname, 300),
    observedAt: clean(raw?.observedAt || observedAt, 40),
    supports: unique(raw?.supports, 20),
    confidence: bounded(raw?.confidence, 0, 1),
  };
}

function normalizeMarketSignal(raw, sources, observedAt) {
  const sourceUrl = raw?.source?.url || raw?.sourceUrl;
  const source = sources.find((item) => item.url === sourceUrl) || normalizeSource(raw?.source || { url: sourceUrl }, observedAt);
  const signal = {
    type: MARKET_SIGNAL_TYPES.has(raw?.type) ? raw.type : "visibility",
    value: typeof raw?.value === "number" ? raw.value : clean(raw?.value, 200),
    unit: raw?.unit ? clean(raw.unit, 80) : undefined,
    source,
    observedAt: clean(raw?.observedAt || observedAt, 40),
    confidence: bounded(raw?.confidence, 0, 1),
    limitation: clean(raw?.limitation, 500),
  };
  const errors = validateMarketSignal(signal);
  if (errors.length) throw new SearchError("SEARCH_INVALID_DATA", { message: errors.join(" ") });
  return signal;
}

function repositoryCoverage(raw, existingProducts) {
  const comparisons = [];
  const possible = existingProducts
    .map((existing) => ({ existing, ...compareProductIdentity(raw, existing) }))
    .sort((a, b) => b.confidence - a.confidence);
  const best = possible[0];
  const relationship =
    best && best.relationship !== "separate" && best.confidence >= 0.5 ? best.relationship : "new";
  return {
    productSlug: relationship !== "new" ? best?.existing.slug : undefined,
    manufacturerSlug: existingProducts.find(
      (item) => normalizeProductIdentity(item.brand) === normalizeProductIdentity(raw.brand || raw.manufacturer),
    )?.manufacturerSlug,
    mentionedIn: [],
    comparisons,
    guides: [],
    images: [],
    relationship,
    rationale: best?.rationale || "Kein ähnliches vorhandenes Produkt erkannt.",
  };
}

export function mapProductCandidate(raw, query, existingProducts, observedAt) {
  const name = clean(raw?.name, 240);
  const brand = clean(raw?.brand || raw?.manufacturer, 160);
  if (!name || !brand) throw new SearchError("SEARCH_INVALID_DATA", { message: "Produktkandidat benötigt Name und Hersteller." });
  const sources = (raw?.sources || []).slice(0, 30).map((source) => normalizeSource(source, observedAt));
  const marketSignals = (raw?.marketSignals || []).slice(0, 30).map((signal) => normalizeMarketSignal(signal, sources, observedAt));
  const validation = scoreValidation({
    sources,
    germanyAvailable: Boolean(raw?.germanyAvailable),
    currentAvailability: Boolean(raw?.currentAvailability),
  });
  const coverage = repositoryCoverage(
    {
      name,
      brand,
      aliases: unique(raw?.aliases, 20),
      modelNumbers: unique(raw?.modelNumbers, 20),
      variant: clean(raw?.variant, 120),
      successorOf: clean(raw?.successorOf, 160),
    },
    existingProducts,
  );
  const commercial = classifyCommercialPotential({
    purchaseIntent: bounded(raw?.commercialSignals?.purchaseIntent),
    retailerCoverage: bounded(raw?.commercialSignals?.retailerCoverage),
    comparisonFit: bounded(raw?.commercialSignals?.comparisonFit),
    followUpPurchases: bounded(raw?.commercialSignals?.followUpPurchases),
    competition: bounded(raw?.commercialSignals?.competition, 0, 100),
  });
  const contentGapScore = scoreContentGap({
    searchVisibility: bounded(raw?.gapSignals?.searchVisibility),
    productRelevance: bounded(raw?.gapSignals?.productRelevance),
    commercialPotential: commercial.score,
    missingCoverage: coverage.relationship === "new" ? 100 : coverage.relationship === "successor" ? 70 : 20,
    internalLinkability: bounded(raw?.gapSignals?.internalLinkability),
    sourceQuality: validation.score,
    freshness: bounded(raw?.gapSignals?.freshness),
  });
  const slug = slugify(raw?.slug || `${brand}-${name}`);
  const blockers = [];
  if (coverage.relationship === "identical" || coverage.relationship === "alias") blockers.push("Wahrscheinliches Duplikat oder Alias.");
  if (validation.score < 60) blockers.push("Validation Score unter 60.");
  if (!sources.some((source) => ["manufacturer", "manual", "datasheet"].includes(source.sourceType))) blockers.push("Keine Hersteller-, Handbuch- oder Datenblattquelle.");
  return {
    id: `candidate-${stableId(brand, name, ...unique(raw?.modelNumbers, 20))}`,
    name,
    brand,
    manufacturer: clean(raw?.manufacturer || brand, 160),
    manufacturerSlug: slugify(raw?.manufacturerSlug || brand),
    aliases: unique(raw?.aliases, 20),
    modelNumbers: unique(raw?.modelNumbers, 20),
    category: clean(raw?.category || query.category, 160),
    subcategory: raw?.subcategory ? clean(raw.subcategory, 160) : undefined,
    targetAnimals: (raw?.targetAnimals || []).filter((item) => ["dog", "cat", "other"].includes(item)),
    targetSizes: (raw?.targetSizes || []).filter((item) => ["small", "medium", "large", "unknown"].includes(item)),
    productUrl: raw?.productUrl ? validateExternalSourceUrl(raw.productUrl) : undefined,
    manufacturerUrl: raw?.manufacturerUrl ? validateExternalSourceUrl(raw.manufacturerUrl) : undefined,
    discoveredAt: observedAt,
    validatedAt: observedAt,
    validationScore: validation.score,
    contentGapScore,
    nicheFitScore: undefined,
    commercialPotential: commercial.level,
    commercialRationale: commercial.rationale,
    confidence: validation.confidence,
    marketSignals,
    sources,
    existingCoverage: coverage,
    missingData: unique(raw?.missingData, 40),
    risks: unique([...(raw?.risks || []), ...blockers], 40),
    productData: raw?.productData && typeof raw.productData === "object" ? raw.productData : {},
    status: blockers.length ? "blocked" : "awaiting-review",
  };
}

export function getCopilotWorkspaceStatus() {
  const workspace = readCopilotWorkspace();
  return {
    provider: discoveryProviderStatus(),
    counts: {
      productCandidates: workspace.productCandidates.length,
      contentGaps: workspace.contentGaps.length,
      nicheOpportunities: workspace.nicheOpportunities.length,
      productDrafts: workspace.productDrafts.length,
      jobs: workspace.jobs.length,
    },
    productCandidates: workspace.productCandidates,
    contentGaps: workspace.contentGaps,
    nicheOpportunities: workspace.nicheOpportunities,
    productDrafts: workspace.productDrafts,
    jobs: workspace.jobs.slice(-30),
  };
}

export async function runProductDiscovery(payload = {}, { progress = () => {}, fetchImpl } = {}) {
  const category = clean(payload.category, 100);
  if (!PRODUCT_DISCOVERY_CATEGORIES.includes(category)) {
    throw new SearchError("SEARCH_INVALID_DATA", { message: "Unbekannte Produktkategorie." });
  }
  const job = createCopilotJob("product.discovery.run");
  const observedAt = new Date().toISOString();
  updateCopilotJob(job.id, { status: "running", startedAt: observedAt, progress: 10, currentStep: "Repository analysieren" });
  progress({ step: "repository", message: "Vorhandene Produktdateien und Identitäten werden geprüft.", percent: 10 });
  const existingProducts = loadRepositoryProducts();
  const promptContext = {
    kind: "product-discovery",
    title: `Neue Produkte in ${category} finden`,
    category,
    problems: ["Repository-Abdeckung außerhalb bestehender Herstellerlisten prüfen"],
    existingData: [`${existingProducts.length} vorhandene Produktdateien werden vor der Recherche abgeglichen.`],
    missingData: ["Offizielle Produktidentität", "Primärquellen", "regionale Verfügbarkeit", "Marktsignale"],
    acceptanceCriteria: ["Mindestens eine Primärquelle", "Mehrere Quellenbelege", "Duplikat- und Variantenprüfung", "Validation Score mindestens 60"],
  };
  if (!discoveryProviderStatus().configured) {
    const prompts = buildPromptPair(promptContext);
    const blocker = "Kein serverseitiger, fest konfigurierter Discovery-Provider vorhanden.";
    updateCopilotJob(job.id, {
      status: "blocked",
      finishedAt: new Date().toISOString(),
      progress: 20,
      currentStep: blocker,
      result: { prompts },
      warnings: [blocker],
    });
    appendCopilotAudit({ action: "product.discovery.run", statusAfter: "blocked", warnings: [blocker] });
    return { jobId: job.id, status: "blocked", blocker, prompts, provider: discoveryProviderStatus() };
  }
  progress({ step: "provider", message: "Sicherer Produktentdeckungs-Provider wird serverseitig abgefragt.", percent: 35 });
  updateCopilotJob(job.id, { progress: 35, currentStep: "Webquellen über festen Provider laden" });
  try {
    const discovered = await discoverProductsWithProvider({ ...payload, category }, { fetchImpl });
    const candidates = discovered.candidates.map((raw) => mapProductCandidate(raw, { category }, existingProducts, observedAt));
    const uniqueCandidates = [...new Map(candidates.map((candidate) => [candidate.id, candidate])).values()];
    updateCopilotWorkspace((workspace) => {
      const previous = new Map(workspace.productCandidates.map((candidate) => [candidate.id, candidate]));
      uniqueCandidates.forEach((candidate) => previous.set(candidate.id, candidate));
      workspace.productCandidates = [...previous.values()].filter((candidate) => !workspace.ignoredCandidateIds.includes(candidate.id));
      return workspace;
    });
    updateCopilotJob(job.id, {
      status: "awaiting-review",
      finishedAt: new Date().toISOString(),
      progress: 100,
      currentStep: "Kandidaten warten auf redaktionelle Prüfung",
      result: { candidates: uniqueCandidates.map((candidate) => candidate.id), provider: discovered.provider },
      sources: uniqueCandidates.flatMap((candidate) => candidate.sources).slice(0, 100),
    });
    appendCopilotAudit({
      action: "product.discovery.run",
      statusAfter: "awaiting-review",
      sources: uniqueCandidates.flatMap((candidate) => candidate.sources),
      warnings: uniqueCandidates.flatMap((candidate) => candidate.risks),
    });
    return { jobId: job.id, status: "awaiting-review", candidates: uniqueCandidates, provider: discovered.provider };
  } catch (error) {
    updateCopilotJob(job.id, {
      status: "failed",
      finishedAt: new Date().toISOString(),
      currentStep: "Produktentdeckung fehlgeschlagen",
      error: { code: error?.code || "SEARCH_API_UNAVAILABLE", message: clean(error?.message, 500) },
    });
    appendCopilotAudit({ action: "product.discovery.run", statusAfter: "failed", error: { code: error?.code || "SEARCH_API_UNAVAILABLE", message: clean(error?.message, 500) } });
    throw error;
  }
}

const candidateById = (id) => {
  const candidate = readCopilotWorkspace().productCandidates.find((item) => item.id === id);
  if (!candidate) throw new SearchError("SEARCH_INVALID_DATA", { message: "Produktkandidat wurde nicht gefunden." });
  return candidate;
};

export function validateStoredCandidate(payload = {}) {
  const candidate = candidateById(clean(payload.candidateId, 100));
  const validation = scoreValidation({
    sources: candidate.sources,
    germanyAvailable: candidate.marketSignals.some((signal) => signal.type === "retailer-coverage"),
    currentAvailability: candidate.marketSignals.some((signal) => ["retailer-coverage", "visibility"].includes(signal.type)),
  });
  const status = validation.score >= 60 && !["identical", "alias"].includes(candidate.existingCoverage.relationship) ? "awaiting-review" : "blocked";
  updateCopilotWorkspace((workspace) => {
    workspace.productCandidates = workspace.productCandidates.map((item) =>
      item.id === candidate.id ? { ...item, validationScore: validation.score, confidence: validation.confidence, status, validatedAt: new Date().toISOString() } : item,
    );
    return workspace;
  });
  appendCopilotAudit({ action: "product.discovery.validate", entity: candidate.id, statusBefore: candidate.status, statusAfter: status, sources: candidate.sources });
  return { candidateId: candidate.id, status, ...validation };
}

export function ignoreStoredCandidate(payload = {}) {
  const candidate = candidateById(clean(payload.candidateId, 100));
  updateCopilotWorkspace((workspace) => {
    workspace.ignoredCandidateIds = [...new Set([...workspace.ignoredCandidateIds, candidate.id])];
    workspace.productCandidates = workspace.productCandidates.filter((item) => item.id !== candidate.id);
    return workspace;
  });
  appendCopilotAudit({ action: "product.discovery.ignore", entity: candidate.id, statusBefore: candidate.status, statusAfter: "ignored" });
  return { candidateId: candidate.id, status: "ignored" };
}

export function runStoredCandidatePreflight(payload = {}) {
  const candidate = candidateById(clean(payload.candidateId, 100));
  const slug = slugify(payload.slug || `${candidate.brand}-${candidate.name}`);
  const result = runProductPreflight({ ...candidate, slug, productData: candidate.productData || {} });
  appendCopilotAudit({
    action: "product.preflight.run",
    entity: candidate.id,
    statusBefore: candidate.status,
    statusAfter: result.passed ? "awaiting-review" : "blocked",
    sources: candidate.sources,
    warnings: [...result.blockers, ...result.warnings],
  });
  return { candidateId: candidate.id, slug, preflight: result };
}

const imagePrompts = (candidate, slug) => {
  const confirmed = unique(candidate.sources.flatMap((source) => source.supports), 20);
  const base = `Neutrale redaktionelle Produktdarstellung von ${candidate.name} (${candidate.manufacturer}). Ausschließlich bestätigte Merkmale verwenden: ${confirmed.join(", ") || "Produktoptik noch nicht ausreichend belegt"}. Keine Logos, kein Text, keine zusätzlichen Funktionen, reale Proportionen.`;
  return PRODUCT_IMAGE_ROLES.map((role) => ({
    role,
    target: `apps/pfotentechnik/src/assets/images/products/${slug}/${role}.webp`,
    prompt: `${base} Bildrolle ${role}; ${role === "thumbnail" ? "1:1, 800×800" : "16:9, 1600×900"}.`,
  }));
};

export function generateProductDraft(payload = {}) {
  const candidate = candidateById(clean(payload.candidateId, 100));
  const slug = slugify(payload.slug || `${candidate.brand}-${candidate.name}`);
  const preflight = runProductPreflight({ ...candidate, slug, productData: candidate.productData || {} });
  const draft = {
    id: `draft-${randomUUID()}`,
    candidateId: candidate.id,
    slug,
    productData: candidate.productData || {},
    content: "",
    frontmatter: candidate.productData || {},
    sources: candidate.sources,
    imagePrompts: imagePrompts(candidate, slug),
    proposedFiles: preflight.targetPaths,
    missingData: [...new Set([...candidate.missingData, ...preflight.missingFields])],
    warnings: [...preflight.warnings, ...preflight.blockers],
    preflight,
    status: preflight.passed ? "awaiting-review" : "blocked",
    generatedAt: new Date().toISOString(),
    prompts: buildPromptPair({
      kind: "product-creation",
      title: candidate.name,
      slug,
      manufacturer: candidate.manufacturer,
      category: candidate.category,
      problems: preflight.blockers,
      existingData: candidate.sources.flatMap((source) => source.supports),
      missingData: [...candidate.missingData, ...preflight.missingFields],
      comparisons: preflight.recommendedComparisons,
      imageRequirements: imagePrompts(candidate, slug).map((item) => `${item.role}: ${item.target}`),
      sources: candidate.sources,
      acceptanceCriteria: ["Preflight ohne Blocker", "Entwurf redaktionell geprüft", "Explizite Freigabe", "Build und Produkt-Audit erfolgreich"],
    }),
  };
  fs.mkdirSync(DRAFT_DIR, { recursive: true });
  const target = path.join(DRAFT_DIR, `${draft.id}.json`);
  fs.writeFileSync(target, `${JSON.stringify(draft, null, 2)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
  updateCopilotWorkspace((workspace) => {
    workspace.productDrafts = [...workspace.productDrafts, { ...draft, content: "" }].slice(-100);
    workspace.productCandidates = workspace.productCandidates.map((item) => item.id === candidate.id ? { ...item, status: draft.status === "blocked" ? "blocked" : "drafted" } : item);
    return workspace;
  });
  appendCopilotAudit({ action: "product.draft.generate", entity: candidate.id, statusBefore: candidate.status, statusAfter: draft.status, generatedFiles: [path.relative(APP_ROOT, target)], sources: candidate.sources, warnings: draft.warnings });
  return { draft: { ...draft, content: "" }, previewPath: path.relative(APP_ROOT, target), prompts: draft.prompts };
}

const draftById = (id) => {
  const draft = readCopilotWorkspace().productDrafts.find((item) => item.id === id);
  if (!draft) throw new SearchError("SEARCH_INVALID_DATA", { message: "Produktentwurf wurde nicht gefunden." });
  return draft;
};

export function approveProductDraft(payload = {}) {
  const draft = draftById(clean(payload.draftId, 100));
  const markdown = String(payload.finalMarkdown || "");
  if (payload.approval !== "approve-reviewed-product-draft") throw new SearchError("SEARCH_ACTION_NOT_ALLOWED", { message: "Explizite Freigabe fehlt." });
  if (markdown.length < 500 || markdown.length > 150_000 || !/^---\s*\r?\n[\s\S]+?\r?\n---/m.test(markdown)) {
    throw new SearchError("SEARCH_INVALID_DATA", { message: "Der geprüfte finale Markdown-Entwurf ist unvollständig oder ungültig." });
  }
  if (!new RegExp(`^slug:\\s*[\"']?${draft.slug}[\"']?\\s*$`, "m").test(markdown)) throw new SearchError("SEARCH_INVALID_DATA", { message: "Slug im Entwurf stimmt nicht mit dem Preflight überein." });
  if (/TODO|TBD|DUMMY|PLACEHOLDER|lorem ipsum|nicht recherchiert/i.test(markdown)) throw new SearchError("SEARCH_INVALID_DATA", { message: "Entwurf enthält Platzhalter oder nicht recherchierte Inhalte." });
  if (!/^##\s+Quellen/im.test(markdown) || !/https?:\/\//i.test(markdown)) throw new SearchError("SEARCH_INVALID_DATA", { message: "Nachvollziehbarer Quellenabschnitt fehlt." });
  updateCopilotWorkspace((workspace) => {
    workspace.productDrafts = workspace.productDrafts.map((item) =>
      item.id === draft.id ? { ...item, content: markdown, status: "approved", approvedAt: new Date().toISOString() } : item,
    );
    return workspace;
  });
  appendCopilotAudit({ action: "product.draft.approve", entity: draft.id, statusBefore: draft.status, statusAfter: "approved", sources: draft.sources, userApproval: true });
  return { draftId: draft.id, status: "approved", preview: markdown };
}

export function publishApprovedProduct(payload = {}) {
  const draft = draftById(clean(payload.draftId, 100));
  if (payload.approval !== "create-approved-product" || draft.status !== "approved" || !draft.content) {
    throw new SearchError("SEARCH_ACTION_NOT_ALLOWED", { message: "Nur ein explizit freigegebener Produktentwurf darf angelegt werden." });
  }
  const candidate = candidateById(draft.candidateId);
  const preflight = runProductPreflight({ ...candidate, slug: draft.slug, productData: draft.productData || {} });
  if (!preflight.passed) throw new SearchError("SEARCH_INVALID_DATA", { message: `Preflight blockiert die Anlage: ${preflight.blockers.join(" ")}` });
  const target = assertSafeProductSlug(draft.slug);
  fs.writeFileSync(target, draft.content, { encoding: "utf8", flag: "wx", mode: 0o644 });
  updateCopilotWorkspace((workspace) => {
    workspace.productDrafts = workspace.productDrafts.map((item) => item.id === draft.id ? { ...item, status: "created" } : item);
    workspace.productCandidates = workspace.productCandidates.map((item) => item.id === candidate.id ? { ...item, status: "created" } : item);
    return workspace;
  });
  appendCopilotAudit({ action: "product.create", entity: draft.id, statusBefore: "approved", statusAfter: "created", changedFiles: [path.relative(APP_ROOT, target)], sources: draft.sources, userApproval: true });
  return { draftId: draft.id, target, slug: draft.slug };
}

export function rollbackPublishedProduct(result, error) {
  if (!result?.target) return;
  const resolved = path.resolve(result.target);
  const productDir = path.resolve(APP_ROOT, "src", "content", "products");
  if (path.dirname(resolved) !== productDir) return;
  try { if (fs.existsSync(resolved)) fs.unlinkSync(resolved); } catch {}
  appendCopilotAudit({ action: "product.create.rollback", entity: result.draftId, statusBefore: "created", statusAfter: "failed", changedFiles: [path.relative(APP_ROOT, resolved)], error: { code: error?.code || "BUILD_FAILED", message: clean(error?.message, 500) }, userApproval: true, buildResult: "failed" });
}

export function refreshContentGaps() {
  const workspace = readCopilotWorkspace();
  const gaps = workspace.productCandidates
    .filter((candidate) => candidate.contentGapScore >= 40 && !["identical", "alias"].includes(candidate.existingCoverage.relationship))
    .map((candidate) => ({
      id: `gap-${candidate.id}`,
      type: candidate.existingCoverage.relationship === "successor" ? "successor" : "missing-product",
      title: candidate.name,
      description: `Repository-Abdeckung für ${candidate.name} prüfen.`,
      rationale: candidate.existingCoverage.rationale,
      sources: candidate.sources,
      expectedPageType: "product",
      userNeed: candidate.category,
      commercialPotential: candidate.commercialPotential,
      editorialEffort: candidate.missingData.length > 8 ? "high" : candidate.missingData.length > 3 ? "medium" : "low",
      competition: "unknown",
      confidence: candidate.confidence,
      score: candidate.contentGapScore,
      recommendedAction: candidate.validationScore >= 60 ? "Preflight und redaktionelle Prüfung starten." : "Weitere Primärquellen beschaffen.",
      prompts: buildPromptPair({
        kind: "content-gap",
        title: candidate.name,
        manufacturer: candidate.manufacturer,
        category: candidate.category,
        problems: candidate.risks,
        existingData: [candidate.existingCoverage.rationale],
        missingData: candidate.missingData,
        sources: candidate.sources,
      }),
    }));
  updateCopilotWorkspace((state) => { state.contentGaps = gaps; return state; });
  appendCopilotAudit({ action: "content-gap.refresh", statusAfter: "completed", sources: gaps.flatMap((gap) => gap.sources) });
  return { gaps };
}

export function refreshNicheOpportunities(payload = {}) {
  const minimumScore = bounded(payload.minimumScore || 65);
  const opportunities = (payload.opportunities || []).slice(0, 50).map((raw) => {
    const sources = (raw.sources || []).map((source) => normalizeSource(source, new Date().toISOString()));
    if (!sources.length) throw new SearchError("SEARCH_INVALID_DATA", { message: "Nischenchance benötigt mindestens eine belastbare Quelle." });
    const fit = scoreNicheFit({
      targetAudienceOverlap: bounded(raw.targetAudienceOverlap),
      internalLinkability: bounded(raw.internalLinkability),
      productAvailability: bounded(raw.productAvailability),
      searchPotential: bounded(raw.searchPotential),
      commercialPotential: bounded(raw.commercialPotential),
      editorialCredibility: bounded(raw.editorialCredibility),
    }, minimumScore);
    return {
      id: `niche-${stableId(raw.title)}`,
      title: clean(raw.title, 240),
      rationale: clean(raw.rationale, 1_000),
      targetAudienceOverlap: bounded(raw.targetAudienceOverlap),
      internalLinkability: bounded(raw.internalLinkability),
      productAvailability: bounded(raw.productAvailability),
      searchPotential: bounded(raw.searchPotential),
      commercialPotential: bounded(raw.commercialPotential),
      editorialCredibility: bounded(raw.editorialCredibility),
      score: fit.score,
      confidence: fit.confidence,
      risks: unique(raw.risks, 30),
      sources,
      status: fit.recommended ? "awaiting-review" : "rejected",
      prompts: buildPromptPair({
        kind: "niche-opportunity",
        title: raw.title,
        problems: raw.risks || [],
        existingData: [raw.rationale],
        missingData: ["Search-Nachfrage", "Herstellerlandschaft", "redaktionelle Fachgrenzen"],
        sources,
      }),
    };
  });
  updateCopilotWorkspace((workspace) => { workspace.nicheOpportunities = opportunities; return workspace; });
  appendCopilotAudit({ action: "niche-opportunities.refresh", statusAfter: "completed", sources: opportunities.flatMap((item) => item.sources), warnings: opportunities.flatMap((item) => item.risks) });
  return { minimumScore, opportunities };
}

export function generateEntityResearchPrompt(payload = {}) {
  const kind = payload.kind === "manufacturer" ? "manufacturer" : payload.kind === "comparison" ? "comparison" : "product-research";
  return buildPromptPair({
    kind,
    title: clean(payload.title || "Redaktionelle Prüfung", 240),
    affectedFile: payload.affectedFile ? clean(payload.affectedFile, 500) : undefined,
    slug: payload.slug ? clean(payload.slug, 160) : undefined,
    manufacturer: payload.manufacturer ? clean(payload.manufacturer, 160) : undefined,
    category: payload.category ? clean(payload.category, 160) : undefined,
    problems: unique(payload.problems, 30),
    existingData: unique(payload.existingData, 30),
    missingData: unique(payload.missingData, 30),
    comparisons: unique(payload.comparisons, 20),
    guides: unique(payload.guides, 20),
    acceptanceCriteria: ["Repository-Stand zuerst prüfen", "Nur belastbare Quellen", "Vorschau vor jeder Dateiänderung"],
  });
}

import test from "node:test";
import assert from "node:assert/strict";
import {
  buildChatGptPrompt,
  buildCodexPrompt,
  buildPromptPair,
} from "../src/lib/seo-copilot/prompts.ts";
import {
  classifyCommercialPotential,
  scoreContentGap,
  scoreNicheFit,
  scoreSourceEvidence,
  scoreValidation,
  validateMarketSignal,
} from "../src/lib/seo-copilot/scoring.ts";
import {
  compareProductIdentity,
  normalizeProductIdentity,
} from "../src/lib/seo-copilot/identity.ts";
import {
  assertSafeProductSlug,
  detectProductSchema,
  runProductPreflight,
} from "../src/lib/seo-copilot/preflight.ts";
import {
  mapProductCandidate,
  validateExternalSourceUrl,
} from "../src/lib/seo-copilot/workflow.mjs";
import { transitionCopilotJob } from "../src/lib/seo-copilot/store.mjs";
import { createSearchActionService } from "../src/lib/search/action-service.mjs";

const observedAt = "2026-07-23T10:00:00.000Z";
const source = (url, sourceType, supports = ["Kapazität"]) => ({
  url,
  domain: new URL(url).hostname,
  sourceType,
  title: `${sourceType} source`,
  observedAt,
  supports,
  confidence: 1,
});

const primarySources = [
  source("https://manufacturer.example/products/model-x", "manufacturer"),
  source("https://manufacturer.example/manuals/model-x.pdf", "manual"),
  source("https://retailer-one.example/model-x", "established-retailer"),
  source("https://retailer-two.example/model-x", "established-retailer"),
];

test("Prompt-Generator ist mit festem Zeitstempel reproduzierbar", () => {
  const input = { kind: "product-health", title: "Model X", missingData: ["Maße"] };
  const first = buildPromptPair(input, { generatedAt: observedAt });
  const second = buildPromptPair(input, { generatedAt: observedAt });
  assert.deepEqual(first, second);
});

test("Product-Health-Prompt enthält Datei, Schema, Problem und Validierung", () => {
  const result = buildCodexPrompt({
    kind: "product-health",
    title: "Model X",
    slug: "model-x",
    affectedFile: "apps/pfotentechnik/src/content/products/model-x.md",
    missingData: ["Maße", "Gewicht"],
  }, { generatedAt: observedAt });
  for (const token of ["model-x.md", "product.ts", "Maße", "npm run build:pfotentechnik"]) assert.match(result.prompt, new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
});

test("Codex-Prompt verlangt Repository-Prüfung und explizite Freigabe", () => {
  const prompt = buildCodexPrompt({ kind: "product-creation", title: "Model X" }, { generatedAt: observedAt }).prompt;
  assert.match(prompt, /Repository-Stand erneut prüfen/i);
  assert.match(prompt, /expliziter Freigabe/i);
});

test("ChatGPT-Prompt trennt Herstellerdaten und Marktsignale", () => {
  const prompt = buildChatGptPrompt({ kind: "product-research", title: "Model X" }, { generatedAt: observedAt }).prompt;
  assert.match(prompt, /Trenne bestätigte Herstellerangaben/i);
  assert.match(prompt, /Marktsignale, nicht als Verkaufszahlen/i);
});

test("Prompt-Generator redigiert Secret-ähnliche Werte", () => {
  const prompt = buildCodexPrompt({ kind: "content-health", title: "x", existingData: ["api_key=super-secret"] }, { generatedAt: observedAt }).prompt;
  assert.equal(prompt.includes("super-secret"), false);
  assert.match(prompt, /\[REDACTED\]/);
});

test("Produktkandidat-Mapping berechnet Scores und Repository-Abdeckung", () => {
  const candidate = mapProductCandidate({
    name: "Model X",
    brand: "Example",
    manufacturer: "Example GmbH",
    category: "smart-feeders",
    sources: primarySources,
    germanyAvailable: true,
    currentAvailability: true,
    gapSignals: { productRelevance: 90, internalLinkability: 80, freshness: 90, searchVisibility: 50 },
    commercialSignals: { purchaseIntent: 80, retailerCoverage: 70, comparisonFit: 90, followUpPurchases: 30, competition: 50 },
  }, { category: "smart-feeders" }, [], observedAt);
  assert.equal(candidate.existingCoverage.relationship, "new");
  assert.ok(candidate.validationScore >= 80);
  assert.ok(candidate.contentGapScore > 0);
});

test("Validation Score bevorzugt Primärquellen und mehrere Händler", () => {
  const result = scoreValidation({ sources: primarySources, germanyAvailable: true, currentAvailability: true });
  assert.ok(result.score >= 80);
  assert.equal(result.confidence, "high");
});

test("Content Gap Score folgt zentraler Gewichtung", () => {
  assert.equal(scoreContentGap({ searchVisibility: 100, productRelevance: 100, commercialPotential: 100, missingCoverage: 100, internalLinkability: 100, sourceQuality: 100, freshness: 100 }), 100);
});

test("Niche Fit Score respektiert Mindestscore", () => {
  const result = scoreNicheFit({ targetAudienceOverlap: 80, internalLinkability: 80, productAvailability: 70, searchPotential: 60, commercialPotential: 60, editorialCredibility: 90 }, 65);
  assert.equal(result.recommended, true);
  assert.ok(result.score >= 65);
});

test("Kommerzielles Potenzial bleibt als Schätzung gekennzeichnet", () => {
  const result = classifyCommercialPotential({ purchaseIntent: 90, retailerCoverage: 80, comparisonFit: 90, followUpPurchases: 50, competition: 30 });
  assert.equal(result.level, "high");
  assert.match(result.rationale, /Schätzung/);
  assert.match(result.rationale, /keine Umsatz/i);
});

test("Marktindikatoren benötigen Quelle, Einschränkung und valide Confidence", () => {
  const signal = { type: "retailer-coverage", value: 2, source: primarySources[0], observedAt, confidence: 0.8, limitation: "Nur zwei geprüfte Händler." };
  assert.deepEqual(validateMarketSignal(signal), []);
  assert.ok(validateMarketSignal({ ...signal, limitation: "" }).length > 0);
});

test("Unbelegte Marktsignale dürfen nicht als Verkaufszahlen bezeichnet werden", () => {
  const signal = { type: "visibility", value: 4, unit: "Verkaufszahlen", source: primarySources[0], observedAt, confidence: 0.7, limitation: "Nur Sichtbarkeit." };
  assert.match(validateMarketSignal(signal).join(" "), /nicht als Verkaufszahlen/i);
});

test("Identische Produktnamen werden als identisch erkannt", () => {
  assert.equal(compareProductIdentity({ name: "PETLIBRO Granary", brand: "PETLIBRO" }, { name: "Petlibro Granary", brand: "PETLIBRO" }).relationship, "identical");
});

test("Alias-Erkennung nutzt gemeinsame Modellnummern", () => {
  assert.equal(compareProductIdentity({ name: "Granary Smart Feeder", brand: "PETLIBRO", modelNumbers: ["PLAF203"] }, { name: "Granary WiFi", brand: "PETLIBRO", modelNumbers: ["PLAF203"] }).relationship, "alias");
});

test("Varianten mit gemeinsamer Modellnummer werden nicht automatisch zusammengeführt", () => {
  assert.equal(compareProductIdentity({ name: "Model X Black", brand: "A", modelNumbers: ["AX100"], variant: "black" }, { name: "Model X White", brand: "A", modelNumbers: ["AX100"], variant: "white" }).relationship, "variant");
});

test("Nachfolger werden separat von Alias und identischem Produkt klassifiziert", () => {
  assert.equal(compareProductIdentity({ name: "Model X2", brand: "A", successorOf: "model-x" }, { name: "Model X", brand: "A", slug: "model-x" }).relationship, "successor");
});

test("Normalisierung behandelt Schreibweisen und Bindestriche stabil", () => {
  assert.equal(normalizeProductIdentity("PETLIBRO—Granary WiFi"), "petlibro granary wifi");
});

test("Produktschema wird dynamisch erkannt und besitzt Pflichtfelder", () => {
  const schema = detectProductSchema();
  assert.equal(schema.detected, true);
  for (const field of ["title", "slug", "description", "testStatus", "manufacturer", "images", "rating", "decision", "review"]) assert.ok(schema.requiredFields.includes(field), field);
  assert.match(schema.version, /^sha256:/);
});

test("Dateipfad-Validierung blockiert Traversal", () => {
  assert.throws(() => assertSafeProductSlug("../outside"), /Ungültiger Produkt-Slug/);
  assert.match(assertSafeProductSlug("safe-product"), /safe-product\.md$/);
});

test("Preflight prüft Pflichtfelder, Primärquellen, Hersteller und Vergleiche", () => {
  const required = Object.fromEntries(detectProductSchema().requiredFields.map((field) => [field, true]));
  const result = runProductPreflight({
    id: "candidate-preflight",
    name: "Codex Preflight Model",
    brand: "PETLIBRO",
    manufacturer: "PETLIBRO",
    manufacturerSlug: "petlibro",
    aliases: [],
    modelNumbers: ["CODEX99999"],
    category: "Futterautomaten",
    slug: "codex-preflight-model",
    sources: primarySources,
    missingData: [],
    productData: required,
  }, new Date(observedAt));
  assert.equal(result.missingFields.length, 0);
  assert.equal(result.blockers.some((item) => /Herstellerdatei fehlt/.test(item)), false);
  assert.ok(result.recommendedComparisons.some((slug) => /futter/.test(slug)));
  assert.ok(result.blockers.some((item) => /hero\.webp/.test(item)));
});

test("Quellenbewertung ignoriert doppelte URL-Belege", () => {
  assert.equal(scoreSourceEvidence([primarySources[0], primarySources[0]]), 30);
});

test("Externe URLs blockieren lokale Ziele und Zugangsdaten", () => {
  assert.throws(() => validateExternalSourceUrl("http://127.0.0.1/private"), /Lokale Quellen/);
  assert.throws(() => validateExternalSourceUrl("https://user:pass@example.com"), /Unsichere/);
  assert.match(validateExternalSourceUrl("https://example.com/product"), /^https:/);
});

test("Action-Allowlist blockiert Shell und unterstützt Abbruch sowie Wiederholung", async () => {
  let attempts = 0;
  const service = createSearchActionService({
    "product.discovery.run": async ({ signal }) => {
      attempts += 1;
      if (attempts === 1) throw new Error("first failure");
      return new Promise((resolve) => {
        signal.addEventListener("abort", () => resolve({ cancelled: true }));
      });
    },
  }, { logger: () => {} });
  assert.throws(() => service.start("shell.exec", { command: "whoami" }), (error) => error.code === "SEARCH_ACTION_NOT_ALLOWED");
  const failed = service.start("product.discovery.run", { category: "smart-feeders" });
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(service.get(failed.id).status, "failed");
  const retried = service.retry(failed.id);
  assert.ok(retried?.id);
  assert.equal(service.cancel(retried.id), true);
  await new Promise((resolve) => setTimeout(resolve, 0));
  assert.equal(service.get(retried.id).status, "cancelled");
});

test("Job-Statusübergänge sind explizit und ungültige Übergänge werden blockiert", () => {
  const pending = { id: "job", status: "pending" };
  const running = transitionCopilotJob(pending, "running");
  assert.equal(running.status, "running");
  assert.equal(transitionCopilotJob(running, "awaiting-review").status, "awaiting-review");
  assert.throws(() => transitionCopilotJob(pending, "completed"), /Ungültiger Job-Übergang/);
});

import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import {
  BLOCKED_ANCHOR_SET,
  LINK_TAXONOMY,
  detectTaxonomyIntents,
  detectTaxonomyTopics,
  isBlockedAnchor,
  normalizeTaxonomyPath,
  sanitizeAnchorAliases
} from "../src/domain/content/linkTaxonomy.data.mjs";
import { hasThematicProximity, scoreMultiTopicContext } from "../src/domain/content/linkingSemantics.ts";

const appRoot = path.resolve(import.meta.dirname, "..");

test("Hundetrinkbrunnen erweitert keine Katzenbrunnen-Anker", () => {
  const dogEntry = LINK_TAXONOMY.find((entry) => entry.id === "knowledge:trinkbrunnen-hund");
  assert.ok(dogEntry);
  assert.ok(dogEntry.anchorAliases.includes("Hundebrunnen"));
  assert.ok(!dogEntry.anchorAliases.some((anchor) => /katzenbrunnen/i.test(anchor)));
});

test("generische Einzelanker sind blockiert, spezifische Phrasen bleiben erlaubt", () => {
  for (const anchor of ["Hund", "Katze", "App", "Kamera", "Nassfutter", "Vergleich"]) {
    assert.equal(isBlockedAnchor(anchor), true, anchor);
  }
  assert.deepEqual(
    sanitizeAnchorAliases(["Hund", "Futterautomat für Hunde", "Kamera", "Futterautomat mit Kamera"]),
    ["Futterautomat für Hunde", "Futterautomat mit Kamera"]
  );
  assert.ok(BLOCKED_ANCHOR_SET.size >= 20);
});

test("Ownership der generischen Kategorien ist eindeutig", () => {
  const cases = [
    ["Futterautomat", "/smarte-futterautomaten/"],
    ["Trinkbrunnen", "/trinkbrunnen/"],
    ["GPS-Tracker", "/gps-tracker/"],
    ["Pet Tech", "/smarte-haustiertechnik/"]
  ];
  for (const [anchor, route] of cases) {
    const owners = LINK_TAXONOMY.filter((entry) => (entry.exclusiveAnchors ?? []).includes(anchor));
    assert.equal(owners.length, 1, anchor);
    assert.equal(normalizeTaxonomyPath(owners[0].href), route);
  }
});

test("Themenerkennung unterstützt mehrere Themen und Intents", () => {
  const topics = detectTaxonomyTopics("Futterautomat für Nassfutter reinigen bei Stromausfall");
  assert.ok(topics.includes("futterautomaten"));
  assert.ok(topics.includes("ernaehrung"));
  const healthTopics = detectTaxonomyTopics("Katze trinkt zu wenig und ein Trinkbrunnen soll helfen");
  assert.ok(healthTopics.includes("gesundheit"));
  assert.ok(healthTopics.includes("trinkbrunnen"));
  assert.ok(detectTaxonomyIntents("Wie kann ich den Filter reinigen und wechseln?").includes("how-to"));
});

test("Related Content verlangt thematische Evidenz vor dem Typbonus", () => {
  assert.equal(hasThematicProximity({ semanticSimilarity: 0.05 }), false);
  assert.equal(hasThematicProximity({ sharedTopics: ["gps-tracker"] }), true);
  assert.equal(hasThematicProximity({ exactTagMatches: 1 }), true);
});

test("Next Steps belohnt mehrere passende Themen und bestraft fachfremde Ziele", () => {
  const close = scoreMultiTopicContext({
    sourceTopics: ["futterautomaten", "nassfutter"],
    candidateTopics: ["futterautomaten", "nassfutter"],
    sourceIntents: ["how-to"], candidateIntents: ["how-to"], tokenOverlap: 3
  });
  const foreign = scoreMultiTopicContext({
    sourceTopics: ["futterautomaten", "nassfutter"],
    candidateTopics: ["gps-tracker"],
    sourceIntents: ["how-to"], candidateIntents: ["comparison"], tokenOverlap: 1
  });
  assert.ok(close.topicOverlap >= 2);
  assert.ok(close.score > foreign.score);
  assert.ok(foreign.score < 0);
});

test("Content Graph verwendet aktuelle Collections und Produktroute", () => {
  const source = fs.readFileSync(path.join(appRoot, "scripts/build-content-graph.mjs"), "utf8");
  assert.match(source, /src\/content\/comparisons/);
  assert.match(source, /\/produkt\/\$\{slug\}/);
  assert.doesNotMatch(source, /src\/data\/comparisons/);
  assert.doesNotMatch(source, /\/produkte\/\$\{slug\}/);
});

test("SEO-Co-Pilot prüft effektive Auto-Links und dynamische Cornerstones", () => {
  const loader = fs.readFileSync(path.join(appRoot, "src/lib/seo/advisor/loadContent.ts"), "utf8");
  const wrapper = fs.readFileSync(path.join(appRoot, "src/lib/seo/advisor/engineV3.ts"), "utf8");
  assert.match(loader, /data-effective-auto-link/);
  assert.match(loader, /getEffectiveTaxonomyLinks/);
  assert.match(wrapper, /getCornerstoneEntries/);
  assert.match(wrapper, /containsEffectiveLink/);
});

test("Audit besitzt Strict-Fehler für Ownership, Routen, Selbstlinks und Cluster", () => {
  const source = fs.readFileSync(path.resolve(appRoot, "../../scripts/audit-internal-links.mjs"), "utf8");
  for (const code of [
    "UNRESOLVED_ANCHOR_CONFLICT", "TARGET_ROUTE_MISSING", "BLOCKED_GENERIC_ANCHOR",
    "SELF_LINK", "WRONG_CLUSTER_TARGET_HIGH_CONFIDENCE"
  ]) assert.match(source, new RegExp(code));
});

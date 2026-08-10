import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

const experience = read("apps/pfotentechnik/src/components/product-experience-2/ProductExperience2.astro");
const evidence = read("apps/pfotentechnik/src/components/product-experience-2/ProductEvidence2.astro");
const community = read("apps/pfotentechnik/src/components/product-experience-2/ProductCommunityInsights2.astro");
const facts = read("apps/pfotentechnik/src/components/product-experience-2/ProductDecisionFacts2.astro");
const consequences = read("apps/pfotentechnik/src/domain/productExperience/consequences.ts");

const pos = (needle) => { const i = experience.indexOf(needle); assert.ok(i >= 0, `Fehlt: ${needle}`); return i; };

test("Entscheidungsnutzen steht vor Community, Details und Evidence", () => {
  assert.ok(pos("<ProductVerdict2") < pos("<ProductDecisionFacts2"));
  assert.ok(pos("<ProductDecisionFacts2") < pos("<ProductCommunityInsights2"));
  assert.ok(pos("<ProductCommunityInsights2") < pos("<ProductDetails2"));
  assert.ok(pos("<ProductDetails2") < pos("<ProductEvidence2"));
});

test("externe Quellen sind kompakt und bewusst aufklappbar", () => {
  assert.match(evidence, /<details class="evidence__sources">/);
  assert.match(evidence, /Externe Belege ansehen/);
  assert.match(evidence, /Quelle öffnen/);
  assert.doesNotMatch(evidence, /<a href=\{item\.url\}[^>]*><strong>/);
});

test("Evidence bleibt vollständig im HTML", () => {
  assert.match(evidence, /professionalReviews\.map/);
  assert.match(evidence, /userReviewSources\.map/);
  assert.match(evidence, /evidence\?\.externalNote/);
  assert.doesNotMatch(evidence, /client:only/);
});

test("Community ist verdichtet statt als große Farbflächen aufgebaut", () => {
  assert.match(community, /community__groups/);
  assert.match(community, /community__group is-positive/);
  assert.match(community, /community__group is-negative/);
  assert.match(community, /Einordnung:/);
});

test("Decision Facts sind kompakte Zeilen", () => {
  assert.match(facts, /Was die wichtigsten Daten bedeuten/);
  assert.match(facts, /decision-facts dl/);
  assert.doesNotMatch(facts, /repeat\(3/);
});

test("GPS-Akku-Konsequenz nennt Live-Ortung statt flexiblen Standort", () => {
  assert.match(consequences, /normalizedCategory\.includes\("gps"\)/);
  assert.match(consequences, /Live-Ortung/);
  const branch = consequences.match(/if \(key\.includes\("akku"\)\) \{[\s\S]*?\n  \}/)?.[0] ?? "";
  assert.doesNotMatch(branch, /flexibleren Standort/);
});

test("PDP-Version ist 2.2", () => {
  assert.match(experience, /data-product-experience="2\.2"/);
});

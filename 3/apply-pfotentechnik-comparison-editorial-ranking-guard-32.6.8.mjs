#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-comparison-editorial-ranking-guard-32.6.8";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}

const root = findRoot(process.cwd());
const target = path.join(
  root,
  "apps",
  "pfotentechnik",
  "src",
  "domain",
  "comparison",
  "buildComparisonViewModel.ts"
);

if (!fs.existsSync(target)) {
  throw new Error(`[${PATCH}] Datei fehlt: ${path.relative(root, target)}`);
}

let raw = fs.readFileSync(target, "utf8");

const oldBlock = `  const winnerCandidate =
    automaticRecommendation.winnerSlug ??
    data.recommendation.winnerSlug;
  const alternativeCandidate =
    automaticRecommendation.alternativeSlug ??
    data.recommendation.alternativeSlug;

  const resolvedWinnerSlug =
    winnerCandidate && eligibleItemSlugs.includes(winnerCandidate)
      ? winnerCandidate
      : eligibleItemSlugs[0];

  const resolvedAlternativeSlug =
    alternativeCandidate &&
    alternativeCandidate !== resolvedWinnerSlug &&
    eligibleItemSlugs.includes(alternativeCandidate)
      ? alternativeCandidate
      : eligibleItemSlugs.find((slug) => slug !== resolvedWinnerSlug);`;

const newBlock = `  /*
   * Editorial Ranking Guard 32.6.8
   *
   * Die globale Backlink-Union darf die Teilnehmermenge erweitern,
   * aber keine vorhandene redaktionelle Siegerentscheidung still
   * überschreiben.
   *
   * Priorität:
   * 1. explizit gepflegter recommendation.winnerSlug / alternativeSlug
   * 2. automatische Recommendation Engine
   * 3. erstes kaufbares kuratiertes item[]
   * 4. erst danach ein ergänztes Backlink-Produkt
   */
  const eligibleExplicitSlugs = explicitItems
    .filter((item) =>
      item.type === "product" &&
      recommendationEligible(item.slug)
    )
    .map((item) => item.slug);

  const winnerCandidate =
    data.recommendation.winnerSlug ??
    automaticRecommendation.winnerSlug;
  const alternativeCandidate =
    data.recommendation.alternativeSlug ??
    automaticRecommendation.alternativeSlug;

  const resolvedWinnerSlug =
    winnerCandidate && eligibleItemSlugs.includes(winnerCandidate)
      ? winnerCandidate
      : eligibleExplicitSlugs[0] ?? eligibleItemSlugs[0];

  const resolvedAlternativeSlug =
    alternativeCandidate &&
    alternativeCandidate !== resolvedWinnerSlug &&
    eligibleItemSlugs.includes(alternativeCandidate)
      ? alternativeCandidate
      : eligibleExplicitSlugs.find((slug) => slug !== resolvedWinnerSlug) ??
        eligibleItemSlugs.find((slug) => slug !== resolvedWinnerSlug);`;

if (!raw.includes(oldBlock)) {
  throw new Error(
    `[${PATCH}] Erwarteter Recommendation-Block nicht gefunden. ` +
    `Der lokale Stand weicht vom geprüften GitHub-Stand ab.`
  );
}

const backup = `${target}.${PATCH}.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
}

raw = raw.replace(oldBlock, newBlock);

// Remove the superseded duplicate 32.6.4 comment if present.
const staleComment = `  /*
   * Comparison Membership 32.6.4
   *
   * Safety-first Hybrid:
   * - kuratierte items[] bleiben vollständig erhalten
   * - explizite product.comparisons[]-Backlinks dürfen zusätzliche Produkte ergänzen
   * - kein bestehendes Produkt wird automatisch entfernt
   * - keine Volltext-Heuristik entscheidet über Mitgliedschaft
   * - technische Selection Rules werden in dieser Stufe noch nicht produktiv genutzt
   *
   * Damit gilt:
   * visible = curated items[] ∪ explicit product.comparisons[]
   */
`;
raw = raw.replace(staleComment, "");

fs.writeFileSync(target, raw, "utf8");

const reportDir = path.join(
  root,
  "apps",
  "pfotentechnik",
  "reports",
  "comparison-selection"
);
fs.mkdirSync(reportDir, { recursive: true });

const reportPath = path.join(
  reportDir,
  "comparison-editorial-ranking-guard-32.6.8.md"
);

fs.writeFileSync(reportPath, `# Comparison Editorial Ranking Guard 32.6.8

## Problem

Seit 32.6.7 darf product.comparisons[] die Teilnehmermenge eines Vergleichs
global ergänzen.

Die Recommendation Engine lief bereits auf dieser erweiterten Menge und hatte
bisher Vorrang vor einem explizit gepflegten recommendation.winnerSlug.

Dadurch hätte ein neu ergänztes Backlink-Produkt einen redaktionell gesetzten
Sieger still ersetzen können.

## Neue Priorität

1. Expliziter recommendation.winnerSlug / alternativeSlug
2. Automatic Recommendation Engine
3. Erstes kaufbares kuratiertes item[]
4. Ergänztes Backlink-Produkt erst als letzter Fallback

## Unverändert

- visible = items[] ∪ product.comparisons[]
- keine automatische Entfernung
- keine Volltext-Heuristik für Membership
- Registry bleibt unverändert
`, "utf8");

console.log(`[${PATCH}] Gepatcht: ${path.relative(root, target)}`);
console.log(`[${PATCH}] Redaktionelle Sieger haben wieder Vorrang.`);
console.log(`[${PATCH}] Backlink-Produkte bleiben als sichere Ergänzung sichtbar.`);
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] Fertig.`);

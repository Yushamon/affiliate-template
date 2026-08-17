#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-automatic-winner-resolution-32.6.21";

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

const anchor = `  const eligibleExplicitSlugs = explicitItems
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

const replacement = `  const eligibleExplicitSlugs = explicitItems
    .filter((item) =>
      item.type === "product" &&
      recommendationEligible(item.slug)
    )
    .map((item) => item.slug);

  /*
   * Automatic Winner Resolution 32.6.21
   *
   * winnerSlug ist ein redaktioneller Override, keine Pflichtpflege.
   * Wenn kein Override und kein fachlich spezialisierter automatischer
   * Sieger vorliegt, wird aus den bereits vorhandenen Produktbewertungen
   * ein belastbarer Sieger ermittelt.
   *
   * Spezialintents erhalten vorher Hard Gates. Ein Produkt kann also nicht
   * nur wegen eines hohen Basisscores einen Vergleich gewinnen, dessen
   * Kernanforderung es nach strukturierten Produktdaten nicht erfüllt.
   */
  const comparisonSlug = data.slug.toLocaleLowerCase("de");

  const matchesHardIntent = (product: ProductEntry): boolean => {
    const filters = product.data.comparisonFilters;
    const gps = product.data.gps;

    if (/mit-kamera/.test(comparisonSlug)) {
      return filters?.camera === true;
    }

    if (/ohne-abo/.test(comparisonSlug)) {
      return gps ? gps.subscriptionRequired === false : true;
    }

    if (/mit-akku|akkulaufzeit/.test(comparisonSlug)) {
      if (gps) return typeof gps.batteryMaxDays === "number";
      return filters?.backupPower === true;
    }

    if (/nassfutter/.test(comparisonSlug)) {
      return (filters?.foodType ?? []).includes("wet");
    }

    if (/ohne-wlan/.test(comparisonSlug)) {
      return filters?.app === false;
    }

    if (/fuer-katzen|für-katzen|katzen/.test(comparisonSlug)) {
      const animals = filters?.animal ?? gps?.animal ?? [];
      if (animals.length > 0 && !animals.includes("cat")) return false;
    }

    if (/fuer-hunde|für-hunde|hunde/.test(comparisonSlug)) {
      const animals = filters?.animal ?? gps?.animal ?? [];
      if (animals.length > 0 && !animals.includes("dog")) return false;
    }

    return true;
  };

  const scoreCandidates = eligibleItemSlugs
    .map((slug) => productBySlug.get(slug))
    .filter((product): product is ProductEntry => Boolean(product))
    .filter(matchesHardIntent)
    .map((product) => ({
      slug: product.data.slug,
      scoreResult: calculateProductScore(product.data)
    }))
    .filter((candidate) =>
      candidate.scoreResult.score !== null &&
      candidate.scoreResult.source !== "unrated"
    )
    .sort((a, b) => {
      const scoreDelta =
        (b.scoreResult.score ?? 0) - (a.scoreResult.score ?? 0);
      if (scoreDelta !== 0) return scoreDelta;

      const evidenceRank = (source: string) =>
        source === "score" ? 3 :
        source === "criteria" ? 2 :
        source === "rating" ? 1 : 0;

      const evidenceDelta =
        evidenceRank(b.scoreResult.source) -
        evidenceRank(a.scoreResult.source);
      if (evidenceDelta !== 0) return evidenceDelta;

      return b.scoreResult.criteriaCount - a.scoreResult.criteriaCount;
    });

  const scoreWinner =
    scoreCandidates[0] &&
    (scoreCandidates[0].scoreResult.score ?? 0) >= 60
      ? scoreCandidates[0]
      : undefined;

  const scoreAlternative = scoreCandidates.find(
    (candidate) => candidate.slug !== scoreWinner?.slug
  );

  const winnerCandidate =
    data.recommendation.winnerSlug ??
    automaticRecommendation.winnerSlug ??
    scoreWinner?.slug;

  const alternativeCandidate =
    data.recommendation.alternativeSlug ??
    automaticRecommendation.alternativeSlug ??
    scoreAlternative?.slug;

  const resolvedWinnerSlug =
    winnerCandidate && eligibleItemSlugs.includes(winnerCandidate)
      ? winnerCandidate
      : undefined;

  const resolvedAlternativeSlug =
    alternativeCandidate &&
    alternativeCandidate !== resolvedWinnerSlug &&
    eligibleItemSlugs.includes(alternativeCandidate)
      ? alternativeCandidate
      : undefined;`;

if (!raw.includes(anchor)) {
  throw new Error(
    `[${PATCH}] Erwarteter Winner-Block nicht gefunden. ` +
    `Falls 32.6.20 bereits installiert wurde, bitte Backup zurückspielen oder den aktuellen Stand senden.`
  );
}

const backup = `${target}.${PATCH}.bak`;
if (!fs.existsSync(backup)) {
  fs.copyFileSync(target, backup);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
}

raw = raw.replace(anchor, replacement);

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
  "automatic-winner-resolution-32.6.21.md"
);

fs.writeFileSync(reportPath, `# Automatic Winner Resolution 32.6.21

## Ziel

Vergleichssieger sollen sich beim Build automatisch aus den vorhandenen
Produktbewertungen aktualisieren. recommendation.winnerSlug bleibt nur ein
bewusster redaktioneller Override.

## Priorität der Siegerauflösung

1. recommendation.winnerSlug als expliziter Override
2. familienspezifische automaticRecommendation
3. zentraler score-basierter Automatic Winner Resolver
4. kein Sieger, wenn keine belastbare Bewertung vorhanden ist

Die bisherige Regel "erstes kaufbares Produkt gewinnt" entfällt vollständig.

## Score-Basis

Verwendet wird calculateProductScore(product.data).

Akzeptierte Quellen:

- score
- criteria
- rating

unrated wird ausgeschlossen.

Ein automatischer Score-Sieger benötigt mindestens 60/100.

Bei Score-Gleichstand gilt:

1. expliziter score
2. Kriterienbewertung
3. einzelnes rating
4. höhere Zahl bewerteter Kriterien

## Intent Hard Gates

Vor dem Ranking werden eindeutige Spezialanforderungen berücksichtigt:

- mit-kamera => comparisonFilters.camera === true
- ohne-abo => GPS subscriptionRequired === false
- mit-akku / Akkulaufzeit => GPS-Akkudaten bzw. backupPower
- Nassfutter => foodType enthält wet
- ohne-WLAN => app === false
- Katzen-/Hundevergleiche => strukturierte Tierart darf nicht widersprechen

Fehlende Tierart schließt ein Produkt nicht aus. Ein expliziter Widerspruch
dagegen schon.

## Ergebnis

Damit können auch Produktfamilien ohne eigene Recommendation Engine, etwa
Haustierkameras, automatisch einen sinnvollen Top-Kandidaten aus den
vorhandenen Bewertungen bestimmen.

Kein manueller winnerSlug ist für den Normalbetrieb erforderlich.

## Sicherheit

- Membership unverändert
- keine Produkte aus Vergleichen gelöscht
- Ratings unverändert
- Filter unverändert
- redaktionelle Overrides bleiben möglich
- kein Fallback auf erstes item[]
`, "utf8");

console.log(`[${PATCH}] Gepatcht: ${path.relative(root, target)}`);
console.log(`[${PATCH}] Zentraler score-basierter Winner Resolver aktiviert.`);
console.log(`[${PATCH}] Erstes item[] wird nicht mehr automatisch Sieger.`);
console.log(`[${PATCH}] recommendation.winnerSlug ist nur noch Override.`);
console.log(`[${PATCH}] Intent Hard Gates aktiviert.`);
console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] Fertig.`);

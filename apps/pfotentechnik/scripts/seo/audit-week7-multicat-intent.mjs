#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");
const content = path.join(app, "src", "content");
const checks = [];

const normalize = (value) =>
  String(value).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
const read = (file) => normalize(fs.readFileSync(file, "utf8"));
const check = (name, ok, detail = "") =>
  checks.push({ name, ok, detail });

function splitDocument(text) {
  const match = normalize(text).match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  return match ? { frontmatter: match[1], body: match[2] } : null;
}

function topLevelValue(frontmatter, key) {
  const match = frontmatter.match(
    new RegExp(
      `^${key}:\\s*(?:"([^"]*)"|'([^']*)'|([^\\n#]+))\\s*$`,
      "m"
    )
  );
  return (match?.[1] ?? match?.[2] ?? match?.[3])?.trim() || "";
}

function nestedValue(frontmatter, blockName, key) {
  const lines = frontmatter.split("\n");
  const start = lines.findIndex((line) => line === `${blockName}:`);
  if (start < 0) return "";

  let end = start + 1;
  while (
    end < lines.length &&
    (lines[end].startsWith(" ") || lines[end].trim() === "")
  ) {
    end += 1;
  }

  const block = lines.slice(start + 1, end).join("\n");
  const match = block.match(
    new RegExp(
      `^  ${key}:\\s*(?:"([^"]*)"|'([^']*)'|([^\\n#]+))\\s*$`,
      "m"
    )
  );
  return (match?.[1] ?? match?.[2] ?? match?.[3])?.trim() || "";
}

function itemCount(frontmatter) {
  const lines = frontmatter.split("\n");
  const start = lines.findIndex((line) => line === "items:");
  if (start < 0) return 0;

  let end = start + 1;
  while (
    end < lines.length &&
    (lines[end].startsWith(" ") || lines[end].trim() === "")
  ) {
    end += 1;
  }

  return lines
    .slice(start + 1, end)
    .filter((line) => /^  - slug:/.test(line))
    .length;
}

function duplicateCardNavigation(frontmatter) {
  const lines = frontmatter.split("\n");
  const duplicates = [];

  for (let index = 0; index < lines.length; index += 1) {
    const item = lines[index].match(/^(\s*)-\s+(?:label|title):\s+/);
    if (!item) continue;

    const itemIndent = item[1].length;
    const directIndent = " ".repeat(itemIndent + 2);
    const seen = new Set();

    let end = index + 1;
    while (end < lines.length) {
      const line = lines[end];
      const sibling = line.match(/^(\s*)-\s+/);
      if (sibling && sibling[1].length === itemIndent) break;
      if (
        line.trim() &&
        (line.match(/^\s*/)?.[0].length ?? 0) < itemIndent
      ) break;

      if (line.startsWith(directIndent)) {
        const rest = line.slice(directIndent.length);
        if (!/^\s/.test(rest)) {
          const key = rest.match(/^([A-Za-z][A-Za-z0-9_-]*):/)?.[1];
          if (key === "href" || key === "cta") {
            if (seen.has(key)) duplicates.push(`${key}@${end + 1}`);
            else seen.add(key);
          }
        }
      }
      end += 1;
    }
    index = end - 1;
  }

  return duplicates;
}

const guideFile = path.join(content, "pages", "futterautomat-fuer-zwei-katzen.md");
const comparisonFile = path.join(content, "comparisons", "beste-futterautomaten-fuer-zwei-katzen.md");
const multiFile = path.join(content, "pages", "beste-futterautomaten-fuer-mehrtierhaushalte.md");
const hubFile = path.join(content, "pages", "smarte-futterautomaten.md");

for (const [label, file] of [
  ["Guide", guideFile],
  ["Comparison", comparisonFile],
  ["Mehrtierseite", multiFile],
  ["Cornerstone", hubFile]
]) {
  check(`${label}: Datei vorhanden`, fs.existsSync(file), file);
}

const guide = splitDocument(read(guideFile));
const comparison = splitDocument(read(comparisonFile));
const multi = splitDocument(read(multiFile));
const hub = splitDocument(read(hubFile));

check("Guide-Frontmatter parsebar", Boolean(guide));
check("Comparison-Frontmatter parsebar", Boolean(comparison));
check("Mehrtier-Frontmatter parsebar", Boolean(multi));
check("Hub-Frontmatter parsebar", Boolean(hub));

if (guide) {
  const title = topLevelValue(guide.frontmatter, "seoTitle");
  const description = topLevelValue(guide.frontmatter, "seoDescription");
  check("Guide-Title 40–65 Zeichen", title.length >= 40 && title.length <= 65, String(title.length));
  check("Guide-Description 120–170 Zeichen", description.length >= 120 && description.length <= 170, String(description.length));
  check("Guide beantwortet Bauart-Intent", guide.body.includes("## Doppelschale, zwei Automaten oder Mikrochip?"));
  check("Guide verlinkt Comparison", guide.body.includes("/vergleiche/beste-futterautomaten-fuer-zwei-katzen/"));
  check("Guide verlinkt breite Mehrtierseite", guide.body.includes("/beste-futterautomaten-fuer-mehrtierhaushalte/"));
}

if (comparison) {
  const title = nestedValue(comparison.frontmatter, "seo", "title");
  const description = nestedValue(comparison.frontmatter, "seo", "description");
  check("Comparison-Title 40–65 Zeichen", title.length >= 40 && title.length <= 65, String(title.length));
  check("Comparison-Description 120–170 Zeichen", description.length >= 120 && description.length <= 170, String(description.length));
  check("Comparison genau 5 Systeme", itemCount(comparison.frontmatter) === 5, String(itemCount(comparison.frontmatter)));
  check("Comparison automatische Erweiterung aus", /automaticRecommendations:\n\s+enabled:\s+false/.test(comparison.frontmatter));
  check("Comparison verlinkt Guide", comparison.body.includes("/futterautomat-fuer-zwei-katzen/"));
  check("Comparison kein pauschaler Gesamtsieger", comparison.body.includes("keinen sinnvollen Gesamtsieger"));
}

if (multi) {
  const title = topLevelValue(multi.frontmatter, "title");
  const seoTitle = topLevelValue(multi.frontmatter, "seoTitle");
  check("Mehrtierseite ohne Beste-Title", !/^Beste\b/i.test(title));
  check("Mehrtier-SEO-Title 40–65 Zeichen", seoTitle.length >= 40 && seoTitle.length <= 65, String(seoTitle.length));
  check("Mehrtierseite klar breit positioniert", multi.body.includes("breiten Mehrtierhaushalt"));
  check("Mehrtierseite verlinkt Zwei-Katzen-Guide", multi.body.includes("/futterautomat-fuer-zwei-katzen/"));
  check("Mehrtierseite verlinkt Zwei-Katzen-Comparison", multi.body.includes("/vergleiche/beste-futterautomaten-fuer-zwei-katzen/"));
  check("Mehrtierseite enthält Hund-und-Katze-FAQ", multi.frontmatter.includes("Welcher Futterautomat eignet sich für Hund und Katze?"));
}

if (hub) {
  check("Hub verlinkt Guide", hub.frontmatter.includes('href: "/futterautomat-fuer-zwei-katzen/"'));
  check("Hub verlinkt Comparison", hub.body.includes("/vergleiche/beste-futterautomaten-fuer-zwei-katzen/"));
  check("Hub verlinkt breite Mehrtierseite", hub.body.includes("/beste-futterautomaten-fuer-mehrtierhaushalte/"));
  const duplicates = duplicateCardNavigation(hub.frontmatter);
  check("Hub ohne doppelte Karten-Navigation", duplicates.length === 0, duplicates.join(", "));
}

const packageData = JSON.parse(
  read(path.join(app, "package.json"))
);
check(
  "npm-Audit-Befehl vorhanden",
  packageData.scripts?.["audit:multicat-intent"] ===
    "node scripts/seo/audit-week7-multicat-intent.mjs"
);

const failed = checks.filter((entry) => !entry.ok);
for (const entry of checks) {
  console.log(
    `${entry.ok ? "OK" : "FEHLER"}  ${entry.name}${entry.detail ? ` (${entry.detail})` : ""}`
  );
}

if (failed.length) {
  console.error(`\n${failed.length} Mehrkatzen-SEO-Prüfung(en) fehlgeschlagen.`);
  process.exit(1);
}

console.log("\nWoche-7-Mehrkatzen-Intent-Audit erfolgreich.");

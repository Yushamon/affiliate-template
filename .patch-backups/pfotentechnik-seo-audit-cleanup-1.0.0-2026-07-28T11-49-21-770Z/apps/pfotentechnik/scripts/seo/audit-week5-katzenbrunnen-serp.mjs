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
const check = (name, ok, detail = "") => checks.push({ name, ok, detail });

function splitDocument(text) {
  const match = normalize(text).match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) return null;
  return { frontmatter: match[1], body: match[2] };
}

function topLevelScalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^${key}:\\s*["']?([^\\n"']+)["']?$`, "m"));
  return match?.[1]?.trim();
}

function seoValue(frontmatter, key) {
  const lines = frontmatter.split("\n");
  const start = lines.findIndex((line) => line === "seo:");
  if (start < 0) return undefined;

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
      `^  ${key}:\\s*(?:"([^"]*)"|'([^']*)'|([^\\n]+))$`,
      "m"
    )
  );

  return (match?.[1] ?? match?.[2] ?? match?.[3])?.trim();
}

const pageSlugs = [
  "trinkbrunnen-fuer-mehrere-katzen",
  "wie-viele-wasserstellen-katze",
  "katzentrinkbrunnen-richtig-reinigen",
  "biofilm-im-katzentrinkbrunnen",
  "kalk-katzentrinkbrunnen-entfernen",
  "filter-im-katzentrinkbrunnen-wechseln",
  "katzentrinkbrunnen-laut-pumpe",
  "katzentrinkbrunnen-material-edelstahl-keramik-kunststoff"
];

for (const slug of pageSlugs) {
  const file = path.join(content, "pages", `${slug}.md`);
  check(`${slug}: Datei vorhanden`, fs.existsSync(file));
  if (!fs.existsSync(file)) continue;
  const parsed = splitDocument(read(file));
  check(`${slug}: Frontmatter parsebar`, Boolean(parsed));
  if (!parsed) continue;

  const seoTitle = seoValue(parsed.frontmatter, "title") ?? "";
  const seoDescription = seoValue(parsed.frontmatter, "description") ?? "";
  check(
    `${slug}: SEO-Title 35–65 Zeichen`,
    seoTitle.length >= 35 && seoTitle.length <= 65,
    String(seoTitle.length)
  );
  check(
    `${slug}: Description 110–170 Zeichen`,
    seoDescription.length >= 110 && seoDescription.length <= 170,
    String(seoDescription.length)
  );
  check(
    `${slug}: Vergleich verlinkt`,
    parsed.body.includes("/vergleiche/beste-trinkbrunnen-fuer-katzen/")
  );
  check(
    `${slug}: hohe Linkpriorität`,
    /^  priority:\s*["']high["']$/m.test(parsed.frontmatter)
  );
}

const comparisonFile = path.join(
  content,
  "comparisons",
  "beste-trinkbrunnen-fuer-katzen.md"
);
const comparison = read(comparisonFile);
const slugs = [
  ...comparison.matchAll(/^  - slug:\s*["']([^"']+)["']/gm)
].map((match) => match[1]);

const expectedSlugs = [
  "petkit-eversweet-solo-2-fountain",
  "oneisall-3-2l-cordless-fountain",
  "petkit-eversweet-max-2-uvc",
  "petkit-eversweet-ultra",
  "petlibro-stainless-steel-fountain",
  "cat-mate-335-pet-fountain"
];

check("Comparison hat genau 6 Modelle", slugs.length === 6, String(slugs.length));
check("Comparison-Slugs eindeutig", new Set(slugs).size === slugs.length);
check(
  "Comparison enthält erwartete Modelle",
  expectedSlugs.every((slug) => slugs.includes(slug))
);
check("Comparison ohne Großhund-Modell", !comparison.includes("oneisall-7l-dog-water-fountain"));
check(
  "Comparison ohne Nicht-dokumentiert-Chips",
  !/value:\s*["']Nicht dokumentiert["']/i.test(comparison) &&
    !/^\s+overrides:\s*$/m.test(comparison)
);
check(
  "Comparison automatische Erweiterung deaktiviert",
  /automaticRecommendations:\n\s+enabled:\s+false/.test(comparison)
);
check(
  "Comparison-Snippet nennt 6 Modelle",
  comparison.includes("Katzenbrunnen im Vergleich: 6 Modelle für Katzen")
);

const hub = read(path.join(content, "pages", "trinkbrunnen.md"));
check(
  "Hub verlinkt Katzen-Comparison",
  hub.includes("/vergleiche/beste-trinkbrunnen-fuer-katzen/")
);
check(
  "Hub enthält Problemlöser-Tabelle",
  hub.includes("## Katzenbrunnen gezielt auswählen und pflegen")
);
check(
  "Hub verlinkt Mehrkatzen-Ratgeber",
  hub.includes("/trinkbrunnen-fuer-mehrere-katzen/")
);
check(
  "Hub verlinkt Reinigung",
  hub.includes("/katzentrinkbrunnen-richtig-reinigen/")
);

const pageDirectory = path.join(content, "pages");
const inboundSources = fs.readdirSync(pageDirectory)
  .filter((name) => name.endsWith(".md"))
  .filter((name) =>
    read(path.join(pageDirectory, name))
      .includes("/vergleiche/beste-trinkbrunnen-fuer-katzen/")
  );
check(
  "Mindestens 9 Page-Inbounds zur Katzen-Comparison",
  inboundSources.length >= 9,
  String(inboundSources.length)
);

const packageData = JSON.parse(read(path.join(app, "package.json")));
check(
  "npm-Audit-Befehl vorhanden",
  packageData.scripts?.["audit:cat-fountain-serp"] ===
    "node scripts/seo/audit-week5-katzenbrunnen-serp.mjs"
);

const failed = checks.filter((entry) => !entry.ok);
for (const entry of checks) {
  console.log(
    `${entry.ok ? "OK" : "FEHLER"}  ${entry.name}${entry.detail ? ` (${entry.detail})` : ""}`
  );
}

if (failed.length) {
  console.error(`\n${failed.length} Katzenbrunnen-SEO-Prüfung(en) fehlgeschlagen.`);
  process.exit(1);
}

console.log("\nWoche-5-Katzenbrunnen-Audit erfolgreich.");

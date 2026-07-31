import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const ROOT = path.resolve(import.meta.dirname, "..");
const failures = [];
const checks = [];

const read = (relativePath) =>
  fs.readFileSync(path.join(ROOT, relativePath), "utf8");

const requirePattern = (relativePath, pattern, label) => {
  const source = read(relativePath);
  const ok = pattern.test(source);
  checks.push({ ok, label });
  if (!ok) failures.push(`${label} (${relativePath})`);
};

requirePattern(
  "src/pages/[slug].astro",
  /<EditorialTransparency[\s\S]*?kind="ratgeber"/,
  "Ratgeber zeigen die redaktionelle Transparenz"
);
requirePattern(
  "src/pages/produkt/[product].astro",
  /<EditorialTransparency[\s\S]*?testStatus=\{contentProduct\.testStatus\}/,
  "Produktseiten zeigen Prüfart und Nachweisbasis"
);
requirePattern(
  "src/pages/vergleiche/[comparison].astro",
  /<EditorialTransparency[\s\S]*?kind="vergleich"/,
  "Vergleiche zeigen die redaktionelle Transparenz"
);
requirePattern(
  "src/content/pages/so-bewerten-wir.md",
  /(?=[\s\S]*Bewertungssystem: 0 bis 100 Punkte)(?=[\s\S]*Grundgewichtung)(?=[\s\S]*Affiliate-Provisionen)/,
  "Methodik dokumentiert Skala, Gewichtung und Affiliate-Trennung"
);
requirePattern(
  "src/pages/affiliate-hinweis.astro",
  /Unsere Trennungsregeln[\s\S]*?höhere mögliche Provision/,
  "Affiliate-Hinweis nennt verbindliche Trennungsregeln"
);
requirePattern(
  "src/pages/redaktion.astro",
  /Was „getestet“ bei uns bedeutet[\s\S]*?Korrekturen und Aktualisierungen/,
  "Redaktionsseite erklärt Prüfbegriffe und Korrekturprozess"
);
requirePattern(
  "src/project.config.ts",
  /defaultAuthor:[\s\S]*?\/redaktion\//,
  "Standardautor verweist auf die Redaktionsseite"
);

const productDirectory = path.join(ROOT, "src/content/products");
const productFiles = fs.readdirSync(productDirectory)
  .filter((name) => /\.mdx?$/i.test(name));

for (const file of productFiles) {
  const source = fs.readFileSync(path.join(productDirectory, file), "utf8");
  if (!/^testStatus:\s*["']?(?:hands-on|editorial-review|manufacturer-data|long-term-test|not-tested)["']?\s*$/m.test(source)) {
    failures.push(`Prüfart fehlt oder ist ungültig (${file})`);
  }
  if (!/^updatedAt:\s*"\d{4}-\d{2}-\d{2}"/m.test(source)) {
    failures.push(`Inhaltlicher Stand fehlt (${file})`);
  }
}

checks.push({
  ok: !failures.some((message) => message.includes(".md")),
  label: `${productFiles.length} Produktseiten haben Prüfart und Aktualisierungsstand`
});

for (const check of checks) {
  console.log(`${check.ok ? "OK" : "FEHLER"}  ${check.label}`);
}

if (failures.length) {
  console.error(`\nEditorial-Transparency-Audit fehlgeschlagen (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exitCode = 1;
} else {
  console.log("\nEditorial-Transparency-Audit erfolgreich.");
}

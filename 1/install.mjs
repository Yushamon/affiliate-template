#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = process.cwd();
const app = path.join(repo, "apps", "pfotentechnik");
const route = path.join(app, "src", "pages", "produkt", "[product].astro");
const payload = path.join(here, "payload");
const backupRoot = path.join(
  repo,
  ".patch-backups",
  `product-page-polish-2.4-${Date.now()}`
);
const changed = [];

if (!fs.existsSync(path.join(app, "package.json"))) {
  console.error("Bitte im Root von Yushamon/affiliate-template ausführen.");
  process.exit(1);
}

if (!fs.existsSync(route)) {
  console.error("Produktseitenroute nicht gefunden: " + route);
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

function backupFile(target) {
  const rel = path.relative(repo, target);
  const backup = path.join(backupRoot, rel);
  if (fs.existsSync(target)) {
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(target, backup);
    return backup;
  }
  return null;
}

function rememberAndWrite(target, content) {
  const backup = backupFile(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  changed.push({ target, backup });
}

function rollback() {
  for (const item of changed.reverse()) {
    if (item.backup && fs.existsSync(item.backup)) {
      fs.mkdirSync(path.dirname(item.target), { recursive: true });
      fs.copyFileSync(item.backup, item.target);
    } else if (fs.existsSync(item.target)) {
      fs.rmSync(item.target, { force: true });
    }
  }
}

try {
  for (const source of walk(payload)) {
    const rel = path.relative(payload, source);
    const target = path.join(repo, rel);
    rememberAndWrite(target, fs.readFileSync(source));
    console.log(`✓ ${rel}`);
  }

  let text = fs.readFileSync(route, "utf8");
  const original = text;

  // Präsentations-Fix importieren.
  if (!text.includes('ProductPagePresentationFix.astro')) {
    const importLine =
      'import ProductPagePresentationFix from "../../components/ProductPagePresentationFix.astro";\n';

    const projectLayoutImport =
      'import ProjectLayout from "../../layouts/ProjectLayout.astro";';

    if (!text.includes(projectLayoutImport)) {
      throw new Error("Sicherer Import-Anker in [product].astro nicht gefunden");
    }

    text = text.replace(
      projectLayoutImport,
      `${projectLayoutImport}\n${importLine.trimEnd()}`
    );
  }

  // Debug niemals standardmäßig aktivieren.
  text = text.replace(
    /debug=\{import\.meta\.env\.DEV\}/g,
    'debug={false}'
  );

  // Bestehende Scores konsistent auf 100 skalieren.
  if (!text.includes("const productScore100")) {
    const anchor = "const reviewProduct = {";
    if (!text.includes(anchor)) {
      throw new Error("reviewProduct-Block nicht gefunden");
    }

    const helper = `const productScoreRaw = Number(contentProduct.score ?? contentProduct.rating ?? 0);
const productScore100 =
  productScoreRaw > 0 && productScoreRaw <= 10
    ? Math.round(productScoreRaw * 10)
    : Math.max(0, Math.min(100, Math.round(productScoreRaw)));

const productSuitabilityLabels = Array.from(new Set([
  ...(Array.isArray(contentProduct.decision?.bestFor)
    ? contentProduct.decision.bestFor
    : []),
  ...(Array.isArray(contentProduct.petSize)
    ? contentProduct.petSize
    : contentProduct.petSize
      ? [contentProduct.petSize]
      : []),
  ...(contentProduct.animal
    ? [contentProduct.animal]
    : [])
]))
  .map((value) => String(value).trim())
  .filter(Boolean)
  .slice(0, 4);

const compactProductSpecs = (() => {
  const source = contentProduct.specs ?? {};
  const entries = Array.isArray(source)
    ? source
    : Object.entries(source).map(([label, value]) => ({
        label,
        value:
          value && typeof value === "object"
            ? value.value ?? value.label ?? value.text ?? ""
            : value
      }));

  const blocked = new Set([
    "status",
    "prüfstatus",
    "teststatus",
    "bewertungsstatus"
  ]);

  const normalized = entries
    .map((item) => ({
      ...item,
      label: String(item?.label ?? item?.title ?? item?.name ?? "").trim(),
      value: String(item?.value ?? item?.text ?? item?.description ?? "").trim()
    }))
    .filter((item) =>
      item.label &&
      item.value &&
      !blocked.has(item.label.toLowerCase()) &&
      item.value.toLowerCase() !== "editorial-review"
    )
    .map((item) => ({
      ...item,
      value:
        item.value.length > 92
          ? \`\${item.value.slice(0, 89).trim()}…\`
          : item.value
    }))
    .slice(0, 8);

  if (productSuitabilityLabels.length) {
    normalized.unshift({
      label: "Geeignet für",
      value: productSuitabilityLabels.join(", ")
    });
  }

  return normalized.slice(0, 8);
})();

`;
    text = text.replace(anchor, helper + anchor);
  }

  // Sternebewertung nicht mehr an ProductReview übergeben.
  text = text.replace(
    /rating:\s*contentProduct\.rating,/g,
    "rating: undefined,"
  );

  // 100er-Score statt fehlerhafter /10-Darstellung.
  text = text.replace(
    /score:\s*contentProduct\.score\s*\?\?\s*0,/g,
    "score: productScore100,"
  );

  // Kompakte, redaktionell geeignete Kurzfakten.
  text = text.replace(
    /specs:\s*contentProduct\.specs,/g,
    "specs: compactProductSpecs,"
  );

  // Falls die aktuelle Route den internen Status direkt durchreicht.
  text = text.replace(
    /status:\s*contentProduct\.(?:testStatus|productStatus),?/g,
    ""
  );

  // Doppelte Prüf-/Trust-Komponente aus der Route entfernen.
  text = text.replace(
    /import ProductTrustPanel from "\.\.\/\.\.\/components\/ProductTrustPanel\.astro";\r?\n/g,
    ""
  );
  text = text.replace(
    /\s*<ProductTrustPanel[\s\S]*?\/>\s*/g,
    "\n"
  );

  // Fix-Komponente einmalig am Seitenende innerhalb des Layouts einfügen.
  if (!text.includes("<ProductPagePresentationFix")) {
    const closeLayout = "</ProjectLayout>";
    if (!text.includes(closeLayout)) {
      throw new Error("ProjectLayout-Ende nicht gefunden");
    }
    text = text.replace(
      closeLayout,
      '  <ProductPagePresentationFix rootSelector="main" />\n</ProjectLayout>'
    );
  }

  if (text === original) {
    throw new Error("Die Route konnte nicht geändert werden");
  }

  rememberAndWrite(route, text);
  console.log("✓ apps/pfotentechnik/src/pages/produkt/[product].astro");

  console.log("\nPrüfe Build …");
  const result = spawnSync("npm", ["run", "build:pfotentechnik"], {
    cwd: repo,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    throw new Error("Build fehlgeschlagen");
  }

  console.log("\nProduct Page Polish 2.4 installiert.");
  console.log("- keine Sternebewertung");
  console.log("- Bewertung konsistent auf /100");
  console.log("- keine sichtbaren internen Statuswerte");
  console.log("- Geeignet-für-Angabe ergänzt");
  console.log("- Kurzfakten gekürzt und Raster stabilisiert");
  console.log("- doppelter ProductTrustPanel entfernt");
  console.log(`Backup: ${backupRoot}`);
} catch (error) {
  console.error(`\n${error.message}. Rollback wird ausgeführt …`);
  rollback();
  process.exit(1);
}

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NAME = "pfotentechnik-anchor-governance-and-release-gate-1.0.10";
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");

const COMPARISON_ROUTE = path.join(
  APP,
  "src",
  "pages",
  "vergleiche",
  "[comparison].astro"
);

const TECHNICAL_AUDIT = path.join(
  APP,
  "scripts",
  "seo",
  "audit-week4-technical-seo.mjs"
);

const COMPARISON_SCHEMA_AUDIT = path.join(
  APP,
  "scripts",
  "seo",
  "audit-comparison-product-schema.mjs"
);

const BACKUP_ROOT = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const changed = [];

const log = (message = "") =>
  console.log(`[${NAME}] ${message}`.trimEnd());

const fail = (message) => {
  console.error(`\n[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};

const rel = (file) =>
  path.relative(ROOT, file).replace(/\\/g, "/");

function read(file) {
  if (!fs.existsSync(file)) {
    fail(`Erwartete Datei fehlt: ${rel(file)}`);
  }
  return fs.readFileSync(file, "utf8");
}

function backup(file) {
  const target = path.join(BACKUP_ROOT, rel(file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function writeIfChanged(file, source, updated) {
  if (source === updated) {
    log(`Unverändert: ${rel(file)}`);
    return;
  }

  backup(file);
  fs.writeFileSync(file, updated, "utf8");
  changed.push(rel(file));
  log(`Geändert: ${rel(file)}`);
}

function run(command, args, options = {}) {
  log(`Ausführen: ${command} ${args.join(" ")}`);

  const result = spawnSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: {
      ...process.env,
      FORCE_COLOR: "0",
      ...(options.env ?? {})
    }
  });

  if (result.error) {
    fail(
      `${command} konnte nicht gestartet werden: ` +
      result.error.message
    );
  }

  if (result.status !== 0 && !options.allowFailure) {
    fail(
      `Befehl fehlgeschlagen (${result.status}): ` +
      `${command} ${args.join(" ")}`
    );
  }

  return result;
}

log("Vorprüfung");

for (const file of [
  path.join(ROOT, "package.json"),
  path.join(APP, "package.json"),
  COMPARISON_ROUTE,
  TECHNICAL_AUDIT,
  COMPARISON_SCHEMA_AUDIT
]) {
  if (!fs.existsSync(file)) {
    fail(`Repository-Struktur unvollständig: ${rel(file)}`);
  }
}

/* 1. Product-Verschachtelung aus Vergleichs-ItemList zurückrollen. */
{
  const source = read(COMPARISON_ROUTE);

  const productBlock = `  itemListElement: model.products.map((product, index) => {
    const productUrl = new URL(
      product.href,
      Astro.site ?? Astro.url
    ).href;

    return {
      "@type": "ListItem",
      position: index + 1,
      name: product.title,
      url: productUrl,
      item: {
        "@type": "Product",
        "@id": \`\${productUrl}#product\`,
        name: product.title,
        url: productUrl
      }
    };
  })`;

  const directListItemBlock = `  itemListElement: model.products.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: product.title,
    url: new URL(product.href, Astro.site ?? Astro.url).href
  }))`;

  let updated = source;

  if (source.includes(productBlock)) {
    updated = source.replace(productBlock, directListItemBlock);
  } else if (!source.includes(directListItemBlock)) {
    fail(
      "Die Comparison-ItemList entspricht weder Version 1.0.9 " +
      "noch der erwarteten direkten ListItem-Struktur."
    );
  }

  writeIfChanged(COMPARISON_ROUTE, source, updated);
}

/* 2. Veralteten Source-Check auf direkte ListItems ausrichten. */
{
  const source = read(TECHNICAL_AUDIT);

  const oldCheck = `check(
  "ItemList enthält Product-Items",
  /itemListElement:[\\s\\S]*?item:[\\s\\S]*?["@']@type["@']:\\s*["@']Product["@']/m.test(comparisonRoute)
);`;

  const newCheck = `check(
  "ItemList enthält direkte Produktverweise",
  /itemListElement:[\\s\\S]*?["@']@type["@']:\\s*["@']ListItem["@'][\\s\\S]*?name:\\s*product\\.title[\\s\\S]*?url:\\s*new URL\\(product\\.href,/m.test(comparisonRoute) &&
    !/itemListElement:[\\s\\S]*?item:\\s*\\{/m.test(comparisonRoute) &&
    !/itemListElement:[\\s\\S]*?["@']@type["@']:\\s*["@']Product["@']/m.test(comparisonRoute)
);`;

  let updated = source;

  if (source.includes(oldCheck)) {
    updated = source.replace(oldCheck, newCheck);
  } else if (!source.includes('"ItemList enthält direkte Produktverweise"')) {
    fail(
      "Der veraltete ItemList-Source-Check wurde nicht gefunden."
    );
  }

  writeIfChanged(TECHNICAL_AUDIT, source, updated);
}

/* 3. /vergleiche/index.html aus Detailseiten-Schema-Audit ausnehmen. */
{
  const source = read(COMPARISON_SCHEMA_AUDIT);

  const oldLoop = `for (const file of htmlFiles(path.join(app, "dist", "vergleiche"))) {
  const html = fs.readFileSync(file, "utf8");`;

  const newLoop = `for (const file of htmlFiles(path.join(app, "dist", "vergleiche"))) {
  const relativeComparisonFile = path
    .relative(path.join(app, "dist", "vergleiche"), file)
    .replace(/\\\\/g, "/");

  // Die Hub-/Indexseite ist keine einzelne Vergleichsdetailseite und
  // benötigt daher kein Produkt-ItemList nach dem Detailseitenvertrag.
  if (relativeComparisonFile === "index.html") continue;

  const html = fs.readFileSync(file, "utf8");`;

  let updated = source;

  if (source.includes(oldLoop)) {
    updated = source.replace(oldLoop, newLoop);
  } else if (!source.includes('relativeComparisonFile === "index.html"')) {
    fail(
      "Der Schleifenanker im Comparison-Schema-Audit wurde nicht gefunden."
    );
  }

  writeIfChanged(COMPARISON_SCHEMA_AUDIT, source, updated);
}

/* Nachprüfung */
const comparisonSource = read(COMPARISON_ROUTE);
if (
  comparisonSource.includes('"@type": "Product"') ||
  comparisonSource.includes("item: {") ||
  comparisonSource.includes("#product")
) {
  fail(
    "Comparison-ItemList enthält nach dem Rollback weiterhin Product-Markup."
  );
}

for (const required of [
  '"@type": "ItemList"',
  '"@type": "ListItem"',
  "position: index + 1",
  "name: product.title",
  "url: new URL(product.href, Astro.site ?? Astro.url).href"
]) {
  if (!comparisonSource.includes(required)) {
    fail(`Comparison-ItemList-Anforderung fehlt: ${required}`);
  }
}

if (
  !read(TECHNICAL_AUDIT).includes(
    '"ItemList enthält direkte Produktverweise"'
  )
) {
  fail("Der technische Source-Audit wurde nicht korrekt aktualisiert.");
}

if (
  !read(COMPARISON_SCHEMA_AUDIT).includes(
    'relativeComparisonFile === "index.html"'
  )
) {
  fail("Die Vergleichs-Indexseite wird noch nicht korrekt ausgenommen.");
}

run(process.execPath, ["--check", TECHNICAL_AUDIT]);
run(process.execPath, ["--check", COMPARISON_SCHEMA_AUDIT]);

run(
  "npm",
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "audit:technical-seo:source"
  ]
);

run(
  "npm",
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "build"
  ],
  {
    env: {
      PFOTENTECHNIK_FAST_BUILD: "0"
    }
  }
);

run(
  "npm",
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "audit:comparison-schema"
  ]
);

run(
  "npm",
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "comparison:data:audit:strict"
  ]
);

run(
  "npm",
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "comparison:audit:strict"
  ]
);

run(
  "npm",
  [
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "seo:release:check"
  ],
  {
    env: {
      PFOTENTECHNIK_FAST_BUILD: "0"
    }
  }
);

log("");
log("ABGESCHLOSSEN.");
log("Die fehlerhafte Product-Verschachtelung aus 1.0.9 wurde zurückgerollt.");
log("Comparison-ItemLists verwenden wieder direkte ListItem-URLs.");
log("Der technische Source-Check prüft jetzt den gültigen Schema-Vertrag.");
log("/vergleiche/index.html wird nicht mehr als Vergleichsdetailseite behandelt.");
log("Product-Seitenschemata, sichtbares Layout und Vergleichsreihenfolge blieben unverändert.");
log(`Geänderte Dateien: ${changed.length}`);
for (const file of changed) log(`- ${file}`);
if (changed.length) log(`Backups: ${rel(BACKUP_ROOT)}`);
log("Kein Commit, kein Push und kein Pull Request wurden erstellt.");

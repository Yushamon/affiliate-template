#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const NAME = "pfotentechnik-anchor-governance-and-release-gate-1.0.9";
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const COMPARISON_ROUTE = path.join(
  APP,
  "src",
  "pages",
  "vergleiche",
  "[comparison].astro"
);
const BACKUP_ROOT = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

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
  COMPARISON_ROUTE
]) {
  if (!fs.existsSync(file)) {
    fail(`Repository-Struktur unvollständig: ${rel(file)}`);
  }
}

let source = read(COMPARISON_ROUTE);

const oldBlock = `  itemListElement: model.products.map((product, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: product.title,
    url: new URL(product.href, Astro.site ?? Astro.url).href
  }))`;

const newBlock = `  itemListElement: model.products.map((product, index) => {
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

if (source.includes(newBlock)) {
  log("Product-Items sind bereits im ItemList-Schema vorhanden.");
} else {
  if (!source.includes(oldBlock)) {
    fail(
      "Der erwartete ItemList-Codeblock wurde nicht gefunden. " +
      "Es wurde nichts verändert."
    );
  }

  backup(COMPARISON_ROUTE);
  source = source.replace(oldBlock, newBlock);
  fs.writeFileSync(COMPARISON_ROUTE, source, "utf8");
  log(`Geändert: ${rel(COMPARISON_ROUTE)}`);
}

const updated = read(COMPARISON_ROUTE);

for (const required of [
  '"@type": "ItemList"',
  '"@type": "ListItem"',
  'item: {',
  '"@type": "Product"',
  '"@id": `${productUrl}#product`',
  'itemListOrder: "https://schema.org/ItemListOrderAscending"'
]) {
  if (!updated.includes(required)) {
    fail(`Nachprüfung fehlgeschlagen: ${required}`);
  }
}

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
log("Comparison-ItemList enthält jetzt echte Product-Items.");
log("Jeder ListItem-Eintrag besitzt:");
log("- stabile Position");
log("- Produktname");
log("- kanonische Produkt-URL");
log("- verschachtelte Product-Entität");
log("- stabile Product-ID mit #product");
log("Sichtbare Darstellung und Vergleichsreihenfolge blieben unverändert.");
log(`Backups: ${rel(BACKUP_ROOT)}`);
log("Kein Commit, kein Push und kein Pull Request wurden erstellt.");

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH = "pfotentechnik-seo-cockpit-generic-product-operations-30.1.0";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const BACKUP = path.join(ROOT, ".patch-backups", `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`);

const targets = {
  frontmatter: path.join(APP, "src/lib/price-intelligence/frontmatter-price.mjs"),
  service: path.join(APP, "src/lib/price-intelligence/service.mjs"),
  policy: path.join(APP, "src/lib/product-operations/policy.mjs"),
  page: path.join(APP, "src/pages/admin/seo/prices.astro"),
  package: path.join(APP, "package.json"),
  test: path.join(APP, "test/seo-cockpit-generic-product-operations-30.1.0.test.mjs")
};

const log = (message) => console.log(`[${PATCH}] ${message}`);

function assertFiles() {
  for (const [key, file] of Object.entries(targets)) {
    if (key === "test") continue;
    if (!fs.existsSync(file)) throw new Error(`Erwartete Datei fehlt: ${path.relative(ROOT, file)}`);
  }
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const destination = path.join(BACKUP, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(file, destination);
}

function write(file, content) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current === content) {
    log(`Bereits aktuell: ${path.relative(ROOT, file)}`);
    return;
  }
  backup(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
  log(`Geschrieben: ${path.relative(ROOT, file)}`);
}

function replaceOnce(source, search, replacement, label) {
  if (source.includes(replacement)) return source;
  const count = source.split(search).length - 1;
  if (count !== 1) throw new Error(`${label}: erwarteter Marker nicht eindeutig gefunden (${count}).`);
  return source.replace(search, replacement);
}

function patchFrontmatter() {
  let source = fs.readFileSync(targets.frontmatter, "utf8");

  const oldPattern = 'new RegExp(`^${key}:\\\\s*(?:#.*)?$`).test(line)';
  const newPattern = 'new RegExp(`^${key}:\\\\s*`).test(line)';
  const count = source.split(oldPattern).length - 1;
  if (count === 2) source = source.split(oldPattern).join(newPattern);
  else if (!source.includes(newPattern)) throw new Error(`Inline-YAML-Erkennung: 2 Marker erwartet, ${count} gefunden.`);

  source = replaceOnce(
    source,
    `export function renderAffiliateBlock(affiliate) {\n  if (!affiliate?.url) throw new Error("Affiliate- beziehungsweise Händler-URL fehlt.");\n  const lines = ["affiliate:"];\n  if (affiliate.provider) lines.push(\`  provider: \${quote(affiliate.provider)}\`);\n  lines.push(\`  label: \${quote(affiliate.label || "Preis und Verfügbarkeit prüfen")}\`);\n  lines.push(\`  url: \${quote(affiliate.url)}\`);\n  if (affiliate.rel) lines.push(\`  rel: \${quote(affiliate.rel)}\`);\n  if (affiliate.target) lines.push(\`  target: \${quote(affiliate.target)}\`);\n  return lines.join("\\n");\n}\n`,
    `export function renderAffiliateBlock(affiliate) {\n  if (!affiliate?.url) throw new Error("Affiliate- beziehungsweise Händler-URL fehlt.");\n  const lines = ["affiliate:"];\n  if (affiliate.provider) lines.push(\`  provider: \${quote(affiliate.provider)}\`);\n  lines.push(\`  label: \${quote(affiliate.label || "Preis und Verfügbarkeit prüfen")}\`);\n  lines.push(\`  url: \${quote(affiliate.url)}\`);\n  if (affiliate.rel) lines.push(\`  rel: \${quote(affiliate.rel)}\`);\n  if (affiliate.target) lines.push(\`  target: \${quote(affiliate.target)}\`);\n  return lines.join("\\n");\n}\n\nexport function renderManufacturerBlock(manufacturer) {\n  const name = String(manufacturer?.name || "").trim();\n  const slug = String(manufacturer?.slug || manufacturer?.key || "").trim();\n  const key = String(manufacturer?.key || slug).trim();\n  if (!name || !slug || !key) throw new Error("Herstellername, Hersteller-Slug und Hersteller-Key sind erforderlich.");\n  return [\n    "manufacturer:",\n    \`  key: \${quote(key)}\`,\n    \`  name: \${quote(name)}\`,\n    \`  slug: \${quote(slug)}\`\n  ].join("\\n");\n}\n`,
    "Hersteller-Renderer"
  );

  source = replaceOnce(
    source,
    `    if (result.removeAffiliate) {\n      nextYaml = removeTopLevelBlock(nextYaml, "affiliate");\n    } else if (result.affiliate?.url) {\n      nextYaml = replaceTopLevelBlock(nextYaml, "affiliate", renderAffiliateBlock(result.affiliate));\n    }\n\n    const parsedBeforeOperations`,
    `    if (result.removeAffiliate) {\n      nextYaml = removeTopLevelBlock(nextYaml, "affiliate");\n    } else if (result.affiliate?.url) {\n      nextYaml = replaceTopLevelBlock(nextYaml, "affiliate", renderAffiliateBlock(result.affiliate));\n    }\n    if (result.manufacturer) {\n      nextYaml = replaceTopLevelBlock(nextYaml, "manufacturer", renderManufacturerBlock(result.manufacturer));\n    }\n\n    const parsedBeforeOperations`,
    "Hersteller-Persistenz"
  );

  source = replaceOnce(
    source,
    `    const nextData = { ...data };\n    let price = cleanPrice(data.price ?? { current: null, currency: "EUR", status: "unknown" });\n`,
    `    const nextData = { ...data };\n    let price = cleanPrice(data.price ?? { current: null, currency: "EUR", status: "unknown" });\n    let manufacturer;\n\n    if (patch.manufacturer !== undefined) {\n      const name = String(patch.manufacturer?.name || "").trim().slice(0, 120);\n      const slug = String(patch.manufacturer?.slug || patch.manufacturer?.key || "").trim().toLocaleLowerCase("de-DE");\n      const key = String(patch.manufacturer?.key || slug).trim().toLocaleLowerCase("de-DE");\n      if (!name) throw new Error("Herstellername fehlt.");\n      if (!/^[a-z0-9][a-z0-9-]*$/.test(slug) || !/^[a-z0-9][a-z0-9-]*$/.test(key)) {\n        throw new Error("Hersteller-Slug und Hersteller-Key dürfen nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.");\n      }\n      manufacturer = { key, name, slug };\n      nextData.manufacturer = manufacturer;\n    }\n`,
    "Hersteller-Patch"
  );

  source = replaceOnce(
    source,
    `      ...(hasAffiliatePatch ? { affiliate, removeAffiliate } : {}),\n      operationFields,`,
    `      ...(hasAffiliatePatch ? { affiliate, removeAffiliate } : {}),\n      ...(manufacturer ? { manufacturer } : {}),\n      operationFields,`,
    "Hersteller-Rückgabe"
  );

  write(targets.frontmatter, source);
}

function patchPolicy() {
  let source = fs.readFileSync(targets.policy, "utf8");
  source = replaceOnce(
    source,
    `    category: String(data?.category?.label ?? data?.category?.key ?? "Unbekannt"),\n    score:`,
    `    category: String(data?.category?.label ?? data?.category?.key ?? "Unbekannt"),\n    manufacturerName: String(data?.manufacturer?.name ?? data?.manufacturer ?? ""),\n    manufacturerSlug: String(data?.manufacturer?.slug ?? data?.manufacturer?.key ?? ""),\n    manufacturerKey: String(data?.manufacturer?.key ?? data?.manufacturer?.slug ?? ""),\n    score:`,
    "Operations-Record Hersteller"
  );
  write(targets.policy, source);
}

function patchService() {
  let source = fs.readFileSync(targets.service, "utf8");

  source = replaceOnce(
    source,
    `const resultFromDocument = (document, extra = {}) => {`,
    `const validateManufacturer = (input) => {\n  const provided = [input.manufacturerName, input.manufacturerSlug, input.manufacturerKey]\n    .some((value) => String(value || "").trim());\n  if (!provided) return undefined;\n  const name = String(input.manufacturerName || "").trim().slice(0, 120);\n  const slug = String(input.manufacturerSlug || input.manufacturerKey || "").trim().toLocaleLowerCase("de-DE");\n  const key = String(input.manufacturerKey || slug).trim().toLocaleLowerCase("de-DE");\n  if (!name) throw new Error("Herstellername fehlt.");\n  if (!/^[a-z0-9][a-z0-9-]*$/.test(slug) || !/^[a-z0-9][a-z0-9-]*$/.test(key)) {\n    throw new Error("Hersteller-Slug und Hersteller-Key dürfen nur Kleinbuchstaben, Zahlen und Bindestriche enthalten.");\n  }\n  return { name, slug, key };\n};\n\nconst resultFromDocument = (document, extra = {}) => {`,
    "Hersteller-Validierung"
  );

  source = replaceOnce(
    source,
    `  const comparisonText = String(input.comparisonText || "").trim().slice(0, 360);\n\n  if (!hasCurrent) {`,
    `  const comparisonText = String(input.comparisonText || "").trim().slice(0, 360);\n  const manufacturer = validateManufacturer(input);\n\n  if (!hasCurrent) {`,
    "Hersteller-Eingabe"
  );

  source = replaceOnce(
    source,
    `      comparisonText,\n      now\n    };`,
    `      comparisonText,\n      ...(manufacturer ? { manufacturer } : {}),\n      now\n    };`,
    "Hersteller bei Status-Update"
  );

  source = replaceOnce(
    source,
    `  return resultFromDocument(persisted, {\n    checkedAt: now,\n    source: sourceLabel,`,
    `  const finalDocument = manufacturer\n    ? await updateProductOperations(persisted.file, { manufacturer, now })\n    : persisted;\n\n  return resultFromDocument(finalDocument, {\n    checkedAt: now,\n    source: sourceLabel,`,
    "Hersteller nach Preis-Update"
  );

  write(targets.service, source);
}

function patchPage() {
  let source = fs.readFileSync(targets.page, "utf8");

  source = replaceOnce(source, `    comparisonText: string;\n  };`, `    comparisonText: string;\n    manufacturerName: string;\n    manufacturerSlug: string;\n  };`, "Draft-Typ");

  source = replaceOnce(
    source,
    `            <label>\n              <span>Quelle oder Händler</span>\n              <input type="text" maxlength="120" data-draft="sourceLabel" value={row.sourceLabel === "Nicht angegeben" ? "" : row.sourceLabel} />\n            </label>`,
    `            <label>\n              <span>Quelle oder Händler</span>\n              <input type="text" maxlength="120" data-draft="sourceLabel" value={row.sourceLabel === "Nicht angegeben" ? "" : row.sourceLabel} />\n            </label>\n            <label>\n              <span>Herstellername</span>\n              <input type="text" maxlength="120" data-draft="manufacturerName" value={row.manufacturerName ?? ""} placeholder="OnlyCat" />\n            </label>\n            <label>\n              <span>Hersteller-Slug</span>\n              <input type="text" maxlength="120" data-draft="manufacturerSlug" value={row.manufacturerSlug ?? ""} placeholder="onlycat" />\n            </label>`,
    "Hersteller-Felder"
  );

  source = replaceOnce(source, `    comparisonText: record.comparisonText || ""\n  });`, `    comparisonText: record.comparisonText || "",\n    manufacturerName: record.manufacturerName || "",\n    manufacturerSlug: record.manufacturerSlug || ""\n  });`, "Draft aus Record");

  source = replaceOnce(
    source,
    `              availabilityReason: draft.availabilityReason\n            })`,
    `              availabilityReason: draft.availabilityReason,\n              manufacturerName: draft.manufacturerName,\n              manufacturerSlug: draft.manufacturerSlug,\n              manufacturerKey: draft.manufacturerSlug\n            })`,
    "Hersteller-Payload"
  );

  source = source.replace("Preis und Verfügbarkeit speichern", "Produktdaten speichern");
  write(targets.page, source);
}

function writeTest() {
  const testSource = `import test from "node:test";\nimport assert from "node:assert/strict";\nimport fs from "node:fs/promises";\nimport os from "node:os";\nimport path from "node:path";\nimport yaml from "js-yaml";\nimport { splitFrontmatter, updateProductOperations, updateProductPrice } from "../src/lib/price-intelligence/frontmatter-price.mjs";\n\nconst fixture = \`---\ntitle: "OnlyCat Mikrochip Katzenklappe"\nslug: "onlycat-mikrochip-katzenklappe"\ntype: "product"\nlayout: "product"\nmanufacturer: { key: "legacy", name: "Legacy", slug: "legacy" }\ncategory: { key: "katzenklappen", label: "Katzenklappen", path: "/katzenklappen/" }\nimages: { hero: { src: "../../assets/images/products/onlycat/hero.webp", alt: "OnlyCat" } }\nprice: { current: null, currency: "EUR", status: "unknown" }\npriceState: "unknown"\navailability: "unknown"\nrecommendation: "Datencheck"\nreview: { summary: "Zusammenfassung", verdict: "Fazit" }\nrating: 3.6\n---\n\nInhalt.\n\`;\n\nasync function parsed(file) {\n  const source = await fs.readFile(file, "utf8");\n  const parts = splitFrontmatter(source, file);\n  return { source, data: yaml.load(parts.yaml) };\n}\n\ntest("Inline-YAML wird ohne doppelte Top-Level-Keys aktualisiert", async () => {\n  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "pt-product-ops-"));\n  const file = path.join(directory, "onlycat-mikrochip-katzenklappe.md");\n  await fs.writeFile(file, fixture);\n\n  await updateProductOperations(file, {\n    affiliateUrl: "https://www.onlycat.com/de/store/onlycat/",\n    sourceLabel: "OnlyCat Deutschland",\n    manufacturer: { key: "onlycat", name: "OnlyCat", slug: "onlycat" },\n    availability: "available",\n    availabilityReason: "Im Hersteller-Shop verfügbar.",\n    now: "2026-08-06T08:00:00.000Z"\n  });\n\n  await updateProductPrice(file, {\n    current: 299,\n    currency: "EUR",\n    status: "unknown",\n    checkedAt: "2026-08-06T08:00:00.000Z",\n    source: { id: "onlycat", label: "OnlyCat Deutschland", type: "merchant" }\n  }, { affiliateUrl: "https://www.onlycat.com/de/store/onlycat/", syncAffiliateUrl: true, now: "2026-08-06T08:00:00.000Z" });\n\n  const { source, data } = await parsed(file);\n  assert.equal(data.manufacturer.name, "OnlyCat");\n  assert.equal(data.manufacturer.slug, "onlycat");\n  assert.equal(data.price.current, 299);\n  assert.equal(data.affiliate.url, "https://www.onlycat.com/de/store/onlycat/");\n  assert.equal(data.availability, "available");\n  assert.equal((source.match(/^price:/gm) || []).length, 1);\n  assert.equal((source.match(/^manufacturer:/gm) || []).length, 1);\n  assert.equal((source.match(/^affiliate:/gm) || []).length, 1);\n});\n`;
  write(targets.test, testSource);
}

function patchPackage() {
  const pkg = JSON.parse(fs.readFileSync(targets.package, "utf8"));
  pkg.scripts ??= {};
  pkg.scripts["test:seo-cockpit-product-operations"] = "node --test test/seo-cockpit-generic-product-operations-30.1.0.test.mjs";
  write(targets.package, JSON.stringify(pkg, null, 2) + "\n");
}

function run(command, args) {
  log(`Prüfe: ${command} ${args.join(" ")}`);
  execFileSync(command, args, { cwd: ROOT, stdio: "inherit", windowsHide: true });
}

assertFiles();
patchFrontmatter();
patchPolicy();
patchService();
patchPage();
writeTest();
patchPackage();

run(process.execPath, ["--check", fileURLToPath(import.meta.url)]);
run("npm", ["--workspace", "apps/pfotentechnik", "run", "test:seo-cockpit-product-operations"]);
run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);

log("Fertig. Preis, Händler-/Affiliate-Link und Hersteller sind kategorienunabhängig pflegbar; Inline-YAML wird sicher ersetzt.");

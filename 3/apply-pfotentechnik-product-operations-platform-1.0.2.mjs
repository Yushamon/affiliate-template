#!/usr/bin/env node
import fs from "node:fs";
import fsp from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const VERSION = "1.0.2";
const BRANCH = "agent/product-operations-platform";
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const repoRoot = process.cwd();
const payloadRoot = path.join(scriptDir, "payload");
const publish = process.argv.includes("--publish");
const skipBuild = process.argv.includes("--skip-build");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(repoRoot, ".patch-backups", `pfotentechnik-product-operations-${VERSION}-${stamp}`);

const files = {
  schema: "apps/pfotentechnik/src/content/schema/product.ts",
  package: "apps/pfotentechnik/package.json",
  hero: "apps/pfotentechnik/src/components/product-experience-2/ProductHero2.astro",
  model: "apps/pfotentechnik/src/domain/productExperience/model.ts",
  recommendation: "apps/pfotentechnik/src/domain/comparison/recommendationEngine.ts",
  comparison: "apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts",
  productPage: "apps/pfotentechnik/src/pages/produkt/[product].astro",
  layout: "apps/pfotentechnik/src/layouts/SeoAdminLayout.astro",
  adminIndex: "apps/pfotentechnik/src/pages/admin/seo/index.astro"
};

const payloadFiles = [
  "apps/pfotentechnik/src/lib/product-operations/policy.mjs",
  "apps/pfotentechnik/src/lib/product-operations/policy.d.ts",
  "apps/pfotentechnik/src/lib/price-intelligence/frontmatter-price.mjs",
  "apps/pfotentechnik/src/lib/price-intelligence/service.mjs",
  "apps/pfotentechnik/src/lib/admin/operations-router.mjs",
  "apps/pfotentechnik/src/pages/admin/seo/prices.astro",
  "apps/pfotentechnik/src/components/product-experience-2/PriceBox2.astro",
  "apps/pfotentechnik/scripts/product-operations/migrate.mjs",
  "apps/pfotentechnik/scripts/product-operations/audit.mjs",
  "apps/pfotentechnik/test/product-operations.test.mjs",
  "apps/pfotentechnik/docs/product-operations-platform.md"
];

const fail = (message) => {
  console.error(`\n[product-operations-${VERSION}] ${message}`);
  process.exit(1);
};

const run = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options
  });
  if (result.status !== 0) fail(`Befehl fehlgeschlagen: ${command} ${args.join(" ")}`);
};

const runAdvisory = (command, args, options = {}) => {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    stdio: "inherit",
    shell: process.platform === "win32",
    ...options
  });
  if (result.status !== 0) {
    console.warn(`[product-operations-${VERSION}] Hinweis: Externer Bestands-Audit meldet offene Punkte: ${command} ${args.join(" ")}`);
  }
  return result.status === 0;
};

const output = (command, args) => {
  const result = spawnSync(command, args, {
    cwd: repoRoot,
    encoding: "utf8",
    shell: process.platform === "win32"
  });
  if (result.status !== 0) fail(`Befehl fehlgeschlagen: ${command} ${args.join(" ")}\n${result.stderr || ""}`);
  return String(result.stdout || "").trim();
};

const read = (relative) => fs.readFileSync(path.join(repoRoot, relative), "utf8");
const write = (relative, content) => {
  const target = path.join(repoRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
};

const replaceOnce = (source, before, after, label) => {
  if (!source.includes(before)) fail(`Vorprüfung fehlgeschlagen. Anker nicht gefunden: ${label}`);
  if (source.indexOf(before) !== source.lastIndexOf(before)) fail(`Vorprüfung fehlgeschlagen. Anker ist nicht eindeutig: ${label}`);
  return source.replace(before, after);
};

const copyPayload = (relative) => {
  const source = path.join(payloadRoot, relative);
  if (!fs.existsSync(source)) fail(`Payload fehlt: ${relative}`);
  const target = path.join(repoRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
};

const backup = async (relative) => {
  const source = path.join(repoRoot, relative);
  if (!fs.existsSync(source)) return;
  const target = path.join(backupRoot, relative);
  await fsp.mkdir(path.dirname(target), { recursive: true });
  await fsp.copyFile(source, target);
};

const hasCommit = (message) => {
  const log = output("git", ["log", "--format=%s", "-n", "80"]);
  return log.split(/\r?\n/).includes(message);
};

const commit = (message, paths) => {
  run("git", ["add", "--", ...paths]);
  const staged = output("git", ["diff", "--cached", "--name-only"]);
  if (!staged) {
    if (hasCommit(message)) {
      console.log(`[product-operations-${VERSION}] Bereits committed: ${message}`);
      return;
    }
    fail(`Commit „${message}“ enthält keine Änderungen.`);
  }
  run("git", ["commit", "-m", message]);
};

function transformSchema(source) {
  if (source.includes("const productAvailabilitySchema")) return source;
  const definitions = `const productPriceStateSchema = z.enum([\n  "available",\n  "unknown",\n  "removed",\n  "stale"\n]);\n\nconst productAvailabilitySchema = z.enum([\n  "available",\n  "temporarily-unavailable",\n  "out-of-stock",\n  "discontinued",\n  "unknown"\n]);\n\nconst productRecommendationStatusSchema = z.enum([\n  "recommended",\n  "limited",\n  "archived"\n]);\n\nconst productEditorialStatusSchema = z.enum([\n  "complete",\n  "recommended",\n  "required",\n  "archived"\n]);\n\nconst productMaintenanceStatusSchema = z.enum([\n  "complete",\n  "recommended",\n  "required",\n  "archived"\n]);\n\n`;
  source = replaceOnce(source, "const productEditorialSchema =", `${definitions}const productEditorialSchema =`, "Product Operations Schemas");
  const operationsFields = `    priceState: productPriceStateSchema.default("unknown"),
    priceUpdated: z.coerce.date().optional(),
    priceAvailable: z.boolean().default(false),
    affiliateAvailable: z.boolean().default(false),
    availability: productAvailabilitySchema.default("unknown"),
    availabilityReason: z.string().max(500).optional(),
    availabilityUpdated: z.coerce.date().optional(),
    editorialStatus: productEditorialStatusSchema.default("complete"),
    recommendationStatus: productRecommendationStatusSchema.default("limited"),
    maintenanceStatus: productMaintenanceStatusSchema.default("required"),

`;
  const editorialFieldPattern = /(^\s{4}editorial\s*:\s*(?:\r?\n\s{6})?productEditorialSchema\s*,?)/m;
  const editorialMatch = source.match(editorialFieldPattern);
  if (!editorialMatch || editorialMatch.index == null) {
    fail("Vorprüfung fehlgeschlagen. Strukturelles Feld editorial: productEditorialSchema wurde nicht gefunden.");
  }
  source = `${source.slice(0, editorialMatch.index)}${operationsFields}${source.slice(editorialMatch.index)}`;
  return source;
}

function transformPackage(source) {
  const json = JSON.parse(source);
  json.scripts = json.scripts || {};
  Object.assign(json.scripts, {
    "product-operations:migrate": "node scripts/product-operations/migrate.mjs --write",
    "product-operations:migrate:check": "node scripts/product-operations/migrate.mjs",
    "test:product-operations": "node --test test/product-operations.test.mjs",
    "audit:product-operations": "node scripts/product-operations/audit.mjs",
    "audit:product-operations:strict": "node scripts/product-operations/audit.mjs --strict"
  });
  return `${JSON.stringify(json, null, 2)}\n`;
}

function transformHero(source) {
  if (source.includes("operations={model.operations}")) return source;
  return replaceOnce(
    source,
    "    <PriceBox2 price={model.price} affiliate={model.affiliate} />",
    "    <PriceBox2 price={model.price} affiliate={model.affiliate} operations={model.operations} />",
    "PriceBox Operations Props"
  );
}

function transformModel(source) {
  if (!source.includes('product-operations/policy.mjs')) {
    source = replaceOnce(
      source,
      'import { uniqueTextItems } from "./contentLists.ts";',
      'import { uniqueTextItems } from "./contentLists.ts";\nimport { deriveProductOperations, isAutoRecommendationEligible } from "../../lib/product-operations/policy.mjs";',
      "Product Experience Operations Import"
    );
  }
  source = source.replace(
    '.filter((entry) => slugOf(entry) !== currentSlug && categoryKey(entry) === categoryKey(current))',
    '.filter((entry) => slugOf(entry) !== currentSlug && categoryKey(entry) === categoryKey(current) && isAutoRecommendationEligible(deriveProductOperations(dataOf(entry))))'
  );
  source = source.replace(
    "    if (!entry) continue;\n    used.add(slug);",
    "    if (!entry || !isAutoRecommendationEligible(deriveProductOperations(dataOf(entry)))) continue;\n    used.add(slug);"
  );
  if (!source.includes("const operations = deriveProductOperations(data);")) {
    source = replaceOnce(
      source,
      "  const price = priceIndex.bySlug.get(slug);",
      "  const price = priceIndex.bySlug.get(slug);\n  const operations = deriveProductOperations(data);",
      "Product Experience Operations Model"
    );
  }
  source = replaceOnce(
    source,
    "    recommendation: text(data.recommendation ?? data.description),",
    `    recommendation: operations.availability === "discontinued"\n      ? "Dieses Produkt ist eingestellt. Die redaktionelle Einordnung bleibt dokumentiert; für einen Kauf sind die verfügbaren Alternativen relevanter."\n      : operations.availability === "temporarily-unavailable"\n        ? "Dieses Produkt ist vorübergehend nicht verfügbar. Die Qualitätsbewertung bleibt bestehen, aktuell sollte jedoch eine Alternative geprüft werden."\n        : operations.availability === "out-of-stock"\n          ? "Dieses Produkt ist aktuell nicht lieferbar. Die Qualitätsbewertung bleibt bestehen, eine Kaufempfehlung wird derzeit nicht ausgespielt."\n          : text(data.recommendation ?? data.description),`,
    "Availability Recommendation Copy"
  );
  if (!source.includes("    operations,")) {
    source = replaceOnce(source, "    price,\n    affiliate:", "    operations,\n    price,\n    affiliate:", "Operations im Experience Model");
  }
  return source;
}

function transformRecommendation(source) {
  if (!source.includes('product-operations/policy.mjs')) {
    source = replaceOnce(
      source,
      'import type { CollectionEntry } from "astro:content";',
      'import type { CollectionEntry } from "astro:content";\nimport { deriveProductOperations, recommendationTieBreaker } from "../../lib/product-operations/policy.mjs";',
      "Recommendation Operations Import"
    );
  }
  source = replaceOnce(
    source,
    `  const candidates = products.filter((product) =>\n    itemSlugs.includes(product.data.slug)\n  );`,
    `  const candidates = products.filter((product) =>\n    itemSlugs.includes(product.data.slug) &&\n    deriveProductOperations(product.data).autoRecommendationEligible\n  );`,
    "Eligible Recommendation Candidates"
  );
  source = replaceOnce(
    source,
    `  if (candidates.length === 0) {\n    return {\n      enabled: true,\n      winnerSlug: data.recommendation.winnerSlug,\n      alternativeSlug: data.recommendation.alternativeSlug,\n      title: data.recommendation.title,\n      text: data.recommendation.text,\n      scenarios: []\n    };\n  }`,
    `  if (candidates.length === 0) {\n    return {\n      enabled: true,\n      winnerSlug: undefined,\n      alternativeSlug: undefined,\n      title: "Aktuell keine automatisch empfehlbare Hauptoption",\n      text: "Keines der Vergleichsprodukte ist derzeit als verfügbar und automatisch empfehlbar bestätigt.",\n      scenarios: []\n    };\n  }`,
    "No Ineligible Automatic Winner"
  );
  source = replaceOnce(
    source,
    `      b.score - a.score ||\n      b.baseScore - a.baseScore ||\n      a.product.data.title.localeCompare(b.product.data.title, "de")`,
    `      b.score - a.score ||\n      b.baseScore - a.baseScore ||\n      b.tieBreaker - a.tieBreaker ||\n      a.product.data.title.localeCompare(b.product.data.title, "de")`,
    "Recommendation Tie Breaker Sort"
  );
  if (!source.includes("const tieBreaker = recommendationTieBreaker(data);")) {
    source = replaceOnce(
      source,
      "  const evidence = collectEvidence(product);\n  let score = baseScore;",
      "  const evidence = collectEvidence(product);\n  const tieBreaker = recommendationTieBreaker(data);\n  let score = baseScore;",
      "Recommendation Tie Breaker Value"
    );
  }
  source = replaceOnce(
    source,
    `    baseScore,\n    score: Math.round(score * 10) / 10,`,
    `    baseScore,\n    tieBreaker,\n    score: Math.round(score * 10) / 10,`,
    "Recommendation Tie Breaker Result"
  );
  return source;
}

function transformComparison(source) {
  if (!source.includes('product-operations/policy.mjs')) {
    source = replaceOnce(
      source,
      'import type { ProductPriceInsight } from "../price/types";',
      'import type { ProductPriceInsight } from "../price/types";\nimport { deriveProductOperations } from "../../lib/product-operations/policy.mjs";',
      "Comparison Operations Import"
    );
  }
  if (!source.includes("const recommendationEligible =")) {
    source = replaceOnce(
      source,
      "  const priceIndex = buildPriceIndex(products);",
      `  const priceIndex = buildPriceIndex(products);\n  const recommendationEligible = (slug?: string) => {\n    if (!slug) return false;\n    const product = productBySlug.get(slug);\n    return Boolean(product && deriveProductOperations(product.data).autoRecommendationEligible);\n  };`,
      "Comparison Recommendation Eligibility"
    );
  }
  source = replaceOnce(
    source,
    `  const resolvedWinnerSlug =\n    automaticRecommendation.winnerSlug ??\n    data.recommendation.winnerSlug;\n  const resolvedAlternativeSlug =\n    automaticRecommendation.alternativeSlug ??\n    data.recommendation.alternativeSlug;`,
    `  const winnerCandidate = automaticRecommendation.winnerSlug ?? data.recommendation.winnerSlug;\n  const alternativeCandidate = automaticRecommendation.alternativeSlug ?? data.recommendation.alternativeSlug;\n  const resolvedWinnerSlug = recommendationEligible(winnerCandidate) ? winnerCandidate : undefined;\n  const resolvedAlternativeSlug = recommendationEligible(alternativeCandidate) ? alternativeCandidate : undefined;`,
    "Comparison Winner Eligibility"
  );
  source = replaceOnce(
    source,
    `      const affiliate = product.data.affiliate\n        ? {`,
    `      const productOperations = deriveProductOperations(product.data);\n      const affiliate = productOperations.purchasable && product.data.affiliate\n        ? {`,
    "Comparison CTA Availability"
  );
  return source;
}

function transformProductPage(source) {
  if (!source.includes('product-operations/policy.mjs')) {
    source = replaceOnce(
      source,
      'import { buildProductNextSteps } from "../../domain/recommendationLinks";',
      'import { buildProductNextSteps } from "../../domain/recommendationLinks";\nimport { deriveProductOperations } from "../../lib/product-operations/policy.mjs";',
      "Product Page Operations Import"
    );
  }
  if (!source.includes("const productOperations = deriveProductOperations(contentProduct);")) {
    source = replaceOnce(
      source,
      "const contentProduct =\n  contentEntry.data;",
      "const contentProduct =\n  contentEntry.data;\nconst productOperations = deriveProductOperations(contentProduct);",
      "Product Page Operations State"
    );
  }
  source = replaceOnce(
    source,
    `  Date.now() - schemaPriceCheckedAt <= 14 * 86_400_000;`,
    `  Date.now() - schemaPriceCheckedAt <= 14 * 86_400_000 &&\n  productOperations.purchasable;`,
    "Structured Offer Availability"
  );
  source = replaceOnce(
    source,
    `          priceCurrency: contentProduct.price.currency,\n          url: new URL(canonical, site.domain).toString()`,
    `          priceCurrency: contentProduct.price.currency,\n          availability: "https://schema.org/InStock",\n          url: contentProduct.affiliate?.url ?? new URL(canonical, site.domain).toString()`,
    "Structured Offer Details"
  );
  return source;
}

function transformLayout(source) {
  return source.replace('["prices", "/admin/seo/prices/", "Preise"]', '["prices", "/admin/seo/prices/", "Produkte"]');
}

function transformAdminIndex(source) {
  return source.replace(
    '{ href: "/admin/seo/prices/", title: "Preise", text: "Aktuelle Händlerpreise prüfen und automatisch innerhalb vergleichbarer Produktkategorien einordnen." },',
    '{ href: "/admin/seo/prices/", title: "Produktpflege", text: "Preise, Affiliate-Ziele, Verfügbarkeit, Empfehlbarkeit, Pflegepriorität und Archiv zentral verwalten." },'
  );
}

const phaseOnePayloadFiles = [
  "apps/pfotentechnik/src/lib/product-operations/policy.mjs",
  "apps/pfotentechnik/src/lib/product-operations/policy.d.ts",
  "apps/pfotentechnik/src/lib/price-intelligence/frontmatter-price.mjs",
  "apps/pfotentechnik/scripts/product-operations/migrate.mjs",
  "apps/pfotentechnik/scripts/product-operations/audit.mjs"
];

const normalizeStatusPath = (line) => line.slice(3).trim().replace(/^"|"$/g, "");

function isKnownSafePartialInstallation(statusOutput) {
  const changed = String(statusOutput || "")
    .split(/\r?\n/)
    .filter(Boolean)
    .map(normalizeStatusPath);
  if (!changed.length) return false;

  const exactPayloadFiles = new Set([
    ...phaseOnePayloadFiles,
    "apps/pfotentechnik/test/product-operations.test.mjs",
    "apps/pfotentechnik/docs/product-operations-platform.md"
  ]);
  const generatedAuditFiles = new Set([
    "apps/pfotentechnik/reports/product-data-audit.md",
    "apps/pfotentechnik/reports/product-data-audit.json"
  ]);

  return changed.every((relative) => {
    if (generatedAuditFiles.has(relative)) return true;
    if (!exactPayloadFiles.has(relative)) return false;
    const repoFile = path.join(repoRoot, relative);
    const payloadFile = path.join(payloadRoot, relative);
    return fs.existsSync(repoFile) && fs.existsSync(payloadFile) && fs.readFileSync(repoFile).equals(fs.readFileSync(payloadFile));
  });
}
function preflight() {
  const packagePath = path.join(repoRoot, "package.json");
  if (!fs.existsSync(packagePath)) fail("Im aktuellen Verzeichnis wurde kein Repository-Root mit package.json gefunden.");
  const rootPackage = JSON.parse(fs.readFileSync(packagePath, "utf8"));
  if (rootPackage.name !== "affiliate-sites-monorepo") fail("Dieses Installationspaket ist nur für Yushamon/affiliate-template vorgesehen.");
  if (!fs.existsSync(path.join(repoRoot, ".git"))) fail("Das aktuelle Verzeichnis ist kein lokaler Git-Checkout.");
  if (!fs.existsSync(payloadRoot)) fail("Der Payload-Ordner fehlt. ZIP vollständig entpacken.");
  for (const relative of Object.values(files)) if (!fs.existsSync(path.join(repoRoot, relative))) fail(`Erforderliche Datei fehlt: ${relative}`);
  for (const relative of payloadFiles) if (!fs.existsSync(path.join(payloadRoot, relative))) fail(`Payload-Datei fehlt: ${relative}`);
  const dirty = output("git", ["status", "--porcelain"]);
  if (dirty && !isKnownSafePartialInstallation(dirty)) {
    fail("Der Git-Arbeitsbaum enthält Änderungen außerhalb der bekannten Teilinstallation. Diese Änderungen zuerst committen oder separat sichern.");
  }
  if (dirty) {
    console.log("[product-operations-1.0.2] Sichere Teilinstallation bzw. abgebrochene Phase 4 erkannt. Installation wird fortgesetzt.");
  }
}

async function main() {
  preflight();
  const currentBranch = output("git", ["branch", "--show-current"]);
  if (["main", "master"].includes(currentBranch)) run("git", ["switch", "-c", BRANCH]);
  else if (currentBranch !== BRANCH) fail(`Aktiver Branch ist „${currentBranch}“. Erwartet wird main/master oder ${BRANCH}.`);

  const backupTargets = [...Object.values(files), ...payloadFiles];
  for (const relative of backupTargets) await backup(relative);

  if (!hasCommit("feat(pfotentechnik): add product operations data model")) {
  console.log("\nPhase 1: Datenmodell, Migration und atomare Persistenz");
  copyPayload("apps/pfotentechnik/src/lib/product-operations/policy.mjs");
  copyPayload("apps/pfotentechnik/src/lib/product-operations/policy.d.ts");
  copyPayload("apps/pfotentechnik/src/lib/price-intelligence/frontmatter-price.mjs");
  copyPayload("apps/pfotentechnik/scripts/product-operations/migrate.mjs");
  copyPayload("apps/pfotentechnik/scripts/product-operations/audit.mjs");
  write(files.schema, transformSchema(read(files.schema)));
  write(files.package, transformPackage(read(files.package)));
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "product-operations:migrate"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "product-operations:migrate:check"]);
  commit("feat(pfotentechnik): add product operations data model", [
    "apps/pfotentechnik/src/content/schema/product.ts",
    "apps/pfotentechnik/src/lib/product-operations",
    "apps/pfotentechnik/src/lib/price-intelligence/frontmatter-price.mjs",
    "apps/pfotentechnik/scripts/product-operations",
    "apps/pfotentechnik/src/content/products",
    "apps/pfotentechnik/package.json"
  ]);
  } else console.log("\nPhase 1 bereits committed – übersprungen.");

  if (!hasCommit("feat(pfotentechnik): add enterprise product maintenance cockpit")) {
  console.log("\nPhase 2: SEO Cockpit, APIs und Persistenz-Bugfix");
  for (const relative of [
    "apps/pfotentechnik/src/lib/price-intelligence/service.mjs",
    "apps/pfotentechnik/src/lib/admin/operations-router.mjs",
    "apps/pfotentechnik/src/pages/admin/seo/prices.astro"
  ]) copyPayload(relative);
  write(files.layout, transformLayout(read(files.layout)));
  write(files.adminIndex, transformAdminIndex(read(files.adminIndex)));
  commit("feat(pfotentechnik): add enterprise product maintenance cockpit", [
    "apps/pfotentechnik/src/lib/price-intelligence/service.mjs",
    "apps/pfotentechnik/src/lib/admin/operations-router.mjs",
    "apps/pfotentechnik/src/pages/admin/seo/prices.astro",
    files.layout,
    files.adminIndex
  ]);
  } else console.log("\nPhase 2 bereits committed – übersprungen.");

  if (!hasCommit("feat(pfotentechnik): respect availability in products and comparisons")) {
  console.log("\nPhase 3: Produktseiten und Vergleichsempfehlungen");
  copyPayload("apps/pfotentechnik/src/components/product-experience-2/PriceBox2.astro");
  write(files.hero, transformHero(read(files.hero)));
  write(files.model, transformModel(read(files.model)));
  write(files.recommendation, transformRecommendation(read(files.recommendation)));
  write(files.comparison, transformComparison(read(files.comparison)));
  write(files.productPage, transformProductPage(read(files.productPage)));
  commit("feat(pfotentechnik): respect availability in products and comparisons", [
    "apps/pfotentechnik/src/components/product-experience-2/PriceBox2.astro",
    files.hero,
    files.model,
    files.recommendation,
    files.comparison,
    files.productPage
  ]);
  } else console.log("\nPhase 3 bereits committed – übersprungen.");

  console.log("\nPhase 4: Tests, Audit und Dokumentation");
  copyPayload("apps/pfotentechnik/test/product-operations.test.mjs");
  copyPayload("apps/pfotentechnik/docs/product-operations-platform.md");
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "test:product-operations"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "test:price-intelligence"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:product-operations:strict"]);
  console.log("\nBestands-Audits (informativ, keine Product-Operations-Blocker)");
  runAdvisory("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:products:strict"]);
  runAdvisory("npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:data:test"]);
  runAdvisory("npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:audit"]);
  spawnSync("git", ["restore", "--", "apps/pfotentechnik/reports/product-data-audit.md", "apps/pfotentechnik/reports/product-data-audit.json"], {
    cwd: repoRoot,
    stdio: "ignore",
    shell: process.platform === "win32"
  });
  if (!skipBuild) run("npm", ["run", "build:pfotentechnik"]);
  commit("test(pfotentechnik): validate product operations platform", [
    "apps/pfotentechnik/test/product-operations.test.mjs",
    "apps/pfotentechnik/docs/product-operations-platform.md"
  ]);

  if (publish) {
    run("git", ["push", "-u", "origin", BRANCH]);
    const ghVersion = spawnSync("gh", ["--version"], { cwd: repoRoot, stdio: "ignore", shell: process.platform === "win32" });
    if (ghVersion.status !== 0) fail("Branch wurde gepusht, aber GitHub CLI fehlt. Draft-PR bitte manuell öffnen.");
    run("gh", [
      "pr", "create", "--draft", "--base", "main", "--head", BRANCH,
      "--title", "PfotenTechnik Product Operations Platform",
      "--body", "Enterprise-Preis-, Verfügbarkeits-, Empfehlungs- und Pflegeverwaltung. Enthält atomare Preisupdates, Migration, Produkt- und Vergleichslogik, Dashboard, Filter, Archiv, Tests und Dokumentation."
    ]);
  }

  console.log(`\n[product-operations-${VERSION}] Abgeschlossen.`);
  console.log(`Branch: ${BRANCH}`);
  console.log(`Backups: ${path.relative(repoRoot, backupRoot)}`);
  console.log(publish ? "Branch gepusht und Draft-PR erstellt." : "Lokal committed. Für Push und Draft-PR erneut mit --publish ausführen.");
}

main().catch((error) => fail(error instanceof Error ? error.stack || error.message : String(error)));

#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const VERSION = "2.0.3";
const PATCH_ID = `pfotentechnik-product-experience-hotfix-${VERSION}`;
const packageRoot = path.dirname(fileURLToPath(import.meta.url));

function parseArgs(argv) {
  const out = { repo: process.cwd(), skipValidation: false };
  for (let index = 0; index < argv.length; index += 1) {
    const value = argv[index];
    if (value === "--repo") out.repo = argv[++index];
    else if (value === "--skip-validation") out.skipValidation = true;
    else if (value === "--help" || value === "-h") out.help = true;
  }
  return out;
}

function usage() {
  console.log(`PfotenTechnik Product Experience Hotfix ${VERSION}

Installation:
  node install.mjs --repo C:\\hp\\Projekt\\affiliate-template

Optional:
  --skip-validation   Build, Tests und Audit nicht ausführen`);
}

const args = parseArgs(process.argv.slice(2));
if (args.help) {
  usage();
  process.exit(0);
}

const repoRoot = path.resolve(args.repo);
const appRoot = path.join(repoRoot, "apps", "pfotentechnik");
const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);
const reportPath = path.join(appRoot, "reports", `${PATCH_ID}-report.json`);
const touched = new Map();
const created = new Set();

async function exists(file) {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
}

async function atomicWrite(file, content) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${process.pid}.${Date.now()}.tmp`;
  await fs.writeFile(temporary, content, "utf8");
  await fs.rename(temporary, file);
}

async function backup(file) {
  if (touched.has(file) || created.has(file)) return;
  if (await exists(file)) {
    const relative = path.relative(repoRoot, file);
    const destination = path.join(backupRoot, "files", relative);
    await fs.mkdir(path.dirname(destination), { recursive: true });
    await fs.copyFile(file, destination);
    touched.set(file, relative);
  } else {
    created.add(file);
  }
}

async function writeFile(file, content) {
  await backup(file);
  await atomicWrite(file, content);
}

async function copyPayload(relative) {
  const source = path.join(packageRoot, "payload", relative);
  const destination = path.join(repoRoot, relative);
  if (!(await exists(source))) throw new Error(`Payload fehlt: ${relative}`);
  await writeFile(destination, await fs.readFile(source, "utf8"));
}

async function updateFile(relative, updater) {
  const file = path.join(repoRoot, relative);
  if (!(await exists(file))) throw new Error(`Datei fehlt: ${relative}`);
  const current = await fs.readFile(file, "utf8");
  const next = updater(current);
  if (next !== current) await writeFile(file, next);
  return next;
}

function replaceBetween(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`Anker nicht gefunden: ${label}`);
  return source.slice(0, start) + replacement + source.slice(end);
}

async function rollback() {
  for (const [file, relative] of [...touched.entries()].reverse()) {
    const source = path.join(backupRoot, "files", relative);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.copyFile(source, file);
  }
  for (const file of [...created].reverse()) await fs.rm(file, { force: true });
}

function run(command, commandArgs, cwd) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`Befehl fehlgeschlagen (${result.status}): ${command} ${commandArgs.join(" ")}`);
  }
}

const listModelBlock = `  const limitations = uniqueTextItems([
    ...list<string>(data.weaknesses),
    ...list<string>(reviewProduct.weaknesses),
    ...list<string>(reviewProduct.cons)
  ]);
  const idealCandidates = uniqueTextItems([
    ...list<string>(data.decision?.bestFor),
    ...list<string>(reviewProduct.bestFor)
  ]);
  const attentionCandidates = uniqueTextItems([
    ...list<string>(data.decision?.attention),
    ...list<string>(reviewProduct.attention)
  ]);
  const strengthCandidates = uniqueTextItems([
    ...list<string>(data.strengths),
    ...list<string>(reviewProduct.strengths),
    ...list<string>(reviewProduct.pros),
    ...list<string>(reviewProduct.highlights)
  ], { exclude: limitations });
  const idealFor = uniqueTextItems(
    idealCandidates.length ? idealCandidates : list<string>(data.tags),
    { limit: 4 }
  );
  const notFor = uniqueTextItems(
    attentionCandidates.length ? attentionCandidates : limitations,
    { limit: 4 }
  );
  const benefits = strengthCandidates.slice(0, 4);
`;

const ctaThemeBlock = `

/* Unified PfotenTechnik CTA colors 2.0.2
   A single semantic green is used for every primary CTA. Secondary CTAs
   remain neutral and use the same accent only for border and text. */
:root {
  --pt-cta-primary-bg: var(--pt-theme-accent);
  --pt-cta-primary-bg-hover: var(--pt-theme-accent-hover);
  --pt-cta-primary-text: var(--pt-theme-text-inverse);
  --pt-cta-secondary-bg: var(--pt-theme-surface);
  --pt-cta-secondary-bg-hover: var(--pt-theme-accent-soft);
  --pt-cta-secondary-text: var(--pt-theme-accent-text);
}

.pt-button-primary,
.button-primary,
.cta-button,
.affiliate-button,
.primary-cta,
.header-advisor-link[data-pt-purchase-advice="desktop"],
.main-nav-v2 [data-pt-purchase-advice="nav"],
.pt-nav-advisor-cta,
header a[href="/#kaufberatung"],
header a[href="#kaufberatung"],
nav a[href="/#kaufberatung"],
nav a[href="#kaufberatung"],
[data-product-experience="2.0"] .px2-price__cta:not(.is-disabled) {
  border-color: var(--pt-cta-primary-bg) !important;
  background: var(--pt-cta-primary-bg) !important;
  color: var(--pt-cta-primary-text) !important;
  -webkit-text-fill-color: var(--pt-cta-primary-text) !important;
  box-shadow: 0 12px 26px color-mix(in srgb, var(--pt-cta-primary-bg) 20%, transparent) !important;
}

.pt-button-primary:hover,
.button-primary:hover,
.cta-button:hover,
.affiliate-button:hover,
.primary-cta:hover,
.header-advisor-link[data-pt-purchase-advice="desktop"]:hover,
.main-nav-v2 [data-pt-purchase-advice="nav"]:hover,
.pt-nav-advisor-cta:hover,
header a[href="/#kaufberatung"]:hover,
header a[href="#kaufberatung"]:hover,
nav a[href="/#kaufberatung"]:hover,
nav a[href="#kaufberatung"]:hover,
[data-product-experience="2.0"] .px2-price__cta:not(.is-disabled):hover {
  border-color: var(--pt-cta-primary-bg-hover) !important;
  background: var(--pt-cta-primary-bg-hover) !important;
  color: var(--pt-cta-primary-text) !important;
  -webkit-text-fill-color: var(--pt-cta-primary-text) !important;
}

[data-product-experience="2.0"] .alternatives a,
.premium-v3--pfotentechnik .premium-v3-product-cta {
  border: 1px solid var(--pt-cta-primary-bg) !important;
  background: var(--pt-cta-secondary-bg) !important;
  color: var(--pt-cta-secondary-text) !important;
  -webkit-text-fill-color: var(--pt-cta-secondary-text) !important;
  box-shadow: none !important;
}

[data-product-experience="2.0"] .alternatives a:hover,
.premium-v3--pfotentechnik .premium-v3-product-cta:hover {
  background: var(--pt-cta-secondary-bg-hover) !important;
  color: var(--pt-cta-secondary-text) !important;
  -webkit-text-fill-color: var(--pt-cta-secondary-text) !important;
}
`;

const marker = `\n\n/* Product Experience Hybrid Editorial Layout ${VERSION} */\n`;

async function applyCumulative202() {
  await copyPayload("apps/pfotentechnik/src/domain/productExperience/contentLists.ts");

  await updateFile("apps/pfotentechnik/src/pages/produkt/[product].astro", (source) => {
    let next = source;
    next = next.replace('import Breadcrumbs from "@affiliate-core/components/Breadcrumbs.astro";\n\n', "");
    next = next.replace(/\n\s*<Breadcrumbs\s+items=\{breadcrumbs\}\s*\/>\s*\n/, "\n  <!-- Breadcrumbs werden ausschließlich als BreadcrumbList-JSON-LD im Layout ausgegeben. -->\n");
    return next;
  });

  await updateFile("apps/pfotentechnik/src/domain/productExperience/model.ts", (source) => {
    let next = source;
    if (!next.includes('from "./contentLists.ts"')) {
      const anchor = 'import type { ProductDecisionProfile } from "./decisionEngine.ts";\n';
      if (!next.includes(anchor)) throw new Error("Anker nicht gefunden: contentLists Import");
      next = next.replace(anchor, `${anchor}import { uniqueTextItems } from "./contentLists.ts";\n`);
    }
    if (next.includes("  const limitations = [")) {
      next = replaceBetween(next, "  const limitations = [", "  const alternatives =", listModelBlock, "deduplizierte Produktlisten");
    }
    return next;
  });

  await updateFile("apps/pfotentechnik/src/styles/pfotentechnik-theme-fixes.css", (source) => {
    let next = source.replace(/\s+$/, "");
    if (!next.includes("Unified PfotenTechnik CTA colors 2.0.2")) next += ctaThemeBlock;
    if (!next.includes(`Product Experience Hybrid Editorial Layout ${VERSION}`)) next += marker;
    return `${next.replace(/\s+$/, "")}\n`;
  });
}

async function validateInstalledSource() {
  const productPage = await fs.readFile(path.join(appRoot, "src", "pages", "produkt", "[product].astro"), "utf8");
  if (productPage.includes("<Breadcrumbs")) throw new Error("Das sichtbare Produkt-Breadcrumb wurde nicht entfernt.");
  if (!productPage.includes("breadcrumbs={breadcrumbs}")) throw new Error("BreadcrumbList-Daten für das SEO-Schema fehlen.");

  const model = await fs.readFile(path.join(appRoot, "src", "domain", "productExperience", "model.ts"), "utf8");
  if (!model.includes("uniqueTextItems") || model.includes("const limitations = [")) {
    throw new Error("Die zentrale Deduplizierung wurde nicht vollständig eingebaut.");
  }

  const decision = await fs.readFile(path.join(appRoot, "src", "components", "product-experience-2", "ProductDecisionAssistant.astro"), "utf8");
  if (!decision.includes('neutral: "–"') || !decision.includes('negative: "×"')) {
    throw new Error("Neutrale und negative Entscheidungspunkte haben keine eigenen Statuszeichen.");
  }
  if (decision.includes('li[data-kind="neutral"]::before')) {
    throw new Error("Die Kaufentscheidung verwendet noch globale Listen-Pseudoelemente.");
  }

  const timeline = await fs.readFile(path.join(appRoot, "src", "components", "product-experience-2", "ProductEverydayTimeline.astro"), "utf8");
  if (timeline.includes("border-radius:24px") || !timeline.includes("border-top: 1px solid")) {
    throw new Error("Die Alltagstimeline wurde nicht in den offenen Editorial-Flow überführt.");
  }

  const details = await fs.readFile(path.join(appRoot, "src", "components", "product-experience-2", "ProductDetails2.astro"), "utf8");
  if (!details.includes("Weitere Nachteile") || !details.includes("exclude: warnings")) {
    throw new Error("Warnungen und Nachteile werden noch doppelt ausgegeben.");
  }
}

async function main() {
  if (!(await exists(path.join(appRoot, "package.json")))) {
    throw new Error(`PfotenTechnik-Projekt nicht gefunden: ${appRoot}`);
  }

  const themeFile = path.join(appRoot, "src", "styles", "pfotentechnik-theme-fixes.css");
  const currentTheme = await fs.readFile(themeFile, "utf8");
  if (!currentTheme.includes("Product Experience 2.0 Theme Bridge 2.0.1")) {
    throw new Error("Basis-Hotfix 2.0.1 fehlt. Bitte zuerst Product Experience Hotfix 2.0.1 installieren.");
  }
  if (currentTheme.includes(`Product Experience Hybrid Editorial Layout ${VERSION}`)) {
    throw new Error(`Hotfix ${VERSION} ist bereits installiert.`);
  }

  await fs.mkdir(backupRoot, { recursive: true });

  try {
    await applyCumulative202();

    const payloadFiles = [
      "apps/pfotentechnik/src/components/product-experience-2/ProductExperience2.astro",
      "apps/pfotentechnik/src/components/product-experience-2/ProductHero2.astro",
      "apps/pfotentechnik/src/components/product-experience-2/ProductGallery2.astro",
      "apps/pfotentechnik/src/components/product-experience-2/ProductDecisionAssistant.astro",
      "apps/pfotentechnik/src/components/product-experience-2/ProductEverydayTimeline.astro",
      "apps/pfotentechnik/src/components/product-experience-2/ProductDetails2.astro",
      "apps/pfotentechnik/src/components/product-experience-2/ProductAlternatives2.astro",
      "apps/pfotentechnik/src/components/product-experience-2/ProductTrust2.astro",
      "apps/pfotentechnik/test/product-experience-2-hybrid-layout.test.mjs"
    ];

    for (const relative of payloadFiles) await copyPayload(relative);

    await validateInstalledSource();

    const state = {
      patchId: PATCH_ID,
      version: VERSION,
      expectedBaseCommit: "6f332e1f777ef5f3c842caddeb010ce49fc84dfb",
      cumulativeFrom: ["2.0.1", "2.0.2"],
      installedAt: new Date().toISOString(),
      repoRoot,
      backupRoot,
      restoredFiles: [...touched.values()],
      createdFiles: [...created].map((file) => path.relative(repoRoot, file))
    };

    await atomicWrite(path.join(backupRoot, "install-state.json"), JSON.stringify(state, null, 2));

    if (!args.skipValidation) {
      run(process.execPath, ["--test", "test/product-experience-2-hybrid-layout.test.mjs"], appRoot);
      run("npm", ["run", "audit:products"], appRoot);
      run("npm", ["run", "build"], appRoot);
    }

    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await atomicWrite(
      reportPath,
      JSON.stringify({ ...state, validationSkipped: args.skipValidation, status: "success" }, null, 2)
    );

    console.log(`\n[${PATCH_ID}] Installation abgeschlossen.`);
    console.log(`Backup: ${backupRoot}`);
    console.log(`Report: ${reportPath}`);
  } catch (error) {
    console.error(`\n[${PATCH_ID}] Installation fehlgeschlagen.`);
    console.error(error instanceof Error ? error.stack || error.message : error);
    console.error("Änderungen werden zurückgesetzt ...");
    await rollback();
    throw error;
  }
}

main().catch(() => {
  process.exitCode = 1;
});

#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const VERSION = "2.0.1";
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
const reportPath = path.join(
  appRoot,
  "reports",
  `${PATCH_ID}-report.json`
);

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
  if (!(await exists(source))) {
    throw new Error(`Payload fehlt: ${relative}`);
  }
  await writeFile(destination, await fs.readFile(source, "utf8"));
}

async function patchFile(relative, updater) {
  const file = path.join(repoRoot, relative);
  if (!(await exists(file))) {
    throw new Error(`Datei fehlt: ${relative}`);
  }
  const current = await fs.readFile(file, "utf8");
  const next = updater(current);
  if (next === current) {
    throw new Error(`Patch hat keine Änderung erzeugt: ${relative}`);
  }
  await writeFile(file, next);
}

function replaceBetween(source, startMarker, endMarker, replacement, label) {
  const start = source.indexOf(startMarker);
  const end = source.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) {
    throw new Error(`Anker nicht gefunden: ${label}`);
  }
  return source.slice(0, start) + replacement + source.slice(end);
}

function replaceOnce(source, before, after, label) {
  const index = source.indexOf(before);
  if (index < 0) throw new Error(`Anker nicht gefunden: ${label}`);
  if (source.indexOf(before, index + before.length) >= 0) {
    throw new Error(`Anker ist nicht eindeutig: ${label}`);
  }
  return source.slice(0, index) + after + source.slice(index + before.length);
}

async function rollback() {
  for (const [file, relative] of [...touched.entries()].reverse()) {
    const source = path.join(backupRoot, "files", relative);
    await fs.mkdir(path.dirname(file), { recursive: true });
    await fs.copyFile(source, file);
  }

  for (const file of [...created].reverse()) {
    await fs.rm(file, { force: true });
  }
}

function run(command, commandArgs, cwd) {
  const result = spawnSync(command, commandArgs, {
    cwd,
    stdio: "inherit",
    shell: process.platform === "win32"
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(
      `Befehl fehlgeschlagen (${result.status}): ${command} ${commandArgs.join(" ")}`
    );
  }
}

const decisionProfileBlock = `const decisionProfileFor = (data: any, price: ProductPriceInsight | undefined): ProductDecisionProfile => {
  const haystack = collectProductText(data);
  const normalizedCategory = normalize(data.category?.key ?? data.category?.label);
  const usesFoodQuestions = [
    "futterautomat",
    "futterautomaten",
    "futterspender",
    "feeder"
  ].some((term) => normalizedCategory.includes(term));
  const animals = list<string>(data.comparisonFilters?.animal ?? data.comparisonData?.general?.animal)
    .map((value) => normalize(value))
    .map((value) => value === "hund" || value === "hunde" ? "dog" : value === "katze" || value === "katzen" ? "cat" : value)
    .filter((value) => value === "dog" || value === "cat");
  const foodTypes = usesFoodQuestions
    ? list<string>(data.comparisonFilters?.foodType ?? data.comparisonData?.general?.foodType)
        .map((value) => normalize(value))
        .map((value) => value.includes("nass") ? "wet" : value.includes("trocken") ? "dry" : value)
        .filter((value) => value === "dry" || value === "wet")
    : [];

  const hasWifi = typeof data.comparisonFilters?.app === "boolean"
    ? data.comparisonFilters.app
    : booleanFromText(haystack, ["wlan", "wifi", "wi fi", "app steuerung"], ["ohne wlan", "ohne app"]);
  const hasCamera = typeof data.comparisonFilters?.camera === "boolean"
    ? data.comparisonFilters.camera
    : booleanFromText(haystack, ["kamera", "camera", "video"], ["ohne kamera"]);
  const supportsMultiplePets = booleanFromText(
    haystack,
    ["mehrtier", "mehrere tiere", "zwei katzen", "mehrkatzen", "dual hopper", "zwei naepfe", "rfid", "mikrochip"],
    ["nur ein tier", "einzeltier"]
  );
  const worksOffline = booleanFromText(
    haystack,
    ["offline", "ohne wlan", "lokal gespeicherte zeitplaene", "batteriebetrieb"],
    ["cloud pflicht", "nur mit wlan", "internet erforderlich"]
  ) ?? (hasWifi === false ? true : null);

  return {
    productName: text(data.title, "Dieses Produkt"),
    categoryKey: normalizedCategory,
    usesFoodQuestions,
    editorialScore: editorialScore(data),
    animals: [...new Set(animals)],
    petSizes: list<string>(data.comparisonFilters?.petSize ?? data.comparisonData?.general?.petSize).map(normalize),
    foodTypes: [...new Set(foodTypes)],
    supportsMultiplePets,
    hasWifi,
    worksOffline,
    hasCamera,
    priceTier: price?.tier ?? "unknown"
  };
};`;

const alternativeBlock = `const toAlternative = (entry: any, type: string, label: string, reason: string, price?: ProductPriceInsight) => {
  const data = dataOf(entry);
  const slug = slugOf(entry);
  const hero = data.images?.comparison ?? data.images?.thumbnail ?? data.images?.hero;
  return {
    type,
    label,
    title: text(data.title, slug),
    href: text(data.productUrl, \`/produkt/\${slug}/\`),
    image: hero ? { src: imageSource(hero), alt: imageAlt(hero, text(data.title, slug)) } : null,
    score: editorialScore(data),
    priceLabel: price?.formattedCurrent,
    reason,
    decisionProfile: decisionProfileFor(data, price),
    matchKeys: type === "cheaper"
      ? ["budget"]
      : type === "large-dog"
        ? ["animal", "multi-pet"]
        : type === "two-cats"
          ? ["multi-pet"]
          : type === "wet-food"
            ? ["wet-food"]
            : type === "offline"
              ? ["offline"]
              : type === "camera"
                ? ["camera"]
                : ["budget", "camera", "wifi"]
  };
};`;

const themeBridge = `

/* Product Experience 2.0 Theme Bridge ${VERSION}
   Maps the new product system to the central semantic design tokens. */
[data-product-page] [data-product-experience="2.0"] {
  --px2-surface: var(--pt-theme-surface) !important;
  --px2-surface-soft: var(--pt-theme-surface-2) !important;
  --px2-surface-raised: var(--pt-theme-surface-2) !important;
  --px2-text: var(--pt-theme-text) !important;
  --px2-muted: var(--pt-theme-text-soft) !important;
  --px2-border: var(--pt-theme-border) !important;
  --px2-green: var(--pt-theme-accent) !important;
  --px2-green-strong: var(--pt-theme-accent-text) !important;
  --px2-green-soft: var(--pt-theme-accent-soft) !important;
  --px2-amber: var(--pt-theme-warning) !important;
  --px2-amber-soft: color-mix(
    in srgb,
    var(--pt-theme-warning) 18%,
    var(--pt-theme-surface)
  ) !important;
  --px2-red: var(--pt-theme-danger) !important;
  --px2-red-soft: var(--pt-theme-danger-soft) !important;
  --px2-indigo: var(--pt-theme-focus, #4f46e5) !important;
  --px2-shadow: var(--pt-theme-shadow-sm) !important;
  --px2-on-accent: var(--pt-theme-text-inverse) !important;
  color: var(--px2-text);
}

[data-product-page] [data-product-experience="2.0"] :is(
  .px2-hero__content,
  .decision,
  .timeline,
  .details,
  .trust,
  .alternatives article,
  .price-box
) {
  border-color: var(--px2-border);
  color: var(--px2-text);
}

[data-product-page] [data-product-experience="2.0"] :is(
  .px2-hero__content,
  .decision,
  .timeline,
  .details,
  .trust,
  .alternatives article
) {
  background-color: var(--px2-surface);
}

[data-product-page] [data-product-experience="2.0"] :is(
  h1,
  h2,
  h3,
  h4,
  strong,
  legend,
  dt
) {
  color: var(--px2-text) !important;
}

[data-product-page] [data-product-experience="2.0"] :is(
  p,
  li,
  dd,
  small,
  figcaption,
  label
) {
  color: var(--px2-muted);
}

[data-product-page] [data-product-experience="2.0"] :is(
  .decision__header > span,
  .alternatives > header > span,
  .trust > header > span,
  .timeline > header > span,
  .price-box__eyebrow
) {
  color: var(--px2-green-strong) !important;
}
`;

const manualService = `export async function setManualProductPrice(input = {}) {
  const slug = String(input.slug || "").trim();
  if (!slug) throw new Error("Produkt-Slug fehlt.");

  const current = Number(String(input.current ?? "").trim().replace(",", "."));
  if (!Number.isFinite(current) || current <= 0) {
    throw new Error("Der manuelle Preis muss größer als 0 sein.");
  }

  const currency = String(input.currency || "EUR").trim().toUpperCase();
  if (!/^[A-Z]{3}$/.test(currency)) {
    throw new Error("Die Währung muss als dreistelliger ISO-Code angegeben werden.");
  }

  const documents = await listPriceDocuments();
  const document = documents.find((item) => item.slug === slug);
  if (!document) throw new Error(\`Produkt "\${slug}" wurde nicht gefunden.\`);

  const data = document.data ?? {};
  const enteredUrl = String(input.affiliateUrl || "").trim();
  let affiliateUrl =
    enteredUrl ||
    data.price?.affiliateUrl ||
    data.affiliate?.url ||
    data.productUrl ||
    undefined;

  if (affiliateUrl) {
    const parsed = new URL(affiliateUrl);
    if (parsed.protocol !== "https:") {
      throw new Error("Für manuelle Preise sind nur HTTPS-URLs erlaubt.");
    }
    affiliateUrl = parsed.href;
  }

  const sourceLabel =
    String(input.sourceLabel || "").trim().slice(0, 120) ||
    (data.price?.source?.type === "manual"
      ? String(data.price.source.label || "").trim()
      : "") ||
    "Manuell im SEO Cockpit";
  const comparisonText =
    String(input.comparisonText || "").trim().slice(0, 360) ||
    data.price?.comparisonText ||
    undefined;
  const checkedAt = new Date().toISOString();

  await updateProductPrice(document.file, {
    current,
    currency,
    status: "unknown",
    comparisonText,
    checkedAt,
    affiliateUrl,
    source: {
      id: "manual",
      label: sourceLabel,
      type: "manual",
      ...(affiliateUrl ? { url: affiliateUrl } : {})
    }
  });

  return {
    slug: document.slug,
    title: data.title,
    current,
    currency,
    checkedAt,
    source: sourceLabel,
    affiliateUrl: affiliateUrl ?? null,
    method: "manual"
  };
}

`;

const operationsImportBefore =
  'import { checkAllProductPrices, checkProductPrice, priceAudit } from "../price-intelligence/service.mjs";';
const operationsImportAfter =
  'import { checkAllProductPrices, checkProductPrice, priceAudit, setManualProductPrice } from "../price-intelligence/service.mjs";';
const operationsRouteBefore =
  '    if(request.method==="POST"&&pathname==="/api/admin/prices/check-all"){assertJsonRequest(request);const body=await readJsonBody(request,32_768);json(response,200,await checkAllProductPrices({limit:body.limit}),origin);return true}';
const operationsRouteAfter =
  '    if(request.method==="POST"&&pathname==="/api/admin/prices/check-all"){assertJsonRequest(request);const body=await readJsonBody(request,32_768);json(response,200,await checkAllProductPrices({limit:body.limit}),origin);return true}\n    if(request.method==="POST"&&pathname==="/api/admin/prices/manual"){assertJsonRequest(request);const body=await readJsonBody(request,32_768);json(response,200,await setManualProductPrice(body),origin);return true}';

async function main() {
  if (!(await exists(path.join(appRoot, "package.json")))) {
    throw new Error(`PfotenTechnik-Projekt nicht gefunden: ${appRoot}`);
  }

  await fs.mkdir(backupRoot, { recursive: true });

  try {
    await copyPayload(
      "apps/pfotentechnik/src/components/product-experience-2/ProductDecisionAssistant.astro"
    );
    await copyPayload(
      "apps/pfotentechnik/src/domain/productExperience/decisionEngine.ts"
    );
    await copyPayload(
      "apps/pfotentechnik/src/pages/admin/seo/prices.astro"
    );
    await copyPayload(
      "apps/pfotentechnik/test/product-experience-2-hotfix.test.mjs"
    );

    await patchFile(
      "apps/pfotentechnik/src/domain/productExperience/model.ts",
      (source) => {
        let next = replaceBetween(
          source,
          "const decisionProfileFor =",
          "\n\nconst candidateScore =",
          decisionProfileBlock,
          "decisionProfileFor"
        );
        next = replaceBetween(
          next,
          "const toAlternative =",
          "\n\nconst intelligentAlternatives =",
          alternativeBlock,
          "toAlternative"
        );
        return next;
      }
    );

    await patchFile(
      "apps/pfotentechnik/src/styles/pfotentechnik-theme-fixes.css",
      (source) => {
        if (source.includes("Product Experience 2.0 Theme Bridge 2.0.1")) {
          throw new Error("Theme Bridge ist bereits installiert.");
        }
        return `${source.replace(/\s+$/, "")}${themeBridge}\n`;
      }
    );

    await patchFile(
      "apps/pfotentechnik/src/domain/price/types.ts",
      (source) => replaceOnce(
        source,
        'type: "merchant" | "affiliate" | "editorial" | "unknown";',
        'type: "merchant" | "affiliate" | "editorial" | "manual" | "unknown";',
        "PriceSource manual"
      )
    );

    await patchFile(
      "apps/pfotentechnik/src/content/schema/product.ts",
      (source) => replaceOnce(
        source,
        '        "editorial",\n        "unknown"',
        '        "editorial",\n        "manual",\n        "unknown"',
        "productPriceSourceSchema manual"
      )
    );

    await patchFile(
      "apps/pfotentechnik/src/lib/price-intelligence/service.mjs",
      (source) => {
        if (source.includes("export async function setManualProductPrice")) {
          throw new Error("Manuelle Preisfunktion ist bereits installiert.");
        }
        return replaceOnce(
          source,
          "export async function priceAudit() {",
          `${manualService}export async function priceAudit() {`,
          "setManualProductPrice"
        );
      }
    );

    await patchFile(
      "apps/pfotentechnik/src/lib/admin/operations-router.mjs",
      (source) => {
        let next = replaceOnce(
          source,
          operationsImportBefore,
          operationsImportAfter,
          "Operations Router Import"
        );
        next = replaceOnce(
          next,
          operationsRouteBefore,
          operationsRouteAfter,
          "Operations Router Manual Route"
        );
        return next;
      }
    );

    const state = {
      patchId: PATCH_ID,
      version: VERSION,
      installedAt: new Date().toISOString(),
      repoRoot,
      backupRoot,
      restoredFiles: [...touched.values()],
      createdFiles: [...created].map((file) => path.relative(repoRoot, file))
    };
    await atomicWrite(
      path.join(backupRoot, "install-state.json"),
      JSON.stringify(state, null, 2)
    );

    if (!args.skipValidation) {
      run(
        process.execPath,
        [
          "--experimental-strip-types",
          "--test",
          "test/product-experience-2-hotfix.test.mjs"
        ],
        appRoot
      );
      run("npm", ["run", "audit:products"], appRoot);
      run("npm", ["run", "build"], appRoot);
    }

    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    await atomicWrite(
      reportPath,
      JSON.stringify(
        {
          ...state,
          validationSkipped: args.skipValidation,
          status: "success"
        },
        null,
        2
      )
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

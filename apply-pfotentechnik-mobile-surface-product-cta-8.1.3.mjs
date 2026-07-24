#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-mobile-surface-product-cta-8.1.3";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const CHECK_ONLY = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");

const TARGETS = {
  premiumRenderer:
    "packages/affiliate-core/src/renderer/PremiumRenderer.astro",
  productRenderer:
    "apps/pfotentechnik/src/components/product-standard-2/ProductRenderer.astro",
  alternatives:
    "apps/pfotentechnik/src/domain/productAlternatives/index.ts",
  methodology:
    "packages/affiliate-core/src/components/comparison/ComparisonMethodology.astro"
};

const PREMIUM_MARKER =
  "/* === PfotenTechnik Mobile Surface Product CTA 8.1.3 === */";

function log(message) {
  console.log(`[${PATCH_ID}] ${message}`);
}

function fail(message) {
  throw new Error(message);
}

function isRepositoryRoot(candidate) {
  return (
    fs.existsSync(path.join(candidate, "package.json")) &&
    fs.existsSync(path.join(candidate, "apps", "pfotentechnik")) &&
    fs.existsSync(path.join(candidate, "packages", "affiliate-core"))
  );
}

function findRepositoryRoot() {
  const starts = [process.cwd(), SCRIPT_DIR];

  for (const start of starts) {
    let current = path.resolve(start);

    while (true) {
      if (isRepositoryRoot(current)) return current;

      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }

  fail(
    "Repository-Hauptverzeichnis nicht gefunden. " +
      "Lege den Installer in das Repository oder starte ihn innerhalb des Repositories."
  );
}

function readUtf8(file) {
  return fs.readFileSync(file, "utf8");
}

function detectEol(text) {
  return text.includes("\r\n") ? "\r\n" : "\n";
}

function withEol(text, eol) {
  return text.replace(/\r\n|\r|\n/g, eol);
}

function replaceRequired(text, pattern, replacement, label) {
  const next = text.replace(pattern, replacement);

  if (next === text) {
    fail(`Anker nicht gefunden: ${label}`);
  }

  return next;
}

function removeRequired(text, pattern, label) {
  const next = text.replace(pattern, "");

  if (next === text) {
    fail(`Anker nicht gefunden: ${label}`);
  }

  return next;
}

function insertBeforeClosingStyle(text, css) {
  const closingIndex = text.lastIndexOf("</style>");

  if (closingIndex < 0) {
    fail("PremiumRenderer: schließendes </style> nicht gefunden.");
  }

  return (
    text.slice(0, closingIndex).replace(/\s*$/, "\n\n") +
    css.trim() +
    "\n" +
    text.slice(closingIndex)
  );
}

function patchPremiumRenderer(source) {
  if (source.includes(PREMIUM_MARKER)) {
    return {
      content: source,
      changes: ["Mobile-Surface-Regeln bereits vorhanden"]
    };
  }

  const eol = detectEol(source);
  const css = withEol(
    `
${PREMIUM_MARKER}

/* Eyebrow bleibt reine Typografie. Frühere Farbbalken und Dekorationen entfallen. */
.premium-v3--pfotentechnik .premium-v3-eyebrow {
  padding-inline-start: 0 !important;
  border-inline-start: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.premium-v3--pfotentechnik .premium-v3-eyebrow::before,
.premium-v3--pfotentechnik .premium-v3-eyebrow::after {
  display: none !important;
  content: none !important;
}

/* Nur die eigentlichen Karten bilden Flächen. Wrapper bleiben unsichtbar. */
.premium-v3--pfotentechnik .premium-v3-grid,
.premium-v3--pfotentechnik .premium-v3-list {
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

/* Quick-Facts-Verweis als kompakter Textlink statt zweitem großen Button. */
.premium-v3--pfotentechnik .premium-v3-quickFacts > .premium-v3-button {
  display: inline-flex !important;
  width: fit-content !important;
  min-height: 0 !important;
  margin: 18px 0 0 !important;
  padding: 0 !important;
  gap: 7px !important;
  align-items: center !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  color: var(--ed-accent) !important;
  font-size: 0.94rem !important;
  font-weight: 800 !important;
  line-height: 1.4 !important;
  text-decoration: none !important;
  box-shadow: none !important;
}

.premium-v3--pfotentechnik .premium-v3-quickFacts > .premium-v3-button::after {
  content: "→";
  flex: 0 0 auto;
}

.premium-v3--pfotentechnik .premium-v3-quickFacts > .premium-v3-button:hover {
  text-decoration: underline !important;
  text-underline-offset: 0.2em !important;
}

/* === End PfotenTechnik Mobile Surface Product CTA 8.1.3 === */
`,
    eol
  );

  return {
    content: insertBeforeClosingStyle(source, css),
    changes: [
      "Eyebrow-Farbbalken entfernt",
      "Listen- und Grid-Wrapper transparent gesetzt",
      "Quick-Facts-CTA als kompakter Textlink gestaltet"
    ]
  };
}

function patchProductRenderer(source) {
  let next = source;
  const changes = [];

  if (!next.includes("const secondaryCtaHref =")) {
    next = replaceRequired(
      next,
      /(const alternatives\s*=\s*list<any>\(alternativeRecommendations\)[\s\S]*?\.slice\(0,\s*3\);)/,
      `$1

const secondaryCtaHref =
  alternatives.length > 0
    ? "#alternativen"
    : categoryHref || "/vergleiche/";

const secondaryCtaLabel =
  alternatives.length > 0
    ? "Alternativen vergleichen"
    : category
      ? \`\${category} vergleichen\`
      : "Weitere Produkte vergleichen";`,
      "ProductRenderer: Alternativen-Auswertung"
    );

    changes.push("Sekundärer CTA erhält immer ein echtes Ziel");
  }

  if (next.includes('href="#alternativen"')) {
    next = replaceRequired(
      next,
      /<a\s+class="native-buybox__secondary"\s+href="#alternativen">\s*Alternativen vergleichen\s*<\/a>/,
      `<a class="native-buybox__secondary" href={secondaryCtaHref}>
        {secondaryCtaLabel}
      </a>`,
      "ProductRenderer: sekundärer Buybox-CTA"
    );

    changes.push("Toter #alternativen-Link ersetzt");
  }

  if (/\bconst testStatus\s*=/.test(next)) {
    next = removeRequired(
      next,
      /\nconst testStatus\s*=\s*asText\([\s\S]*?\n\);\n/,
      "ProductRenderer: Statusvariable"
    );

    changes.push("Nicht mehr benötigte Statusvariable entfernt");
  }

  if (/\{testStatus\s*&&\s*<div><dt>Status<\/dt>/.test(next)) {
    next = removeRequired(
      next,
      /\s*\{testStatus\s*&&\s*<div><dt>Status<\/dt><dd>\{testStatus\}<\/dd><\/div>\}/,
      "ProductRenderer: Statuszeile in der Buybox"
    );

    changes.push("Statuszeile aus der Buybox entfernt");
  }

  if (!next.includes("const secondaryCtaHref =")) {
    fail("ProductRenderer: sekundäres CTA-Ziel wurde nicht erzeugt.");
  }

  if (next.includes('href="#alternativen"')) {
    fail("ProductRenderer: statischer #alternativen-Link ist noch vorhanden.");
  }

  if (/\bconst testStatus\s*=/.test(next)) {
    fail("ProductRenderer: Statusvariable ist noch vorhanden.");
  }

  return {
    content: next,
    changes:
      changes.length > 0
        ? changes
        : ["CTA- und Statuskorrekturen bereits vorhanden"]
  };
}

const ALTERNATIVES_CONTENT = `import type { CollectionEntry } from "astro:content";
import type { AlternativeRecommendation } from "@affiliate-core/components/product/alternativeRecommendation.types";
import { getFutterautomatenAlternatives } from "./categories/futterautomaten";

export type ProductEntry = CollectionEntry<"products">;

const cleanVisibleLabel = (value: string) =>
  value
    .replace(
      /^\\s*(?:[✓✔☑✅✕✖×❌✗✘•\\-–—]+\\s*)+/u,
      ""
    )
    .trim();

const normalizeLabel = (value: unknown) =>
  cleanVisibleLabel(String(value ?? ""))
    .replace(/[-_]+/g, " ")
    .replace(/\\s+/g, " ")
    .toLocaleLowerCase("de-DE")
    .trim();

const capitalizeFirst = (value: string) => {
  const cleaned = cleanVisibleLabel(value);

  return cleaned
    ? cleaned.charAt(0).toLocaleUpperCase("de-DE") +
        cleaned.slice(1)
    : cleaned;
};

const formatVisibleLabel = (value: string) => {
  const normalized = normalizeLabel(value);

  const labels: Record<string, string> = {
    "große hunde": "Große Hunde",
    "grosse hunde": "Große Hunde",
    "größere hunde": "Größere Hunde",
    "groessere hunde": "Größere Hunde",
    "mittelgroße hunde": "Mittelgroße Hunde",
    "mittelgrosse hunde": "Mittelgroße Hunde",
    "kleine hunde": "Kleine Hunde",
    "große katzen": "Große Katzen",
    "grosse katzen": "Große Katzen",
    "kleine katzen": "Kleine Katzen",
    "katzen": "Katzen",
    "hunde": "Hunde",
    "mehrhundehaushalte": "Mehrhundehaushalte",
    "mehrkatzenhaushalte": "Mehrkatzenhaushalte",
    "mehrtierhaushalte": "Mehrtierhaushalte",
    "hoher wasserbedarf": "Hoher Wasserbedarf",
    "niedriger wasserbedarf": "Niedriger Wasserbedarf",
    "großes volumen": "Großes Volumen",
    "grosses volumen": "Großes Volumen",
    "breite trinkfläche": "Breite Trinkfläche",
    "breite trinkflaeche": "Breite Trinkfläche",
    "mit app": "Mit App",
    "ohne app": "Ohne App",
    "mit kamera": "Mit Kamera",
    "ohne kamera": "Ohne Kamera",
    "mit akku": "Mit Akku",
    "ohne akku": "Ohne Akku",
    "nassfutter": "Nassfutter",
    "trockenfutter": "Trockenfutter",
    "edelstahl": "Edelstahl",
    "kunststoff": "Kunststoff",
    "keramik": "Keramik",
    "preis leistung": "Preis-Leistung"
  };

  return labels[normalized] ?? capitalizeFirst(value);
};

const formatAlternativeHeadline = (value: string) => {
  const normalized = normalizeLabel(value);

  const headlines: Record<string, string> = {
    "große hunde": "Für große Hunde",
    "grosse hunde": "Für große Hunde",
    "größere hunde": "Für größere Hunde",
    "groessere hunde": "Für größere Hunde",
    "mittelgroße hunde": "Für mittelgroße Hunde",
    "mittelgrosse hunde": "Für mittelgroße Hunde",
    "kleine hunde": "Für kleine Hunde",
    "große katzen": "Für große Katzen",
    "grosse katzen": "Für große Katzen",
    "kleine katzen": "Für kleine Katzen",
    "katzen": "Für Katzen",
    "hunde": "Für Hunde",
    "mehrhundehaushalte": "Für Mehrhundehaushalte",
    "mehrkatzenhaushalte": "Für Mehrkatzenhaushalte",
    "mehrtierhaushalte": "Für Mehrtierhaushalte",
    "hoher wasserbedarf": "Bei hohem Wasserbedarf",
    "niedriger wasserbedarf": "Bei niedrigem Wasserbedarf",
    "großes volumen": "Wenn viel Volumen benötigt wird",
    "grosses volumen": "Wenn viel Volumen benötigt wird",
    "breite trinkfläche": "Für eine breite Trinkfläche",
    "breite trinkflaeche": "Für eine breite Trinkfläche",
    "mit app": "Mit App",
    "ohne app": "Ohne App",
    "mit kamera": "Mit Kamera",
    "ohne kamera": "Ohne Kamera",
    "mit akku": "Mit Akku",
    "ohne akku": "Ohne Akku",
    "nassfutter": "Für Nassfutter",
    "trockenfutter": "Für Trockenfutter",
    "edelstahl": "Mit Edelstahl",
    "preis leistung": "Als Preis-Leistungs-Alternative"
  };

  return headlines[normalized] ?? \`Für \${formatVisibleLabel(value)}\`;
};

const asArray = (value: unknown): unknown[] =>
  Array.isArray(value) ? value : [];

const stringArray = (value: unknown): string[] =>
  asArray(value)
    .map((item) => String(item ?? "").trim())
    .filter(Boolean);

const categoryKey = (entry: ProductEntry) => {
  const data = entry.data as any;
  const category = data.category;

  return normalizeLabel(
    typeof category === "string"
      ? category
      : category?.key ?? category?.label
  );
};

const slugOf = (entry: ProductEntry) => {
  const data = entry.data as any;
  return String(data.slug ?? entry.id).replace(/\\.mdx?$/i, "");
};

const normalizeAnimal = (value: string) => {
  const normalized = normalizeLabel(value);

  if (["dog", "hund", "hunde"].includes(normalized)) return "dog";
  if (["cat", "katze", "katzen"].includes(normalized)) return "cat";

  return normalized;
};

const normalizeSize = (value: string) => {
  const normalized = normalizeLabel(value);

  if (["small", "klein", "kleine", "kleiner"].includes(normalized)) {
    return "small";
  }

  if (
    ["medium", "mittel", "mittelgroß", "mittelgross"].includes(normalized)
  ) {
    return "medium";
  }

  if (
    ["large", "groß", "gross", "große", "grosse"].includes(normalized)
  ) {
    return "large";
  }

  return normalized;
};

const collectAnimals = (entry: ProductEntry) => {
  const data = entry.data as any;

  return new Set(
    [
      ...stringArray(data.gps?.animal),
      ...stringArray(data.comparisonFilters?.animal),
      ...stringArray(data.comparisonData?.general?.animal),
      ...stringArray(data.comparisonData?.gps?.animal)
    ].map(normalizeAnimal)
  );
};

const collectSizes = (entry: ProductEntry) => {
  const data = entry.data as any;

  return new Set(
    [
      ...stringArray(data.comparisonFilters?.petSize),
      ...stringArray(data.comparisonData?.general?.petSize)
    ].map(normalizeSize)
  );
};

const intersects = (left: Set<string>, right: Set<string>) =>
  [...left].some((value) => right.has(value));

const isCompatible = (
  current: ProductEntry,
  candidate: ProductEntry
) => {
  const currentAnimals = collectAnimals(current);
  const candidateAnimals = collectAnimals(candidate);
  const currentSizes = collectSizes(current);
  const candidateSizes = collectSizes(candidate);

  if (
    currentAnimals.size > 0 &&
    candidateAnimals.size > 0 &&
    !intersects(currentAnimals, candidateAnimals)
  ) {
    return false;
  }

  if (
    currentSizes.size > 0 &&
    candidateSizes.size > 0 &&
    !intersects(currentSizes, candidateSizes)
  ) {
    return false;
  }

  return true;
};

const editorialScore = (entry: ProductEntry) => {
  const data = entry.data as any;
  const raw = Number(data.score ?? data.rating ?? 0);

  if (!Number.isFinite(raw)) return 0;
  return raw <= 5 ? raw * 20 : raw;
};

const fallbackRank = (
  current: ProductEntry,
  candidate: ProductEntry
) => {
  const currentAnimals = collectAnimals(current);
  const candidateAnimals = collectAnimals(candidate);
  const currentSizes = collectSizes(current);
  const candidateSizes = collectSizes(candidate);

  const animalFit =
    currentAnimals.size > 0 &&
    candidateAnimals.size > 0 &&
    intersects(currentAnimals, candidateAnimals)
      ? 1000
      : 0;

  const sizeFit =
    currentSizes.size > 0 &&
    candidateSizes.size > 0 &&
    intersects(currentSizes, candidateSizes)
      ? 250
      : 0;

  return animalFit + sizeFit + editorialScore(candidate);
};

const toRecommendation = (
  candidate: ProductEntry
): AlternativeRecommendation => {
  const data = candidate.data as any;
  const bestFor = stringArray(data.decision?.bestFor);
  const primaryUseCase = bestFor[0];
  const images = data.images ?? {};
  const review = data.review ?? {};

  return {
    productKey: slugOf(candidate),
    name: String(data.title ?? data.name ?? slugOf(candidate)),
    url:
      data.productUrl ??
      \`/produkt/\${slugOf(candidate)}/\`,
    image:
      images.comparison?.src ??
      images.thumbnail?.src ??
      images.hero?.src ??
      images.hero,
    score: Math.round(editorialScore(candidate)),
    rating: Number(data.rating ?? 0),
    icon: "",
    headline: primaryUseCase
      ? formatAlternativeHeadline(primaryUseCase)
      : "Eine passende Alternative",
    reason: String(
      data.recommendation ??
        data.description ??
        "Passende Alternative im direkten Vergleich."
    ),
    difference: String(
      review.verdict ??
        review.summary ??
        data.description ??
        ""
    ),
    tags: bestFor.slice(0, 3).map(formatVisibleLabel)
  };
};

const explicitEntries = (
  currentProduct: ProductEntry,
  products: ProductEntry[]
) => {
  const data = currentProduct.data as any;
  const requested = stringArray(data.alternatives);
  const bySlug = new Map(
    products.map((product) => [slugOf(product), product])
  );

  return requested
    .map((slug) => bySlug.get(slug))
    .filter(
      (candidate): candidate is ProductEntry =>
        Boolean(candidate && candidate.id !== currentProduct.id)
    );
};

export const getAlternativeRecommendations = (
  currentProduct: ProductEntry,
  products: ProductEntry[],
  limit = 3
): AlternativeRecommendation[] => {
  const explicit = explicitEntries(currentProduct, products);
  const explicitSlugs = new Set(explicit.map(slugOf));
  const result: AlternativeRecommendation[] =
    explicit.map(toRecommendation);

  if (result.length >= limit) {
    return result.slice(0, limit);
  }

  const category = categoryKey(currentProduct);

  if (
    category.includes("futterautomat") ||
    category.includes("fütter")
  ) {
    const specialized = getFutterautomatenAlternatives(
      currentProduct,
      products,
      Math.max(limit * 3, limit)
    ).filter(
      (recommendation) =>
        !explicitSlugs.has(recommendation.productKey)
    );

    return [...result, ...specialized].slice(0, limit);
  }

  const fallback = products
    .filter(
      (candidate) =>
        candidate.id !== currentProduct.id &&
        !explicitSlugs.has(slugOf(candidate)) &&
        categoryKey(candidate) === category &&
        isCompatible(currentProduct, candidate)
    )
    .sort(
      (left, right) =>
        fallbackRank(currentProduct, right) -
          fallbackRank(currentProduct, left) ||
        slugOf(left).localeCompare(slugOf(right), "de")
    )
    .slice(0, Math.max(0, limit - result.length))
    .map(toRecommendation);

  return [...result, ...fallback].slice(0, limit);
};
`;

function patchAlternatives(source) {
  const eol = detectEol(source);
  const content = withEol(ALTERNATIVES_CONTENT, eol);

  if (source === content) {
    return {
      content: source,
      changes: ["Erweiterte Alternativenlogik bereits vorhanden"]
    };
  }

  return {
    content,
    changes: [
      "Alternativenlogik auf GPS und weitere Kategorien erweitert",
      "Explizite Frontmatter-Alternativen werden priorisiert",
      "Tier- und Größen-Fit wird beim Fallback berücksichtigt"
    ]
  };
}

const METHODOLOGY_CONTENT = `---
type Props = {
  productCount: number;
  criterionCount: number;
};

const { productCount, criterionCount } = Astro.props as Props;
---

<section
  class="comparison-methodology"
  aria-labelledby="comparison-methodology-title"
>
  <div>
    <span class="comparison-eyebrow">So vergleichen wir</span>
    <h2 id="comparison-methodology-title">
      Transparente Kriterien statt pauschaler Bestenliste
    </h2>
  </div>

  <div class="comparison-methodology__content">
    <p>
      Dieser Vergleich ordnet {productCount}{" "}Modelle anhand von{" "}
      {criterionCount}{" "}nachvollziehbaren Merkmalen ein. Produktdaten,
      redaktionelle Bewertung und bekannte Einschränkungen werden getrennt
      betrachtet. Fehlende Herstellerangaben werden nicht als Vorteil gewertet.
    </p>

    <ul>
      <li>
        <strong>Eignung vor Funktionsmenge:</strong>{" "}
        Ein Modell gewinnt nicht automatisch, weil es die längste Ausstattungsliste besitzt.
      </li>
      <li>
        <strong>Nachteile bleiben sichtbar:</strong>{" "}
        Einschränkungen und fehlende Angaben werden nicht hinter einem Gesamtscore versteckt.
      </li>
      <li>
        <strong>Entscheidung bleibt nachvollziehbar:</strong>{" "}
        Tabelle, Szenarien und Fazit zeigen, warum ein Produkt empfohlen wird.
      </li>
    </ul>
  </div>
</section>
`;

function patchMethodology(source) {
  const eol = detectEol(source);
  const content = withEol(METHODOLOGY_CONTENT, eol);

  if (source === content) {
    return {
      content: source,
      changes: ["Explizite Textabstände bereits vorhanden"]
    };
  }

  return {
    content,
    changes: [
      "Explizite Leerzeichen unabhängig von LF/CRLF ergänzt"
    ]
  };
}

function timestamp() {
  return new Date()
    .toISOString()
    .replace(/[:.]/g, "-");
}

function copyBackup(root, backupRoot, relativePath) {
  const source = path.join(root, relativePath);
  const destination = path.join(backupRoot, relativePath);

  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(source, destination);
}

function restoreBackup(root, backupRoot, relativePath) {
  const source = path.join(backupRoot, relativePath);
  const destination = path.join(root, relativePath);

  if (!fs.existsSync(source)) {
    fail(`Rollback-Datei fehlt: ${source}`);
  }

  fs.copyFileSync(source, destination);
}

function writeAtomic(file, content) {
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, content, "utf8");
  fs.renameSync(temp, file);
}

function runBuild(root) {
  log("Starte npm run build:pfotentechnik ...");

  let result;

  if (process.platform === "win32") {
    const commandProcessor =
      process.env.ComSpec ||
      path.join(
        process.env.SystemRoot || "C:\\Windows",
        "System32",
        "cmd.exe"
      );

    result = spawnSync(
      commandProcessor,
      ["/d", "/s", "/c", "npm run build:pfotentechnik"],
      {
        cwd: root,
        stdio: "inherit",
        windowsHide: false,
        shell: false
      }
    );
  } else {
    result = spawnSync(
      "npm",
      ["run", "build:pfotentechnik"],
      {
        cwd: root,
        stdio: "inherit",
        shell: false
      }
    );
  }

  if (result.error) {
    fail(
      `Build-Prozess konnte nicht gestartet werden: ` +
        `${result.error.message}`
    );
  }

  if (result.status !== 0) {
    fail(
      `Build fehlgeschlagen` +
        (result.signal ? ` (Signal ${result.signal})` : "") +
        `. Exit-Code: ${result.status ?? "unbekannt"}`
    );
  }
}

function validateTargetFiles(root) {
  for (const relativePath of Object.values(TARGETS)) {
    const absolutePath = path.join(root, relativePath);

    if (!fs.existsSync(absolutePath)) {
      fail(`Datei nicht gefunden: ${relativePath}`);
    }
  }
}

function main() {
  const root = findRepositoryRoot();
  validateTargetFiles(root);

  log(`Repository: ${root}`);
  log(`Modus: ${CHECK_ONLY ? "nur prüfen" : "Änderungen anwenden"}`);

  const operations = [
    {
      relativePath: TARGETS.premiumRenderer,
      patch: patchPremiumRenderer
    },
    {
      relativePath: TARGETS.productRenderer,
      patch: patchProductRenderer
    },
    {
      relativePath: TARGETS.alternatives,
      patch: patchAlternatives
    },
    {
      relativePath: TARGETS.methodology,
      patch: patchMethodology
    }
  ];

  const planned = operations.map((operation) => {
    const absolutePath = path.join(root, operation.relativePath);
    const original = readUtf8(absolutePath);
    const result = operation.patch(original);

    return {
      ...operation,
      absolutePath,
      original,
      content: result.content,
      changes: result.changes,
      changed: result.content !== original
    };
  });

  for (const operation of planned) {
    log(
      `${operation.changed ? "ÄNDERN" : "OK"}: ` +
        operation.relativePath
    );

    for (const change of operation.changes) {
      log(`  - ${change}`);
    }
  }

  const changed = planned.filter((operation) => operation.changed);

  if (CHECK_ONLY) {
    log(
      `${changed.length} Datei(en) würden geändert. ` +
        "Es wurde nichts geschrieben."
    );
    return;
  }

  if (changed.length === 0) {
    log("Alle Korrekturen sind bereits vorhanden.");

    if (!SKIP_BUILD) {
      runBuild(root);
      log("Build erfolgreich.");
    }

    return;
  }

  const backupRoot = path.join(
    root,
    ".patch-backups",
    `${PATCH_ID}-${timestamp()}`
  );

  for (const operation of changed) {
    copyBackup(root, backupRoot, operation.relativePath);
  }

  log(`Backup: ${backupRoot}`);

  try {
    for (const operation of changed) {
      writeAtomic(operation.absolutePath, operation.content);
    }

    log(`${changed.length} Datei(en) geschrieben.`);

    if (!SKIP_BUILD) {
      runBuild(root);
      log("Build erfolgreich.");
    } else {
      log("Build wurde durch --skip-build übersprungen.");
    }

    log("Patch erfolgreich abgeschlossen.");
  } catch (error) {
    console.error(
      `\n[${PATCH_ID}] Fehler erkannt. ` +
        "Ursprungsdateien werden wiederhergestellt ..."
    );

    let rollbackError = null;

    try {
      for (const operation of changed) {
        restoreBackup(root, backupRoot, operation.relativePath);
      }

      console.error(`[${PATCH_ID}] Rollback abgeschlossen.`);
    } catch (currentRollbackError) {
      rollbackError = currentRollbackError;
      console.error(
        `[${PATCH_ID}] Rollback unvollständig: ` +
          `${
            currentRollbackError instanceof Error
              ? currentRollbackError.message
              : String(currentRollbackError)
          }`
      );
    }

    if (rollbackError) {
      throw new Error(
        `${
          error instanceof Error ? error.message : String(error)
        }\nZusätzlich ist der Rollback fehlgeschlagen. Backup: ${backupRoot}`
      );
    }

    throw error;
  }
}

try {
  main();
} catch (error) {
  console.error(
    `\n[${PATCH_ID}] FEHLER: ` +
      `${
        error instanceof Error
          ? error.message
          : String(error)
      }`
  );
  process.exit(1);
}

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PATCH_NAME = "pfotentechnik-mobile-surface-product-cta-8.1.1";
const PATCH_MARKER = "PfotenTechnik Mobile Surface + Product CTA Fix 8.1.1";

const TARGETS = {
  premiumRenderer: "packages/affiliate-core/src/renderer/PremiumRenderer.astro",
  productRenderer: "apps/pfotentechnik/src/components/product-standard-2/ProductRenderer.astro",
  alternatives: "apps/pfotentechnik/src/domain/productAlternatives/index.ts",
  comparisonMethodology:
    "packages/affiliate-core/src/components/comparison/ComparisonMethodology.astro"
};

const args = new Set(process.argv.slice(2));
const dryRun = args.has("--dry-run");
const skipBuild = args.has("--no-build");

const log = (message = "") => console.log(`[${PATCH_NAME}] ${message}`);
const fail = (message) => {
  throw new Error(message);
};

function findRepoRoot() {
  const scriptDir = path.dirname(fileURLToPath(import.meta.url));
  const starts = [process.cwd(), scriptDir];

  for (const start of starts) {
    let current = path.resolve(start);

    for (let depth = 0; depth < 10; depth += 1) {
      const allTargetsExist = Object.values(TARGETS).every((relativePath) =>
        fs.existsSync(path.join(current, relativePath))
      );

      if (allTargetsExist) {
        return current;
      }

      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }

  fail(
    "Repository nicht gefunden. Starte den Installer im Root von " +
      "Yushamon/affiliate-template oder lege ihn in einen Unterordner des Repositories."
  );
}

function replaceExactlyOnce(source, searchValue, replacement, label) {
  const occurrences =
    typeof searchValue === "string"
      ? source.split(searchValue).length - 1
      : [...source.matchAll(new RegExp(searchValue.source, searchValue.flags.includes("g")
          ? searchValue.flags
          : `${searchValue.flags}g`))].length;

  if (occurrences !== 1) {
    fail(`${label}: Erwartet wurde genau ein Anker, gefunden wurden ${occurrences}.`);
  }

  return source.replace(searchValue, replacement);
}

function patchPremiumRenderer(source) {
  if (
    source.includes(PATCH_MARKER) ||
    source.includes("PfotenTechnik Mobile Surface + Product CTA Fix 8.1.0")
  ) {
    return { content: source, changed: false, notes: ["CSS-Fix bereits vorhanden"] };
  }

  const closingStyle = source.lastIndexOf("</style>");
  if (closingStyle < 0) {
    fail("PremiumRenderer.astro: abschließendes </style> nicht gefunden.");
  }

  const css = `
/* === ${PATCH_MARKER} === */

/*
 * Mobile Eyebrows dürfen nicht zur farbigen Vollbreitenleiste werden.
 * Der Text bleibt ein kompaktes Label, unabhängig von globalen span-Regeln.
 */
.premium-v3--pfotentechnik .premium-v3-eyebrow {
  display: inline-flex !important;
  width: fit-content !important;
  max-width: 100% !important;
  justify-self: start !important;
  align-self: center !important;
  margin-inline: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

/*
 * Wrapperflächen entfernen. Nur die eigentlichen Karten und Listenzeilen
 * erhalten eine Oberfläche. Dadurch verschwinden rechteckige Farbbänder
 * hinter abgerundeten Elementen.
 */
.premium-v3--pfotentechnik :is(
  .premium-v3-grid,
  .premium-v3-list
) {
  background: transparent !important;
  box-shadow: none !important;
}

.premium-v3--pfotentechnik :is(
  .premium-v3-checks,
  .premium-v3-checklist
) {
  padding-inline: 0 !important;
  border: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.premium-v3--pfotentechnik :is(
  .premium-v3-checks,
  .premium-v3-checklist
) .premium-v3-list {
  width: 100% !important;
  margin: 0 !important;
  padding: 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
}

.premium-v3--pfotentechnik :is(
  .premium-v3-checks,
  .premium-v3-checklist
) .premium-v3-list li {
  border: 1px solid var(--ed-border) !important;
  border-radius: 15px !important;
  background: var(--ed-surface) !important;
  box-shadow: none !important;
}

/*
 * Karten-CTA als Textlink statt dunkler Vollbreitenleiste.
 */
.premium-v3--pfotentechnik .premium-v3-card-cta {
  display: inline-flex !important;
  width: fit-content !important;
  max-width: 100% !important;
  align-self: flex-start !important;
  margin-top: auto !important;
  padding: 14px 0 0 !important;
  border: 0 !important;
  border-radius: 0 !important;
  background: transparent !important;
  box-shadow: none !important;
  color: var(--ed-accent) !important;
}

/* === End ${PATCH_MARKER} === */
`;

  return {
    content: `${source.slice(0, closingStyle)}${css}\n${source.slice(closingStyle)}`,
    changed: true,
    notes: [
      "Eyebrow-Farbbalken entfernt",
      "Listen- und Grid-Wrapper transparent gesetzt",
      "Quick-Facts-CTA als kompakter Textlink gestaltet"
    ]
  };
}

function patchProductRenderer(source) {
  let content = source;
  const notes = [];

  /*
   * Nicht an die Formatierung des Alternatives-Blocks koppeln.
   * Der scoreLabel-Block ist der stabile Übergang zwischen Datenaufbereitung
   * und Template und kommt im Renderer genau einmal vor.
   */
  if (!content.includes("const secondaryBuyboxCta =")) {
    const scoreLabelAnchor = /\nconst\s+scoreLabel\s*=/;

    const insertion = `
const firstComparisonHref = list<any>(source.comparisons)
  .map((entry: any) => {
    const slug = asText(entry?.slug ?? entry?.key ?? entry);
    if (!slug) return "";
    if (slug.startsWith("/")) return slug;
    return \`/vergleiche/\${slug}/\`;
  })
  .find(Boolean);

const secondaryBuyboxCta =
  alternatives.length > 0
    ? {
        href: "#alternativen",
        label: "Alternativen vergleichen"
      }
    : firstComparisonHref
      ? {
          href: firstComparisonHref,
          label: "Im Vergleich ansehen"
        }
      : categoryHref
        ? {
            href: categoryHref,
            label: category
              ? \`Mehr \${category} vergleichen\`
              : "Weitere Modelle ansehen"
          }
        : null;

const scoreLabel =`;

    content = replaceExactlyOnce(
      content,
      scoreLabelAnchor,
      insertion,
      "ProductRenderer: sekundäre CTA-Logik vor scoreLabel einfügen"
    );
    notes.push("Sekundärer CTA erhält immer ein echtes Ziel");
  }

  const oldSecondary =
    /<a\b(?=[^>]*\bclass=["'][^"']*\bnative-buybox__secondary\b[^"']*["'])(?=[^>]*\bhref=["']#alternativen["'])[^>]*>\s*Alternativen vergleichen\s*<\/a>/s;

  if (oldSecondary.test(content)) {
    content = replaceExactlyOnce(
      content,
      oldSecondary,
      `{secondaryBuyboxCta && (
        <a class="native-buybox__secondary" href={secondaryBuyboxCta.href}>
          {secondaryBuyboxCta.label}
        </a>
      )}`,
      "ProductRenderer: toten Alternativen-Link ersetzen"
    );
    notes.push("Toter #alternativen-Link ersetzt");
  } else if (!content.includes("href={secondaryBuyboxCta.href}")) {
    fail(
      "ProductRenderer: Weder der alte noch der neue sekundäre Buybox-CTA wurde gefunden."
    );
  }

  /*
   * Der technische Content-Status bleibt intern erhalten, wird aber nicht
   * als rohe Schema-Option wie manufacturer-data ausgegeben.
   */
  const statusRow =
    /\s*\{testStatus\s*&&\s*(?:\(\s*)?<div>\s*<dt>\s*Status\s*<\/dt>\s*<dd>\s*\{testStatus\}\s*<\/dd>\s*<\/div>(?:\s*\))?\s*\}/s;

  if (statusRow.test(content)) {
    content = content.replace(statusRow, "");
    notes.push("Statuszeile aus der Buybox entfernt");
  } else if (/<dt>\s*Status\s*<\/dt>/s.test(content)) {
    fail("ProductRenderer: Eine Statuszeile ist vorhanden, konnte aber nicht sicher entfernt werden.");
  }

  const statusConst =
    /\nconst\s+testStatus\s*=\s*asText\(\s*source\.testStatus\s*\?\?\s*trust\.assessmentType\s*\?\?\s*trust\.testStatus\s*,\s*["']Redaktionelle Einordnung["']\s*\);\s*\n/s;

  if (statusConst.test(content)) {
    content = content.replace(statusConst, "\n");
    notes.push("Nicht mehr benötigte Statusvariable entfernt");
  }

  return {
    content,
    changed: content !== source,
    notes: notes.length ? notes : ["ProductRenderer bereits aktualisiert"]
  };
}

function patchAlternatives(source) {
  if (
    source.includes("PfotenTechnik generic product alternatives 8.1.0") ||
    source.includes("PfotenTechnik generic product alternatives 8.1.1")
  ) {
    return {
      content: source,
      changed: false,
      notes: ["Generische Alternativenlogik bereits vorhanden"]
    };
  }

  const oldEnding = /\n\s*return\s*\[\s*\]\s*;\s*\n\};\s*$/;

  const replacement = `  /* PfotenTechnik generic product alternatives 8.1.1
   * Explizite Alternativen werden bevorzugt. Fehlen sie, werden Produkte
   * derselben Kategorie mit passendem Tier-Fit verwendet. Damit funktionieren
   * auch GPS-, Katzenklappen- und weitere Produktcluster.
   */
  const preferredSlugs = Array.isArray(currentProduct.data.alternatives)
    ? currentProduct.data.alternatives
    : [];

  const preferred = new Map(
    preferredSlugs.map((slug, index) => [slug, index])
  );

  const currentAnimals = new Set(
    currentProduct.data.comparisonFilters?.animal ?? []
  );

  const currentSizes = new Set(
    currentProduct.data.comparisonFilters?.petSize ?? []
  );

  const hasOverlap = (left: Set<string>, rightValues: string[]) =>
    left.size === 0 ||
    rightValues.length === 0 ||
    rightValues.some((value) => left.has(value));

  return products
    .filter((candidate) => {
      if (candidate.id === currentProduct.id) return false;

      const isExplicit = preferred.has(candidate.data.slug);
      const candidateCategory = candidate.data.category.key
        .toLowerCase()
        .trim();

      if (!isExplicit && candidateCategory !== category) return false;

      const candidateAnimals =
        candidate.data.comparisonFilters?.animal ?? [];
      const candidateSizes =
        candidate.data.comparisonFilters?.petSize ?? [];

      return (
        isExplicit ||
        (
          hasOverlap(currentAnimals, candidateAnimals) &&
          hasOverlap(currentSizes, candidateSizes)
        )
      );
    })
    .sort((a, b) => {
      const aPreferred =
        preferred.get(a.data.slug) ?? Number.MAX_SAFE_INTEGER;
      const bPreferred =
        preferred.get(b.data.slug) ?? Number.MAX_SAFE_INTEGER;

      const aScore =
        a.data.score ?? Math.round(a.data.rating * 20);
      const bScore =
        b.data.score ?? Math.round(b.data.rating * 20);

      return aPreferred - bPreferred || bScore - aScore;
    })
    .slice(0, limit)
    .map((candidate) => {
      const primaryUseCase =
        candidate.data.decision.bestFor[0];

      return {
        productKey: candidate.data.slug,
        name: candidate.data.title,
        url:
          candidate.data.productUrl ??
          \`/produkt/\${candidate.data.slug}/\`,
        image:
          candidate.data.images.comparison?.src ??
          candidate.data.images.hero.src,
        score:
          candidate.data.score ??
          Math.round(candidate.data.rating * 20),
        rating: candidate.data.rating,
        icon: "",
        headline: primaryUseCase
          ? formatAlternativeHeadline(primaryUseCase)
          : "Eine passende Alternative",
        reason: candidate.data.recommendation,
        difference: candidate.data.review.verdict,
        tags: candidate.data.decision.bestFor
          .slice(0, 3)
          .map(formatVisibleLabel)
      };
    });
};`;

  const content = replaceExactlyOnce(
    source,
    oldEnding,
    replacement,
    "productAlternatives: leeren Fallback ersetzen"
  );

  return {
    content,
    changed: true,
    notes: [
      "Alternativenlogik auf GPS und weitere Kategorien erweitert",
      "Explizite Frontmatter-Alternativen werden priorisiert",
      "Tier- und Größen-Fit wird beim Fallback berücksichtigt"
    ]
  };
}

function patchComparisonMethodology(source) {
  let content = source;
  let changed = false;

  const replacements = [
    [
      "<strong>Eignung vor Funktionsmenge:</strong>\n        Ein Modell",
      '<strong>Eignung vor Funktionsmenge:</strong>{" "}\n        Ein Modell'
    ],
    [
      "<strong>Nachteile bleiben sichtbar:</strong>\n        Einschränkungen",
      '<strong>Nachteile bleiben sichtbar:</strong>{" "}\n        Einschränkungen'
    ],
    [
      "<strong>Entscheidung bleibt nachvollziehbar:</strong>\n        Tabelle",
      '<strong>Entscheidung bleibt nachvollziehbar:</strong>{" "}\n        Tabelle'
    ]
  ];

  for (const [before, after] of replacements) {
    if (content.includes(before)) {
      content = content.replace(before, after);
      changed = true;
    }
  }

  const missingSpacesRemain =
    /<\/strong>\s*\n\s*(Ein Modell|Einschränkungen|Tabelle)/.test(content);

  if (missingSpacesRemain) {
    fail("ComparisonMethodology: Textabstände konnten nicht vollständig korrigiert werden.");
  }

  return {
    content,
    changed,
    notes: changed
      ? ["Fehlende Leerzeichen nach den fett gesetzten Kriterien ergänzt"]
      : ["Methodik-Textabstände bereits korrigiert"]
  };
}

function timestamp() {
  return new Date().toISOString().replace(/[:.]/g, "-");
}

function runBuild(repoRoot) {
  const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

  log("Starte npm run build:pfotentechnik ...");
  const result = spawnSync(
    npmCommand,
    ["run", "build:pfotentechnik"],
    {
      cwd: repoRoot,
      stdio: "inherit",
      shell: false
    }
  );

  if (result.error) {
    throw result.error;
  }

  if (result.status !== 0) {
    fail(`Build fehlgeschlagen, Exit-Code ${result.status}.`);
  }
}

function main() {
  const repoRoot = findRepoRoot();
  log(`Repository: ${repoRoot}`);
  log(dryRun ? "Modus: Dry Run" : "Modus: Änderungen anwenden");

  const patchers = {
    [TARGETS.premiumRenderer]: patchPremiumRenderer,
    [TARGETS.productRenderer]: patchProductRenderer,
    [TARGETS.alternatives]: patchAlternatives,
    [TARGETS.comparisonMethodology]: patchComparisonMethodology
  };

  const originals = new Map();
  const results = new Map();

  for (const [relativePath, patcher] of Object.entries(patchers)) {
    const absolutePath = path.join(repoRoot, relativePath);
    const source = fs.readFileSync(absolutePath, "utf8");
    const result = patcher(source);

    originals.set(relativePath, source);
    results.set(relativePath, result);

    log(`${result.changed ? "ÄNDERN" : "OK"}: ${relativePath}`);
    for (const note of result.notes) {
      log(`  - ${note}`);
    }
  }

  const changedEntries = [...results.entries()].filter(
    ([, result]) => result.changed
  );

  if (changedEntries.length === 0) {
    log("Patch ist bereits vollständig angewendet.");
    return;
  }

  if (dryRun) {
    log(`${changedEntries.length} Datei(en) würden geändert. Es wurde nichts geschrieben.`);
    return;
  }

  const backupRoot = path.join(
    repoRoot,
    ".patch-backups",
    `${PATCH_NAME}-${timestamp()}`
  );

  fs.mkdirSync(backupRoot, { recursive: true });

  for (const [relativePath] of changedEntries) {
    const backupPath = path.join(backupRoot, relativePath);
    fs.mkdirSync(path.dirname(backupPath), { recursive: true });
    fs.writeFileSync(backupPath, originals.get(relativePath), "utf8");
  }

  log(`Backup: ${backupRoot}`);

  try {
    for (const [relativePath, result] of changedEntries) {
      fs.writeFileSync(
        path.join(repoRoot, relativePath),
        result.content,
        "utf8"
      );
    }

    log(`${changedEntries.length} Datei(en) geschrieben.`);

    if (!skipBuild) {
      runBuild(repoRoot);
      log("Build erfolgreich.");
    } else {
      log("Build mit --no-build übersprungen.");
    }
  } catch (error) {
    log("Fehler erkannt. Ursprungsdateien werden wiederhergestellt ...");

    for (const [relativePath] of changedEntries) {
      fs.writeFileSync(
        path.join(repoRoot, relativePath),
        originals.get(relativePath),
        "utf8"
      );
    }

    log("Rollback abgeschlossen.");
    throw error;
  }

  log("Fertig.");
  log("Geprüfte Änderungen:");
  log("  1. Keine Vollbreiten-Farbbalken hinter Eyebrows und Karten-CTAs");
  log("  2. Transparente Wrapper hinter abgerundeten Listenzeilen");
  log("  3. GPS-Alternativen werden tatsächlich geladen");
  log("  4. Sekundärer Produkt-CTA hat immer ein gültiges Ziel oder wird ausgeblendet");
  log("  5. manufacturer-data wird nicht mehr als sichtbarer Status ausgegeben");
  log("  6. Fehlende Leerzeichen in der Vergleichsmethodik sind korrigiert");
}

try {
  main();
} catch (error) {
  console.error(`\n[${PATCH_NAME}] FEHLER: ${error.message}`);
  process.exitCode = 1;
}

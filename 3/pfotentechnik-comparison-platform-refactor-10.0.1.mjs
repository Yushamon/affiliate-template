#!/usr/bin/env node
/**
 * PfotenTechnik Vergleichsplattform Refactor 10.0.0
 *
 * Führt die vollständige Konsolidierung kommerzieller Vergleichsseiten nach
 * /vergleiche/ durch. Der Installer arbeitet transaktional, legt Backups an,
 * aktualisiert interne Links, erzeugt Redirects, erweitert die gemeinsame
 * Premium-Schablone, führt Audits und den Build aus und erstellt logische
 * Git-Commits.
 *
 * Nutzung:
 *   node pfotentechnik-comparison-platform-refactor-10.0.1.mjs
 *   node pfotentechnik-comparison-platform-refactor-10.0.1.mjs --check
 *   node pfotentechnik-comparison-platform-refactor-10.0.1.mjs --push
 *   node pfotentechnik-comparison-platform-refactor-10.0.1.mjs --no-commit
 *   node pfotentechnik-comparison-platform-refactor-10.0.1.mjs --allow-dirty
 *   node pfotentechnik-comparison-platform-refactor-10.0.1.mjs --branch=<name>
 */

import {
  access,
  cp,
  mkdir,
  readFile,
  readdir,
  rm,
  stat,
  writeFile
} from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import yaml from "js-yaml";

const VERSION = "10.0.0";
const PATCH_NAME = `pfotentechnik-comparison-platform-refactor-${VERSION}`;
const ROOT = process.cwd();
const APP_ROOT = path.join(ROOT, "apps", "pfotentechnik");
const PAGES_DIR = path.join(APP_ROOT, "src", "content", "pages");
const COMPARISONS_DIR = path.join(APP_ROOT, "src", "content", "comparisons");
const PRODUCTS_DIR = path.join(APP_ROOT, "src", "content", "products");
const REDIRECTS_FILE = path.join(APP_ROOT, "public", "_redirects");
const COMPARISON_SHELL = path.join(
  ROOT,
  "packages",
  "affiliate-core",
  "src",
  "components",
  "comparison",
  "ComparisonShell.astro"
);
const PREMIUM_CSS = path.join(
  ROOT,
  "packages",
  "affiliate-core",
  "src",
  "components",
  "comparison",
  "comparison-premium-ux.css"
);
const VIEW_MODEL = path.join(
  APP_ROOT,
  "src",
  "domain",
  "comparison",
  "buildComparisonViewModel.ts"
);
const APP_PACKAGE = path.join(APP_ROOT, "package.json");
const AUDIT_SCRIPT = path.join(
  APP_ROOT,
  "scripts",
  "comparison-platform",
  "refactor-audit.mjs"
);
const REPORT_DIR = path.join(APP_ROOT, "reports", "comparison-platform");
const REPORT_FILE = path.join(
  REPORT_DIR,
  "comparison-refactor-2026-07-27.md"
);

const argv = new Set(process.argv.slice(2));
const valueArg = (prefix) => {
  const found = [...argv].find((arg) => arg.startsWith(`${prefix}=`));
  return found ? found.slice(prefix.length + 1) : undefined;
};
const CHECK_ONLY = argv.has("--check");
const NO_COMMIT = argv.has("--no-commit");
const PUSH = argv.has("--push");
const ALLOW_DIRTY = argv.has("--allow-dirty");
const NO_BRANCH = argv.has("--no-branch");
const BRANCH =
  valueArg("--branch") || "refactor/comparison-platform-premium";

const nowIso = () => new Date().toISOString();
const dateStamp = () => nowIso().replaceAll(":", "-").replaceAll(".", "-");
const BACKUP_ROOT = path.join(
  ROOT,
  ".patch-backups",
  `${PATCH_NAME}-${dateStamp()}`
);
const backedUp = new Set();
const changedFiles = new Set();
const deletedFiles = new Set();
const migrationLog = [];
const redirectLog = [];
const linkRewriteLog = [];
const validationLog = [];

const normalizeSlashes = (value) => value.split(path.sep).join("/");
const relativeToRoot = (value) => normalizeSlashes(path.relative(ROOT, value));
const exists = async (file) => {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
};

const log = (message = "") => {
  process.stdout.write(`[${PATCH_NAME}] ${message}\n`);
};

const fail = (message) => {
  throw new Error(message);
};

const executable = (command) =>
  process.platform === "win32" && command === "npm"
    ? "npm.cmd"
    : process.platform === "win32" && command === "npx"
      ? "npx.cmd"
      : command;

const run = (
  command,
  args,
  {
    cwd = ROOT,
    allowFailure = false,
    capture = false,
    env = process.env
  } = {}
) => {
  const result = spawnSync(executable(command), args, {
    cwd,
    encoding: "utf8",
    stdio: capture ? "pipe" : "inherit",
    env
  });

  if (result.error) {
    if (allowFailure) return result;
    fail(`${command} konnte nicht gestartet werden: ${result.error.message}`);
  }

  if (result.status !== 0 && !allowFailure) {
    const stderr = capture ? String(result.stderr || "").trim() : "";
    fail(
      `${command} ${args.join(" ")} ist mit Code ${result.status} fehlgeschlagen${
        stderr ? `:\n${stderr}` : "."
      }`
    );
  }

  return result;
};

const git = (args, options = {}) => run("git", args, options);

const splitFrontmatter = (source, file) => {
  const normalized = source.replace(/^\uFEFF/, "");
  const match = normalized.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    fail(`Ungültiges oder fehlendes Frontmatter: ${relativeToRoot(file)}`);
  }

  const data = yaml.load(match[1]) || {};
  return {
    data,
    body: match[2].replace(/^\s+/, "").replace(/\s+$/, "")
  };
};

const dumpFrontmatter = (data, body) => {
  const frontmatter = yaml.dump(data, {
    lineWidth: 120,
    noRefs: true,
    noCompatMode: true,
    sortKeys: false,
    quotingType: '"',
    forceQuotes: false
  });
  return `---\n${frontmatter}---\n\n${body.trim()}\n`;
};

const backupFile = async (file) => {
  const relative = relativeToRoot(file);
  if (backedUp.has(relative) || !(await exists(file))) return;

  const destination = path.join(BACKUP_ROOT, relative);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(file, destination, { recursive: false });
  backedUp.add(relative);
};

const writeText = async (file, content) => {
  const previous = (await exists(file)) ? await readFile(file, "utf8") : null;
  if (previous === content) return false;

  await backupFile(file);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, content, "utf8");
  changedFiles.add(relativeToRoot(file));
  return true;
};

const deletePath = async (file) => {
  if (!(await exists(file))) return false;
  await backupFile(file);
  await rm(file, { force: true });
  const relative = relativeToRoot(file);
  changedFiles.add(relative);
  deletedFiles.add(relative);
  return true;
};

const walk = async (directory, {
  extensions,
  skip = new Set()
} = {}) => {
  const results = [];
  if (!(await exists(directory))) return results;

  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    if (skip.has(entry.name)) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      results.push(...await walk(full, { extensions, skip }));
      continue;
    }
    if (!extensions || extensions.has(path.extname(entry.name).toLowerCase())) {
      results.push(full);
    }
  }
  return results;
};

const normalizeQuestion = (value) =>
  String(value || "")
    .toLocaleLowerCase("de")
    .replace(/[?!.,:;]/g, "")
    .replace(/\s+/g, " ")
    .trim();

const normalizeHeading = (value) =>
  String(value || "")
    .toLocaleLowerCase("de")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const criterionKey = (value) =>
  String(value || "")
    .toLocaleLowerCase("de")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64) || "kriterium";

const uniqueStrings = (items) => [
  ...new Set(
    items
      .map((item) => String(item || "").trim())
      .filter(Boolean)
  )
];

const escapeRegExp = (value) =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const changedSince = (snapshot) =>
  [...changedFiles].filter((file) => !snapshot.has(file));

const ensureTrailingSlash = (value) => {
  const input = String(value || "").trim();
  if (!input) return input;
  return input.endsWith("/") ? input : `${input}/`;
};

const PRODUCT_ALIASES = {
  "imipaw-3l": "imipaw-3l-automatic-cat-feeder",
  "surefeed-microchip-pet-feeder":
    "surefeed-microchip-pet-feeder-connect",
  "petkit-yumshare-dual": "petkit-yumshare-dual-hopper"
};

const MERGE_MAPPINGS = [
  {
    oldSlug: "futterautomat-mit-kamera",
    targetSlug: "beste-futterautomaten-mit-kamera"
  },
  {
    oldSlug: "futterautomat-ohne-wlan",
    targetSlug: "beste-futterautomaten-ohne-wlan"
  },
  {
    oldSlug: "futterautomat-nassfutter",
    targetSlug: "beste-futterautomaten-fuer-nassfutter"
  },
  {
    oldSlug: "futterautomat-fuer-zwei-katzen",
    targetSlug: "beste-futterautomaten-fuer-zwei-katzen"
  }
];

const NEW_COMPARISON_MANIFEST = {
  "beste-futterautomaten-mit-akku": {
    icon: "🔋",
    criteria: [
      "Stromreserve",
      "Ausgabe im Backup-Betrieb",
      "Portionierung",
      "Offline-Zeitplan",
      "Reinigung",
      "Preis-Leistung"
    ],
    products: [
      "xiaomi-smart-pet-food-feeder-2",
      "petlibro-granary-wifi-feeder",
      "petsafe-smart-feed-2"
    ]
  },
  "beste-futterautomaten-unter-100-euro": {
    icon: "€",
    criteria: [
      "Preisniveau",
      "Portionierung",
      "Zuverlässigkeit",
      "Reinigung",
      "Stromreserve",
      "Preis-Leistung"
    ],
    products: [
      "imipaw-3l-automatic-cat-feeder",
      "honeyguardian-smart-pet-feeder-s305d",
      "cat-mate-c500"
    ]
  },
  "beste-futterautomaten-mit-edelstahl-napf": {
    icon: "🥣",
    criteria: [
      "Napfmaterial",
      "Entnehmbarkeit",
      "Reinigung",
      "Portionierung",
      "Ausfallsicherheit",
      "Preis-Leistung"
    ],
    products: [
      "petlibro-granary-wifi-feeder",
      "xiaomi-smart-pet-food-feeder-2",
      "honeyguardian-smart-pet-feeder-s305d"
    ]
  },
  "futterautomat-gegen-schlingen": {
    icon: "⏱️",
    criteria: [
      "Kleine Portionen",
      "Mahlzeitenzahl",
      "Reproduzierbarkeit",
      "Napf",
      "Stromreserve",
      "Kontrollierbarkeit"
    ],
    products: [
      "petsafe-healthy-pet-simply-feed",
      "petlibro-granary-wifi-feeder",
      "xiaomi-smart-pet-food-feeder-2"
    ]
  },
  "beste-futterautomaten-fuer-mehrtierhaushalte": {
    icon: "🐾",
    criteria: [
      "Tiertrennung",
      "Zugangskontrolle",
      "Futterkammern",
      "Portionierung",
      "Napfkonzept",
      "Reinigung"
    ],
    products: [
      "petlibro-granary-dual-feeder",
      "petkit-yumshare-dual-hopper",
      "surefeed-microchip-pet-feeder-connect"
    ]
  },
  "beste-futterautomaten-fuer-kleine-hunde": {
    icon: "🐕",
    criteria: [
      "Mindestportion",
      "Krokettengröße",
      "Napfergonomie",
      "Standfestigkeit",
      "Offline-Zeitplan",
      "Stromreserve"
    ],
    products: [
      "petkit-fresh-element-solo",
      "xiaomi-smart-pet-food-feeder-2",
      "petlibro-air-wifi-feeder"
    ]
  },
  "beste-futterautomaten-fuer-berufstaetige": {
    icon: "🕒",
    criteria: [
      "Zeitpläne",
      "Offline-Betrieb",
      "Stromreserve",
      "Störungsmeldungen",
      "Vorrat",
      "Kontrollierbarkeit"
    ],
    products: [
      "petlibro-granary-wifi-feeder",
      "xiaomi-smart-pet-food-feeder-2",
      "petsafe-smart-feed-2"
    ]
  },
  "beste-futterautomaten-fuer-seniorenkatzen": {
    icon: "🐈",
    criteria: [
      "Niedriger Zugang",
      "Mindestportion",
      "Napf",
      "Geräusch",
      "Reinigung",
      "Kontrollierbarkeit"
    ],
    products: [
      "surefeed-microchip-pet-feeder-connect",
      "cat-mate-c500",
      "petlibro-granary-wifi-feeder"
    ]
  },
  "beste-futterautomaten-fuer-welpen": {
    icon: "🐶",
    criteria: [
      "Reale Mindestportion",
      "Krokettengröße",
      "Mahlzeiten",
      "Offline-Zeitplan",
      "Stromreserve",
      "Napf und Reinigung",
      "Standfestigkeit",
      "Geeignete Hundegröße"
    ],
    products: [
      "xiaomi-smart-pet-food-feeder-2",
      "petlibro-granary-wifi-feeder",
      "petkit-fresh-element-solo"
    ]
  },
  "futterautomat-fuer-grosse-hunde": {
    icon: "🐕",
    criteria: [
      "Kapazität",
      "Maximale Ausgabe",
      "Krokettengröße",
      "Napf",
      "Standfestigkeit",
      "Notstrom"
    ],
    products: [
      "xiaomi-smart-pet-food-feeder-2",
      "petlibro-granary-wifi-feeder",
      "petlibro-granary-camera-feeder"
    ]
  },
  "futterautomat-mit-app": {
    icon: "📱",
    criteria: [
      "Zeitpläne",
      "Protokolle",
      "Benachrichtigungen",
      "Offline-Verhalten",
      "WLAN",
      "Preis-Leistung"
    ],
    products: [
      "petlibro-granary-wifi-feeder",
      "petkit-fresh-element-solo",
      "xiaomi-smart-pet-food-feeder-2",
      "petlibro-granary-camera-feeder",
      "petkit-yumshare-dual-hopper"
    ]
  }
};

const KNOWLEDGE_SLUGS = new Set([
  "smarte-futterautomaten",
  "futterautomat-hund",
  "futterautomat-katze",
  "futterautomat-im-urlaub",
  "futterautomat-bei-uebergewicht",
  "futterautomat-und-ernaehrung",
  "futterautomat-batterie-oder-netzteil",
  "welcher-futterautomat-ist-der-richtige",
  "wie-funktioniert-ein-futterautomat",
  "wie-viele-mahlzeiten-hund",
  "wie-viele-mahlzeiten-katze"
]);

const sourcePagePath = (slug) => path.join(PAGES_DIR, `${slug}.md`);
const comparisonPath = (slug) => path.join(COMPARISONS_DIR, `${slug}.md`);
const oldUrl = (slug) => `/${slug}/`;
const newUrl = (slug) => `/vergleiche/${slug}/`;

const readMarkdown = async (file) => {
  const source = await readFile(file, "utf8");
  return { source, ...splitFrontmatter(source, file) };
};

const loadProductCatalog = async () => {
  const files = await walk(PRODUCTS_DIR, {
    extensions: new Set([".md", ".mdx"])
  });
  const bySlug = new Map();

  for (const file of files) {
    const { data } = await readMarkdown(file);
    const slug = data.slug || path.basename(file).replace(/\.mdx?$/, "");
    bySlug.set(slug, { data, file });
  }

  return bySlug;
};

const resolveProductSlug = (slug) => PRODUCT_ALIASES[slug] || slug;

const productText = (product) =>
  JSON.stringify(product?.data || {})
    .toLocaleLowerCase("de")
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "");

const inferProductSlugs = ({
  sourceData,
  manifest,
  products,
  slug
}) => {
  const requested = [
    ...(sourceData.comparisonProducts || []),
    ...(manifest?.products || [])
  ].map(resolveProductSlug);

  const valid = uniqueStrings(requested).filter((candidate) =>
    products.has(candidate)
  );

  if (valid.length >= 2) return valid.slice(0, 8);

  const tokens = uniqueStrings(
    String(slug)
      .split("-")
      .filter((token) =>
        token.length >= 4 &&
        !["beste", "futterautomaten", "futterautomat", "fuer"].includes(token)
      )
  );

  const inferred = [...products.entries()]
    .filter(([, product]) => {
      const text = productText(product);
      const isFeeder =
        text.includes("futterautomat") ||
        text.includes("pet feeder") ||
        product.data.category?.key === "futterautomaten";
      return isFeeder && (
        tokens.length === 0 ||
        tokens.some((token) => text.includes(token))
      );
    })
    .map(([productSlug]) => productSlug);

  const genericFeeders = [...products.entries()]
    .filter(([, product]) => {
      const text = productText(product);
      return (
        text.includes("futterautomat") ||
        text.includes("pet feeder") ||
        product.data.category?.key === "futterautomaten"
      );
    })
    .map(([productSlug]) => productSlug);

  return uniqueStrings([...valid, ...inferred, ...genericFeeders]).slice(0, 6);
};

const productItem = (slug, products) => {
  const product = products.get(slug);
  if (!product) return null;

  return {
    slug,
    label: product.data.title || product.data.name || slug,
    type: "product",
    ...(product.data.recommendation
      ? { recommendation: product.data.recommendation }
      : {}),
    values: {}
  };
};

const genericFaq = (group) => {
  const normalized = String(group || "").toLocaleLowerCase("de");

  if (normalized.includes("gps")) {
    return [
      {
        question: "Wie vergleichen wir GPS-Tracker?",
        answer:
          "Wir trennen Ortungssystem, Netzabdeckung, Gerätegewicht, Akkulaufzeit, Befestigung, Wasserschutz und laufende Kosten. Marketingreichweiten werden nicht mit einer garantierten Ortungsleistung gleichgesetzt."
      },
      {
        question: "Ist ein GPS-Tracker ohne Abo immer günstiger?",
        answer:
          "Nicht zwingend. Geräte ohne Mobilfunkabo können ein eigenes Funkgerät, eine begrenzte Funkreichweite oder einen höheren Anschaffungspreis haben. Entscheidend sind Gesamtkosten und Einsatzgebiet."
      },
      {
        question: "Wie wichtig ist das Gerätegewicht?",
        answer:
          "Das Gewicht muss zu Tier, Halsband und Aktivität passen. Bei kleinen Katzen zählt neben dem Tracker auch die komplette Befestigung."
      },
      {
        question: "Sind Herstellerangaben zur Akkulaufzeit direkt vergleichbar?",
        answer:
          "Nur eingeschränkt. Ortungsintervall, Netzqualität, Temperatur und Nutzung verändern die reale Laufzeit. Der Vergleich behandelt Herstellerwerte deshalb als Orientierung."
      },
      {
        question: "Ersetzt ein GPS-Tracker eine sichere Kennzeichnung?",
        answer:
          "Nein. Ein Tracker ergänzt Chip, Registrierung und sichere Kontaktdaten, ersetzt sie aber nicht."
      },
      {
        question: "Wie oft werden die Vergleiche aktualisiert?",
        answer:
          "Produktdaten, Tarife und Verfügbarkeit werden regelmäßig geprüft. Bei wesentlichen Modell- oder Tarifänderungen wird die Einordnung angepasst."
      }
    ];
  }

  if (
    normalized.includes("trinkbrunnen") ||
    normalized.includes("brunnen")
  ) {
    return [
      {
        question: "Wie vergleichen wir Trinkbrunnen?",
        answer:
          "Wir betrachten Material, Wasserkontaktflächen, Reinigung, Pumpenzugang, Filterkonzept, Geräusch, Volumen und die Eignung für das jeweilige Tier."
      },
      {
        question: "Ist ein größerer Tank automatisch besser?",
        answer:
          "Nein. Ein großer Tank reduziert Nachfüllvorgänge, kann aber Reinigung und Wasserwechsel erschweren. Tierzahl, Trinkmenge und Hygiene sind wichtiger."
      },
      {
        question: "Wie wichtig ist die Lautstärke?",
        answer:
          "Eine leise Pumpe kann die Akzeptanz verbessern. Geräusch hängt jedoch auch von Wasserstand, Verschmutzung und Aufstellung ab."
      },
      {
        question: "Sind Filterkosten im Vergleich berücksichtigt?",
        answer:
          "Filterkonzept und laufender Wechselbedarf fließen in die Einordnung ein. Preise können sich ändern und werden deshalb nicht als dauerhaft fixer Wert behandelt."
      },
      {
        question: "Wie oft muss ein Trinkbrunnen gereinigt werden?",
        answer:
          "Der Rhythmus hängt von Tierzahl, Material, Umgebung und Modell ab. Pumpe, Schläuche, Ecken und Dichtungen müssen erreichbar sein und regelmäßig kontrolliert werden."
      },
      {
        question: "Ersetzt ein Trinkbrunnen mehrere Wasserstellen?",
        answer:
          "Nicht grundsätzlich. Viele Tiere profitieren weiterhin von mehreren gut erreichbaren Wasserstellen, besonders in Mehrtierhaushalten."
      }
    ];
  }

  return [
    {
      question: "Wie vergleichen wir Futterautomaten?",
      answer:
        "Wir trennen Portionierung, Futterkompatibilität, Napf, Reinigung, Stromreserve, Offline-Verhalten und Zusatzfunktionen. Eine lange Funktionsliste ersetzt keine zuverlässige Ausgabe."
    },
    {
      question: "Ist der größte Futterbehälter automatisch die beste Wahl?",
      answer:
        "Nein. Vorratsvolumen sagt nichts über Mindestportion, maximale Mahlzeit, Krokettengröße, Napfergonomie oder Ausfallsicherheit aus."
    },
    {
      question: "Wie prüfe ich die reale Portionsgröße?",
      answer:
        "Gib mehrere Portionseinheiten mit dem tatsächlich verwendeten Futter aus, wiege die Gesamtmenge und berechne den Mittelwert. Nach einem Futterwechsel muss neu kalibriert werden."
    },
    {
      question: "Beweist ein App-Protokoll, dass das Tier gefressen hat?",
      answer:
        "Nein. Ein Protokoll bestätigt meist nur eine geplante oder ausgelöste Ausgabe. Ohne sichere Tier- und Mengenmessung ist es kein Fressnachweis."
    },
    {
      question: "Braucht ein Futterautomat eine Stromreserve?",
      answer:
        "Eine Batterie- oder Akku-Reserve kann geplante Ausgaben bei Stromausfall absichern. Welche Funktionen im Notbetrieb weiterlaufen, muss für das konkrete Modell geprüft werden."
    },
    {
      question: "Wie oft werden die Vergleiche aktualisiert?",
      answer:
        "Produktdaten, Verfügbarkeit und wesentliche Funktionsänderungen werden regelmäßig geprüft. Die Vergleichsseite nennt ihren aktuellen Datenstand."
    }
  ];
};

const ensureMinimumFaq = (faq, group, minimum = 6) => {
  const result = [];
  const seen = new Set();

  for (const item of [...(faq || []), ...genericFaq(group)]) {
    if (!item?.question || !item?.answer) continue;
    const key = normalizeQuestion(item.question);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push({
      question: String(item.question).trim(),
      answer: String(item.answer).trim()
    });
    if (result.length >= Math.max(minimum, (faq || []).length)) {
      if (result.length >= minimum && result.length >= (faq || []).length) {
        // Original FAQs bleiben vollständig erhalten; generische Ergänzungen
        // werden nur bis zum Mindestumfang übernommen.
        if (result.length >= (faq || []).length && result.length >= minimum) {
          continue;
        }
      }
    }
  }

  return result;
};

const premiumBlocksToMarkdown = (data) => {
  const sections = [];
  const blocks = Array.isArray(data.premiumBlocks)
    ? data.premiumBlocks
    : [];

  for (const block of blocks) {
    if (!block || typeof block !== "object") continue;
    const title = block.title || block.eyebrow;
    const lines = [];

    if (title) lines.push(`## ${title}`);
    if (block.text) lines.push("", String(block.text).trim());

    const cards = Array.isArray(block.cards) ? block.cards : [];
    for (const card of cards) {
      if (card.title) lines.push("", `### ${card.title}`);
      if (card.text) lines.push("", String(card.text).trim());
      if (card.productKey) {
        lines.push(
          "",
          `[Produktdetails ansehen](/produkt/${resolveProductSlug(
            card.productKey
          )}/)`
        );
      }
    }

    const items = Array.isArray(block.items) ? block.items : [];
    if (items.length) {
      lines.push("", ...items.map((item) => `- ${String(item).trim()}`));
    }

    if (lines.length) sections.push(lines.join("\n"));
  }

  if (data.healthBridge?.title || data.healthBridge?.text) {
    sections.push(
      [
        `## ${data.healthBridge.title || "Gesundheitliche Einordnung"}`,
        "",
        data.healthBridge.text || "",
        data.healthBridge.href
          ? `\n[Weiterlesen](${data.healthBridge.href})`
          : ""
      ].filter(Boolean).join("\n")
    );
  }

  if (data.closingCta?.title || data.closingCta?.text) {
    sections.push(
      [
        `## ${data.closingCta.title || "Nächster Schritt"}`,
        "",
        data.closingCta.text || "",
        data.closingCta.secondaryHref
          ? `\n[${data.closingCta.secondaryLabel || "Weiter vergleichen"}](${data.closingCta.secondaryHref})`
          : ""
      ].filter(Boolean).join("\n")
    );
  }

  return sections.join("\n\n");
};

const sectionMap = (body) => {
  const source = String(body || "").trim();
  const matches = [...source.matchAll(/^##\s+(.+)$/gm)];
  const intro = matches.length ? source.slice(0, matches[0].index).trim() : source;
  const sections = new Map();

  matches.forEach((match, index) => {
    const start = match.index;
    const end = matches[index + 1]?.index ?? source.length;
    sections.set(
      normalizeHeading(match[1]),
      source.slice(start, end).trim()
    );
  });

  return { intro, sections };
};

const mergeBodies = (targetBody, sourceBody, sourceData) => {
  const target = sectionMap(targetBody);
  const source = sectionMap(
    [
      premiumBlocksToMarkdown(sourceData),
      sourceBody
    ].filter(Boolean).join("\n\n")
  );
  const additions = [];

  if (
    source.intro &&
    source.intro !== target.intro &&
    !String(targetBody).includes(source.intro)
  ) {
    additions.push(
      `## Ergänzende Einordnung aus der bisherigen Seite\n\n${source.intro}`
    );
  }

  for (const [key, section] of source.sections.entries()) {
    if (!target.sections.has(key) && !String(targetBody).includes(section)) {
      additions.push(section);
    }
  }

  return [String(targetBody || "").trim(), ...additions]
    .filter(Boolean)
    .join("\n\n");
};

const hasHeading = (body, patterns) => {
  const headings = [...String(body || "").matchAll(/^##\s+(.+)$/gm)]
    .map((match) => normalizeHeading(match[1]));
  return headings.some((heading) =>
    patterns.some((pattern) => pattern.test(heading))
  );
};

const ensurePremiumBody = (body, data) => {
  let result = String(body || "").trim();
  const recommendation = data.recommendation || {};

  if (!hasHeading(result, [/kurzantwort/, /kurze antwort/, /schnellentscheidung/])) {
    result = [
      `## Kurzantwort\n\n${recommendation.text || data.description}`,
      result
    ].filter(Boolean).join("\n\n");
  }

  if (!hasHeading(result, [/unsere empfehlung/, /empfehlungen/, /testsieger/, /gesamtsieger/])) {
    const winner = data.items?.find(
      (item) => item.slug === recommendation.winnerSlug
    );
    result += `\n\n## Unsere Empfehlung\n\n${
      winner
        ? `Unsere stärkste Empfehlung in diesem Vergleich ist **${winner.label || winner.slug}**. `
        : ""
    }${recommendation.text || data.description}`;
  }

  if (!hasHeading(result, [/fur wen geeignet/, /wann lohnt/, /eignet sich/, /nutzungsszenario/])) {
    result +=
      "\n\n## Für wen geeignet\n\nDer Vergleich richtet sich an Tierhalter, die nicht nur Funktionen zählen, sondern Bauart, reale Alltagseignung, Folgekosten und Ausfallsicherheit gegeneinander abwägen möchten.";
  }

  if (!hasHeading(result, [/methodik/, /testmethodik/, /so bewerten/, /bewertung/])) {
    result +=
      "\n\n## Testmethodik\n\nWir vergleichen dokumentierte Produktdaten, Bedienungsanleitungen, belastbare Herstellerangaben und die im Produktkatalog gepflegte redaktionelle Einordnung. Unterschiede werden nur dann als Vorteil gewertet, wenn sie für das jeweilige Nutzungsszenario relevant sind. Unbelegte Angaben und nicht direkt vergleichbare Marketingwerte werden nicht gleichgesetzt.";
  }

  if (!hasHeading(result, [/quellen/, /belege/])) {
    const group = String(data.group || "").toLocaleLowerCase("de");
    const sources = group.includes("futter")
      ? [
          "- Produktdatenblätter und Bedienungsanleitungen der aufgenommenen Modelle",
          "- [FEDIAF Nutritional Guidelines](https://europeanpetfood.org/self-regulation/nutritional-guidelines/)",
          "- [WSAVA Global Nutrition Guidelines](https://wsava.org/global-guidelines/global-nutrition-guidelines/)"
        ]
      : group.includes("trink")
        ? [
            "- Produktdatenblätter und Bedienungsanleitungen der aufgenommenen Modelle",
            "- [WSAVA Global Nutrition Guidelines](https://wsava.org/global-guidelines/global-nutrition-guidelines/)"
          ]
        : [
            "- Produktdatenblätter, Tarifinformationen und Bedienungsanleitungen der aufgenommenen Modelle",
            "- Offizielle Support- und Sicherheitsdokumentation der jeweiligen Hersteller"
          ];
    result += `\n\n## Quellen\n\n${sources.join("\n")}`;
  }

  if (!hasHeading(result, [/weiterfuhrende links/, /interne links/, /weitere passende/, /weiterfuhrende ratgeber/])) {
    result +=
      "\n\n## Weiterführende Links\n\n- [Alle Vergleiche](/vergleiche/)\n- [Smarte Haustiertechnik im Überblick](/smarte-haustiertechnik/)\n- [Redaktion und Bewertungsgrundsätze](/redaktion/)";
  }

  return `${result.trim()}\n`;
};

const normalizeCriteria = (sourceData, manifest) => {
  const configured =
    sourceData.comparisonRecommendation?.criteria ||
    manifest?.criteria ||
    [];
  const existing = Array.isArray(sourceData.criteria)
    ? sourceData.criteria
    : [];

  const source = existing.length ? existing : configured;
  return source.map((criterion) => {
    if (typeof criterion === "string") {
      return {
        key: criterionKey(criterion),
        label: criterion,
        format: "auto",
        fallback: "–"
      };
    }

    return {
      ...criterion,
      key: criterion.key || criterionKey(criterion.label),
      label: criterion.label || criterion.key,
      format: criterion.format || "auto",
      fallback: criterion.fallback || "–"
    };
  });
};

const comparisonGroup = (sourceData, slug) => {
  const text = `${slug} ${(sourceData.tags || []).join(" ")} ${sourceData.category || ""}`
    .toLocaleLowerCase("de");

  if (text.includes("gps")) return "GPS-Tracker";
  if (text.includes("trinkbrunnen")) return "Trinkbrunnen";
  return "Futterautomaten";
};

const buildComparisonData = ({
  sourceData,
  sourceBody,
  slug,
  manifest,
  products
}) => {
  const group = comparisonGroup(sourceData, slug);
  const productSlugs = inferProductSlugs({
    sourceData,
    manifest,
    products,
    slug
  });
  const items = productSlugs
    .map((productSlug) => productItem(productSlug, products))
    .filter(Boolean);

  if (items.length < 2) {
    fail(
      `${slug}: Weniger als zwei im Produktkatalog vorhandene Produkte. ` +
      `Gefunden: ${items.map((item) => item.slug).join(", ") || "keine"}`
    );
  }

  const sourceRecommendation = sourceData.comparisonRecommendation || {};
  const itemSlugs = new Set(items.map((item) => item.slug));
  const requestedWinner = resolveProductSlug(
    sourceRecommendation.winnerSlug ||
    sourceData.recommendation?.winnerSlug ||
    items[0].slug
  );
  const winnerSlug = itemSlugs.has(requestedWinner)
    ? requestedWinner
    : items[0].slug;
  const requestedAlternative = resolveProductSlug(
    sourceRecommendation.alternativeSlug ||
    sourceData.recommendation?.alternativeSlug ||
    ""
  );
  const alternativeSlug = itemSlugs.has(requestedAlternative) &&
    requestedAlternative !== winnerSlug
    ? requestedAlternative
    : items.find((item) => item.slug !== winnerSlug)?.slug;

  const data = {
    title: sourceData.title,
    slug,
    type: "comparison",
    layout: "comparison",
    description:
      sourceData.description ||
      sourceData.seoDescription ||
      `Unabhängiger Vergleich zu ${sourceData.title}.`,
    publishedAt: String(sourceData.publishedAt || "2026-07-09"),
    updatedAt: "2026-07-27",
    author:
      sourceData.author || {
        name: "PfotenTechnik Redaktion",
        role: "Redaktion"
      },
    tags: uniqueStrings([
      ...(sourceData.tags || []),
      "Vergleich"
    ]),
    hub: {
      sections: ["vergleiche"],
      title: sourceData.hub?.title || sourceData.title,
      description:
        sourceData.hub?.description ||
        sourceData.description ||
        sourceData.title,
      icon: sourceData.hub?.icon || manifest?.icon || "↔",
      order: sourceData.hub?.order || 500
    },
    seo: {
      title:
        sourceData.seo?.title ||
        sourceData.seoTitle ||
        `${sourceData.title} im Vergleich 2026`,
      description:
        sourceData.seo?.description ||
        sourceData.seoDescription ||
        sourceData.description,
      canonical: newUrl(slug),
      sitemap: true,
      noindex: false,
      priority: sourceData.seo?.priority ?? 0.8,
      changefreq: sourceData.seo?.changefreq || "monthly"
    },
    comparisonType:
      sourceData.comparisonType ||
      (slug.includes("mit-") || slug.includes("ohne-")
        ? "feature"
        : "use-case"),
    group,
    icon: sourceData.icon || sourceData.hub?.icon || manifest?.icon || "↔",
    ...(sourceData.heroImage ? { heroImage: sourceData.heroImage } : {}),
    items,
    criteria: normalizeCriteria(sourceData, manifest),
    automaticRecommendations: {
      enabled: true
    },
    recommendation: {
      title:
        sourceRecommendation.title ||
        sourceData.recommendation?.title ||
        `Unsere Empfehlung für ${sourceData.title}`,
      text:
        sourceRecommendation.text ||
        sourceData.recommendation?.text ||
        sourceData.description,
      winnerSlug,
      ...(alternativeSlug ? { alternativeSlug } : {})
    },
    tableTitle:
      sourceRecommendation.tableTitle ||
      sourceData.tableTitle ||
      `${sourceData.title}: direkter Vergleich`,
    cardsTitle:
      sourceRecommendation.cardsTitle ||
      sourceData.cardsTitle ||
      "Modelle und Einsatzgrenzen",
    faq: ensureMinimumFaq(sourceData.faq, group)
  };

  const synthesized = [
    premiumBlocksToMarkdown(sourceData),
    sourceBody
  ].filter(Boolean).join("\n\n");

  return {
    data,
    body: ensurePremiumBody(synthesized, data)
  };
};

const normalizeExistingComparison = ({
  data,
  body,
  products
}) => {
  const next = structuredClone(data);
  const slug = next.slug;
  next.type = "comparison";
  next.layout = "comparison";
  next.updatedAt = "2026-07-27";
  next.hub = {
    ...(next.hub || {}),
    sections: ["vergleiche"],
    title: next.hub?.title || next.title,
    description: next.hub?.description || next.description,
    icon: next.hub?.icon || next.icon || "↔",
    order: next.hub?.order || 500
  };
  next.seo = {
    ...(next.seo || {}),
    title: next.seo?.title || next.title,
    description: next.seo?.description || next.description,
    canonical: newUrl(slug),
    sitemap: true,
    noindex: false,
    priority: next.seo?.priority ?? 0.8,
    changefreq: next.seo?.changefreq || "monthly"
  };
  next.automaticRecommendations = {
    ...(next.automaticRecommendations || {}),
    enabled: true
  };

  next.items = (next.items || [])
    .map((item) => ({
      ...item,
      slug: resolveProductSlug(item.slug),
      values: item.values || {},
      overrides: item.overrides || {}
    }))
    .filter((item, index, source) =>
      source.findIndex(
        (candidate) =>
          candidate.type === item.type &&
          candidate.slug === item.slug
      ) === index
    );

  if (next.items.length < 2) {
    const inferred = inferProductSlugs({
      sourceData: next,
      manifest: NEW_COMPARISON_MANIFEST[slug],
      products,
      slug
    });
    next.items = inferred
      .map((productSlug) => productItem(productSlug, products))
      .filter(Boolean);
  }

  if (next.items.length < 2) {
    fail(`${slug}: Der bestehende Vergleich enthält weniger als zwei gültige Items.`);
  }

  next.criteria = normalizeCriteria(
    next,
    NEW_COMPARISON_MANIFEST[slug]
  );
  const existingItemSlugs = new Set(next.items.map((item) => item.slug));
  const requestedWinner = resolveProductSlug(
    next.recommendation?.winnerSlug || next.items[0].slug
  );
  const winnerSlug = existingItemSlugs.has(requestedWinner)
    ? requestedWinner
    : next.items[0].slug;
  const requestedAlternative = resolveProductSlug(
    next.recommendation?.alternativeSlug || ""
  );
  const alternativeSlug = existingItemSlugs.has(requestedAlternative) &&
    requestedAlternative !== winnerSlug
    ? requestedAlternative
    : next.items.find((item) => item.slug !== winnerSlug)?.slug;

  next.recommendation = {
    title:
      next.recommendation?.title ||
      `Unsere Empfehlung für ${next.title}`,
    text:
      next.recommendation?.text ||
      next.description,
    winnerSlug,
    ...(alternativeSlug ? { alternativeSlug } : {})
  };
  next.tableTitle =
    next.tableTitle || `${next.title}: direkter Vergleich`;
  next.cardsTitle =
    next.cardsTitle || "Modelle und Einsatzgrenzen";
  next.faq = ensureMinimumFaq(next.faq, next.group);

  return {
    data: next,
    body: ensurePremiumBody(body, next)
  };
};

const mergeLegacyIntoComparison = ({
  target,
  source,
  products
}) => {
  const next = normalizeExistingComparison({
    data: target.data,
    body: target.body,
    products
  });

  const mergedItems = [
    ...next.data.items,
    ...(source.data.comparisonProducts || [])
      .map(resolveProductSlug)
      .map((slug) => productItem(slug, products))
      .filter(Boolean)
  ].filter((item, index, all) =>
    all.findIndex(
      (candidate) =>
        candidate.type === item.type &&
        candidate.slug === item.slug
    ) === index
  );

  next.data.items = mergedItems;
  next.data.faq = ensureMinimumFaq(
    [...(next.data.faq || []), ...(source.data.faq || [])],
    next.data.group
  );

  const mergedBody = mergeBodies(
    next.body,
    source.body,
    source.data
  );

  return {
    data: next.data,
    body: ensurePremiumBody(mergedBody, next.data)
  };
};

const readAllComparisons = async () => {
  const files = await walk(COMPARISONS_DIR, {
    extensions: new Set([".md", ".mdx"])
  });
  const entries = new Map();

  for (const file of files) {
    const entry = await readMarkdown(file);
    entries.set(entry.data.slug, { ...entry, file });
  }

  return entries;
};

const discoverCategoryComparisons = async () => {
  const files = await walk(PAGES_DIR, {
    extensions: new Set([".md", ".mdx"])
  });
  const slugs = [];

  for (const file of files) {
    const { data } = await readMarkdown(file);
    if (
      data.category === "vergleich" &&
      data.slug &&
      !KNOWLEDGE_SLUGS.has(data.slug)
    ) {
      slugs.push(data.slug);
    }
  }

  return slugs;
};

const allMappings = (existingSlugs, migratedSlugs) => {
  const map = new Map();

  for (const slug of existingSlugs) {
    map.set(oldUrl(slug), newUrl(slug));
  }

  for (const mapping of MERGE_MAPPINGS) {
    map.set(oldUrl(mapping.oldSlug), newUrl(mapping.targetSlug));
  }

  for (const slug of migratedSlugs) {
    map.set(oldUrl(slug), newUrl(slug));
  }

  map.set("/vergleiche/beste-futterautomaten/", "/vergleiche/");
  return map;
};

const applyRedirects = async (mapping) => {
  const current = (await exists(REDIRECTS_FILE))
    ? await readFile(REDIRECTS_FILE, "utf8")
    : "";

  const managedSources = new Set();
  for (const [from] of mapping) {
    if (!from.startsWith("/vergleiche/")) {
      managedSources.add(from);
      managedSources.add(from.replace(/\/$/, ""));
    }
  }

  const retained = current
    .split(/\r?\n/)
    .filter((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith("#")) return true;
      const [source] = trimmed.split(/\s+/);
      return !managedSources.has(source);
    });

  const lines = [
    ...retained,
    "",
    `# ${PATCH_NAME}: kanonische Vergleichsrouten`
  ];

  for (const [from, to] of [...mapping.entries()]
    .filter(([from]) => !from.startsWith("/vergleiche/"))
    .sort(([left], [right]) => left.localeCompare(right, "de"))) {
    const withoutSlash = from.replace(/\/$/, "");
    lines.push(`${withoutSlash} ${to} 301`);
    lines.push(`${from} ${to} 301`);
    redirectLog.push(`${withoutSlash} -> ${to}`);
    redirectLog.push(`${from} -> ${to}`);
  }

  await writeText(
    REDIRECTS_FILE,
    `${lines.join("\n").replace(/\n{3,}/g, "\n\n").trim()}\n`
  );
};

const rewriteInternalLinks = async (mapping) => {
  const extensions = new Set([
    ".md",
    ".mdx",
    ".astro",
    ".ts",
    ".tsx",
    ".js",
    ".mjs",
    ".json",
    ".yaml",
    ".yml",
    ".html"
  ]);
  const skip = new Set([
    "node_modules",
    "dist",
    ".git",
    ".patch-backups",
    "reports"
  ]);

  const roots = [
    path.join(APP_ROOT, "src"),
    path.join(APP_ROOT, "scripts"),
    path.join(APP_ROOT, "public"),
    path.join(ROOT, "packages", "affiliate-core", "src")
  ];

  const files = (
    await Promise.all(
      roots.map((root) => walk(root, { extensions, skip }))
    )
  )
    .flat()
    .filter((file) => file !== REDIRECTS_FILE);

  const replacements = [...mapping.entries()]
    .sort(([left], [right]) => right.length - left.length);

  for (const file of files) {
    let source = await readFile(file, "utf8");
    let next = source;
    let count = 0;

    for (const [from, to] of replacements) {
      const variants = uniqueStrings([
        from,
        from.replace(/\/$/, "")
      ]).sort((a, b) => b.length - a.length);

      for (const variant of variants) {
        if (!variant || variant === "/") continue;
        const isRootAlias = !variant.startsWith("/vergleiche/");
        const pattern = isRootAlias
          ? new RegExp(`(?<!/vergleiche)${escapeRegExp(variant)}`, "g")
          : new RegExp(escapeRegExp(variant), "g");
        const matches = next.match(pattern);
        if (matches?.length) {
          count += matches.length;
          next = next.replace(pattern, to);
        }
      }
    }

    if (next !== source) {
      await writeText(file, next);
      linkRewriteLog.push({
        file: relativeToRoot(file),
        count
      });
    }
  }
};

const patchComparisonShell = async () => {
  let source = await readFile(COMPARISON_SHELL, "utf8");

  if (!source.includes('href="#kurzantwort"')) {
    const navAnchor =
      '<nav class="comparison-premium-nav" aria-label="Sprungnavigation zum Vergleich">\n';
    if (!source.includes(navAnchor)) {
      fail("ComparisonShell: Navigationsanker nicht gefunden.");
    }
    source = source.replace(
      navAnchor,
      `${navAnchor}    <a href="#kurzantwort">Kurzantwort</a>\n`
    );
  }

  if (!source.includes('id="kurzantwort"')) {
    const flowAnchor = '  <div class="comparison-decision-flow">';
    if (!source.includes(flowAnchor)) {
      fail("ComparisonShell: Decision-Flow-Anker nicht gefunden.");
    }

    const quickAnswer = `  <section id="kurzantwort" class="comparison-premium-section comparison-quick-answer" aria-labelledby="kurzantwort-title">
    <div>
      <span class="comparison-eyebrow">Kurzantwort</span>
      <h2 id="kurzantwort-title">{model.verdict.title}</h2>
      <p>{model.verdict.text}</p>
    </div>
    {winner && (
      <a class="comparison-quick-answer__winner" href="#vergleichssieger">
        <span>Unsere Empfehlung</span>
        <strong>{winner.title}</strong>
      </a>
    )}
  </section>

`;
    source = source.replace(flowAnchor, `${quickAnswer}${flowAnchor}`);
  }

  await writeText(COMPARISON_SHELL, source);

  let css = await readFile(PREMIUM_CSS, "utf8");
  if (!css.includes(".comparison-quick-answer {")) {
    css += `

/* ${PATCH_NAME}: gemeinsame Kurzantwort */
.comparison-quick-answer {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(220px, 0.38fr);
  align-items: center;
  gap: clamp(18px, 4vw, 42px);
  padding: clamp(22px, 4vw, 38px);
  border: 1px solid var(--comparison-border, var(--px2-border));
  border-radius: 24px;
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--px2-green-soft) 74%, var(--px2-surface)),
      var(--px2-surface)
    );
}

.comparison-quick-answer h2 {
  margin: 8px 0 10px;
  color: var(--px2-text);
  font-size: clamp(1.55rem, 4vw, 2.4rem);
  line-height: 1.08;
}

.comparison-quick-answer p {
  max-width: 74ch;
  margin: 0;
  color: var(--px2-muted);
  font-size: clamp(1rem, 2.1vw, 1.12rem);
  line-height: 1.65;
}

.comparison-quick-answer__winner {
  display: grid;
  gap: 5px;
  min-height: 96px;
  align-content: center;
  padding: 18px;
  border: 1px solid color-mix(in srgb, var(--px2-green) 34%, var(--px2-border));
  border-radius: 18px;
  background: var(--px2-surface-raised);
  color: var(--px2-text);
  text-decoration: none;
}

.comparison-quick-answer__winner span {
  color: var(--px2-green-strong);
  font-size: 0.76rem;
  font-weight: 850;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.comparison-quick-answer__winner strong {
  font-size: 1.08rem;
  line-height: 1.35;
}

@media (max-width: 720px) {
  .comparison-quick-answer {
    grid-template-columns: 1fr;
    border-radius: 20px;
  }

  .comparison-quick-answer__winner {
    min-height: 0;
  }
}
`;
  }
  await writeText(PREMIUM_CSS, css);

  let viewModel = await readFile(VIEW_MODEL, "utf8");
  const oldBadge = `          badge:
            item.slug === resolvedWinnerSlug
              ? "Top-Empfehlung"
              : item.slug === resolvedAlternativeSlug
                ? "Gute Alternative"
                : index === 1
                  ? "Preis-Leistung"
                  : undefined,`;
  const newBadge = `          badge:
            item.slug === resolvedWinnerSlug
              ? "Top-Empfehlung"
              : item.slug === resolvedAlternativeSlug
                ? "Preis-Leistung"
                : index === 1
                  ? "Gute Alternative"
                  : undefined,`;

  if (viewModel.includes(oldBadge)) {
    viewModel = viewModel.replace(oldBadge, newBadge);
  } else {
    const productBadgePattern =
      /badge:\s*item\.slug === resolvedWinnerSlug\s*\?\s*"Top-Empfehlung"\s*:\s*item\.slug === resolvedAlternativeSlug\s*\?\s*"(?:Gute Alternative|Preis-Leistung)"\s*:\s*index === 1\s*\?\s*"(?:Preis-Leistung|Gute Alternative)"\s*:\s*undefined,/m;

    const badgeMatch = viewModel.match(productBadgePattern);

    if (!badgeMatch) {
      fail("buildComparisonViewModel: Produkt-Badge-Block nicht gefunden.");
    }

    const normalizedBadge = `badge:
            item.slug === resolvedWinnerSlug
              ? "Top-Empfehlung"
              : item.slug === resolvedAlternativeSlug
                ? "Preis-Leistung"
                : index === 1
                  ? "Gute Alternative"
                  : undefined,`;

    if (badgeMatch[0] !== normalizedBadge) {
      viewModel = viewModel.replace(productBadgePattern, normalizedBadge);
    }
  }

  await writeText(VIEW_MODEL, viewModel);
};

const auditScriptSource = () => `#!/usr/bin/env node
import { access, readFile, readdir } from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import yaml from "js-yaml";

const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const pages = path.join(app, "src", "content", "pages");
const comparisons = path.join(app, "src", "content", "comparisons");
const redirectsFile = path.join(app, "public", "_redirects");

const mergeMappings = ${JSON.stringify(MERGE_MAPPINGS, null, 2)};
const migratedSlugs = ${JSON.stringify(Object.keys(NEW_COMPARISON_MANIFEST), null, 2)};
const requiredPatterns = [
  /kurzantwort|kurze antwort|schnellentscheidung/i,
  /empfehlung|testsieger|gesamtsieger/i,
  /fur wen geeignet|wann lohnt|eignet sich|nutzungsszenario/i,
  /methodik|testmethodik|so bewerten|bewertung/i,
  /quellen|belege/i,
  /weiterfuhrende links|interne links|weitere passende|weiterfuhrende ratgeber/i
];

const exists = async (file) => {
  try { await access(file); return true; } catch { return false; }
};

const parse = async (file) => {
  const source = await readFile(file, "utf8");
  const match = source.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---\\r?\\n?([\\s\\S]*)$/);
  if (!match) throw new Error(\`Ungültiges Frontmatter: \${file}\`);
  return { data: yaml.load(match[1]) || {}, body: match[2] };
};

const errors = [];
const redirectText = await readFile(redirectsFile, "utf8");
const comparisonFiles = (await readdir(comparisons))
  .filter((name) => /\\.mdx?$/.test(name));
const slugSet = new Set();

for (const name of comparisonFiles) {
  const file = path.join(comparisons, name);
  const { data, body } = await parse(file);
  const slug = data.slug;
  if (!slug) {
    errors.push(\`\${name}: slug fehlt\`);
    continue;
  }
  if (slugSet.has(slug)) errors.push(\`Doppelter Vergleichsslug: \${slug}\`);
  slugSet.add(slug);

  const canonical = \`/vergleiche/\${slug}/\`;
  if (data.seo?.canonical !== canonical) {
    errors.push(\`\${slug}: Canonical ist \${data.seo?.canonical || "nicht gesetzt"}\`);
  }
  if (data.seo?.noindex === true || data.seo?.sitemap === false) {
    errors.push(\`\${slug}: Vergleich ist von Index oder Sitemap ausgeschlossen\`);
  }
  if (!Array.isArray(data.items) || data.items.length < 2) {
    errors.push(\`\${slug}: weniger als zwei Vergleichsitems\`);
  }
  if (!Array.isArray(data.faq) || data.faq.length < 6) {
    errors.push(\`\${slug}: weniger als sechs FAQ\`);
  }
  const headings = [...body.matchAll(/^##\\s+(.+)$/gm)].map((match) =>
    match[1].toLocaleLowerCase("de").normalize("NFD").replace(/\\p{Diacritic}/gu, "")
  );
  for (const pattern of requiredPatterns) {
    if (!headings.some((heading) => pattern.test(heading))) {
      errors.push(\`\${slug}: Pflichtabschnitt fehlt (\${pattern})\`);
    }
  }

  const old = \`/\${slug}/\`;
  const redirectLine = \`\${old} \${canonical} 301\`;
  const noSlashLine = \`\${old.replace(/\\/$/, "")} \${canonical} 301\`;
  if (!redirectText.includes(redirectLine) || !redirectText.includes(noSlashLine)) {
    errors.push(\`\${slug}: Root-Alias-Redirect fehlt\`);
  }
}

for (const mapping of mergeMappings) {
  const legacy = path.join(pages, \`\${mapping.oldSlug}.md\`);
  if (await exists(legacy)) errors.push(\`Legacy-Seite existiert noch: \${mapping.oldSlug}\`);
  const target = path.join(comparisons, \`\${mapping.targetSlug}.md\`);
  if (!(await exists(target))) errors.push(\`Zielvergleich fehlt: \${mapping.targetSlug}\`);
}

for (const slug of migratedSlugs) {
  if (await exists(path.join(pages, \`\${slug}.md\`))) {
    errors.push(\`Migrierte Seite existiert noch: \${slug}\`);
  }
  if (!(await exists(path.join(comparisons, \`\${slug}.md\`)))) {
    errors.push(\`Migrierter Vergleich fehlt: \${slug}\`);
  }
}

const scanRoots = [
  path.join(app, "src"),
  path.join(root, "packages", "affiliate-core", "src")
];
const extensions = new Set([".md", ".mdx", ".astro", ".ts", ".tsx", ".js", ".mjs", ".json"]);

const walk = async (dir) => {
  const result = [];
  if (!(await exists(dir))) return result;
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".patch-backups", "reports"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else if (extensions.has(path.extname(entry.name))) result.push(full);
  }
  return result;
};

const forbidden = [
  ...mergeMappings.map((item) => \`/\${item.oldSlug}/\`),
  ...migratedSlugs.map((slug) => \`/\${slug}/\`),
  "/vergleiche/beste-futterautomaten/"
];

const containsLegacyUrl = (source, oldUrl) => {
  const candidates = [oldUrl, oldUrl.replace(/\\/$/, "")];
  for (const candidate of candidates) {
    let index = source.indexOf(candidate);
    while (index >= 0) {
      const prefix = source.slice(Math.max(0, index - 10), index);
      const isCanonicalTarget =
        !candidate.startsWith("/vergleiche/") &&
        prefix.endsWith("/vergleiche");
      const nextCharacter = source[index + candidate.length] || "";
      const hasBoundary =
        candidate.endsWith("/") ||
        !/[a-z0-9-]/i.test(nextCharacter);

      if (!isCanonicalTarget && hasBoundary) return true;
      index = source.indexOf(candidate, index + 1);
    }
  }
  return false;
};

for (const rootDir of scanRoots) {
  for (const file of await walk(rootDir)) {
    const source = await readFile(file, "utf8");
    for (const oldUrl of forbidden) {
      if (containsLegacyUrl(source, oldUrl)) {
        errors.push(
          "Alter interner Link " + oldUrl + " in " + path.relative(root, file)
        );
      }
    }
  }
}

if (errors.length) {
  console.error("\\nVergleichs-Refactor-Audit fehlgeschlagen:\\n");
  errors.forEach((error) => console.error(\`- \${error}\`));
  process.exit(1);
}

console.log(\`Vergleichs-Refactor-Audit erfolgreich: \${comparisonFiles.length} kanonische Vergleichsseiten.\`);
`;

const patchAppPackage = async () => {
  const source = await readFile(APP_PACKAGE, "utf8");
  const pkg = JSON.parse(source);
  pkg.scripts ||= {};
  pkg.scripts["comparison:refactor:audit"] =
    "node scripts/comparison-platform/refactor-audit.mjs";
  await writeText(APP_PACKAGE, `${JSON.stringify(pkg, null, 2)}\n`);
  await writeText(AUDIT_SCRIPT, auditScriptSource());
};

const commitPaths = (message, paths) => {
  if (NO_COMMIT) return;
  const existing = uniqueStrings(paths).filter(Boolean);
  if (!existing.length) return;

  git(["add", "--", ...existing]);
  const diff = git(
    ["diff", "--cached", "--quiet"],
    { allowFailure: true, capture: true }
  );
  if (diff.status === 0) return;
  git(["commit", "-m", message]);
};

const setupGit = () => {
  const inside = git(
    ["rev-parse", "--is-inside-work-tree"],
    { capture: true, allowFailure: true }
  );
  if (inside.status !== 0) fail("Der aktuelle Ordner ist kein Git-Repository.");

  const statusResult = git(["status", "--porcelain"], { capture: true });
  const dirty = String(statusResult.stdout || "").trim();
  if (dirty && !ALLOW_DIRTY && !CHECK_ONLY) {
    fail(
      "Das Arbeitsverzeichnis enthält uncommittete Änderungen. " +
      "Committe sie zuerst oder verwende bewusst --allow-dirty."
    );
  }

  if (!NO_BRANCH && !CHECK_ONLY) {
    const current = String(
      git(["branch", "--show-current"], { capture: true }).stdout || ""
    ).trim();

    if (current !== BRANCH) {
      const hasBranch = git(
        ["show-ref", "--verify", "--quiet", `refs/heads/${BRANCH}`],
        { allowFailure: true, capture: true }
      ).status === 0;

      git(hasBranch
        ? ["switch", BRANCH]
        : ["switch", "-c", BRANCH]
      );
    }
  }
};

const validateRepoShape = async () => {
  const required = [
    path.join(ROOT, "package.json"),
    APP_PACKAGE,
    PAGES_DIR,
    COMPARISONS_DIR,
    PRODUCTS_DIR,
    COMPARISON_SHELL,
    PREMIUM_CSS,
    VIEW_MODEL
  ];

  for (const item of required) {
    if (!(await exists(item))) {
      fail(`Erwarteter Repository-Pfad fehlt: ${relativeToRoot(item)}`);
    }
  }
};

const migrateContent = async (products) => {
  const comparisons = await readAllComparisons();
  const categorySlugs = await discoverCategoryComparisons();
  const manifestSlugs = Object.keys(NEW_COMPARISON_MANIFEST);
  const newSlugs = uniqueStrings([...categorySlugs, ...manifestSlugs]);

  for (const mapping of MERGE_MAPPINGS) {
    const sourceFile = sourcePagePath(mapping.oldSlug);
    if (!(await exists(sourceFile))) continue;

    const targetFile = comparisonPath(mapping.targetSlug);
    if (!(await exists(targetFile))) {
      fail(
        `Zielvergleich für ${mapping.oldSlug} fehlt: ${mapping.targetSlug}`
      );
    }

    const [source, target] = await Promise.all([
      readMarkdown(sourceFile),
      readMarkdown(targetFile)
    ]);

    const merged = mergeLegacyIntoComparison({
      target,
      source,
      products
    });
    await writeText(
      targetFile,
      dumpFrontmatter(merged.data, merged.body)
    );
    await deletePath(sourceFile);
    migrationLog.push({
      old: oldUrl(mapping.oldSlug),
      target: newUrl(mapping.targetSlug),
      mode: "merge"
    });
  }

  for (const slug of newSlugs) {
    if (KNOWLEDGE_SLUGS.has(slug)) continue;
    const sourceFile = sourcePagePath(slug);
    const targetFile = comparisonPath(slug);

    if (!(await exists(sourceFile))) {
      if (await exists(targetFile)) continue;
      log(`Hinweis: Migrationsquelle nicht vorhanden: ${slug}`);
      continue;
    }

    const source = await readMarkdown(sourceFile);
    const built = buildComparisonData({
      sourceData: source.data,
      sourceBody: source.body,
      slug,
      manifest: NEW_COMPARISON_MANIFEST[slug],
      products
    });

    if (await exists(targetFile)) {
      const target = await readMarkdown(targetFile);
      const merged = mergeLegacyIntoComparison({
        target,
        source,
        products
      });
      await writeText(
        targetFile,
        dumpFrontmatter(merged.data, merged.body)
      );
    } else {
      await writeText(
        targetFile,
        dumpFrontmatter(built.data, built.body)
      );
    }

    await deletePath(sourceFile);
    migrationLog.push({
      old: oldUrl(slug),
      target: newUrl(slug),
      mode: "migrate"
    });
  }

  const allComparisonFiles = await walk(COMPARISONS_DIR, {
    extensions: new Set([".md", ".mdx"])
  });

  for (const file of allComparisonFiles) {
    const current = await readMarkdown(file);
    const normalized = normalizeExistingComparison({
      data: current.data,
      body: current.body,
      products
    });
    await writeText(
      file,
      dumpFrontmatter(normalized.data, normalized.body)
    );
  }

  const backupLikeFiles = (await readdir(COMPARISONS_DIR))
    .filter((name) =>
      /\.md\.comparison-framework-\d+\.\d+\.bak$/.test(name)
    );
  for (const name of backupLikeFiles) {
    await deletePath(path.join(COMPARISONS_DIR, name));
  }

  return {
    migratedSlugs: newSlugs,
    existingSlugs: (await readAllComparisons()).keys()
  };
};

const writeMappingReport = async ({
  mapping,
  status = "vorbereitet",
  checks = []
}) => {
  const comparisons = await readAllComparisons();
  const rows = [...mapping.entries()]
    .filter(([from]) => !from.startsWith("/vergleiche/"))
    .sort(([left], [right]) => left.localeCompare(right, "de"))
    .map(([from, to]) => `| \`${from}\` | \`${to}\` |`)
    .join("\n");

  const improved = [...comparisons.keys()]
    .sort((a, b) => a.localeCompare(b, "de"))
    .map((slug) => `- \`${newUrl(slug)}\``)
    .join("\n");

  const checkLines = checks.length
    ? checks.map((item) => `- ${item.ok ? "✅" : "❌"} \`${item.command}\``).join("\n")
    : "- Noch nicht ausgeführt";

  const content = `# Vergleichsplattform Refactor ${VERSION}

Stand: 2026-07-27  
Status: **${status}**

## Zielarchitektur

Alle kommerziellen Vergleiche werden ausschließlich unter \`/vergleiche/\` ausgeliefert. Wissens- und Evergreenartikel bleiben als eigenständige Informationsseiten bestehen.

## URL-Mapping und Redirects

| Alt | Neu |
| --- | --- |
${rows}

## Migrierte und zusammengeführte Seiten

${migrationLog.length
  ? migrationLog
      .map((item) => `- \`${item.old}\` → \`${item.target}\` (${item.mode})`)
      .join("\n")
  : "- Keine Migration in diesem Lauf"}

## Qualitativ vereinheitlichte Vergleichsseiten

${improved}

## Plattformweite Verbesserungen

- einheitliche Canonicals unter \`/vergleiche/\`
- ausschließlich indexierbare Vergleichszielseiten in der Sitemap
- Root-Aliase mit permanenten 301-Redirects
- gemeinsame Kurzantwort in der ComparisonShell
- konsistente Testsieger-, Preis-Leistungs- und Alternativenkennzeichnung
- mindestens sechs FAQ je Vergleich
- verpflichtende Abschnitte für Eignung, Methodik, Quellen und weiterführende Links
- vollständiger ItemList- und FAQ-Schema-Pfad über die zentrale Route
- aktualisierte interne Links in Content, Navigation, CTA-Modulen und Komponenten
- mobile Sprungnavigation, Sticky CTA und Dark-Mode-Unterstützung über die gemeinsame Shell

## Validierung

${checkLines}

## Scope-Abgrenzung

Wissensartikel, Evergreenartikel, Kaufberater, Produktseiten und Herstellerseiten wurden inhaltlich nicht verändert. Dort wurden ausschließlich interne Links auf kanonische Vergleichsrouten aktualisiert.
`;

  await writeText(REPORT_FILE, content);
};

const runValidation = () => {
  const commands = [
    ["node", ["apps/pfotentechnik/scripts/comparison-platform/refactor-audit.mjs"]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:integrity"]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:metadata:check"]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:data:audit:strict"]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "audit:technical-seo"]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "audit:comparison-schema"]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "audit:repository"]],
    ["npm", ["run", "build:pfotentechnik"]]
  ];

  for (const [command, args] of commands) {
    const label = `${command} ${args.join(" ")}`;
    log(`Validierung: ${label}`);
    const result = run(command, args, {
      allowFailure: true,
      capture: false
    });
    const ok = result.status === 0;
    validationLog.push({ command: label, ok });
    if (!ok) {
      fail(`Validierung fehlgeschlagen: ${label}`);
    }
  }
};

const checkCurrentState = async () => {
  const comparisons = await readAllComparisons();
  const categorySlugs = await discoverCategoryComparisons();
  const expectedMigrated = uniqueStrings([
    ...Object.keys(NEW_COMPARISON_MANIFEST),
    ...categorySlugs
  ]);
  const mapping = allMappings(
    [...comparisons.keys()],
    expectedMigrated
  );

  log(`Kanonische Vergleiche: ${comparisons.size}`);
  log(`Noch vorhandene category=vergleich-Seiten: ${categorySlugs.length}`);
  for (const slug of categorySlugs) log(`- ${oldUrl(slug)} -> ${newUrl(slug)}`);

  for (const item of MERGE_MAPPINGS) {
    if (await exists(sourcePagePath(item.oldSlug))) {
      log(`- ${oldUrl(item.oldSlug)} -> ${newUrl(item.targetSlug)}`);
    }
  }

  const auditExists = await exists(AUDIT_SCRIPT);
  if (auditExists) {
    run("node", [relativeToRoot(AUDIT_SCRIPT)]);
  } else {
    log("Der Refactor-Audit ist noch nicht installiert.");
  }

  return mapping;
};

const main = async () => {
  if (PUSH && NO_COMMIT) {
    fail("--push kann nicht gemeinsam mit --no-commit verwendet werden.");
  }

  await validateRepoShape();
  setupGit();

  if (CHECK_ONLY) {
    await checkCurrentState();
    return;
  }

  log("Produktkatalog wird geladen.");
  const products = await loadProductCatalog();
  log(`${products.size} Produktdatensätze erkannt.`);

  log("Vergleichsseiten werden migriert und normalisiert.");
  const migrationMark = new Set(changedFiles);
  const migrationResult = await migrateContent(products);
  const existingSlugs = [...migrationResult.existingSlugs];
  const mapping = allMappings(
    existingSlugs,
    migrationResult.migratedSlugs
  );
  commitPaths(
    "refactor(comparisons): migrate legacy commercial comparisons",
    changedSince(migrationMark)
  );

  log("Gemeinsamer Premiumstandard wird erweitert.");
  const premiumMark = new Set(changedFiles);
  await patchComparisonShell();
  commitPaths(
    "feat(comparisons): enforce premium comparison baseline",
    changedSince(premiumMark)
  );

  log("Redirects und interne Links werden kanonisiert.");
  const seoMark = new Set(changedFiles);
  await applyRedirects(mapping);
  await rewriteInternalLinks(mapping);
  commitPaths(
    "fix(seo): canonicalize comparison routes and internal links",
    changedSince(seoMark)
  );

  log("Refactor-Audit und Dokumentation werden installiert.");
  const auditMark = new Set(changedFiles);
  await patchAppPackage();
  commitPaths(
    "test(comparisons): add refactor integrity audit",
    changedSince(auditMark)
  );

  const docsMark = new Set(changedFiles);
  await writeMappingReport({ mapping, status: "vor Validierung" });
  commitPaths(
    "docs(comparisons): record migration mapping",
    changedSince(docsMark)
  );

  runValidation();

  await writeMappingReport({
    mapping,
    status: "abgeschlossen",
    checks: validationLog
  });
  commitPaths(
    "docs(comparisons): record successful final audit",
    [
      relativeToRoot(REPORT_FILE),
      relativeToRoot(REPORT_DIR)
    ]
  );

  if (PUSH) {
    const branch = String(
      git(["branch", "--show-current"], { capture: true }).stdout || ""
    ).trim();
    if (!branch) fail("Aktueller Git-Branch konnte nicht bestimmt werden.");
    git(["push", "-u", "origin", branch]);
  }

  log("");
  log("Refactor abgeschlossen.");
  log(`Vergleichsseiten: ${existingSlugs.length}`);
  log(`Migrationen: ${migrationLog.length}`);
  log(`Redirects: ${redirectLog.length}`);
  log(`Dateien mit Link-Rewrites: ${linkRewriteLog.length}`);
  log(`Backup: ${relativeToRoot(BACKUP_ROOT)}`);
  log(`Bericht: ${relativeToRoot(REPORT_FILE)}`);
};

main().catch(async (error) => {
  try {
    if (!CHECK_ONLY) {
      await mkdir(REPORT_DIR, { recursive: true });
      const failureReport = `# Vergleichsplattform Refactor ${VERSION}

Stand: 2026-07-27  
Status: **fehlgeschlagen**

## Fehler

\`\`\`
${String(error?.stack || error)}
\`\`\`

## Bereits ausgeführte Migrationen

${migrationLog.length
  ? migrationLog.map((item) => `- ${item.old} → ${item.target}`).join("\n")
  : "- keine"}

## Backup

\`${relativeToRoot(BACKUP_ROOT)}\`
`;
      await writeFile(
        path.join(REPORT_DIR, "comparison-refactor-failure.md"),
        failureReport,
        "utf8"
      );
    }
  } catch {
    // Fehlerbericht darf den ursprünglichen Fehler nicht verdecken.
  }

  console.error(`\n[${PATCH_NAME}] FEHLER\n${error?.stack || error}`);
  process.exit(1);
});

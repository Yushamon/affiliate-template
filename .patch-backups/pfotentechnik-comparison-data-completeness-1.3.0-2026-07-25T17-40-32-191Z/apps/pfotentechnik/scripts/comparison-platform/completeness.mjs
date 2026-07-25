import fs from "node:fs";
import path from "node:path";
import {
  COMPARISON_DIR,
  PRODUCT_DIR,
  REPORT_DIR,
  loadEntries,
  slugOf,
  splitFrontmatter,
  ensureReportDir
} from "./core.mjs";
import { resolveComparisonValue } from "./data-platform.mjs";

const WRITE = process.argv.includes("--write");
const INCLUDE_MEDIUM = process.argv.includes("--include-medium");

const asList = (value) => {
  if (Array.isArray(value)) return value;
  if (!value || typeof value !== "object") return [];

  return Object.entries(value)
    .sort(([a], [b]) => {
      const an = Number(a);
      const bn = Number(b);
      if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;
      return a.localeCompare(b, "de");
    })
    .map(([, entry]) => entry)
    .filter((entry) => entry && typeof entry === "object");
};

const normalize = (value) =>
  String(value ?? "")
    .toLocaleLowerCase("de-DE")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]/g, "");

const clean = (value) =>
  String(value ?? "")
    .replace(/\s+/g, " ")
    .trim();

const record = (value) =>
  value && typeof value === "object" && !Array.isArray(value)
    ? value
    : {};

const evidenceText = (product) => {
  const data = product.data;
  const parts = [
    data.title,
    data.description,
    data.recommendation,
    data.capacity,
    data.useCase,
    ...(Array.isArray(data.features) ? data.features : []),
    ...(Array.isArray(data.strengths) ? data.strengths : []),
    ...(Array.isArray(data.weaknesses) ? data.weaknesses : []),
    ...(Array.isArray(data.specs)
      ? data.specs.map((spec) =>
          `${spec.label}: ${String(spec.value ?? "")}`
        )
      : []),
    ...asList(data.decision?.bestFor),
    ...asList(data.decision?.attention),
    product.source
  ];

  return parts.filter(Boolean).join("\n");
};

const specValue = (product, patterns) => {
  const specs = Array.isArray(product.data.specs)
    ? product.data.specs
    : [];

  for (const spec of specs) {
    const label = clean(spec.label);
    if (patterns.some((pattern) => pattern.test(label))) {
      const value = clean(spec.value);
      if (value) {
        return {
          value,
          confidence: "high",
          source: `specs:${label}`
        };
      }
    }
  }

  return null;
};

const findMatch = (text, patterns, confidence = "medium") => {
  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (!match) continue;

    const value = clean(match[1] ?? match[0]);
    if (!value) continue;

    return {
      value,
      confidence,
      source: `text:${pattern.source}`
    };
  }

  return null;
};

const yesNo = (condition, yes, no, source) => ({
  value: condition ? yes : no,
  confidence: "high",
  source
});

function infer(product, criterion) {
  const key = normalize(
    criterion.key || criterion.label
  );

  const text = evidenceText(product);
  const lower = text.toLocaleLowerCase("de-DE");
  const filters = record(product.data.comparisonFilters);
  const gps = record(product.data.gps);

  if (["kapazitaet", "volumen", "fassungsvermoegen"].includes(key)) {
    if (product.data.capacity) {
      return {
        value: clean(product.data.capacity),
        confidence: "high",
        source: "capacity"
      };
    }

    return (
      specValue(product, [
        /kapazität/i,
        /kapazitaet/i,
        /volumen/i,
        /fassungsvermögen/i,
        /tankgröße/i,
        /tankgroesse/i
      ]) ??
      findMatch(text, [
        /\b(\d+(?:[.,]\d+)?\s*(?:l|liter|ml|fl\.?\s*oz\.?))\b/i
      ], "medium")
    );
  }

  if (["material", "werkstoff"].includes(key)) {
    const spec = specValue(product, [
      /material/i,
      /werkstoff/i,
      /trinkfläche/i,
      /trinkflaeche/i
    ]);
    if (spec) return spec;

    const materials = [];
    if (/\bedelstahl(?:\s*304|\s*316)?\b/i.test(text)) {
      const match = text.match(/\bedelstahl(?:\s*304|\s*316)?\b/i);
      materials.push(match[0]);
    }
    if (/\bkeramik\b/i.test(text)) materials.push("Keramik");
    if (/\babs\b/i.test(text)) materials.push("ABS-Kunststoff");
    else if (/\bkunststoff\b/i.test(text)) materials.push("Kunststoff");
    if (/\bbpa[- ]?frei\b/i.test(text)) materials.push("BPA-frei");

    if (materials.length) {
      return {
        value: [...new Set(materials)].join(", "),
        confidence: "medium",
        source: "text:material"
      };
    }
  }

  if (["lautstaerke", "geraeusch", "geraeuschpegel"].includes(key)) {
    const spec = specValue(product, [
      /lautstärke/i,
      /lautstaerke/i,
      /geräusch/i,
      /geraeusch/i,
      /dezibel/i
    ]);
    if (spec) return spec;

    return findMatch(text, [
      /(?:unter|bis zu|ca\.?|circa|ungefähr|ungefaehr)?\s*(\d+(?:[.,]\d+)?\s*dB)\b/i
    ], "high");
  }

  if (["filter", "filtersystem", "filtertyp"].includes(key)) {
    const spec = specValue(product, [
      /filtersystem/i,
      /filtertyp/i,
      /^filter$/i,
      /filtration/i
    ]);
    if (spec) return spec;

    const types = [];
    if (/aktivkohlefilter/i.test(lower)) types.push("Aktivkohlefilter");
    if (/schaumstofffilter/i.test(lower)) types.push("Schaumstofffilter");
    if (/ionenaustausch/i.test(lower)) types.push("Ionenaustauschfilter");
    if (/mehrstufig(?:e|es|en)?\s+filter/i.test(lower)) {
      types.push("Mehrstufiges Filtersystem");
    }
    if (/\bfilter\b/i.test(lower) && !types.length) {
      const sentence = lower
        .split(/(?<=[.!?])\s+/)
        .find((part) => /\bfilter\b/i.test(part));
      if (sentence && sentence.length <= 180) {
        return {
          value: clean(sentence),
          confidence: "medium",
          source: "text:filter-sentence"
        };
      }
    }
    if (types.length) {
      return {
        value: [...new Set(types)].join(", "),
        confidence: "high",
        source: "text:filter-types"
      };
    }
  }

  if (["reinigung", "pflege", "reinigungsaufwand"].includes(key)) {
    const spec = specValue(product, [
      /reinigung/i,
      /pflege/i,
      /spülmaschine/i,
      /spuelmaschine/i
    ]);
    if (spec) return spec;

    if (/spülmaschinengeeignet|spuelmaschinengeeignet/i.test(lower)) {
      return {
        value: "Entnehmbare Teile spülmaschinengeeignet",
        confidence: "high",
        source: "text:spuelmaschinengeeignet"
      };
    }
    if (/leicht zu reinigen|einfache reinigung/i.test(lower)) {
      return {
        value: "Einfache Reinigung laut Produktbeschreibung",
        confidence: "medium",
        source: "text:einfache-reinigung"
      };
    }
    if (/abnehmbar|zerlegbar|entnehmbar/i.test(lower)) {
      return {
        value: "Entnehmbare beziehungsweise zerlegbare Komponenten",
        confidence: "medium",
        source: "text:abnehmbar"
      };
    }
  }

  if (["stromversorgung", "strom", "power"].includes(key)) {
    const spec = specValue(product, [
      /stromversorgung/i,
      /energieversorgung/i,
      /akku/i,
      /batterie/i,
      /usb/i,
      /netzteil/i
    ]);
    if (spec) return spec;

    const parts = [];
    const battery = text.match(
      /\b(?:lithium[- ]ionen[- ]akku|akku)(?:\s+mit)?\s*(\d[\d.\s]*\s*mAh)?/i
    );
    if (battery) parts.push(clean(battery[0]));

    const usb = text.match(/\bUSB[- ]?C\b/i);
    if (usb) parts.push("USB-C");

    if (/\bnetzbetrieb\b|\bnetzteil\b|\bstromkabel\b/i.test(lower)) {
      parts.push("Netzbetrieb");
    }
    if (/\bbatteriebetrieb\b|\bbatterien\b/i.test(lower)) {
      parts.push("Batteriebetrieb");
    }

    if (parts.length) {
      return {
        value: [...new Set(parts)].join(", "),
        confidence: "high",
        source: "text:power"
      };
    }
  }

  if (["kuehlung", "kuehlprinzip", "cooling"].includes(key)) {
    const spec = specValue(product, [
      /kühlung/i,
      /kuehlung/i,
      /kühlakku/i,
      /kuehlakku/i
    ]);
    if (spec) return spec;

    if (/aktive kühlung|aktive kuehlung/i.test(lower)) {
      return {
        value: "Aktive Kühlung",
        confidence: "high",
        source: "text:active-cooling"
      };
    }
    if (/kühlakku|kuehlakku/i.test(lower)) {
      return {
        value: "Kühlung über Kühlakku",
        confidence: "high",
        source: "text:cool-pack"
      };
    }
  }

  if (["app", "appsteuerung", "steuerung"].includes(key)) {
    if (typeof filters.app === "boolean") {
      return yesNo(
        filters.app,
        "App-Steuerung",
        "Keine App-Steuerung",
        "comparisonFilters.app"
      );
    }

    if (/\bapp\b/i.test(lower)) {
      return {
        value: "App-Steuerung",
        confidence: "medium",
        source: "text:app"
      };
    }
  }

  if (["kamera", "video"].includes(key)) {
    if (typeof filters.camera === "boolean") {
      return yesNo(
        filters.camera,
        "Kamera vorhanden",
        "Keine Kamera",
        "comparisonFilters.camera"
      );
    }

    if (/\bkamera\b|\bvideo\b/i.test(lower)) {
      return {
        value: "Kamera vorhanden",
        confidence: "medium",
        source: "text:camera"
      };
    }
  }

  if (["ausfallsicherheit", "notstrom", "backup"].includes(key)) {
    if (typeof filters.backupPower === "boolean") {
      return yesNo(
        filters.backupPower,
        "Batterie-Backup vorhanden",
        "Kein Batterie-Backup dokumentiert",
        "comparisonFilters.backupPower"
      );
    }

    if (/batterie[- ]?backup|notstrom|stromausfall/i.test(lower)) {
      return {
        value: "Batterie-Backup vorhanden",
        confidence: "high",
        source: "text:backup"
      };
    }
  }

  if (["eignungfuerhunde", "hundeeignung", "geeignetfuerhunde"].includes(key)) {
    const animals = Array.isArray(filters.animal)
      ? filters.animal
      : [];

    if (animals.length) {
      const dog = animals.includes("dog");
      const cat = animals.includes("cat");

      return {
        value:
          dog && cat
            ? "Für Hunde und Katzen eingeordnet"
            : dog
              ? "Für Hunde eingeordnet"
              : "Nicht für Hunde eingeordnet",
        confidence: "high",
        source: "comparisonFilters.animal"
      };
    }

    if (/\bfür hunde und katzen\b|\bfuer hunde und katzen\b/i.test(lower)) {
      return {
        value: "Für Hunde und Katzen eingeordnet",
        confidence: "high",
        source: "text:dog-cat"
      };
    }
    if (/\bfür hunde\b|\bfuer hunde\b/i.test(lower)) {
      return {
        value: "Für Hunde eingeordnet",
        confidence: "medium",
        source: "text:dog"
      };
    }
  }

  if (["mahlzeiten", "mahlzeitenzahl", "faecher"].includes(key)) {
    const spec = specValue(product, [
      /mahlzeit/i,
      /fächer/i,
      /faecher/i
    ]);
    if (spec) return spec;

    return findMatch(text, [
      /\b(\d+\s*(?:mahlzeiten|fächer|faecher))\b/i
    ], "high");
  }

  if (["portionierung", "portionsgroesse", "ausgabemenge"].includes(key)) {
    const spec = specValue(product, [
      /portion/i,
      /ausgabemenge/i,
      /dosierung/i
    ]);
    if (spec) return spec;

    return findMatch(text, [
      /\b(\d+(?:[.,]\d+)?\s*(?:g|gramm)\s*(?:pro portion|je portion)?)\b/i
    ], "high");
  }

  if (["zugang", "zugangskontrolle", "futterzugang"].includes(key)) {
    if (filters.access === "microchip") {
      return {
        value: "Mikrochip- oder RFID-Zugang",
        confidence: "high",
        source: "comparisonFilters.access"
      };
    }
    if (filters.access === "open") {
      return {
        value: "Freier Zugang",
        confidence: "high",
        source: "comparisonFilters.access"
      };
    }
    if (/mikrochip|rfid/i.test(lower)) {
      return {
        value: "Mikrochip- oder RFID-Zugang",
        confidence: "high",
        source: "text:access"
      };
    }
  }

  if (["wasserschutz", "wasserdicht", "ipschutz"].includes(key)) {
    if (gps.waterproofRating) {
      return {
        value: clean(gps.waterproofRating),
        confidence: "high",
        source: "gps.waterproofRating"
      };
    }

    return findMatch(text, [
      /\b(IP(?:X)?\d{1,2})\b/i
    ], "high");
  }

  if (["akkulaufzeit", "batterielaufzeit"].includes(key)) {
    if (gps.batteryMaxDays) {
      return {
        value: `Bis zu ${gps.batteryMaxDays} Tage`,
        confidence: "high",
        source: "gps.batteryMaxDays"
      };
    }

    return findMatch(text, [
      /\b(?:bis zu\s*)?(\d+(?:[.,]\d+)?\s*(?:tage|stunden))\s+akkulaufzeit\b/i,
      /\bakkulaufzeit(?:\s+von|\s*:)?\s*(\d+(?:[.,]\d+)?\s*(?:tage|stunden))\b/i
    ], "high");
  }

  if (["abo", "abonnement", "laufendekosten"].includes(key)) {
    if (typeof gps.subscriptionRequired === "boolean") {
      return yesNo(
        gps.subscriptionRequired,
        "Abo erforderlich",
        "Kein Mobilfunkabo erforderlich",
        "gps.subscriptionRequired"
      );
    }

    if (/kein abo|ohne abo/i.test(lower)) {
      return {
        value: "Kein Abo erforderlich",
        confidence: "high",
        source: "text:no-subscription"
      };
    }
    if (/abo erforderlich|abonnement erforderlich/i.test(lower)) {
      return {
        value: "Abo erforderlich",
        confidence: "high",
        source: "text:subscription"
      };
    }
  }

  if (["gewicht", "geraetegewicht"].includes(key)) {
    const grams = gps.deviceWeightGrams ?? gps.totalWeightGrams;

    if (grams) {
      return {
        value: `${grams} g`,
        confidence: "high",
        source: "gps.weight"
      };
    }

    const spec = specValue(product, [/gewicht/i]);
    if (spec) return spec;
  }

  return null;
}

function existingCustomKeys(source) {
  const range = splitFrontmatter(source);
  const lines = range.frontmatter.split("\n");
  const result = new Set();

  let comparisonStart = lines.findIndex((line) =>
    /^comparisonData:\s*$/.test(line)
  );
  if (comparisonStart < 0) return result;

  let comparisonEnd = lines.length;
  for (let i = comparisonStart + 1; i < lines.length; i++) {
    if (/^\S/.test(lines[i]) && lines[i].trim()) {
      comparisonEnd = i;
      break;
    }
  }

  let customStart = -1;
  for (let i = comparisonStart + 1; i < comparisonEnd; i++) {
    if (/^  custom:\s*$/.test(lines[i])) {
      customStart = i;
      break;
    }
  }
  if (customStart < 0) return result;

  for (let i = customStart + 1; i < comparisonEnd; i++) {
    if (lines[i].trim() && !/^    /.test(lines[i])) break;
    const match = lines[i].match(/^    ([^:]+):/);
    if (match) result.add(match[1].trim().replace(/^["']|["']$/g, ""));
  }

  return result;
}

function insertCustom(source, additions) {
  if (!additions.length) return source.replace(/\r\n/g, "\n");

  const normalized = source.replace(/\r\n/g, "\n");
  const { frontmatter, body } = splitFrontmatter(normalized);
  const lines = frontmatter.split("\n");

  let comparisonStart = lines.findIndex((line) =>
    /^comparisonData:\s*$/.test(line)
  );

  if (comparisonStart < 0) {
    let insertAt = lines.findIndex((line) =>
      /^comparisonFilters:\s*$/.test(line)
    );
    if (insertAt < 0) insertAt = lines.length;

    lines.splice(
      insertAt,
      0,
      "comparisonData:",
      "  version: 1",
      "  custom:",
      ...additions.map(({ key, value }) =>
        `    ${key}: ${JSON.stringify(value)}`
      )
    );
  } else {
    let comparisonEnd = lines.length;

    for (let i = comparisonStart + 1; i < lines.length; i++) {
      if (/^\S/.test(lines[i]) && lines[i].trim()) {
        comparisonEnd = i;
        break;
      }
    }

    let customStart = -1;
    for (let i = comparisonStart + 1; i < comparisonEnd; i++) {
      if (/^  custom:\s*$/.test(lines[i])) {
        customStart = i;
        break;
      }
    }

    if (customStart < 0) {
      lines.splice(
        comparisonEnd,
        0,
        "  custom:",
        ...additions.map(({ key, value }) =>
          `    ${key}: ${JSON.stringify(value)}`
        )
      );
    } else {
      let customEnd = comparisonEnd;
      for (let i = customStart + 1; i < comparisonEnd; i++) {
        if (lines[i].trim() && !/^    /.test(lines[i])) {
          customEnd = i;
          break;
        }
      }

      lines.splice(
        customEnd,
        0,
        ...additions.map(({ key, value }) =>
          `    ${key}: ${JSON.stringify(value)}`
        )
      );
    }
  }

  return `---\n${lines.join("\n").trimEnd()}\n---\n\n${body.replace(/^\n+/, "")}`;
}

function removeMissingOverrides(source, removalsBySlug) {
  if (!removalsBySlug.size) return source.replace(/\r\n/g, "\n");

  const normalized = source.replace(/\r\n/g, "\n");
  const { frontmatter, body } = splitFrontmatter(normalized);
  const lines = frontmatter.split("\n");

  let currentSlug = "";
  let inItems = false;
  let inOverrides = false;
  const output = [];

  for (const line of lines) {
    if (/^items:\s*$/.test(line)) {
      inItems = true;
      currentSlug = "";
      inOverrides = false;
      output.push(line);
      continue;
    }

    if (inItems && /^\S/.test(line) && line.trim()) {
      inItems = false;
      currentSlug = "";
      inOverrides = false;
      output.push(line);
      continue;
    }

    const slugMatch = line.match(/^  -\s+slug:\s*(.+?)\s*$/);
    if (inItems && slugMatch) {
      currentSlug = slugMatch[1].trim().replace(/^["']|["']$/g, "");
      inOverrides = false;
      output.push(line);
      continue;
    }

    if (inItems && /^    overrides:\s*$/.test(line)) {
      inOverrides = true;
      output.push(line);
      continue;
    }

    if (
      inItems &&
      inOverrides &&
      line.trim() &&
      !/^      /.test(line)
    ) {
      inOverrides = false;
    }

    if (inItems && inOverrides && currentSlug) {
      const match = line.match(
        /^      (.+?):\s*["']?Nicht dokumentiert["']?\s*$/
      );

      if (match) {
        const key = match[1].trim().replace(/^["']|["']$/g, "");
        const removals = removalsBySlug.get(currentSlug);

        if (removals?.has(key)) {
          continue;
        }
      }
    }

    output.push(line);
  }

  for (let i = output.length - 1; i >= 0; i--) {
    if (!/^    overrides:\s*$/.test(output[i])) continue;

    let hasChild = false;
    for (let j = i + 1; j < output.length; j++) {
      if (output[j].trim() && !/^      /.test(output[j])) break;
      if (/^      [^:]+:/.test(output[j])) {
        hasChild = true;
        break;
      }
    }

    if (!hasChild) output.splice(i, 1);
  }

  return `---\n${output.join("\n").trimEnd()}\n---\n\n${body.replace(/^\n+/, "")}`;
}

export function runCompleteness({
  write = WRITE,
  includeMedium = INCLUDE_MEDIUM
} = {}) {
  const comparisons = loadEntries(COMPARISON_DIR);
  const products = loadEntries(PRODUCT_DIR);

  const productBySlug = new Map(
    products.map((entry) => [slugOf(entry), entry])
  );

  const proposalsByProduct = new Map();
  const uncertain = [];
  const unresolvedBefore = [];

  for (const comparison of comparisons) {
    const criteria = asList(comparison.data.criteria);
    const items = asList(comparison.data.items);

    for (const item of items) {
      if (item.type !== "product") continue;

      const product = productBySlug.get(item.slug);
      if (!product) continue;

      for (const criterion of criteria) {
        if (!criterion?.key) continue;

        const current = resolveComparisonValue({
          product: product.data,
          item,
          criterion
        });

        if (current && current !== "–" && current !== "Nicht dokumentiert") {
          continue;
        }

        unresolvedBefore.push({
          comparison: slugOf(comparison),
          product: item.slug,
          criterion: criterion.key
        });

        const inferred = infer(product, criterion);
        if (!inferred) continue;

        const accepted =
          inferred.confidence === "high" ||
          (includeMedium && inferred.confidence === "medium");

        if (!accepted) {
          uncertain.push({
            comparison: slugOf(comparison),
            product: item.slug,
            criterion: criterion.key,
            value: inferred.value,
            confidence: inferred.confidence,
            source: inferred.source
          });
          continue;
        }

        const productMap =
          proposalsByProduct.get(item.slug) ?? new Map();

        const existing = productMap.get(criterion.key);
        if (!existing) {
          productMap.set(criterion.key, {
            value: inferred.value,
            confidence: inferred.confidence,
            source: inferred.source,
            comparisons: new Set([slugOf(comparison)])
          });
        } else if (existing.value === inferred.value) {
          existing.comparisons.add(slugOf(comparison));
        } else {
          uncertain.push({
            comparison: slugOf(comparison),
            product: item.slug,
            criterion: criterion.key,
            value: inferred.value,
            confidence: "conflict",
            source: inferred.source,
            existingValue: existing.value
          });
          productMap.delete(criterion.key);
        }

        proposalsByProduct.set(item.slug, productMap);
      }
    }
  }

  let changedProducts = 0;
  let addedFields = 0;
  const accepted = [];

  for (const [slug, proposalMap] of proposalsByProduct) {
    const product = productBySlug.get(slug);
    if (!product) continue;

    const existing = existingCustomKeys(product.source);
    const additions = [];

    for (const [key, proposal] of proposalMap) {
      if (existing.has(key)) continue;

      additions.push({
        key,
        value: proposal.value
      });

      accepted.push({
        product: slug,
        criterion: key,
        value: proposal.value,
        confidence: proposal.confidence,
        source: proposal.source,
        comparisons: [...proposal.comparisons]
      });
    }

    if (!additions.length) continue;

    const next = insertCustom(product.source, additions);
    if (next === product.source.replace(/\r\n/g, "\n")) continue;

    changedProducts++;
    addedFields += additions.length;

    console.log(
      `${write ? "[product]" : "[check product]"} ${path.basename(product.file)} (+${additions.length})`
    );

    if (write) fs.writeFileSync(product.file, next, "utf8");
  }

  let changedComparisons = 0;

  for (const comparison of comparisons) {
    const removalsBySlug = new Map();

    for (const entry of accepted) {
      if (!entry.comparisons.includes(slugOf(comparison))) continue;

      const keys = removalsBySlug.get(entry.product) ?? new Set();
      keys.add(entry.criterion);
      removalsBySlug.set(entry.product, keys);
    }

    if (!removalsBySlug.size) continue;

    const next = removeMissingOverrides(
      comparison.source,
      removalsBySlug
    );

    if (next === comparison.source.replace(/\r\n/g, "\n")) continue;

    changedComparisons++;

    console.log(
      `${write ? "[comparison]" : "[check comparison]"} ${path.basename(comparison.file)}`
    );

    if (write) fs.writeFileSync(comparison.file, next, "utf8");
  }

  ensureReportDir();

  const report = {
    generatedAt: new Date().toISOString(),
    mode: includeMedium ? "high-and-medium" : "high-only",
    summary: {
      products: products.length,
      comparisons: comparisons.length,
      unresolvedBefore: unresolvedBefore.length,
      acceptedFields: accepted.length,
      changedProducts,
      changedComparisons,
      uncertainSuggestions: uncertain.length
    },
    accepted,
    uncertain
  };

  fs.writeFileSync(
    path.join(REPORT_DIR, "comparison-data-completeness.json"),
    JSON.stringify(report, null, 2) + "\n",
    "utf8"
  );

  fs.writeFileSync(
    path.join(REPORT_DIR, "comparison-data-completeness.md"),
    [
      "# Comparison Data Completeness",
      "",
      `Erstellt: ${report.generatedAt}`,
      `Modus: ${report.mode}`,
      "",
      `- Vorher offene oder nicht dokumentierte Zellen: ${unresolvedBefore.length}`,
      `- Automatisch ergänzte zentrale Felder: ${accepted.length}`,
      `- Geänderte Produktdateien: ${changedProducts}`,
      `- Bereinigte Vergleichsdateien: ${changedComparisons}`,
      `- Nur als Vorschlag protokolliert: ${uncertain.length}`,
      "",
      "## Übernommene Felder",
      "",
      ...(accepted.length
        ? accepted.map((entry) =>
            `- \`${entry.product}\` → \`${entry.criterion}\`: ${entry.value} (${entry.source})`
          )
        : ["Keine."]),
      "",
      "## Manuell zu prüfende Vorschläge",
      "",
      ...(uncertain.length
        ? uncertain.map((entry) =>
            `- \`${entry.product}\` → \`${entry.criterion}\`: ${entry.value} (${entry.confidence}, ${entry.source})`
          )
        : ["Keine."]),
      ""
    ].join("\n"),
    "utf8"
  );

  console.log("");
  console.log("Comparison Data Completeness");
  console.log(`Automatisch ergänzt: ${accepted.length}`);
  console.log(`Geänderte Produkte: ${changedProducts}`);
  console.log(`Bereinigte Vergleiche: ${changedComparisons}`);
  console.log(`Manuell zu prüfen: ${uncertain.length}`);

  return report;
}

if (
  process.argv[1] &&
  import.meta.url.endsWith(process.argv[1].replaceAll("\\", "/"))
) {
  runCompleteness({
    write: WRITE,
    includeMedium: INCLUDE_MEDIUM
  });
}

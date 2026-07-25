#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ID = "pfotentechnik-comparison-data-completeness-1.3.0";
const CHECK = process.argv.includes("--check");
const INCLUDE_MEDIUM = process.argv.includes("--include-medium");
const SKIP_BUILD = process.argv.includes("--skip-build");

const SCRIPT_CONTENT = 'import fs from "node:fs";\nimport path from "node:path";\nimport {\n  COMPARISON_DIR,\n  PRODUCT_DIR,\n  REPORT_DIR,\n  loadEntries,\n  slugOf,\n  splitFrontmatter,\n  ensureReportDir\n} from "./core.mjs";\nimport { resolveComparisonValue } from "./data-platform.mjs";\n\nconst WRITE = process.argv.includes("--write");\nconst INCLUDE_MEDIUM = process.argv.includes("--include-medium");\n\nconst asList = (value) => {\n  if (Array.isArray(value)) return value;\n  if (!value || typeof value !== "object") return [];\n\n  return Object.entries(value)\n    .sort(([a], [b]) => {\n      const an = Number(a);\n      const bn = Number(b);\n      if (Number.isFinite(an) && Number.isFinite(bn)) return an - bn;\n      return a.localeCompare(b, "de");\n    })\n    .map(([, entry]) => entry)\n    .filter((entry) => entry && typeof entry === "object");\n};\n\nconst normalize = (value) =>\n  String(value ?? "")\n    .toLocaleLowerCase("de-DE")\n    .replaceAll("ä", "ae")\n    .replaceAll("ö", "oe")\n    .replaceAll("ü", "ue")\n    .replaceAll("ß", "ss")\n    .replace(/[^a-z0-9]/g, "");\n\nconst clean = (value) =>\n  String(value ?? "")\n    .replace(/\\s+/g, " ")\n    .trim();\n\nconst record = (value) =>\n  value && typeof value === "object" && !Array.isArray(value)\n    ? value\n    : {};\n\nconst evidenceText = (product) => {\n  const data = product.data;\n  const parts = [\n    data.title,\n    data.description,\n    data.recommendation,\n    data.capacity,\n    data.useCase,\n    ...(Array.isArray(data.features) ? data.features : []),\n    ...(Array.isArray(data.strengths) ? data.strengths : []),\n    ...(Array.isArray(data.weaknesses) ? data.weaknesses : []),\n    ...(Array.isArray(data.specs)\n      ? data.specs.map((spec) =>\n          `${spec.label}: ${String(spec.value ?? "")}`\n        )\n      : []),\n    ...asList(data.decision?.bestFor),\n    ...asList(data.decision?.attention),\n    product.source\n  ];\n\n  return parts.filter(Boolean).join("\\n");\n};\n\nconst specValue = (product, patterns) => {\n  const specs = Array.isArray(product.data.specs)\n    ? product.data.specs\n    : [];\n\n  for (const spec of specs) {\n    const label = clean(spec.label);\n    if (patterns.some((pattern) => pattern.test(label))) {\n      const value = clean(spec.value);\n      if (value) {\n        return {\n          value,\n          confidence: "high",\n          source: `specs:${label}`\n        };\n      }\n    }\n  }\n\n  return null;\n};\n\nconst findMatch = (text, patterns, confidence = "medium") => {\n  for (const pattern of patterns) {\n    const match = text.match(pattern);\n    if (!match) continue;\n\n    const value = clean(match[1] ?? match[0]);\n    if (!value) continue;\n\n    return {\n      value,\n      confidence,\n      source: `text:${pattern.source}`\n    };\n  }\n\n  return null;\n};\n\nconst yesNo = (condition, yes, no, source) => ({\n  value: condition ? yes : no,\n  confidence: "high",\n  source\n});\n\nfunction infer(product, criterion) {\n  const key = normalize(\n    criterion.key || criterion.label\n  );\n\n  const text = evidenceText(product);\n  const lower = text.toLocaleLowerCase("de-DE");\n  const filters = record(product.data.comparisonFilters);\n  const gps = record(product.data.gps);\n\n  if (["kapazitaet", "volumen", "fassungsvermoegen"].includes(key)) {\n    if (product.data.capacity) {\n      return {\n        value: clean(product.data.capacity),\n        confidence: "high",\n        source: "capacity"\n      };\n    }\n\n    return (\n      specValue(product, [\n        /kapazität/i,\n        /kapazitaet/i,\n        /volumen/i,\n        /fassungsvermögen/i,\n        /tankgröße/i,\n        /tankgroesse/i\n      ]) ??\n      findMatch(text, [\n        /\\b(\\d+(?:[.,]\\d+)?\\s*(?:l|liter|ml|fl\\.?\\s*oz\\.?))\\b/i\n      ], "medium")\n    );\n  }\n\n  if (["material", "werkstoff"].includes(key)) {\n    const spec = specValue(product, [\n      /material/i,\n      /werkstoff/i,\n      /trinkfläche/i,\n      /trinkflaeche/i\n    ]);\n    if (spec) return spec;\n\n    const materials = [];\n    if (/\\bedelstahl(?:\\s*304|\\s*316)?\\b/i.test(text)) {\n      const match = text.match(/\\bedelstahl(?:\\s*304|\\s*316)?\\b/i);\n      materials.push(match[0]);\n    }\n    if (/\\bkeramik\\b/i.test(text)) materials.push("Keramik");\n    if (/\\babs\\b/i.test(text)) materials.push("ABS-Kunststoff");\n    else if (/\\bkunststoff\\b/i.test(text)) materials.push("Kunststoff");\n    if (/\\bbpa[- ]?frei\\b/i.test(text)) materials.push("BPA-frei");\n\n    if (materials.length) {\n      return {\n        value: [...new Set(materials)].join(", "),\n        confidence: "medium",\n        source: "text:material"\n      };\n    }\n  }\n\n  if (["lautstaerke", "geraeusch", "geraeuschpegel"].includes(key)) {\n    const spec = specValue(product, [\n      /lautstärke/i,\n      /lautstaerke/i,\n      /geräusch/i,\n      /geraeusch/i,\n      /dezibel/i\n    ]);\n    if (spec) return spec;\n\n    return findMatch(text, [\n      /(?:unter|bis zu|ca\\.?|circa|ungefähr|ungefaehr)?\\s*(\\d+(?:[.,]\\d+)?\\s*dB)\\b/i\n    ], "high");\n  }\n\n  if (["filter", "filtersystem", "filtertyp"].includes(key)) {\n    const spec = specValue(product, [\n      /filtersystem/i,\n      /filtertyp/i,\n      /^filter$/i,\n      /filtration/i\n    ]);\n    if (spec) return spec;\n\n    const types = [];\n    if (/aktivkohlefilter/i.test(lower)) types.push("Aktivkohlefilter");\n    if (/schaumstofffilter/i.test(lower)) types.push("Schaumstofffilter");\n    if (/ionenaustausch/i.test(lower)) types.push("Ionenaustauschfilter");\n    if (/mehrstufig(?:e|es|en)?\\s+filter/i.test(lower)) {\n      types.push("Mehrstufiges Filtersystem");\n    }\n    if (/\\bfilter\\b/i.test(lower) && !types.length) {\n      const sentence = lower\n        .split(/(?<=[.!?])\\s+/)\n        .find((part) => /\\bfilter\\b/i.test(part));\n      if (sentence && sentence.length <= 180) {\n        return {\n          value: clean(sentence),\n          confidence: "medium",\n          source: "text:filter-sentence"\n        };\n      }\n    }\n    if (types.length) {\n      return {\n        value: [...new Set(types)].join(", "),\n        confidence: "high",\n        source: "text:filter-types"\n      };\n    }\n  }\n\n  if (["reinigung", "pflege", "reinigungsaufwand"].includes(key)) {\n    const spec = specValue(product, [\n      /reinigung/i,\n      /pflege/i,\n      /spülmaschine/i,\n      /spuelmaschine/i\n    ]);\n    if (spec) return spec;\n\n    if (/spülmaschinengeeignet|spuelmaschinengeeignet/i.test(lower)) {\n      return {\n        value: "Entnehmbare Teile spülmaschinengeeignet",\n        confidence: "high",\n        source: "text:spuelmaschinengeeignet"\n      };\n    }\n    if (/leicht zu reinigen|einfache reinigung/i.test(lower)) {\n      return {\n        value: "Einfache Reinigung laut Produktbeschreibung",\n        confidence: "medium",\n        source: "text:einfache-reinigung"\n      };\n    }\n    if (/abnehmbar|zerlegbar|entnehmbar/i.test(lower)) {\n      return {\n        value: "Entnehmbare beziehungsweise zerlegbare Komponenten",\n        confidence: "medium",\n        source: "text:abnehmbar"\n      };\n    }\n  }\n\n  if (["stromversorgung", "strom", "power"].includes(key)) {\n    const spec = specValue(product, [\n      /stromversorgung/i,\n      /energieversorgung/i,\n      /akku/i,\n      /batterie/i,\n      /usb/i,\n      /netzteil/i\n    ]);\n    if (spec) return spec;\n\n    const parts = [];\n    const battery = text.match(\n      /\\b(?:lithium[- ]ionen[- ]akku|akku)(?:\\s+mit)?\\s*(\\d[\\d.\\s]*\\s*mAh)?/i\n    );\n    if (battery) parts.push(clean(battery[0]));\n\n    const usb = text.match(/\\bUSB[- ]?C\\b/i);\n    if (usb) parts.push("USB-C");\n\n    if (/\\bnetzbetrieb\\b|\\bnetzteil\\b|\\bstromkabel\\b/i.test(lower)) {\n      parts.push("Netzbetrieb");\n    }\n    if (/\\bbatteriebetrieb\\b|\\bbatterien\\b/i.test(lower)) {\n      parts.push("Batteriebetrieb");\n    }\n\n    if (parts.length) {\n      return {\n        value: [...new Set(parts)].join(", "),\n        confidence: "high",\n        source: "text:power"\n      };\n    }\n  }\n\n  if (["kuehlung", "kuehlprinzip", "cooling"].includes(key)) {\n    const spec = specValue(product, [\n      /kühlung/i,\n      /kuehlung/i,\n      /kühlakku/i,\n      /kuehlakku/i\n    ]);\n    if (spec) return spec;\n\n    if (/aktive kühlung|aktive kuehlung/i.test(lower)) {\n      return {\n        value: "Aktive Kühlung",\n        confidence: "high",\n        source: "text:active-cooling"\n      };\n    }\n    if (/kühlakku|kuehlakku/i.test(lower)) {\n      return {\n        value: "Kühlung über Kühlakku",\n        confidence: "high",\n        source: "text:cool-pack"\n      };\n    }\n  }\n\n  if (["app", "appsteuerung", "steuerung"].includes(key)) {\n    if (typeof filters.app === "boolean") {\n      return yesNo(\n        filters.app,\n        "App-Steuerung",\n        "Keine App-Steuerung",\n        "comparisonFilters.app"\n      );\n    }\n\n    if (/\\bapp\\b/i.test(lower)) {\n      return {\n        value: "App-Steuerung",\n        confidence: "medium",\n        source: "text:app"\n      };\n    }\n  }\n\n  if (["kamera", "video"].includes(key)) {\n    if (typeof filters.camera === "boolean") {\n      return yesNo(\n        filters.camera,\n        "Kamera vorhanden",\n        "Keine Kamera",\n        "comparisonFilters.camera"\n      );\n    }\n\n    if (/\\bkamera\\b|\\bvideo\\b/i.test(lower)) {\n      return {\n        value: "Kamera vorhanden",\n        confidence: "medium",\n        source: "text:camera"\n      };\n    }\n  }\n\n  if (["ausfallsicherheit", "notstrom", "backup"].includes(key)) {\n    if (typeof filters.backupPower === "boolean") {\n      return yesNo(\n        filters.backupPower,\n        "Batterie-Backup vorhanden",\n        "Kein Batterie-Backup dokumentiert",\n        "comparisonFilters.backupPower"\n      );\n    }\n\n    if (/batterie[- ]?backup|notstrom|stromausfall/i.test(lower)) {\n      return {\n        value: "Batterie-Backup vorhanden",\n        confidence: "high",\n        source: "text:backup"\n      };\n    }\n  }\n\n  if (["eignungfuerhunde", "hundeeignung", "geeignetfuerhunde"].includes(key)) {\n    const animals = Array.isArray(filters.animal)\n      ? filters.animal\n      : [];\n\n    if (animals.length) {\n      const dog = animals.includes("dog");\n      const cat = animals.includes("cat");\n\n      return {\n        value:\n          dog && cat\n            ? "Für Hunde und Katzen eingeordnet"\n            : dog\n              ? "Für Hunde eingeordnet"\n              : "Nicht für Hunde eingeordnet",\n        confidence: "high",\n        source: "comparisonFilters.animal"\n      };\n    }\n\n    if (/\\bfür hunde und katzen\\b|\\bfuer hunde und katzen\\b/i.test(lower)) {\n      return {\n        value: "Für Hunde und Katzen eingeordnet",\n        confidence: "high",\n        source: "text:dog-cat"\n      };\n    }\n    if (/\\bfür hunde\\b|\\bfuer hunde\\b/i.test(lower)) {\n      return {\n        value: "Für Hunde eingeordnet",\n        confidence: "medium",\n        source: "text:dog"\n      };\n    }\n  }\n\n  if (["mahlzeiten", "mahlzeitenzahl", "faecher"].includes(key)) {\n    const spec = specValue(product, [\n      /mahlzeit/i,\n      /fächer/i,\n      /faecher/i\n    ]);\n    if (spec) return spec;\n\n    return findMatch(text, [\n      /\\b(\\d+\\s*(?:mahlzeiten|fächer|faecher))\\b/i\n    ], "high");\n  }\n\n  if (["portionierung", "portionsgroesse", "ausgabemenge"].includes(key)) {\n    const spec = specValue(product, [\n      /portion/i,\n      /ausgabemenge/i,\n      /dosierung/i\n    ]);\n    if (spec) return spec;\n\n    return findMatch(text, [\n      /\\b(\\d+(?:[.,]\\d+)?\\s*(?:g|gramm)\\s*(?:pro portion|je portion)?)\\b/i\n    ], "high");\n  }\n\n  if (["zugang", "zugangskontrolle", "futterzugang"].includes(key)) {\n    if (filters.access === "microchip") {\n      return {\n        value: "Mikrochip- oder RFID-Zugang",\n        confidence: "high",\n        source: "comparisonFilters.access"\n      };\n    }\n    if (filters.access === "open") {\n      return {\n        value: "Freier Zugang",\n        confidence: "high",\n        source: "comparisonFilters.access"\n      };\n    }\n    if (/mikrochip|rfid/i.test(lower)) {\n      return {\n        value: "Mikrochip- oder RFID-Zugang",\n        confidence: "high",\n        source: "text:access"\n      };\n    }\n  }\n\n  if (["wasserschutz", "wasserdicht", "ipschutz"].includes(key)) {\n    if (gps.waterproofRating) {\n      return {\n        value: clean(gps.waterproofRating),\n        confidence: "high",\n        source: "gps.waterproofRating"\n      };\n    }\n\n    return findMatch(text, [\n      /\\b(IP(?:X)?\\d{1,2})\\b/i\n    ], "high");\n  }\n\n  if (["akkulaufzeit", "batterielaufzeit"].includes(key)) {\n    if (gps.batteryMaxDays) {\n      return {\n        value: `Bis zu ${gps.batteryMaxDays} Tage`,\n        confidence: "high",\n        source: "gps.batteryMaxDays"\n      };\n    }\n\n    return findMatch(text, [\n      /\\b(?:bis zu\\s*)?(\\d+(?:[.,]\\d+)?\\s*(?:tage|stunden))\\s+akkulaufzeit\\b/i,\n      /\\bakkulaufzeit(?:\\s+von|\\s*:)?\\s*(\\d+(?:[.,]\\d+)?\\s*(?:tage|stunden))\\b/i\n    ], "high");\n  }\n\n  if (["abo", "abonnement", "laufendekosten"].includes(key)) {\n    if (typeof gps.subscriptionRequired === "boolean") {\n      return yesNo(\n        gps.subscriptionRequired,\n        "Abo erforderlich",\n        "Kein Mobilfunkabo erforderlich",\n        "gps.subscriptionRequired"\n      );\n    }\n\n    if (/kein abo|ohne abo/i.test(lower)) {\n      return {\n        value: "Kein Abo erforderlich",\n        confidence: "high",\n        source: "text:no-subscription"\n      };\n    }\n    if (/abo erforderlich|abonnement erforderlich/i.test(lower)) {\n      return {\n        value: "Abo erforderlich",\n        confidence: "high",\n        source: "text:subscription"\n      };\n    }\n  }\n\n  if (["gewicht", "geraetegewicht"].includes(key)) {\n    const grams = gps.deviceWeightGrams ?? gps.totalWeightGrams;\n\n    if (grams) {\n      return {\n        value: `${grams} g`,\n        confidence: "high",\n        source: "gps.weight"\n      };\n    }\n\n    const spec = specValue(product, [/gewicht/i]);\n    if (spec) return spec;\n  }\n\n  return null;\n}\n\nfunction existingCustomKeys(source) {\n  const range = splitFrontmatter(source);\n  const lines = range.frontmatter.split("\\n");\n  const result = new Set();\n\n  let comparisonStart = lines.findIndex((line) =>\n    /^comparisonData:\\s*$/.test(line)\n  );\n  if (comparisonStart < 0) return result;\n\n  let comparisonEnd = lines.length;\n  for (let i = comparisonStart + 1; i < lines.length; i++) {\n    if (/^\\S/.test(lines[i]) && lines[i].trim()) {\n      comparisonEnd = i;\n      break;\n    }\n  }\n\n  let customStart = -1;\n  for (let i = comparisonStart + 1; i < comparisonEnd; i++) {\n    if (/^  custom:\\s*$/.test(lines[i])) {\n      customStart = i;\n      break;\n    }\n  }\n  if (customStart < 0) return result;\n\n  for (let i = customStart + 1; i < comparisonEnd; i++) {\n    if (lines[i].trim() && !/^    /.test(lines[i])) break;\n    const match = lines[i].match(/^    ([^:]+):/);\n    if (match) result.add(match[1].trim().replace(/^["\']|["\']$/g, ""));\n  }\n\n  return result;\n}\n\nfunction insertCustom(source, additions) {\n  if (!additions.length) return source.replace(/\\r\\n/g, "\\n");\n\n  const normalized = source.replace(/\\r\\n/g, "\\n");\n  const { frontmatter, body } = splitFrontmatter(normalized);\n  const lines = frontmatter.split("\\n");\n\n  let comparisonStart = lines.findIndex((line) =>\n    /^comparisonData:\\s*$/.test(line)\n  );\n\n  if (comparisonStart < 0) {\n    let insertAt = lines.findIndex((line) =>\n      /^comparisonFilters:\\s*$/.test(line)\n    );\n    if (insertAt < 0) insertAt = lines.length;\n\n    lines.splice(\n      insertAt,\n      0,\n      "comparisonData:",\n      "  version: 1",\n      "  custom:",\n      ...additions.map(({ key, value }) =>\n        `    ${key}: ${JSON.stringify(value)}`\n      )\n    );\n  } else {\n    let comparisonEnd = lines.length;\n\n    for (let i = comparisonStart + 1; i < lines.length; i++) {\n      if (/^\\S/.test(lines[i]) && lines[i].trim()) {\n        comparisonEnd = i;\n        break;\n      }\n    }\n\n    let customStart = -1;\n    for (let i = comparisonStart + 1; i < comparisonEnd; i++) {\n      if (/^  custom:\\s*$/.test(lines[i])) {\n        customStart = i;\n        break;\n      }\n    }\n\n    if (customStart < 0) {\n      lines.splice(\n        comparisonEnd,\n        0,\n        "  custom:",\n        ...additions.map(({ key, value }) =>\n          `    ${key}: ${JSON.stringify(value)}`\n        )\n      );\n    } else {\n      let customEnd = comparisonEnd;\n      for (let i = customStart + 1; i < comparisonEnd; i++) {\n        if (lines[i].trim() && !/^    /.test(lines[i])) {\n          customEnd = i;\n          break;\n        }\n      }\n\n      lines.splice(\n        customEnd,\n        0,\n        ...additions.map(({ key, value }) =>\n          `    ${key}: ${JSON.stringify(value)}`\n        )\n      );\n    }\n  }\n\n  return `---\\n${lines.join("\\n").trimEnd()}\\n---\\n\\n${body.replace(/^\\n+/, "")}`;\n}\n\nfunction removeMissingOverrides(source, removalsBySlug) {\n  if (!removalsBySlug.size) return source.replace(/\\r\\n/g, "\\n");\n\n  const normalized = source.replace(/\\r\\n/g, "\\n");\n  const { frontmatter, body } = splitFrontmatter(normalized);\n  const lines = frontmatter.split("\\n");\n\n  let currentSlug = "";\n  let inItems = false;\n  let inOverrides = false;\n  const output = [];\n\n  for (const line of lines) {\n    if (/^items:\\s*$/.test(line)) {\n      inItems = true;\n      currentSlug = "";\n      inOverrides = false;\n      output.push(line);\n      continue;\n    }\n\n    if (inItems && /^\\S/.test(line) && line.trim()) {\n      inItems = false;\n      currentSlug = "";\n      inOverrides = false;\n      output.push(line);\n      continue;\n    }\n\n    const slugMatch = line.match(/^  -\\s+slug:\\s*(.+?)\\s*$/);\n    if (inItems && slugMatch) {\n      currentSlug = slugMatch[1].trim().replace(/^["\']|["\']$/g, "");\n      inOverrides = false;\n      output.push(line);\n      continue;\n    }\n\n    if (inItems && /^    overrides:\\s*$/.test(line)) {\n      inOverrides = true;\n      output.push(line);\n      continue;\n    }\n\n    if (\n      inItems &&\n      inOverrides &&\n      line.trim() &&\n      !/^      /.test(line)\n    ) {\n      inOverrides = false;\n    }\n\n    if (inItems && inOverrides && currentSlug) {\n      const match = line.match(\n        /^      (.+?):\\s*["\']?Nicht dokumentiert["\']?\\s*$/\n      );\n\n      if (match) {\n        const key = match[1].trim().replace(/^["\']|["\']$/g, "");\n        const removals = removalsBySlug.get(currentSlug);\n\n        if (removals?.has(key)) {\n          continue;\n        }\n      }\n    }\n\n    output.push(line);\n  }\n\n  for (let i = output.length - 1; i >= 0; i--) {\n    if (!/^    overrides:\\s*$/.test(output[i])) continue;\n\n    let hasChild = false;\n    for (let j = i + 1; j < output.length; j++) {\n      if (output[j].trim() && !/^      /.test(output[j])) break;\n      if (/^      [^:]+:/.test(output[j])) {\n        hasChild = true;\n        break;\n      }\n    }\n\n    if (!hasChild) output.splice(i, 1);\n  }\n\n  return `---\\n${output.join("\\n").trimEnd()}\\n---\\n\\n${body.replace(/^\\n+/, "")}`;\n}\n\nexport function runCompleteness({\n  write = WRITE,\n  includeMedium = INCLUDE_MEDIUM\n} = {}) {\n  const comparisons = loadEntries(COMPARISON_DIR);\n  const products = loadEntries(PRODUCT_DIR);\n\n  const productBySlug = new Map(\n    products.map((entry) => [slugOf(entry), entry])\n  );\n\n  const proposalsByProduct = new Map();\n  const uncertain = [];\n  const unresolvedBefore = [];\n\n  for (const comparison of comparisons) {\n    const criteria = asList(comparison.data.criteria);\n    const items = asList(comparison.data.items);\n\n    for (const item of items) {\n      if (item.type !== "product") continue;\n\n      const product = productBySlug.get(item.slug);\n      if (!product) continue;\n\n      for (const criterion of criteria) {\n        if (!criterion?.key) continue;\n\n        const current = resolveComparisonValue({\n          product: product.data,\n          item,\n          criterion\n        });\n\n        if (current && current !== "–" && current !== "Nicht dokumentiert") {\n          continue;\n        }\n\n        unresolvedBefore.push({\n          comparison: slugOf(comparison),\n          product: item.slug,\n          criterion: criterion.key\n        });\n\n        const inferred = infer(product, criterion);\n        if (!inferred) continue;\n\n        const accepted =\n          inferred.confidence === "high" ||\n          (includeMedium && inferred.confidence === "medium");\n\n        if (!accepted) {\n          uncertain.push({\n            comparison: slugOf(comparison),\n            product: item.slug,\n            criterion: criterion.key,\n            value: inferred.value,\n            confidence: inferred.confidence,\n            source: inferred.source\n          });\n          continue;\n        }\n\n        const productMap =\n          proposalsByProduct.get(item.slug) ?? new Map();\n\n        const existing = productMap.get(criterion.key);\n        if (!existing) {\n          productMap.set(criterion.key, {\n            value: inferred.value,\n            confidence: inferred.confidence,\n            source: inferred.source,\n            comparisons: new Set([slugOf(comparison)])\n          });\n        } else if (existing.value === inferred.value) {\n          existing.comparisons.add(slugOf(comparison));\n        } else {\n          uncertain.push({\n            comparison: slugOf(comparison),\n            product: item.slug,\n            criterion: criterion.key,\n            value: inferred.value,\n            confidence: "conflict",\n            source: inferred.source,\n            existingValue: existing.value\n          });\n          productMap.delete(criterion.key);\n        }\n\n        proposalsByProduct.set(item.slug, productMap);\n      }\n    }\n  }\n\n  let changedProducts = 0;\n  let addedFields = 0;\n  const accepted = [];\n\n  for (const [slug, proposalMap] of proposalsByProduct) {\n    const product = productBySlug.get(slug);\n    if (!product) continue;\n\n    const existing = existingCustomKeys(product.source);\n    const additions = [];\n\n    for (const [key, proposal] of proposalMap) {\n      if (existing.has(key)) continue;\n\n      additions.push({\n        key,\n        value: proposal.value\n      });\n\n      accepted.push({\n        product: slug,\n        criterion: key,\n        value: proposal.value,\n        confidence: proposal.confidence,\n        source: proposal.source,\n        comparisons: [...proposal.comparisons]\n      });\n    }\n\n    if (!additions.length) continue;\n\n    const next = insertCustom(product.source, additions);\n    if (next === product.source.replace(/\\r\\n/g, "\\n")) continue;\n\n    changedProducts++;\n    addedFields += additions.length;\n\n    console.log(\n      `${write ? "[product]" : "[check product]"} ${path.basename(product.file)} (+${additions.length})`\n    );\n\n    if (write) fs.writeFileSync(product.file, next, "utf8");\n  }\n\n  let changedComparisons = 0;\n\n  for (const comparison of comparisons) {\n    const removalsBySlug = new Map();\n\n    for (const entry of accepted) {\n      if (!entry.comparisons.includes(slugOf(comparison))) continue;\n\n      const keys = removalsBySlug.get(entry.product) ?? new Set();\n      keys.add(entry.criterion);\n      removalsBySlug.set(entry.product, keys);\n    }\n\n    if (!removalsBySlug.size) continue;\n\n    const next = removeMissingOverrides(\n      comparison.source,\n      removalsBySlug\n    );\n\n    if (next === comparison.source.replace(/\\r\\n/g, "\\n")) continue;\n\n    changedComparisons++;\n\n    console.log(\n      `${write ? "[comparison]" : "[check comparison]"} ${path.basename(comparison.file)}`\n    );\n\n    if (write) fs.writeFileSync(comparison.file, next, "utf8");\n  }\n\n  ensureReportDir();\n\n  const report = {\n    generatedAt: new Date().toISOString(),\n    mode: includeMedium ? "high-and-medium" : "high-only",\n    summary: {\n      products: products.length,\n      comparisons: comparisons.length,\n      unresolvedBefore: unresolvedBefore.length,\n      acceptedFields: accepted.length,\n      changedProducts,\n      changedComparisons,\n      uncertainSuggestions: uncertain.length\n    },\n    accepted,\n    uncertain\n  };\n\n  fs.writeFileSync(\n    path.join(REPORT_DIR, "comparison-data-completeness.json"),\n    JSON.stringify(report, null, 2) + "\\n",\n    "utf8"\n  );\n\n  fs.writeFileSync(\n    path.join(REPORT_DIR, "comparison-data-completeness.md"),\n    [\n      "# Comparison Data Completeness",\n      "",\n      `Erstellt: ${report.generatedAt}`,\n      `Modus: ${report.mode}`,\n      "",\n      `- Vorher offene oder nicht dokumentierte Zellen: ${unresolvedBefore.length}`,\n      `- Automatisch ergänzte zentrale Felder: ${accepted.length}`,\n      `- Geänderte Produktdateien: ${changedProducts}`,\n      `- Bereinigte Vergleichsdateien: ${changedComparisons}`,\n      `- Nur als Vorschlag protokolliert: ${uncertain.length}`,\n      "",\n      "## Übernommene Felder",\n      "",\n      ...(accepted.length\n        ? accepted.map((entry) =>\n            `- \\`${entry.product}\\` → \\`${entry.criterion}\\`: ${entry.value} (${entry.source})`\n          )\n        : ["Keine."]),\n      "",\n      "## Manuell zu prüfende Vorschläge",\n      "",\n      ...(uncertain.length\n        ? uncertain.map((entry) =>\n            `- \\`${entry.product}\\` → \\`${entry.criterion}\\`: ${entry.value} (${entry.confidence}, ${entry.source})`\n          )\n        : ["Keine."]),\n      ""\n    ].join("\\n"),\n    "utf8"\n  );\n\n  console.log("");\n  console.log("Comparison Data Completeness");\n  console.log(`Automatisch ergänzt: ${accepted.length}`);\n  console.log(`Geänderte Produkte: ${changedProducts}`);\n  console.log(`Bereinigte Vergleiche: ${changedComparisons}`);\n  console.log(`Manuell zu prüfen: ${uncertain.length}`);\n\n  return report;\n}\n\nif (\n  process.argv[1] &&\n  import.meta.url.endsWith(process.argv[1].replaceAll("\\\\", "/"))\n) {\n  runCompleteness({\n    write: WRITE,\n    includeMedium: INCLUDE_MEDIUM\n  });\n}\n';

function fail(message) {
  throw new Error(message);
}

function findRoot() {
  let current = process.cwd();

  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik"))
    ) return current;

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  fail("Repository nicht gefunden.");
}

function run(root, command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });

  if (result.error) fail(result.error.message);

  if (result.status !== 0) {
    fail(
      `${command} ${args.join(" ")} fehlgeschlagen ` +
      `(Exit ${result.status}).`
    );
  }
}

function walk(directory, output = []) {
  if (!fs.existsSync(directory)) return output;

  for (
    const entry of fs.readdirSync(
      directory,
      { withFileTypes: true }
    )
  ) {
    const full = path.join(directory, entry.name);

    if (entry.isDirectory()) walk(full, output);
    else if (entry.isFile()) output.push(full);
  }

  return output;
}

const root = findRoot();
const app = path.join(root, "apps", "pfotentechnik");
const target = path.join(
  app,
  "scripts",
  "comparison-platform",
  "completeness.mjs"
);

if (
  !fs.existsSync(
    path.join(
      app,
      "scripts",
      "comparison-platform",
      "core.mjs"
    )
  ) ||
  !fs.existsSync(
    path.join(
      app,
      "scripts",
      "comparison-platform",
      "data-platform.mjs"
    )
  )
) {
  fail(
    "Comparison Data Platform ist nicht vollständig installiert."
  );
}

console.log(`[${ID}] Repository: ${root}`);
console.log(
  `[${ID}] Modus: ` +
  `${INCLUDE_MEDIUM ? "high + medium" : "nur high confidence"}`
);

const original = fs.existsSync(target)
  ? fs.readFileSync(target, "utf8")
  : null;

console.log(
  `[${ID}] ${original === SCRIPT_CONTENT ? "OK" : "ÄNDERN"}: ` +
  path.relative(root, target)
);

if (CHECK) {
  const temporary = path.join(
    root,
    `.comparison-completeness-check-${process.pid}.mjs`
  );

  fs.writeFileSync(temporary, SCRIPT_CONTENT, "utf8");

  try {
    run(root, "node", ["--check", temporary]);
  } finally {
    fs.rmSync(temporary, { force: true });
  }

  console.log(`[${ID}] Prüfung erfolgreich.`);
  process.exit(0);
}

const affected = [
  target,
  ...walk(
    path.join(app, "src", "content", "products")
  ).filter((file) => /\.mdx?$/.test(file)),
  ...walk(
    path.join(app, "src", "content", "comparisons")
  ).filter((file) => /\.mdx?$/.test(file))
];

const backup = path.join(
  root,
  ".patch-backups",
  `${ID}-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`
);

for (const file of affected) {
  if (!fs.existsSync(file)) continue;

  const destination = path.join(
    backup,
    path.relative(root, file)
  );

  fs.mkdirSync(path.dirname(destination), {
    recursive: true
  });

  fs.copyFileSync(file, destination);
}

try {
  fs.mkdirSync(path.dirname(target), {
    recursive: true
  });

  fs.writeFileSync(target, SCRIPT_CONTENT, "utf8");

  run(root, "node", ["--check", target]);

  const args = [
    "apps/pfotentechnik/scripts/comparison-platform/completeness.mjs",
    "--write"
  ];

  if (INCLUDE_MEDIUM) args.push("--include-medium");

  run(root, "node", args);

  if (
    fs.existsSync(
      path.join(
        app,
        "scripts",
        "comparison-platform",
        "phase3-verify.mjs"
      )
    )
  ) {
    run(root, "node", [
      "apps/pfotentechnik/scripts/comparison-platform/phase3-verify.mjs",
      "--factual-threshold=85"
    ]);
  }

  if (!SKIP_BUILD) {
    run(root, "npm", [
      "run",
      "build:pfotentechnik"
    ]);
  }

  console.log(`[${ID}] Completeness-Patch erfolgreich.`);
} catch (error) {
  console.error(`[${ID}] Rollback ...`);

  for (const file of affected) {
    const backupFile = path.join(
      backup,
      path.relative(root, file)
    );

    if (!fs.existsSync(backupFile)) continue;

    fs.mkdirSync(path.dirname(file), {
      recursive: true
    });

    fs.copyFileSync(backupFile, file);
  }

  console.error(`[${ID}] Rollback abgeschlossen.`);
  throw error;
}

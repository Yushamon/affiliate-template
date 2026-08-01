#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-ux-architecture-fix-25.7.4";
const args = new Set(process.argv.slice(2));
const checkOnly = args.has("--check");
const runTests = !args.has("--no-tests") && !checkOnly;

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 14; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const BACKUP = path.join(ROOT, ".patch-backups", `${NAME}-${timestamp}`);
const plans = [];

const rel = (file) => path.relative(ROOT, file).replaceAll("\\", "/");

function readRequired(relativePath) {
  const file = path.join(ROOT, relativePath);
  if (!fs.existsSync(file)) {
    throw new Error(`Pflichtdatei nicht gefunden: ${relativePath}`);
  }
  return { file, source: fs.readFileSync(file, "utf8") };
}

function planTransform(relativePath, transform, { optional = false } = {}) {
  const file = path.join(ROOT, relativePath);
  if (!fs.existsSync(file)) {
    if (optional) return;
    throw new Error(`Pflichtdatei nicht gefunden: ${relativePath}`);
  }
  const before = fs.readFileSync(file, "utf8");
  const after = transform(before, relativePath);
  if (typeof after !== "string") {
    throw new Error(`Transformation lieferte keinen Text: ${relativePath}`);
  }
  if (after !== before) plans.push({ file, before, after, existed: true });
}

function planCreate(relativePath, content) {
  const file = path.join(ROOT, relativePath);
  if (fs.existsSync(file)) {
    const before = fs.readFileSync(file, "utf8");
    if (before !== content) plans.push({ file, before, after: content, existed: true });
    return;
  }
  plans.push({ file, before: "", after: content, existed: false });
}

function replaceRequired(source, pattern, replacement, label) {
  const next = source.replace(pattern, replacement);
  if (next === source) {
    throw new Error(`${label} konnte nicht sicher aktualisiert werden.`);
  }
  return next;
}

function scopeLegacyProductLists(source) {
  let next = source;
  next = next.replaceAll(".product-detail li::before {", ".product-detail > ul > li::before {");
  next = next.replaceAll(".product-detail li {", ".product-detail > ul > li {");
  next = next.replaceAll(".product-detail ul {", ".product-detail > ul {");

  if (
    next.includes(".product-detail li::before {") ||
    next.includes(".product-detail li {") ||
    next.includes(".product-detail ul {")
  ) {
    throw new Error("Breite Legacy-Listenselektoren konnten nicht vollständig eingegrenzt werden.");
  }
  return next;
}

function transformGallery(source) {
  if (
    source.includes("height: clamp(300px, 46vw, 610px);") &&
    source.includes("grid-template-rows: minmax(0, 1fr) auto;") &&
    source.includes("object-position: center;")
  ) {
    return source;
  }

  const desiredTop = `  .px2-gallery__stage,
  .px2-gallery__empty {
    display: grid;
    place-items: center;
    height: clamp(300px, 46vw, 610px);
    min-width: 0;
    margin: 0;
    overflow: hidden;
    border: 1px solid var(--px2-border);
    border-radius: 24px;
    background:
      radial-gradient(circle at 80% 15%, color-mix(in srgb, var(--px2-green-soft) 70%, transparent), transparent 38%),
      var(--px2-surface-raised);
    box-shadow: var(--px2-shadow);
  }

  .px2-gallery__stage {
    grid-template-rows: minmax(0, 1fr) auto;
    padding: clamp(10px, 2.5vw, 24px);
  }

  .px2-gallery__stage img {
    display: block;
    width: 100%;
    height: 100%;
    min-height: 0;
    max-height: none;
    aspect-ratio: auto;
    padding: 0;
    object-fit: contain;
    object-position: center;
  }`;

  const currentTop = /  \.px2-gallery__stage,\n  \.px2-gallery__empty \{\n[\s\S]*?\n  \}\n\n  \.px2-gallery__stage img \{\n[\s\S]*?\n  \}/;
  const previousTop = /  \.px2-gallery__stage,\n  \.px2-gallery__empty \{\n[\s\S]*?\n  \}\n\n  \.px2-gallery__stage \{\n[\s\S]*?\n  \}\n\n  \.px2-gallery__stage img \{\n[\s\S]*?\n  \}/;

  let next = source;
  if (previousTop.test(next)) next = next.replace(previousTop, desiredTop);
  else if (currentTop.test(next)) next = next.replace(currentTop, desiredTop);
  else throw new Error("Gallery-Grundlayout entspricht keiner bekannten, sicher patchbaren Struktur.");

  const desiredMobile = `  @media (max-width: 720px) {
    .px2-gallery__stage,
    .px2-gallery__empty {
      height: 300px;
      border-radius: 18px;
    }

    .px2-gallery__stage {
      padding: 8px;
    }

    .px2-gallery__stage img {
      max-height: none;
      padding: 0;
    }`;

  const currentMobile = /  @media \(max-width: 720px\) \{\n    \.px2-gallery__stage,\n    \.px2-gallery__empty \{\n[\s\S]*?\n    \}\n\n    \.px2-gallery__stage img \{\n[\s\S]*?\n    \}/;
  const previousMobile = /  @media \(max-width: 720px\) \{\n    \.px2-gallery__stage,\n    \.px2-gallery__empty \{\n[\s\S]*?\n    \}\n\n    \.px2-gallery__stage \{\n[\s\S]*?\n    \}\n\n    \.px2-gallery__empty \{\n[\s\S]*?\n    \}\n\n    \.px2-gallery__stage img \{\n[\s\S]*?\n    \}/;

  if (previousMobile.test(next)) next = next.replace(previousMobile, desiredMobile);
  else if (currentMobile.test(next)) next = next.replace(currentMobile, desiredMobile);
  else throw new Error("Mobiles Gallery-Layout entspricht keiner bekannten, sicher patchbaren Struktur.");

  return next;
}

function transformHero(source) {
  if (source.includes("const suitableFor = model.suitabilitySummary;")) return source;
  let next = source;
  next = next.replace(
    /const suitableFor = model\.idealFor\[0\] \?\? model\.category;/,
    "const suitableFor = model.suitabilitySummary;"
  );
  next = next.replace(
    /const suitableFor = model\.idealFor\.slice\(0, 2\)\.join\(" · "\) \|\| model\.category;/,
    "const suitableFor = model.suitabilitySummary;"
  );
  if (!next.includes("const suitableFor = model.suitabilitySummary;")) {
    throw new Error("Hero-Eignungszusammenfassung konnte nicht zentral angebunden werden.");
  }
  return next;
}

function transformVerdict(source) {
  if (
    source.includes('.verdict__card.is-positive li::before') &&
    source.includes('content: "✓";') &&
    source.includes('.verdict__card.is-negative li::before') &&
    source.includes('content: "×";') &&
    !source.includes(".verdict__card.verdict__card li::before")
  ) {
    return source;
  }

  let next = source;

  next = next.replace(
`{buyIf.map((item) => (
          <li>
            <span class="verdict__marker" aria-hidden="true">✓</span>
            <span>{item}</span>
          </li>
        ))}`,
    `{buyIf.map((item) => <li>{item}</li>)}`
  );
  next = next.replace(
`{avoidIf.map((item) => (
          <li>
            <span class="verdict__marker" aria-hidden="true">×</span>
            <span>{item}</span>
          </li>
        ))}`,
    `{avoidIf.map((item) => <li>{item}</li>)}`
  );

  const listRegion = /  \.verdict__card ul \{[\s\S]*?\n\n  \.verdict__card li,\n/;
  const desired = `  .verdict__card ul {
    display: grid;
    gap: 7px;
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .verdict__card li {
    position: relative;
    padding-left: 1.25rem;
  }

  .verdict__card li::before {
    position: absolute;
    left: 0;
    font-weight: 950;
  }

  .verdict__card.is-positive li::before {
    color: var(--px2-green-strong);
    content: "✓";
  }

  .verdict__card.is-negative li::before {
    color: var(--px2-red);
    content: "×";
  }

  .verdict__card li,
`;

  next = replaceRequired(next, listRegion, desired, "Verdict-Listenmarker");

  if (
    next.includes(".verdict__card.verdict__card li::before") ||
    next.includes("verdict__marker")
  ) {
    throw new Error("Alte Verdict-Gegenregeln oder doppelte Marker sind noch vorhanden.");
  }
  return next;
}

const MODEL_HELPERS = `const specValueFor = (data: any, ...labels: string[]): string => {
  const normalizedLabels = labels.map(normalize);
  const match = list<any>(data?.specs).find((item) => {
    const label = normalize(item?.label);
    return normalizedLabels.some((candidate) => label === candidate || label.includes(candidate));
  });
  return text(match?.value);
};

const booleanFromSpecs = (data: any, labels: string[]): boolean | null => {
  const value = specValueFor(data, ...labels);
  if (!value) return null;
  const normalizedValue = normalize(value);
  if (["nein", "kein", "ohne", "nicht vorhanden", "nicht vorgesehen"].some((term) => normalizedValue.includes(term))) {
    return false;
  }
  return true;
};

const batteryCapabilityFromSpecs = (data: any): boolean | null => {
  const explicitBattery = specValueFor(data, "Akku", "Akkubetrieb");
  if (explicitBattery) {
    const normalizedBattery = normalize(explicitBattery);
    if (["nein", "kein", "ohne", "nicht vorhanden", "nicht vorgesehen"].some((term) => normalizedBattery.includes(term))) {
      return false;
    }
    return true;
  }

  const power = normalize(specValueFor(data, "Stromversorgung", "Netzbetrieb", "Power"));
  if (!power) return null;
  if (["backup", "notstrom", "ausfallsicherung"].some((term) => power.includes(term))) return false;
  if (["akkubetrieb", "wiederaufladbar", "kabellos", "cordless", "batteriebetrieb"].some((term) => power.includes(term))) {
    return true;
  }
  if (["netzteil", "netzbetrieb", "netzanschluss"].some((term) => power.includes(term))) return false;
  return null;
};

const foodTypesFromData = (data: any): string[] => {
  const structured = [
    ...list<string>(data.comparisonFilters?.foodType),
    ...list<string>(data.comparisonData?.general?.foodType)
  ]
    .flatMap((value) => {
      const normalized = normalize(value);
      return [
        normalized === "dry" || normalized.includes("trocken") ? "dry" : "",
        normalized === "wet" || normalized.includes("nass") || normalized.includes("feucht") ? "wet" : ""
      ];
    })
    .filter(Boolean);

  if (structured.length > 0) return [...new Set(structured)];

  const specification = normalize(specValueFor(data, "Futterart", "Futtertyp", "Futter"));
  return [
    specification.includes("trocken") ? "dry" : "",
    specification.includes("nass") || specification.includes("feucht") ? "wet" : ""
  ].filter(Boolean);
};

const joinGerman = (values: string[]): string => {
  if (values.length <= 1) return values[0] ?? "";
  if (values.length === 2) return \`\${values[0]} und \${values[1]}\`;
  return \`\${values.slice(0, -1).join(", ")} und \${values.at(-1)}\`;
};

const dogSuitabilityLabel = (petSizes: string[]): string => {
  const sizes = new Set(petSizes.map(normalize));
  const small = sizes.has("small") || sizes.has("klein");
  const medium = sizes.has("medium") || sizes.has("mittel") || sizes.has("mittelgross");
  const large = sizes.has("large") || sizes.has("gross");

  if (small && medium && !large) return "kleine bis mittelgroße Hunde";
  if (!small && medium && large) return "mittelgroße bis große Hunde";
  if (small && !medium && large) return "kleine und große Hunde";
  if (small && !medium && !large) return "kleine Hunde";
  if (!small && medium && !large) return "mittelgroße Hunde";
  if (!small && !medium && large) return "große Hunde";
  return "Hunde";
};

const buildSuitabilitySummary = (
  profile: Pick<ProductDecisionProfile, "animals" | "petSizes">,
  idealFor: string[],
  fallback: string
): string => {
  const animals = new Set(profile.animals.map(normalize));
  const labels: string[] = [];
  if (animals.has("cat")) labels.push("Katzen");
  if (animals.has("dog")) labels.push(dogSuitabilityLabel(profile.petSizes));
  if (labels.length > 0) return joinGerman(labels);

  const explicit = idealFor.find((item) => {
    const normalized = normalize(item);
    return normalized.includes("katze") || normalized.includes("hund") || normalized.includes("tier");
  });
  return explicit ?? idealFor[0] ?? fallback;
};`;

function transformModel(source) {
  let next = source;
  const decisionStart = next.indexOf("const decisionProfileFor =");
  if (decisionStart < 0) throw new Error("decisionProfileFor wurde im Produktmodell nicht gefunden.");

  const helperStart = next.indexOf("const specValueFor =");
  if (helperStart >= 0 && helperStart < decisionStart) {
    next = next.slice(0, helperStart) + MODEL_HELPERS + "\n\n" + next.slice(decisionStart);
  } else if (!next.includes("const buildSuitabilitySummary =")) {
    next = next.slice(0, decisionStart) + MODEL_HELPERS + "\n\n" + next.slice(decisionStart);
  }

  if (!next.includes("const foodTypes = usesFoodQuestions\n    ? foodTypesFromData(data)\n    : [];")) {
    const start = next.indexOf("  const foodTypes = usesFoodQuestions");
    const end = next.indexOf("\n\n  const hasWifi", start);
    if (start < 0 || end < 0) throw new Error("Futterart-Erkennung konnte nicht lokalisiert werden.");
    next = next.slice(0, start) +
`  const foodTypes = usesFoodQuestions
    ? foodTypesFromData(data)
    : [];` +
      next.slice(end);
  }

  const wifiStart = next.indexOf("  const hasWifi =");
  const cameraStart = next.indexOf("  const hasCamera =", wifiStart);
  if (wifiStart < 0 || cameraStart < 0) throw new Error("WLAN-/Kamera-Erkennung konnte nicht lokalisiert werden.");
  next = next.slice(0, wifiStart) +
`  const hasWifi = typeof data.comparisonFilters?.app === "boolean"
    ? data.comparisonFilters.app
    : booleanFromSpecs(data, ["WLAN", "WiFi", "App"])
      ?? booleanFromText(haystack, ["wlan", "wifi", "wi fi", "app steuerung"], ["ohne wlan", "ohne app"]);

` + next.slice(cameraStart);

  const cameraStartAfter = next.indexOf("  const hasCamera =", wifiStart);
  const multiStart = next.indexOf("  const supportsMultiplePets =", cameraStartAfter);
  if (cameraStartAfter < 0 || multiStart < 0) throw new Error("Kamera-Erkennung konnte nicht lokalisiert werden.");
  next = next.slice(0, cameraStartAfter) +
`  const hasCamera = typeof data.comparisonFilters?.camera === "boolean"
    ? data.comparisonFilters.camera
    : booleanFromSpecs(data, ["Kamera", "Camera"])
      ?? booleanFromText(haystack, ["kamera", "camera", "video"], ["ohne kamera", "keine kamera"]);

` + next.slice(multiStart);

  if (!next.includes("  const decisionProfile = decisionProfileFor(data, price);")) {
    const marker = "  const alternatives = intelligentAlternatives(currentEntry, allProducts, priceIndex, alternativeRecommendations);";
    if (!next.includes(marker)) throw new Error("Einfügepunkt für das zentrale Decision Profile fehlt.");
    next = next.replace(
      marker,
`  const decisionProfile = decisionProfileFor(data, price);
  const suitabilitySummary = buildSuitabilitySummary(
    decisionProfile,
    idealFor,
    text(data.category?.label ?? data.category, "Geeignete Haustiere")
  );
  const alternatives = intelligentAlternatives(currentEntry, allProducts, priceIndex, alternativeRecommendations);`
    );
  }

  next = next.replaceAll("decisionProfileFor(data, price).", "decisionProfile.");
  next = next.replace(
    /    hasBattery: [^\n]+,/,
    "    hasBattery: batteryCapabilityFromSpecs(data),"
  );
  next = next.replace(
    "    decisionProfile: decisionProfileFor(data, price),",
    "    decisionProfile,"
  );

  if (!next.includes("    suitabilitySummary,")) {
    next = replaceRequired(
      next,
      "    idealFor,\n    notFor,",
      "    idealFor,\n    suitabilitySummary,\n    notFor,",
      "Rückgabe der Eignungszusammenfassung"
    );
  }

  if (
    !next.includes("const buildSuitabilitySummary =") ||
    !next.includes("const suitabilitySummary = buildSuitabilitySummary(") ||
    !next.includes("    hasBattery: batteryCapabilityFromSpecs(data),") ||
    next.includes("decisionProfileFor(data, price).")
  ) {
    throw new Error("Zentrale Produktdatenlogik wurde nicht vollständig konsolidiert.");
  }

  return next;
}

function transformConsequences(source) {
  let next = source;

  if (!next.includes("Kein integrierter Akku:")) {
    const powerBlock = /  if \(key\.includes\("akku"\) \|\| key\.includes\("batterie"\) \|\| key\.includes\("stromversorgung"\)\) \{\n    return "Die Stromversorgung entscheidet, wie zuverlässig das Gerät bei Stromausfall oder unterwegs weiterarbeitet\.";\n  \}/;
    next = replaceRequired(
      next,
      powerBlock,
`  if (key.includes("akku")) {
    if (["nein", "kein", "ohne", "nicht vorhanden", "nicht vorgesehen"].some((term) => normalizedValue.includes(term))) {
      return "Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.";
    }
    return "Ein integrierter Akku erlaubt einen flexibleren Standort. Laufzeit, Ladezeit und Verhalten während des Ladens bleiben dabei kaufentscheidend.";
  }

  if (key.includes("batterie") || key.includes("notstrom")) {
    return "Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.";
  }

  if (key.includes("stromversorgung") || key.includes("netzteil") || key.includes("netzbetrieb")) {
    return "Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.";
  }`,
      "Unterscheidung der Stromversorgungsarten"
    );
  }

  const genericConstant = `const GENERIC_POWER_CONSEQUENCE =
  "Die Stromversorgung entscheidet, wie zuverlässig das Gerät bei Stromausfall oder unterwegs weiterarbeitet.";`;

  if (!next.includes("const GENERIC_POWER_CONSEQUENCE")) {
    next = replaceRequired(
      next,
      "\nexport const buildDecisionFacts =",
      `\n${genericConstant}\n\nexport const buildDecisionFacts =`,
      "Generische Legacy-Konsequenz"
    );
  }

  if (!next.includes("supplied === GENERIC_POWER_CONSEQUENCE")) {
    const prefix = /export const buildDecisionFacts = \(\n  data: any,\n  specs: Array<\{ label: string; value: string \}>\n\): DecisionFact\[\] => \{\n[\s\S]*?  if \(explicit\.length > 0\) return explicit\.slice\(0, 6\);\n\n  const category = text\(data\?\.category\?\.label \?\? data\?\.category\?\.key \?\? data\?\.category\);\n/;
    const replacement = `export const buildDecisionFacts = (
  data: any,
  specs: Array<{ label: string; value: string }>
): DecisionFact[] => {
  const category = text(data?.category?.label ?? data?.category?.key ?? data?.category);
  const explicit = Array.isArray(data?.decisionFacts)
    ? data.decisionFacts
        .map((item: any) => {
          const label = text(item?.label);
          const value = text(item?.value);
          const supplied = text(item?.consequence);
          const derived = implicationFor(label, value, category);
          const consequence =
            !supplied || supplied === GENERIC_POWER_CONSEQUENCE
              ? derived ?? supplied
              : supplied;
          return {
            label,
            value,
            consequence,
            source: "editorial" as const
          };
        })
        .filter((item: DecisionFact) => item.label && item.value && item.consequence)
    : [];

  if (explicit.length > 0) return explicit.slice(0, 6);

`;
    next = replaceRequired(next, prefix, replacement, "Normalisierung expliziter Decision Facts");
  }

  if (
    !next.includes("supplied === GENERIC_POWER_CONSEQUENCE") ||
    !next.includes("Batterien oder Notstrom überbrücken") ||
    !next.includes("Kein integrierter Akku:")
  ) {
    throw new Error("Decision-Fact-Konsequenzen wurden nicht vollständig differenziert.");
  }

  return next;
}

planTransform("packages/affiliate-core/src/styles/product.css", scopeLegacyProductLists);
planTransform("apps/pfotentechnik/src/styles/pfotentechnik.css", scopeLegacyProductLists, { optional: true });
planTransform(
  "apps/pfotentechnik/src/components/product-experience-2/ProductGallery2.astro",
  transformGallery
);
planTransform(
  "apps/pfotentechnik/src/components/product-experience-2/ProductHero2.astro",
  transformHero
);
planTransform(
  "apps/pfotentechnik/src/components/product-experience-2/ProductVerdict2.astro",
  transformVerdict
);
planTransform(
  "apps/pfotentechnik/src/domain/productExperience/model.ts",
  transformModel
);
planTransform(
  "apps/pfotentechnik/src/domain/productExperience/consequences.ts",
  transformConsequences
);

const testPath = "apps/pfotentechnik/test/product-ux-architecture-25.7.4.test.mjs";
const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const COMPONENTS = path.join(APP, "src", "components", "product-experience-2");
const DOMAIN = path.join(APP, "src", "domain", "productExperience");

const read = (file) => fs.readFileSync(file, "utf8");
const component = (name) => read(path.join(COMPONENTS, name));

test("Legacy-Produktlisten wirken nur auf direkte alte Inhaltslisten", () => {
  const files = [
    path.join(ROOT, "packages", "affiliate-core", "src", "styles", "product.css"),
    path.join(APP, "src", "styles", "pfotentechnik.css")
  ].filter(fs.existsSync);
  const css = files.map(read).join("\\n");
  assert.doesNotMatch(css, /\\.product-detail\\s+li::before\\s*\\{/);
  assert.doesNotMatch(css, /\\.product-detail\\s+li\\s*\\{/);
  assert.doesNotMatch(css, /\\.product-detail\\s+ul\\s*\\{/);
  assert.match(css, /\\.product-detail\\s*>\\s*ul\\s*>\\s*li::before\\s*\\{/);
});

test("Verdict besitzt seine Marker selbst und verwendet keine Gegenregel", () => {
  const source = component("ProductVerdict2.astro");
  assert.match(source, /is-positive li::before[\\s\\S]*content:\\s*"✓"/);
  assert.match(source, /is-negative li::before[\\s\\S]*content:\\s*"×"/);
  assert.doesNotMatch(source, /verdict__card\\.verdict__card li::before/);
  assert.doesNotMatch(source, /verdict__marker/);
});

test("Timeline und Produkt-Fit benötigen keine Marker-Resets", () => {
  assert.doesNotMatch(component("ProductEverydayTimeline.astro"), /timeline\\.timeline li::before/);
  assert.doesNotMatch(component("ProductCategoryFitAssistant.astro"), /category-fit\\.category-fit li::before/);
});

test("Gallery begrenzt die Bildfläche und zeigt das ganze Motiv", () => {
  const source = component("ProductGallery2.astro");
  assert.match(source, /height:\\s*clamp\\(300px, 46vw, 610px\\)/);
  assert.match(source, /grid-template-rows:\\s*minmax\\(0, 1fr\\) auto/);
  assert.match(source, /height:\\s*100%/);
  assert.match(source, /object-fit:\\s*contain/);
  assert.match(source, /object-position:\\s*center/);
});

test("Hero nutzt die zentral berechnete Eignungszusammenfassung", () => {
  const source = component("ProductHero2.astro");
  assert.match(source, /model\\.suitabilitySummary/);
  assert.doesNotMatch(source, /idealFor\\[0\\]|idealFor\\.slice/);
});

test("Produktmodell leitet Eignung und technische Fähigkeiten strukturiert ab", () => {
  const source = read(path.join(DOMAIN, "model.ts"));
  assert.match(source, /const buildSuitabilitySummary =/);
  assert.match(source, /kleine bis mittelgroße Hunde/);
  assert.match(source, /foodTypesFromData/);
  assert.match(source, /booleanFromSpecs/);
  assert.match(source, /batteryCapabilityFromSpecs/);
  assert.match(source, /const decisionProfile = decisionProfileFor\\(data, price\\)/);
  assert.doesNotMatch(source, /decisionProfileFor\\(data, price\\)\\./);
});

test("Akku, Backup-Batterie und Netzbetrieb erhalten unterschiedliche Folgen", () => {
  const source = read(path.join(DOMAIN, "consequences.ts"));
  assert.match(source, /Kein integrierter Akku:/);
  assert.match(source, /Batterien oder Notstrom überbrücken/);
  assert.match(source, /am Netz, kabellos oder nur mit einer Backup-Lösung/);
  assert.match(source, /supplied === GENERIC_POWER_CONSEQUENCE/);
  assert.doesNotMatch(source, /key\\.includes\\("akku"\\) \\|\\| key\\.includes\\("batterie"\\)/);
});
`;

planCreate(testPath, testSource);

console.log(`[${NAME}] Vorprüfung erfolgreich.`);
if (plans.length === 0) {
  console.log(`[${NAME}] Keine Änderungen nötig.`);
  process.exit(0);
}

for (const plan of plans) {
  console.log(`[${NAME}] ${checkOnly ? "Würde ändern" : plan.existed ? "Ändert" : "Erstellt"}: ${rel(plan.file)}`);
}

if (checkOnly) {
  console.log(`[${NAME}] Check abgeschlossen. Es wurde nichts geschrieben.`);
  process.exit(0);
}

fs.mkdirSync(BACKUP, { recursive: true });
for (const plan of plans) {
  if (plan.existed) {
    const backupFile = path.join(BACKUP, rel(plan.file));
    fs.mkdirSync(path.dirname(backupFile), { recursive: true });
    fs.writeFileSync(backupFile, plan.before, "utf8");
  }
}

for (const plan of plans) {
  fs.mkdirSync(path.dirname(plan.file), { recursive: true });
  fs.writeFileSync(plan.file, plan.after, "utf8");
}

fs.writeFileSync(
  path.join(BACKUP, "manifest.json"),
  JSON.stringify(
    {
      name: NAME,
      createdAt: new Date().toISOString(),
      files: plans.map((plan) => ({ path: rel(plan.file), existed: plan.existed }))
    },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log(`[${NAME}] Backup: ${rel(BACKUP)}`);

if (runTests) {
  execFileSync(
    process.execPath,
    ["--experimental-strip-types", "--test", testPath],
    { cwd: ROOT, stdio: "inherit" }
  );

  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  for (const script of [
    "test:product-standard-3",
    "test:product-ux-cleanup",
    "test:css-product-system"
  ]) {
    execFileSync(
      npm,
      ["--workspace", "apps/pfotentechnik", "run", script],
      { cwd: ROOT, stdio: "inherit" }
    );
  }
}

console.log(`[${NAME}] Fertig.`);
console.log(`[${NAME}] Danach: npm --workspace apps/pfotentechnik run build`);

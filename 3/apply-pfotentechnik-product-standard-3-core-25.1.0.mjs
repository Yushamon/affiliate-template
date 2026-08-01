#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-standard-3-core-25.1.0";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-")
);

const files = {"apps/pfotentechnik/src/domain/productExperience/consequences.ts": "type DecisionFact = {\n  label: string;\n  value: string;\n  consequence: string;\n  source: \"product-data\" | \"technical-specification\" | \"editorial\";\n};\n\nconst text = (value: unknown): string => {\n  if (typeof value === \"string\") return value.trim();\n  if (typeof value === \"number\" || typeof value === \"boolean\") return String(value);\n  return \"\";\n};\n\nconst normalize = (value: unknown): string =>\n  text(value)\n    .toLocaleLowerCase(\"de-DE\")\n    .replaceAll(\"ä\", \"ae\")\n    .replaceAll(\"ö\", \"oe\")\n    .replaceAll(\"ü\", \"ue\")\n    .replaceAll(\"ß\", \"ss\")\n    .replace(/[^a-z0-9]+/g, \" \")\n    .trim();\n\nconst implicationFor = (\n  label: string,\n  value: string,\n  category: string\n): string | null => {\n  const key = normalize(label);\n  const normalizedValue = normalize(value);\n  const normalizedCategory = normalize(category);\n\n  if (key.includes(\"kapazitaet\") || key.includes(\"volumen\")) {\n    if (normalizedCategory.includes(\"futter\")) {\n      return \"Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.\";\n    }\n    if (normalizedCategory.includes(\"trink\") || normalizedCategory.includes(\"brunnen\")) {\n      return \"Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.\";\n    }\n    return \"Die Größe beeinflusst, wie häufig nachgefüllt oder gewartet werden muss.\";\n  }\n\n  if (key.includes(\"app\") || key.includes(\"wlan\") || key.includes(\"wifi\")) {\n    if ([\"ja\", \"vorhanden\", \"app\", \"wlan app\", \"mit app\"].some((term) => normalizedValue.includes(term))) {\n      return \"Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.\";\n    }\n    if ([\"nein\", \"ohne\", \"nicht vorhanden\"].some((term) => normalizedValue.includes(term))) {\n      return \"Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.\";\n    }\n  }\n\n  if (key.includes(\"kamera\")) {\n    if ([\"ja\", \"vorhanden\", \"integriert\"].some((term) => normalizedValue.includes(term))) {\n      return \"Du kannst nicht nur die Geräteaktion, sondern auch die Situation am Napf oder Aufenthaltsort kontrollieren.\";\n    }\n    if ([\"nein\", \"ohne\"].some((term) => normalizedValue.includes(term))) {\n      return \"Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.\";\n    }\n  }\n\n  if (key.includes(\"akku\") || key.includes(\"batterie\") || key.includes(\"stromversorgung\")) {\n    return \"Die Stromversorgung entscheidet, wie zuverlässig das Gerät bei Stromausfall oder unterwegs weiterarbeitet.\";\n  }\n\n  if (key.includes(\"material\")) {\n    if (normalizedValue.includes(\"edelstahl\")) {\n      return \"Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.\";\n    }\n    if (normalizedValue.includes(\"keramik\")) {\n      return \"Keramik ist schwer und standfest, kann bei Stößen aber beschädigt werden.\";\n    }\n    if (normalizedValue.includes(\"kunststoff\")) {\n      return \"Kunststoff ist leicht, sollte wegen Kratzern und Geruchsaufnahme besonders gründlich kontrolliert werden.\";\n    }\n  }\n\n  if (key.includes(\"gewicht\")) {\n    if (normalizedCategory.includes(\"gps\") || normalizedCategory.includes(\"tracker\")) {\n      return \"Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.\";\n    }\n    return \"Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.\";\n  }\n\n  if (key.includes(\"abmess\") || key.includes(\"groesse\") || key.includes(\"durchgang\")) {\n    return \"Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.\";\n  }\n\n  if (key.includes(\"filter\")) {\n    return \"Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.\";\n  }\n\n  if (key.includes(\"laut\") || key.includes(\"geraeusch\")) {\n    return \"Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.\";\n  }\n\n  if (key.includes(\"portion\")) {\n    return \"Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.\";\n  }\n\n  if (key.includes(\"abo\") || key.includes(\"monat\") || key.includes(\"laufende kosten\")) {\n    return \"Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.\";\n  }\n\n  if (key.includes(\"schutz\") || key.includes(\"wasserdicht\") || key.includes(\"ip\")) {\n    return \"Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.\";\n  }\n\n  return null;\n};\n\nexport const buildDecisionFacts = (\n  data: any,\n  specs: Array<{ label: string; value: string }>\n): DecisionFact[] => {\n  const explicit = Array.isArray(data?.decisionFacts)\n    ? data.decisionFacts\n        .map((item: any) => ({\n          label: text(item?.label),\n          value: text(item?.value),\n          consequence: text(item?.consequence),\n          source: \"editorial\" as const\n        }))\n        .filter((item: DecisionFact) => item.label && item.value && item.consequence)\n    : [];\n\n  if (explicit.length > 0) return explicit.slice(0, 6);\n\n  const category = text(data?.category?.label ?? data?.category?.key ?? data?.category);\n  const output: DecisionFact[] = [];\n  const seen = new Set<string>();\n\n  for (const spec of specs) {\n    const consequence = implicationFor(spec.label, spec.value, category);\n    if (!consequence) continue;\n    const key = normalize(spec.label);\n    if (seen.has(key)) continue;\n    seen.add(key);\n    output.push({\n      label: spec.label,\n      value: spec.value,\n      consequence,\n      source: \"technical-specification\"\n    });\n    if (output.length >= 6) break;\n  }\n\n  return output;\n};\n\nexport type { DecisionFact };\n", "apps/pfotentechnik/src/components/product-experience-2/ProductDecisionFacts2.astro": "---\ninterface DecisionFact {\n  label: string;\n  value: string;\n  consequence: string;\n  source: \"product-data\" | \"technical-specification\" | \"editorial\";\n}\n\ninterface Props {\n  facts?: DecisionFact[];\n}\n\nconst { facts = [] } = Astro.props;\n---\n\n{facts.length > 0 && (\n  <section class=\"decision-facts\" aria-labelledby=\"decision-facts-title\">\n    <header>\n      <span>Eigenschaft und Konsequenz</span>\n      <h2 id=\"decision-facts-title\">Was die technischen Daten im Alltag bedeuten</h2>\n    </header>\n\n    <dl>\n      {facts.map((fact) => (\n        <div>\n          <dt>\n            <span>{fact.label}</span>\n            <strong>{fact.value}</strong>\n          </dt>\n          <dd>{fact.consequence}</dd>\n        </div>\n      ))}\n    </dl>\n  </section>\n)}\n\n<style>\n  .decision-facts {\n    display: grid;\n    gap: 14px;\n    padding: 16px;\n    border: 1px solid var(--px2-border);\n    border-radius: 20px;\n    background: var(--px2-surface);\n    box-shadow: var(--px2-shadow);\n  }\n\n  .decision-facts header span {\n    color: var(--px2-green-strong);\n    font-size: .74rem;\n    font-weight: 850;\n    letter-spacing: .07em;\n    text-transform: uppercase;\n  }\n\n  .decision-facts h2 {\n    margin: 5px 0 0;\n    font-size: clamp(1.4rem, 6vw, 2rem);\n    letter-spacing: -.025em;\n  }\n\n  .decision-facts dl {\n    display: grid;\n    gap: 10px;\n    margin: 0;\n  }\n\n  .decision-facts dl > div {\n    display: grid;\n    gap: 9px;\n    min-width: 0;\n    padding: 14px;\n    border: 1px solid var(--px2-border);\n    border-radius: 15px;\n    background: var(--px2-surface-raised);\n  }\n\n  .decision-facts dt {\n    display: grid;\n    gap: 3px;\n    min-width: 0;\n  }\n\n  .decision-facts dt span {\n    color: var(--px2-muted);\n    font-size: .73rem;\n    font-weight: 850;\n    letter-spacing: .045em;\n    text-transform: uppercase;\n  }\n\n  .decision-facts dt strong {\n    color: var(--px2-text);\n    font-size: 1rem;\n    overflow-wrap: anywhere;\n  }\n\n  .decision-facts dd {\n    margin: 0;\n    color: var(--px2-muted);\n    font-size: .9rem;\n    line-height: 1.5;\n  }\n\n  @media (min-width: 720px) {\n    .decision-facts {\n      padding: 22px;\n    }\n\n    .decision-facts dl {\n      grid-template-columns: 1fr 1fr;\n    }\n  }\n\n  @media (min-width: 1040px) {\n    .decision-facts dl {\n      grid-template-columns: repeat(3, minmax(0, 1fr));\n    }\n  }\n</style>\n", "apps/pfotentechnik/src/components/product-experience-2/ProductPurchaseMistakes2.astro": "---\ninterface PurchaseMistake {\n  title: string;\n  reason: string;\n  betterChoice?: {\n    label: string;\n    href: string;\n  } | null;\n}\n\ninterface Props {\n  items?: PurchaseMistake[];\n}\n\nconst { items = [] } = Astro.props;\n---\n\n{items.length > 0 && (\n  <section class=\"purchase-mistakes\" aria-labelledby=\"purchase-mistakes-title\">\n    <header>\n      <span>Typische Fehlkäufe vermeiden</span>\n      <h2 id=\"purchase-mistakes-title\">Wann dieses Produkt die falsche Wahl ist</h2>\n    </header>\n\n    <div class=\"purchase-mistakes__grid\">\n      {items.slice(0, 3).map((item) => (\n        <article>\n          <h3>{item.title}</h3>\n          <p>{item.reason}</p>\n          {item.betterChoice && (\n            <a href={item.betterChoice.href}>\n              {item.betterChoice.label}\n              <span aria-hidden=\"true\">→</span>\n            </a>\n          )}\n        </article>\n      ))}\n    </div>\n  </section>\n)}\n\n<style>\n  .purchase-mistakes {\n    display: grid;\n    gap: 14px;\n    padding: 16px;\n    border: 1px solid var(--px2-border);\n    border-radius: 20px;\n    background: var(--px2-red-soft);\n  }\n\n  .purchase-mistakes header span {\n    color: var(--px2-red);\n    font-size: .74rem;\n    font-weight: 850;\n    letter-spacing: .07em;\n    text-transform: uppercase;\n  }\n\n  .purchase-mistakes h2 {\n    margin: 5px 0 0;\n    font-size: clamp(1.4rem, 6vw, 2rem);\n    letter-spacing: -.025em;\n  }\n\n  .purchase-mistakes__grid {\n    display: grid;\n    gap: 10px;\n  }\n\n  .purchase-mistakes article {\n    min-width: 0;\n    padding: 14px;\n    border: 1px solid var(--px2-border);\n    border-radius: 15px;\n    background: var(--px2-surface);\n  }\n\n  .purchase-mistakes h3 {\n    margin: 0 0 7px;\n    font-size: 1rem;\n  }\n\n  .purchase-mistakes p {\n    margin: 0;\n    color: var(--px2-muted);\n    font-size: .9rem;\n    line-height: 1.5;\n  }\n\n  .purchase-mistakes a {\n    display: inline-flex;\n    gap: 7px;\n    margin-top: 10px;\n    color: var(--px2-green-strong);\n    font-weight: 850;\n    text-underline-offset: 3px;\n  }\n\n  @media (min-width: 720px) {\n    .purchase-mistakes {\n      padding: 22px;\n    }\n\n    .purchase-mistakes__grid {\n      grid-template-columns: repeat(3, minmax(0, 1fr));\n    }\n  }\n</style>\n", "apps/pfotentechnik/test/product-standard-3-core-25.1.0.test.mjs": "import test from \"node:test\";\nimport assert from \"node:assert/strict\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport { fileURLToPath } from \"node:url\";\n\nconst ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), \"../../..\");\nconst APP = path.join(ROOT, \"apps\", \"pfotentechnik\");\nconst COMPONENTS = path.join(APP, \"src\", \"components\", \"product-experience-2\");\nconst DOMAIN = path.join(APP, \"src\", \"domain\", \"productExperience\");\n\nconst readComponent = (name) => fs.readFileSync(path.join(COMPONENTS, name), \"utf8\");\nconst readDomain = (name) => fs.readFileSync(path.join(DOMAIN, name), \"utf8\");\n\ntest(\"Decision Facts werden vor Nutzung und Fit ausgespielt\", () => {\n  const source = readComponent(\"ProductExperience2.astro\");\n  const facts = source.indexOf(\"<ProductDecisionFacts2\");\n  const usage = source.indexOf(\"<ProductEverydayTimeline\");\n  const fit = source.indexOf(\"<ProductDecisionAssistant\");\n  assert.ok(facts >= 0);\n  assert.ok(facts < usage);\n  assert.ok(facts < fit);\n});\n\ntest(\"Fehlkäufe erscheinen nur mit expliziten Daten\", () => {\n  const source = readDomain(\"model.ts\");\n  assert.match(source, /data\\.purchaseMistakes/);\n  assert.doesNotMatch(source, /purchaseMistakes\\s*=\\s*model\\.notFor/);\n});\n\ntest(\"Konsequenzen werden aus technischen Daten abgeleitet\", () => {\n  const source = readDomain(\"consequences.ts\");\n  assert.match(source, /buildDecisionFacts/);\n  assert.match(source, /Kapazität|kapazitaet/i);\n  assert.match(source, /App|WLAN/);\n  assert.match(source, /material/i);\n  assert.match(source, /gesamtkosten/i);\n});\n\ntest(\"Neue Komponenten sind mobile-first, dark-mode-tokenbasiert und ohne important\", () => {\n  for (const name of [\"ProductDecisionFacts2.astro\", \"ProductPurchaseMistakes2.astro\"]) {\n    const source = readComponent(name);\n    assert.doesNotMatch(source, /!important/);\n    assert.doesNotMatch(source, /#[0-9a-f]{3,8}\\b/i);\n    assert.match(source, /@media \\(min-width:/);\n    assert.doesNotMatch(source, /@media \\(max-width:/);\n  }\n});\n\ntest(\"Decision Facts erklären Konsequenzen statt nur Daten zu wiederholen\", () => {\n  const source = readComponent(\"ProductDecisionFacts2.astro\");\n  assert.match(source, /Was die technischen Daten im Alltag bedeuten/);\n  assert.match(source, /\\{fact\\.consequence\\}/);\n});\n\ntest(\"Fehlkauf-Bereich begrenzt sich auf drei Fälle\", () => {\n  const source = readComponent(\"ProductPurchaseMistakes2.astro\");\n  assert.match(source, /items\\.slice\\(0,\\s*3\\)/);\n});\n"};

function backup(target) {
  if (!fs.existsSync(target)) return;
  const relative = path.relative(ROOT, target);
  const destination = path.join(BACKUP, relative);
  fs.mkdirSync(path.dirname(destination), { recursive: true });
  fs.copyFileSync(target, destination);
}

for (const [relative, content] of Object.entries(files)) {
  const target = path.join(ROOT, relative);
  backup(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  console.log("[" + NAME + "] Geschrieben: " + relative);
}

const modelPath = path.join(ROOT, "apps", "pfotentechnik", "src", "domain", "productExperience", "model.ts");
backup(modelPath);
let model = fs.readFileSync(modelPath, "utf8");

if (!model.includes('from "./consequences"')) {
  const importMarker = 'import { uniqueTextItems } from "./contentLists.ts";';
  if (!model.includes(importMarker)) throw new Error("Importanker in model.ts nicht gefunden.");
  model = model.replace(
    importMarker,
    importMarker + '\nimport { buildDecisionFacts } from "./consequences";'
  );
}

if (!model.includes("const decisionFacts = buildDecisionFacts")) {
  const marker = "  const rawCommunity = data.communityInsights ?? {};";
  const index = model.indexOf(marker);
  if (index < 0) throw new Error("Community-Anker in model.ts nicht gefunden.");
  model = model.slice(0, index) + "\n  const decisionFacts = buildDecisionFacts(data, list<any>(data.specs)\n    .map((item) => ({ label: text(item?.label), value: text(item?.value) }))\n    .filter((item) => item.label && item.value));\n\n  const purchaseMistakes = list<any>(data.purchaseMistakes)\n    .map((item) => {\n      const title = text(item?.title);\n      const reason = text(item?.reason);\n      const betterChoiceLabel = text(item?.betterChoice?.label);\n      const betterChoiceHref = text(item?.betterChoice?.href);\n      if (!title || !reason) return null;\n      return {\n        title,\n        reason,\n        betterChoice: betterChoiceLabel && betterChoiceHref\n          ? { label: betterChoiceLabel, href: betterChoiceHref }\n          : null\n      };\n    })\n    .filter(Boolean);\n" + "\n" + model.slice(index);
}

if (!model.includes("    decisionFacts,")) {
  const marker = "    evidenceSummary,";
  const index = model.indexOf(marker);
  if (index < 0) throw new Error("Return-Anker evidenceSummary nicht gefunden.");
  model = model.slice(0, index) + "    decisionFacts,\n    purchaseMistakes,\n" + model.slice(index);
}

fs.writeFileSync(modelPath, model);
console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, modelPath));

const experiencePath = path.join(ROOT, "apps", "pfotentechnik", "src", "components", "product-experience-2", "ProductExperience2.astro");
backup(experiencePath);
let experience = fs.readFileSync(experiencePath, "utf8");

if (!experience.includes('ProductDecisionFacts2')) {
  const importMarker = 'import ProductCommunityInsights2 from "./ProductCommunityInsights2.astro";';
  if (!experience.includes(importMarker)) throw new Error("Importanker in ProductExperience2.astro nicht gefunden.");
  experience = experience.replace(
    importMarker,
    importMarker + '\nimport ProductDecisionFacts2 from "./ProductDecisionFacts2.astro";\nimport ProductPurchaseMistakes2 from "./ProductPurchaseMistakes2.astro";'
  );
}

if (!experience.includes("<ProductDecisionFacts2")) {
  const renderMarker = "  <ProductCommunityInsights2 insights={model.communityInsights} />";
  if (!experience.includes(renderMarker)) throw new Error("Renderanker Community nicht gefunden.");
  experience = experience.replace(
    renderMarker,
    renderMarker + '\n  <ProductDecisionFacts2 facts={model.decisionFacts} />\n  <ProductPurchaseMistakes2 items={model.purchaseMistakes} />'
  );
}

fs.writeFileSync(experiencePath, experience);
console.log("[" + NAME + "] Geändert: " + path.relative(ROOT, experiencePath));

const testPath = path.join(ROOT, "apps", "pfotentechnik", "test", "product-standard-3-core-25.1.0.test.mjs");
execFileSync(process.execPath, ["--test", testPath], { cwd: ROOT, stdio: "inherit" });

console.log("[" + NAME + "] Fertig.");
console.log("[" + NAME + "] Danach:");
console.log("npm --workspace apps/pfotentechnik run test:product-experience-2");
console.log("npm --workspace apps/pfotentechnik run build");

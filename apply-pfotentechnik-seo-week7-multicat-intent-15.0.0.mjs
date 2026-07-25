#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";

const PATCH = "pfotentechnik-seo-week7-multicat-intent-15.0.0";
const CHECK = process.argv.includes("--check");

function findRepoRoot(start) {
  let current = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "package.json"))
    ) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Root mit apps/pfotentechnik nicht gefunden.");
}

const root = findRepoRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const changed = new Map();

const normalizeText = (value) =>
  String(value)
    .replace(/^\uFEFF/, "")
    .replace(/\r\n?/g, "\n");

const rel = (file) => path.relative(root, file).replaceAll("\\", "/");

function read(file) {
  if (!fs.existsSync(file)) {
    throw new Error(`Datei fehlt: ${rel(file)}`);
  }
  return normalizeText(fs.readFileSync(file, "utf8"));
}

function stage(file, content) {
  const next = normalizeText(content);
  const old = fs.existsSync(file) ? read(file) : null;
  if (old !== next) changed.set(file, { old, next });
}

function splitDocument(text) {
  const match = normalizeText(text).match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error("Markdown-Frontmatter konnte nicht getrennt werden.");
  return { frontmatter: match[1], body: match[2] };
}

function joinDocument(frontmatter, body) {
  return `---\n${frontmatter.trimEnd()}\n---\n\n${body.trim()}\n`;
}

function setTopLevelScalar(text, key, value) {
  const { frontmatter, body } = splitDocument(text);
  const lines = frontmatter.split("\n");
  const index = lines.findIndex((line) => line.startsWith(`${key}:`));
  if (index < 0) throw new Error(`Top-Level-Feld ${key} nicht gefunden.`);
  lines[index] = `${key}: ${JSON.stringify(value)}`;
  return joinDocument(lines.join("\n"), body);
}

function topLevelBlockRange(lines, key) {
  const start = lines.findIndex((line) => line === `${key}:`);
  if (start < 0) return null;
  let end = start + 1;
  while (
    end < lines.length &&
    (lines[end].startsWith(" ") || lines[end].trim() === "")
  ) {
    end += 1;
  }
  return { start, end };
}

function setNestedScalar(text, blockName, key, value) {
  const { frontmatter, body } = splitDocument(text);
  const lines = frontmatter.split("\n");
  const range = topLevelBlockRange(lines, blockName);
  if (!range) throw new Error(`${blockName}-Block nicht gefunden.`);

  const block = lines.slice(range.start, range.end);
  const index = block.findIndex((line) =>
    new RegExp(`^  ${key}:`).test(line)
  );

  if (index >= 0) {
    block[index] = `  ${key}: ${JSON.stringify(value)}`;
  } else {
    while (block.length > 1 && block.at(-1).trim() === "") block.pop();
    block.push(`  ${key}: ${JSON.stringify(value)}`);
  }

  lines.splice(range.start, range.end - range.start, ...block);
  return joinDocument(lines.join("\n"), body);
}

function setNestedBoolean(text, blockName, key, value) {
  const { frontmatter, body } = splitDocument(text);
  const lines = frontmatter.split("\n");
  const range = topLevelBlockRange(lines, blockName);
  if (!range) throw new Error(`${blockName}-Block nicht gefunden.`);

  const block = lines.slice(range.start, range.end);
  const index = block.findIndex((line) =>
    new RegExp(`^  ${key}:`).test(line)
  );

  const output = `  ${key}: ${value ? "true" : "false"}`;
  if (index >= 0) block[index] = output;
  else block.push(output);

  lines.splice(range.start, range.end - range.start, ...block);
  return joinDocument(lines.join("\n"), body);
}

function setNestedBlockScalar(text, parent, child, key, value, raw = false) {
  const { frontmatter, body } = splitDocument(text);
  const lines = frontmatter.split("\n");
  const parentRange = topLevelBlockRange(lines, parent);
  if (!parentRange) throw new Error(`${parent}-Block nicht gefunden.`);

  const childStart = lines.findIndex(
    (line, index) =>
      index > parentRange.start &&
      index < parentRange.end &&
      line === `  ${child}:`
  );
  if (childStart < 0) {
    throw new Error(`${parent}.${child}-Block nicht gefunden.`);
  }

  let childEnd = childStart + 1;
  while (
    childEnd < parentRange.end &&
    (lines[childEnd].startsWith("    ") || lines[childEnd].trim() === "")
  ) {
    childEnd += 1;
  }

  const index = lines.findIndex(
    (line, cursor) =>
      cursor > childStart &&
      cursor < childEnd &&
      new RegExp(`^    ${key}:`).test(line)
  );

  const output = `    ${key}: ${raw ? value : JSON.stringify(value)}`;
  if (index >= 0) {
    lines[index] = output;
  } else {
    lines.splice(childEnd, 0, output);
  }

  return joinDocument(lines.join("\n"), body);
}

function replaceRequired(text, search, replacement, label) {
  if (text.includes(replacement)) return text;
  if (!text.includes(search)) throw new Error(`${label}: Anker nicht gefunden.`);
  return text.replace(search, replacement);
}

function insertBodySection(text, heading, section, preferredMarkers) {
  if (text.includes(heading)) return text;

  const { frontmatter, body } = splitDocument(text);
  let position = -1;

  for (const marker of preferredMarkers) {
    position = body.indexOf(marker);
    if (position >= 0) break;
  }

  const nextBody = position >= 0
    ? `${body.slice(0, position).trimEnd()}\n\n${section.trim()}\n\n${body.slice(position).trimStart()}`
    : `${body.trimEnd()}\n\n${section.trim()}\n`;

  return joinDocument(frontmatter, nextBody);
}

function updateCard(text, title, values) {
  const { frontmatter, body } = splitDocument(text);
  const lines = frontmatter.split("\n");
  const titleIndex = lines.findIndex((line) =>
    line.trim() === `title: ${JSON.stringify(title)}`
  );
  if (titleIndex < 0) throw new Error(`Karte nicht gefunden: ${title}`);

  const titleIndent = lines[titleIndex].match(/^\s*/)?.[0].length ?? 0;
  const itemIndent = titleIndent - 2;
  let start = titleIndex;

  while (start >= 0) {
    const line = lines[start];
    if (
      line.match(/^\s*-\s+/) &&
      (line.match(/^\s*/)?.[0].length ?? 0) === itemIndent
    ) {
      break;
    }
    start -= 1;
  }
  if (start < 0) throw new Error(`Kartenanfang nicht gefunden: ${title}`);

  let end = start + 1;
  while (end < lines.length) {
    const line = lines[end];
    if (
      line.match(/^\s*-\s+/) &&
      (line.match(/^\s*/)?.[0].length ?? 0) === itemIndent
    ) {
      break;
    }
    if (
      line.trim() &&
      (line.match(/^\s*/)?.[0].length ?? 0) < itemIndent
    ) {
      break;
    }
    end += 1;
  }

  const directIndent = " ".repeat(itemIndent + 2);
  const keys = new Set(Object.keys(values));
  const seen = new Set();
  const nextBlock = [];

  for (let index = start; index < end; index += 1) {
    const line = lines[index];
    const rest = line.startsWith(directIndent)
      ? line.slice(directIndent.length)
      : "";
    const key = rest.match(/^([A-Za-z][A-Za-z0-9_-]*):/)?.[1];

    if (key && keys.has(key)) {
      if (!seen.has(key)) {
        nextBlock.push(`${directIndent}${key}: ${JSON.stringify(values[key])}`);
        seen.add(key);
      }
      continue;
    }
    nextBlock.push(line);
  }

  for (const [key, value] of Object.entries(values)) {
    if (!seen.has(key)) {
      nextBlock.push(`${directIndent}${key}: ${JSON.stringify(value)}`);
    }
  }

  lines.splice(start, end - start, ...nextBlock);
  return joinDocument(lines.join("\n"), body);
}

function findDuplicateCardNavigation(frontmatter) {
  const lines = frontmatter.split("\n");
  const duplicates = [];

  for (let index = 0; index < lines.length; index += 1) {
    const item = lines[index].match(/^(\s*)-\s+(?:label|title):\s+/);
    if (!item) continue;

    const itemIndent = item[1].length;
    const directIndent = " ".repeat(itemIndent + 2);
    const seen = new Map();

    let end = index + 1;
    while (end < lines.length) {
      const line = lines[end];
      const sibling = line.match(/^(\s*)-\s+/);
      if (sibling && sibling[1].length === itemIndent) break;
      if (
        line.trim() &&
        (line.match(/^\s*/)?.[0].length ?? 0) < itemIndent
      ) break;

      if (line.startsWith(directIndent)) {
        const rest = line.slice(directIndent.length);
        if (!/^\s/.test(rest)) {
          const key = rest.match(/^([A-Za-z][A-Za-z0-9_-]*):/)?.[1];
          if (key === "href" || key === "cta") {
            if (seen.has(key)) {
              duplicates.push({
                key,
                firstLine: seen.get(key) + 1,
                duplicateLine: end + 1
              });
            } else {
              seen.set(key, end);
            }
          }
        }
      }
      end += 1;
    }
    index = end - 1;
  }

  return duplicates;
}

function ensureFaq(text, question, answer) {
  if (text.includes(`question: ${JSON.stringify(question)}`)) return text;

  const { frontmatter, body } = splitDocument(text);
  const lines = frontmatter.split("\n");
  const faqRange = topLevelBlockRange(lines, "faq");
  if (!faqRange) throw new Error("FAQ-Block nicht gefunden.");

  const insertAt = faqRange.end;
  lines.splice(
    insertAt,
    0,
    `  - question: ${JSON.stringify(question)}`,
    `    answer: ${JSON.stringify(answer)}`
  );
  return joinDocument(lines.join("\n"), body);
}

const files = {
  guide: path.join(app, "src", "content", "pages", "futterautomat-fuer-zwei-katzen.md"),
  comparison: path.join(app, "src", "content", "comparisons", "beste-futterautomaten-fuer-zwei-katzen.md"),
  multi: path.join(app, "src", "content", "pages", "beste-futterautomaten-fuer-mehrtierhaushalte.md"),
  hub: path.join(app, "src", "content", "pages", "smarte-futterautomaten.md"),
  packageJson: path.join(app, "package.json"),
  audit: path.join(app, "scripts", "seo", "audit-week7-multicat-intent.mjs")
};

// 1) Rankender Ratgeber: Bauart- und Problemlösungs-Intent.
{
  let text = read(files.guide);
  text = setTopLevelScalar(
    text,
    "seoTitle",
    "Futterautomat für 2 Katzen: 1 Gerät, 2 Näpfe oder Chip?"
  );
  text = setTopLevelScalar(
    text,
    "seoDescription",
    "Futterautomat für zwei Katzen richtig wählen: Doppelschale, zwei Geräte oder Mikrochip – nach Futterklau, Diät, Fresstempo und Futterart."
  );
  text = setTopLevelScalar(text, "updatedAt", "2026-07-25");

  text = replaceRequired(
    text,
    "## Futterautomat für zwei Katzen: die schnelle Entscheidung",
    "## Doppelschale, zwei Automaten oder Mikrochip?",
    "Guide-Entscheidungsheading"
  );

  text = insertBodySection(
    text,
    "## Mehr als zwei Tiere oder Hund und Katze?",
    `## Mehr als zwei Tiere oder Hund und Katze?

Dieser Ratgeber ist bewusst auf **zwei Katzen** zugeschnitten. Für Haushalte mit mehreren Katzen, mehreren Hunden oder einer Mischung aus Hund und Katze gelten zusätzliche Anforderungen an Napfhöhe, Futterart, Standort und Zugang. Diese breitere Planung behandelt [Futterautomat im Mehrtierhaushalt](/beste-futterautomaten-fuer-mehrtierhaushalte/).

Steht die passende Bauart bereits fest, zeigt der [Vergleich der fünf Systeme für zwei Katzen](/vergleiche/beste-futterautomaten-fuer-zwei-katzen/) konkrete Modelle für Doppelschale, zwei Futtersorten und geschützte Rationen.`,
    ["## Fazit", "## Quellen"]
  );

  stage(files.guide, text);
}

// 2) Comparison: klare Produkt- und Modellintention.
{
  let text = read(files.comparison);
  text = setTopLevelScalar(text, "updatedAt", "2026-07-25");
  text = setNestedScalar(
    text,
    "seo",
    "title",
    "Futterautomaten für 2 Katzen: 5 Systeme im Vergleich"
  );
  text = setNestedScalar(
    text,
    "seo",
    "description",
    "Fünf Futterautomaten für zwei Katzen vergleichen: Mikrochip-Zugang, Doppelschale, Dual-Hopper, App, Portionierung und Schutz vor Futterklau."
  );
  text = setNestedBoolean(
    text,
    "automaticRecommendations",
    "enabled",
    false
  );
  text = setTopLevelScalar(
    text,
    "tableTitle",
    "5 Systeme für zwei Katzen direkt verglichen"
  );
  text = setTopLevelScalar(
    text,
    "cardsTitle",
    "Welches System passt zu Futterklau, Diät oder gleichem Futter?"
  );

  text = insertBodySection(
    text,
    "## Erst das Problem bestimmen, dann das Modell wählen",
    `## Erst das Problem bestimmen, dann das Modell wählen

Diese Seite beantwortet die **Produktfrage**: Welches konkrete System passt am besten zu gleichem Futter, zwei Futtersorten oder geschützten Rationen? Die vorgelagerte Bauartentscheidung erklärt der Ratgeber [Futterautomat für zwei Katzen](/futterautomat-fuer-zwei-katzen/).

Ein Mikrochip-Napf, eine Doppelschale und ein Dual-Hopper lösen drei verschiedene Aufgaben. Deshalb gibt es keinen sinnvollen Gesamtsieger für jeden Zwei-Katzen-Haushalt.`,
    ["## Schnellentscheidung in 30 Sekunden"]
  );

  stage(files.comparison, text);
}

// 3) Breite Mehrtierseite: Hunde, Katzen und größere Haushalte.
{
  let text = read(files.multi);
  text = setTopLevelScalar(
    text,
    "title",
    "Futterautomat im Mehrtierhaushalt"
  );
  text = setTopLevelScalar(
    text,
    "seoTitle",
    "Futterautomat im Mehrtierhaushalt: Futter sicher trennen"
  );
  text = setTopLevelScalar(
    text,
    "description",
    "Futterautomaten für mehrere Hunde oder Katzen planen: getrennte Futterplätze, Mikrochip-Zugang, Portionen, Futterneid und unterschiedliche Rationen."
  );
  text = setTopLevelScalar(
    text,
    "seoDescription",
    "Futterautomaten für mehrere Hunde oder Katzen: Futterplätze, Mikrochip-Zugang, Portionen, Futterneid und unterschiedliche Rationen richtig planen."
  );
  text = setTopLevelScalar(text, "updatedAt", "2026-07-25");

  text = setNestedScalar(
    text,
    "hub",
    "title",
    "Futterautomat im Mehrtierhaushalt"
  );
  text = setNestedScalar(
    text,
    "hub",
    "description",
    "Fütterung mit mehreren Hunden oder Katzen nach Zugang, Futterart und Standort organisieren."
  );

  text = replaceRequired(
    text,
    'decisionIntro: "Mehrere Tiere stellen andere Anforderungen an einen Futterautomaten. Besonders wichtig sind Zuverlässigkeit, Portionierung und eine sichere Trennung der Mahlzeiten."',
    'decisionIntro: "Mehrere Hunde oder Katzen brauchen passende Futterplätze, sichere Zugänge und eine Organisation, die unterschiedliche Rationen und Tiergrößen berücksichtigt."',
    "Mehrtier-DecisionIntro"
  );

  text = replaceRequired(
    text,
    'title: "Welcher Futterautomat eignet sich für mehrere Tiere?"',
    'title: "Wie organisiert man Futterautomaten mit mehreren Tieren?"',
    "Mehrtier-Answer-Title"
  );

  text = insertBodySection(
    text,
    "## Abgrenzung: zwei Katzen oder allgemeiner Mehrtierhaushalt?",
    `## Abgrenzung: zwei Katzen oder allgemeiner Mehrtierhaushalt?

Diese Seite behandelt den **breiten Mehrtierhaushalt**: mehrere Katzen, mehrere Hunde oder Hund und Katze mit unterschiedlichen Körpergrößen und Futterarten.

Für genau zwei Katzen sind zwei spezialisierte Einstiege sinnvoll:

- [Bauart und Fütterungsproblem bestimmen](/futterautomat-fuer-zwei-katzen/)
- [Fünf konkrete Systeme vergleichen](/vergleiche/beste-futterautomaten-fuer-zwei-katzen/)

So konkurriert die allgemeine Mehrtierseite nicht mit der spezifischen Zwei-Katzen-Kaufberatung.`,
    ["## Unsere Empfehlung auf einen Blick"]
  );

  text = ensureFaq(
    text,
    "Welcher Futterautomat eignet sich für Hund und Katze?",
    "Hund und Katze benötigen häufig unterschiedliche Napfhöhen, Futtersorten und Portionsgrößen. Zwei getrennte Futterplätze sind meist geeigneter als ein gemeinsamer Doppelnapf. Wenn eine Ration geschützt werden muss, ist ein artspezifisch passender Mikrochip- oder RFID-Zugang sinnvoll."
  );
  text = ensureFaq(
    text,
    "Wie viele Futterplätze braucht ein Mehrtierhaushalt?",
    "Als Ausgangspunkt sollte jedes Tier einen gut erreichbaren Futterplatz haben. Bei Konkurrenz, sehr unterschiedlichem Fresstempo oder medizinisch getrennten Rationen sind zusätzlicher Abstand, Sichtschutz oder getrennte Räume wichtiger als mehrere Näpfe direkt nebeneinander."
  );

  stage(files.multi, text);
}

// 4) Cornerstone: Guide und Comparison sichtbar voneinander trennen.
{
  let text = read(files.hub);
  text = updateCard(
    text,
    "Doppelnapf oder Zugangskontrolle",
    {
      text: "Für zwei Katzen entscheidet nicht die Zahl der Näpfe, sondern ob Portionen nur verteilt oder zuverlässig vor Futterklau geschützt werden müssen.",
      href: "/futterautomat-fuer-zwei-katzen/",
      cta: "Bauart für zwei Katzen wählen"
    }
  );

  text = insertBodySection(
    text,
    "## Zwei Katzen: erst Bauart, dann konkrete Modelle",
    `## Zwei Katzen: erst Bauart, dann konkrete Modelle

Bei zwei Katzen führen zwei getrennte Schritte schneller zur passenden Lösung:

1. [Doppelschale, zwei Automaten oder Mikrochip wählen](/futterautomat-fuer-zwei-katzen/)
2. [Fünf konkrete Systeme für zwei Katzen vergleichen](/vergleiche/beste-futterautomaten-fuer-zwei-katzen/)

Für mehrere Hunde, mehrere Katzen oder gemischte Haushalte behandelt [Futterautomat im Mehrtierhaushalt](/beste-futterautomaten-fuer-mehrtierhaushalte/) zusätzlich Tiergröße, Napfhöhe, Futterart und räumliche Organisation.`,
    ["## Auswahlhilfe:", "## Welche Bauarten gibt es?", "## Fazit"]
  );

  const parsed = splitDocument(text);
  const duplicates = findDuplicateCardNavigation(parsed.frontmatter);
  if (duplicates.length) {
    throw new Error(
      `Doppelte href-/cta-Schlüssel im Futterautomaten-Hub: ${JSON.stringify(duplicates)}`
    );
  }

  stage(files.hub, text);
}

// 5) Dauerhaften Audit-Befehl ergänzen.
{
  const packageData = JSON.parse(read(files.packageJson));
  packageData.scripts ??= {};
  packageData.scripts["audit:multicat-intent"] =
    "node scripts/seo/audit-week7-multicat-intent.mjs";
  stage(files.packageJson, `${JSON.stringify(packageData, null, 2)}\n`);
}

const auditSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");
const content = path.join(app, "src", "content");
const checks = [];

const normalize = (value) =>
  String(value).replace(/^\\uFEFF/, "").replace(/\\r\\n?/g, "\\n");
const read = (file) => normalize(fs.readFileSync(file, "utf8"));
const check = (name, ok, detail = "") =>
  checks.push({ name, ok, detail });

function splitDocument(text) {
  const match = normalize(text).match(/^---\\n([\\s\\S]*?)\\n---\\n?([\\s\\S]*)$/);
  return match ? { frontmatter: match[1], body: match[2] } : null;
}

function topLevelValue(frontmatter, key) {
  const match = frontmatter.match(
    new RegExp(
      \`^\${key}:\\\\s*(?:"([^"]*)"|'([^']*)'|([^\\\\n#]+))\\\\s*$\`,
      "m"
    )
  );
  return (match?.[1] ?? match?.[2] ?? match?.[3])?.trim() || "";
}

function nestedValue(frontmatter, blockName, key) {
  const lines = frontmatter.split("\\n");
  const start = lines.findIndex((line) => line === \`\${blockName}:\`);
  if (start < 0) return "";

  let end = start + 1;
  while (
    end < lines.length &&
    (lines[end].startsWith(" ") || lines[end].trim() === "")
  ) {
    end += 1;
  }

  const block = lines.slice(start + 1, end).join("\\n");
  const match = block.match(
    new RegExp(
      \`^  \${key}:\\\\s*(?:"([^"]*)"|'([^']*)'|([^\\\\n#]+))\\\\s*$\`,
      "m"
    )
  );
  return (match?.[1] ?? match?.[2] ?? match?.[3])?.trim() || "";
}

function itemCount(frontmatter) {
  const lines = frontmatter.split("\\n");
  const start = lines.findIndex((line) => line === "items:");
  if (start < 0) return 0;

  let end = start + 1;
  while (
    end < lines.length &&
    (lines[end].startsWith(" ") || lines[end].trim() === "")
  ) {
    end += 1;
  }

  return lines
    .slice(start + 1, end)
    .filter((line) => /^  - slug:/.test(line))
    .length;
}

function duplicateCardNavigation(frontmatter) {
  const lines = frontmatter.split("\\n");
  const duplicates = [];

  for (let index = 0; index < lines.length; index += 1) {
    const item = lines[index].match(/^(\\s*)-\\s+(?:label|title):\\s+/);
    if (!item) continue;

    const itemIndent = item[1].length;
    const directIndent = " ".repeat(itemIndent + 2);
    const seen = new Set();

    let end = index + 1;
    while (end < lines.length) {
      const line = lines[end];
      const sibling = line.match(/^(\\s*)-\\s+/);
      if (sibling && sibling[1].length === itemIndent) break;
      if (
        line.trim() &&
        (line.match(/^\\s*/)?.[0].length ?? 0) < itemIndent
      ) break;

      if (line.startsWith(directIndent)) {
        const rest = line.slice(directIndent.length);
        if (!/^\\s/.test(rest)) {
          const key = rest.match(/^([A-Za-z][A-Za-z0-9_-]*):/)?.[1];
          if (key === "href" || key === "cta") {
            if (seen.has(key)) duplicates.push(\`\${key}@\${end + 1}\`);
            else seen.add(key);
          }
        }
      }
      end += 1;
    }
    index = end - 1;
  }

  return duplicates;
}

const guideFile = path.join(content, "pages", "futterautomat-fuer-zwei-katzen.md");
const comparisonFile = path.join(content, "comparisons", "beste-futterautomaten-fuer-zwei-katzen.md");
const multiFile = path.join(content, "pages", "beste-futterautomaten-fuer-mehrtierhaushalte.md");
const hubFile = path.join(content, "pages", "smarte-futterautomaten.md");

for (const [label, file] of [
  ["Guide", guideFile],
  ["Comparison", comparisonFile],
  ["Mehrtierseite", multiFile],
  ["Cornerstone", hubFile]
]) {
  check(\`\${label}: Datei vorhanden\`, fs.existsSync(file), file);
}

const guide = splitDocument(read(guideFile));
const comparison = splitDocument(read(comparisonFile));
const multi = splitDocument(read(multiFile));
const hub = splitDocument(read(hubFile));

check("Guide-Frontmatter parsebar", Boolean(guide));
check("Comparison-Frontmatter parsebar", Boolean(comparison));
check("Mehrtier-Frontmatter parsebar", Boolean(multi));
check("Hub-Frontmatter parsebar", Boolean(hub));

if (guide) {
  const title = topLevelValue(guide.frontmatter, "seoTitle");
  const description = topLevelValue(guide.frontmatter, "seoDescription");
  check("Guide-Title 40–65 Zeichen", title.length >= 40 && title.length <= 65, String(title.length));
  check("Guide-Description 120–170 Zeichen", description.length >= 120 && description.length <= 170, String(description.length));
  check("Guide beantwortet Bauart-Intent", guide.body.includes("## Doppelschale, zwei Automaten oder Mikrochip?"));
  check("Guide verlinkt Comparison", guide.body.includes("/vergleiche/beste-futterautomaten-fuer-zwei-katzen/"));
  check("Guide verlinkt breite Mehrtierseite", guide.body.includes("/beste-futterautomaten-fuer-mehrtierhaushalte/"));
}

if (comparison) {
  const title = nestedValue(comparison.frontmatter, "seo", "title");
  const description = nestedValue(comparison.frontmatter, "seo", "description");
  check("Comparison-Title 40–65 Zeichen", title.length >= 40 && title.length <= 65, String(title.length));
  check("Comparison-Description 120–170 Zeichen", description.length >= 120 && description.length <= 170, String(description.length));
  check("Comparison genau 5 Systeme", itemCount(comparison.frontmatter) === 5, String(itemCount(comparison.frontmatter)));
  check("Comparison automatische Erweiterung aus", /automaticRecommendations:\\n\\s+enabled:\\s+false/.test(comparison.frontmatter));
  check("Comparison verlinkt Guide", comparison.body.includes("/futterautomat-fuer-zwei-katzen/"));
  check("Comparison kein pauschaler Gesamtsieger", comparison.body.includes("keinen sinnvollen Gesamtsieger"));
}

if (multi) {
  const title = topLevelValue(multi.frontmatter, "title");
  const seoTitle = topLevelValue(multi.frontmatter, "seoTitle");
  check("Mehrtierseite ohne Beste-Title", !/^Beste\\b/i.test(title));
  check("Mehrtier-SEO-Title 40–65 Zeichen", seoTitle.length >= 40 && seoTitle.length <= 65, String(seoTitle.length));
  check("Mehrtierseite klar breit positioniert", multi.body.includes("breiten Mehrtierhaushalt"));
  check("Mehrtierseite verlinkt Zwei-Katzen-Guide", multi.body.includes("/futterautomat-fuer-zwei-katzen/"));
  check("Mehrtierseite verlinkt Zwei-Katzen-Comparison", multi.body.includes("/vergleiche/beste-futterautomaten-fuer-zwei-katzen/"));
  check("Mehrtierseite enthält Hund-und-Katze-FAQ", multi.frontmatter.includes("Welcher Futterautomat eignet sich für Hund und Katze?"));
}

if (hub) {
  check("Hub verlinkt Guide", hub.frontmatter.includes('href: "/futterautomat-fuer-zwei-katzen/"'));
  check("Hub verlinkt Comparison", hub.body.includes("/vergleiche/beste-futterautomaten-fuer-zwei-katzen/"));
  check("Hub verlinkt breite Mehrtierseite", hub.body.includes("/beste-futterautomaten-fuer-mehrtierhaushalte/"));
  const duplicates = duplicateCardNavigation(hub.frontmatter);
  check("Hub ohne doppelte Karten-Navigation", duplicates.length === 0, duplicates.join(", "));
}

const packageData = JSON.parse(
  read(path.join(app, "package.json"))
);
check(
  "npm-Audit-Befehl vorhanden",
  packageData.scripts?.["audit:multicat-intent"] ===
    "node scripts/seo/audit-week7-multicat-intent.mjs"
);

const failed = checks.filter((entry) => !entry.ok);
for (const entry of checks) {
  console.log(
    \`\${entry.ok ? "OK" : "FEHLER"}  \${entry.name}\${entry.detail ? \` (\${entry.detail})\` : ""}\`
  );
}

if (failed.length) {
  console.error(\`\\n\${failed.length} Mehrkatzen-SEO-Prüfung(en) fehlgeschlagen.\`);
  process.exit(1);
}

console.log("\\nWoche-7-Mehrkatzen-Intent-Audit erfolgreich.");
`;

stage(files.audit, auditSource);

console.log(`[${PATCH}] Repository: ${root}`);
console.log(`[${PATCH}] Ändern/erstellen: ${changed.size}`);

if (CHECK) {
  for (const file of changed.keys()) {
    console.log(`ÄNDERN: ${rel(file)}`);
  }
  console.log(`[${PATCH}] Vorprüfung erfolgreich. Es wurde nichts verändert.`);
  process.exit(0);
}

const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replaceAll(":", "-")}`
);

try {
  for (const [file, state] of changed) {
    if (state.old !== null) {
      const backup = path.join(backupRoot, rel(file));
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.writeFileSync(backup, state.old, "utf8");
    }
  }

  for (const [file, state] of changed) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, state.next, "utf8");
    console.log(`GEÄNDERT: ${rel(file)}`);
  }

  const auditUrl = pathToFileURL(files.audit).href;
  await import(`${auditUrl}?t=${Date.now()}`);

  console.log(`[${PATCH}] Erfolgreich angewendet.`);
  console.log(`[${PATCH}] Backup: ${backupRoot}`);
  console.log("Nächster Schritt: npm run build:pfotentechnik");
  console.log("Danach: npm --prefix apps/pfotentechnik run audit:multicat-intent");
} catch (error) {
  console.error(`[${PATCH}] Fehler: ${error.message}`);

  for (const [file, state] of changed) {
    if (state.old === null) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, state.old, "utf8");
    }
  }

  console.error(`[${PATCH}] Alle Änderungen wurden zurückgesetzt.`);
  process.exit(1);
}

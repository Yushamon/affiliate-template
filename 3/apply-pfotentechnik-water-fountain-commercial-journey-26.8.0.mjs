#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-water-fountain-commercial-journey-26.8.0";
const APP_RELATIVE = path.join("apps", "pfotentechnik");

const FILES = {
  material: path.join(
    APP_RELATIVE,
    "src",
    "content",
    "pages",
    "katzentrinkbrunnen-material-edelstahl-keramik-kunststoff.md",
  ),
  cleaning: path.join(
    APP_RELATIVE,
    "src",
    "content",
    "pages",
    "katzentrinkbrunnen-richtig-reinigen.md",
  ),
  filter: path.join(
    APP_RELATIVE,
    "src",
    "content",
    "pages",
    "filter-im-katzentrinkbrunnen-wechseln.md",
  ),
  comparison: path.join(
    APP_RELATIVE,
    "src",
    "content",
    "comparisons",
    "beste-trinkbrunnen-fuer-katzen.md",
  ),
  test: path.join(
    APP_RELATIVE,
    "test",
    "water-fountain-commercial-journey-26.8.0.test.mjs",
  ),
  package: path.join(APP_RELATIVE, "package.json"),
};

const REQUIRED_SCRIPTS = [
  "audit:topical-authority:strict",
  "audit:decision-journeys:strict",
  "audit:internal-link-health:strict",
  "audit:content-quality:strict",
  "build",
];

const JOURNEYS = {
  material: {
    label: "Modelle nach tatsächlichen Wasserflächen vergleichen",
    sectionTitle: "Von der Materialfrage zur Modellauswahl",
    paragraphs: [
      "Die Materialbezeichnung allein entscheidet nicht über Hygiene oder Alltagstauglichkeit. Prüfe im [Katzenbrunnen-Vergleich](/vergleiche/beste-trinkbrunnen-fuer-katzen/) deshalb getrennt, welche Flächen tatsächlich mit Wasser in Berührung kommen, wie gut sich Pumpe und Tank erreichen lassen und ob Ersatzfilter verfügbar sind.",
      "Für die Pflege nach dem Kauf führt die [vollständige Reinigungsanleitung](/katzentrinkbrunnen-richtig-reinigen/) durch Tank, Pumpe, Rotorraum und Dichtungen. Der [Trinkbrunnen-Hub](/trinkbrunnen/) ordnet die Materialfrage in Tiergröße, Standort und Betriebsart ein.",
    ],
  },
  cleaning: {
    label: "Brunnen mit gut zugänglicher Pumpe vergleichen",
    sectionTitle: "Reinigbarkeit vor dem Kauf prüfen",
    paragraphs: [
      "Wer noch kein Modell gewählt hat, sollte den Reinigungsweg als Kaufkriterium behandeln. Im [Katzenbrunnen-Vergleich](/vergleiche/beste-trinkbrunnen-fuer-katzen/) werden Zerlegbarkeit, Pumpenzugang und spülmaschinengeeignete Teile getrennt bewertet.",
      "Für die Materialentscheidung hilft der Vergleich von [Edelstahl, Keramik und Kunststoff](/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/). Laufende Filterpflege und Folgekosten erklärt der Ratgeber zum [Filterwechsel im Katzenbrunnen](/filter-im-katzentrinkbrunnen-wechseln/). Zur breiten Auswahl führt der [Trinkbrunnen-Hub](/trinkbrunnen/).",
    ],
  },
  filter: {
    label: "Filtertyp und Folgekosten im Modellvergleich prüfen",
    sectionTitle: "Filterkosten in die Kaufentscheidung einbeziehen",
    paragraphs: [
      "Vor dem Kauf lohnt sich der Blick auf Filtertyp, Packungsgröße, dokumentiertes Wechselintervall und Ersatzteilversorgung. Der [Katzenbrunnen-Vergleich](/vergleiche/beste-trinkbrunnen-fuer-katzen/) führt Filter und Folgekosten als eigenes Kriterium und trennt belegte Angaben von fehlenden Daten.",
      "Ein neuer Filter ersetzt weder die [vollständige Reinigung](/katzentrinkbrunnen-richtig-reinigen/) noch die Prüfung der tatsächlich wasserberührenden [Materialien](/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/). Der [Trinkbrunnen-Hub](/trinkbrunnen/) hilft, Filterkosten zusammen mit Tierzahl, Standort und Betriebsart einzuordnen.",
    ],
  },
};

const COMPARISON_SECTION = {
  title: "So werden Material, Reinigung und Filter bewertet",
  paragraphs: [
    "Die drei Kriterien beantworten unterschiedliche Fragen und dürfen nicht zu einem pauschalen Hygieneurteil vermischt werden:",
    "",
    "- **Material:** Entscheidend sind die tatsächlich wasserberührenden Flächen, nicht allein die Produktbezeichnung. Die Unterschiede erklärt der Ratgeber [Edelstahl, Keramik oder Kunststoff](/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/).",
    "- **Reinigung:** Bewertet werden Zerlegbarkeit, Pumpenzugang, Wasserwege und ausdrücklich belegte Spülmaschineneignung. Die praktische Prüfung zeigt die Anleitung [Katzentrinkbrunnen vollständig reinigen](/katzentrinkbrunnen-richtig-reinigen/).",
    "- **Filter und Folgekosten:** Relevant sind Filtertyp, Wechselintervall, Kompatibilität und verfügbare Ersatzfilter. Hintergründe liefert [Filterintervalle und Warnzeichen](/filter-im-katzentrinkbrunnen-wechseln/).",
    "",
    "Fehlende Herstellerangaben werden nicht durch Vermutungen ersetzt. Ein Modell ohne belastbare Daten erhält dadurch keinen künstlichen Vorteil oder Nachteil.",
  ],
};

function log(message) {
  console.log(`[${PATCH}] ${message}`);
}

function findRoot(start) {
  let current = path.resolve(start);
  for (let depth = 0; depth < 16; depth += 1) {
    if (fs.existsSync(path.join(current, APP_RELATIVE, "package.json"))) {
      return current;
    }
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Wurzel mit apps/pfotentechnik/package.json nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, APP_RELATIVE);
const ABSOLUTE = Object.fromEntries(
  Object.entries(FILES).map(([key, relative]) => [key, path.join(ROOT, relative)]),
);
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`,
);

function hasConflictMarkers(source) {
  return /^(<<<<<<<|=======|>>>>>>>)(?: .*)?$/m.test(source);
}

function preflightFile(file, label, required = true) {
  if (!fs.existsSync(file)) {
    if (required) throw new Error(`${label} fehlt: ${path.relative(ROOT, file)}`);
    return "";
  }
  const source = fs.readFileSync(file, "utf8");
  if (hasConflictMarkers(source)) {
    throw new Error(
      `${label} enthält ungelöste Git-Konfliktmarker: ${path.relative(ROOT, file)}`,
    );
  }
  return source;
}

function splitMarkdown(source, label) {
  const normalized = source.replace(/\r\n/g, "\n");
  const lines = normalized.split("\n");

  if (lines[0]?.trim() !== "---") {
    throw new Error(`${label}: Frontmatter-Start fehlt.`);
  }

  const end = lines.findIndex((line, index) => index > 0 && line.trim() === "---");
  if (end < 0) throw new Error(`${label}: Frontmatter-Ende fehlt.`);

  return {
    frontmatter: lines.slice(1, end),
    body: lines.slice(end + 1),
  };
}

function serializeMarkdown(frontmatter, body) {
  const bodyLines = [...body];
  while (bodyLines.length && !bodyLines[0].trim()) bodyLines.shift();
  while (bodyLines.length && !bodyLines.at(-1).trim()) bodyLines.pop();
  return ["---", ...frontmatter, "---", "", ...bodyLines, ""].join("\n");
}

function topLevelKey(line) {
  if (!line || /^\s/.test(line)) return null;
  const match = line.match(/^([A-Za-z][A-Za-z0-9_-]*):(?:\s|$)/);
  return match?.[1] ?? null;
}

function topLevelRange(lines, key) {
  const start = lines.findIndex((line) => topLevelKey(line) === key);
  if (start < 0) return null;

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (topLevelKey(lines[index])) {
      end = index;
      break;
    }
  }
  return { start, end };
}

function upsertTopLevelBlock(lines, key, block, beforeKey = null) {
  const range = topLevelRange(lines, key);
  if (range) {
    return [...lines.slice(0, range.start), ...block, ...lines.slice(range.end)];
  }

  if (beforeKey) {
    const before = topLevelRange(lines, beforeKey);
    if (before) {
      return [...lines.slice(0, before.start), ...block, "", ...lines.slice(before.start)];
    }
  }

  return [...lines, "", ...block];
}

function upsertRecommendationJourney(frontmatter, label) {
  return upsertTopLevelBlock(
    frontmatter,
    "recommendationJourney",
    [
      "recommendationJourney:",
      "  mode: filtered",
      "  animal: cat",
      "  comparisonHref: /vergleiche/beste-trinkbrunnen-fuer-katzen/",
      `  comparisonLabel: ${label}`,
    ],
    "faq",
  );
}

function parseSections(lines) {
  const sections = [];
  let current = { title: null, lines: [] };

  for (const line of lines) {
    if (/^##\s+/.test(line)) {
      sections.push(current);
      current = { title: line.replace(/^##\s+/, "").trim(), lines: [line] };
    } else {
      current.lines.push(line);
    }
  }

  sections.push(current);
  return sections;
}

function upsertSection(body, title, paragraphs, beforeTitles = []) {
  const sections = parseSections(body);
  const replacement = {
    title,
    lines: [`## ${title}`, "", ...paragraphs, ""],
  };

  const existing = sections.findIndex((section) => section.title === title);
  if (existing >= 0) {
    sections[existing] = replacement;
    return sections.flatMap((section) => section.lines);
  }

  const insertion = sections.findIndex(
    (section) => section.title && beforeTitles.includes(section.title),
  );

  if (insertion >= 0) sections.splice(insertion, 0, replacement);
  else sections.push(replacement);

  return sections.flatMap((section) => section.lines);
}

function writeIfChanged(file, content) {
  const previous = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (previous === content) {
    log(`Bereits aktuell: ${path.relative(ROOT, file)}`);
    return false;
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
  log(`Geändert: ${path.relative(ROOT, file)}`);
  return true;
}

function backupFile(file) {
  if (!fs.existsSync(file)) return;
  const target = path.join(BACKUP, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function rollback(targets) {
  for (const file of targets) {
    const backup = path.join(BACKUP, path.relative(ROOT, file));
    if (fs.existsSync(backup)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(backup, file);
    } else if (file === ABSOLUTE.test && fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }
}

function run(command, args, label, cwd = ROOT) {
  log(`Prüfe: ${label}`);
  const executable =
    process.platform === "win32" && command === "npm" ? "npm.cmd" : command;
  const result = spawnSync(executable, args, {
    cwd,
    stdio: "inherit",
    shell: false,
    env: process.env,
  });

  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`${label} fehlgeschlagen (Exit ${result.status}).`);
  }
  log(`BESTANDEN: ${label}`);
}

function assertContains(source, values, label) {
  for (const value of values) {
    if (!source.includes(value)) {
      throw new Error(`${label}: Zielzustand fehlt: ${value}`);
    }
  }
}

const sources = {
  material: preflightFile(ABSOLUTE.material, "Materialratgeber"),
  cleaning: preflightFile(ABSOLUTE.cleaning, "Reinigungsratgeber"),
  filter: preflightFile(ABSOLUTE.filter, "Filterratgeber"),
  comparison: preflightFile(ABSOLUTE.comparison, "Katzenvergleich"),
  package: preflightFile(ABSOLUTE.package, "package.json"),
};

let packageJson;
try {
  packageJson = JSON.parse(sources.package);
} catch (error) {
  throw new Error(
    `package.json ist kein gültiges JSON: ${
      error instanceof Error ? error.message : String(error)
    }`,
  );
}

for (const script of REQUIRED_SCRIPTS) {
  if (typeof packageJson.scripts?.[script] !== "string") {
    throw new Error(`Erforderliches npm-Skript fehlt: ${script}`);
  }
}

const TARGETS = [
  ABSOLUTE.material,
  ABSOLUTE.cleaning,
  ABSOLUTE.filter,
  ABSOLUTE.comparison,
  ABSOLUTE.test,
];

fs.mkdirSync(BACKUP, { recursive: true });
for (const file of TARGETS) backupFile(file);
log(`Backup: ${path.relative(ROOT, BACKUP)}`);

try {
  for (const key of ["material", "cleaning", "filter"]) {
    const document = splitMarkdown(sources[key], `${key}-Ratgeber`);
    const journey = JOURNEYS[key];
    const frontmatter = upsertRecommendationJourney(
      document.frontmatter,
      journey.label,
    );
    const body = upsertSection(
      document.body,
      journey.sectionTitle,
      journey.paragraphs,
      ["Quellen", "Fazit"],
    );
    const next = serializeMarkdown(frontmatter, body);

    assertContains(
      next,
      [
        "recommendationJourney:",
        "comparisonHref: /vergleiche/beste-trinkbrunnen-fuer-katzen/",
        `comparisonLabel: ${journey.label}`,
        `## ${journey.sectionTitle}`,
        "(/trinkbrunnen/)",
      ],
      `${key}-Ratgeber`,
    );

    writeIfChanged(ABSOLUTE[key], next);
  }

  const comparison = splitMarkdown(sources.comparison, "Katzenvergleich");
  const comparisonBody = upsertSection(
    comparison.body,
    COMPARISON_SECTION.title,
    COMPARISON_SECTION.paragraphs,
    ["Fazit", "Quellen"],
  );
  const nextComparison = serializeMarkdown(
    comparison.frontmatter,
    comparisonBody,
  );

  assertContains(
    nextComparison,
    [
      "## So werden Material, Reinigung und Filter bewertet",
      "(/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/)",
      "(/katzentrinkbrunnen-richtig-reinigen/)",
      "(/filter-im-katzentrinkbrunnen-wechseln/)",
      "Fehlende Herstellerangaben werden nicht durch Vermutungen ersetzt.",
    ],
    "Katzenvergleich",
  );

  writeIfChanged(ABSOLUTE.comparison, nextComparison);

  const testSource = `import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const APP = process.cwd();
const files = {
  material: path.join(APP, "src/content/pages/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff.md"),
  cleaning: path.join(APP, "src/content/pages/katzentrinkbrunnen-richtig-reinigen.md"),
  filter: path.join(APP, "src/content/pages/filter-im-katzentrinkbrunnen-wechseln.md"),
  comparison: path.join(APP, "src/content/comparisons/beste-trinkbrunnen-fuer-katzen.md"),
};

const source = Object.fromEntries(
  Object.entries(files).map(([key, file]) => [key, fs.readFileSync(file, "utf8")]),
);

test("alle drei Intent-Owner führen strukturell zum Katzenvergleich", () => {
  for (const key of ["material", "cleaning", "filter"]) {
    assert.match(source[key], /recommendationJourney:/);
    assert.match(
      source[key],
      /comparisonHref: \\/vergleiche\\/beste-trinkbrunnen-fuer-katzen\\//,
    );
  }
});

test("Journey-Labels benennen das jeweilige Entscheidungskriterium", () => {
  assert.match(
    source.material,
    /comparisonLabel: Modelle nach tatsächlichen Wasserflächen vergleichen/,
  );
  assert.match(
    source.cleaning,
    /comparisonLabel: Brunnen mit gut zugänglicher Pumpe vergleichen/,
  );
  assert.match(
    source.filter,
    /comparisonLabel: Filtertyp und Folgekosten im Modellvergleich prüfen/,
  );
});

test("Ratgeber besitzen Rückweg, nächste Entscheidung und fachliche Vertiefung", () => {
  for (const key of ["material", "cleaning", "filter"]) {
    assert.match(source[key], /\\(\\/trinkbrunnen\\/\\)/);
    assert.match(
      source[key],
      /\\(\\/vergleiche\\/beste-trinkbrunnen-fuer-katzen\\/\\)/,
    );
  }
  assert.match(
    source.material,
    /\\(\\/katzentrinkbrunnen-richtig-reinigen\\/\\)/,
  );
  assert.match(
    source.cleaning,
    /\\(\\/filter-im-katzentrinkbrunnen-wechseln\\/\\)/,
  );
  assert.match(
    source.filter,
    /\\(\\/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff\\/\\)/,
  );
});

test("Katzenvergleich erklärt Kriterien und verlinkt zurück", () => {
  assert.match(
    source.comparison,
    /## So werden Material, Reinigung und Filter bewertet/,
  );
  assert.match(
    source.comparison,
    /\\(\\/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff\\/\\)/,
  );
  assert.match(
    source.comparison,
    /\\(\\/katzentrinkbrunnen-richtig-reinigen\\/\\)/,
  );
  assert.match(
    source.comparison,
    /\\(\\/filter-im-katzentrinkbrunnen-wechseln\\/\\)/,
  );
});

test("Patch erzeugt keine künstliche neue Vergleichsroute", () => {
  const all = Object.values(source).join("\\n");
  assert.doesNotMatch(all, /\\/vergleiche\\/katzenbrunnen-(?:material|edelstahl|filter|hygiene)\\//);
});
`;

  writeIfChanged(ABSOLUTE.test, testSource);

  for (const file of TARGETS) {
    preflightFile(
      file,
      path.relative(ROOT, file),
      file !== ABSOLUTE.test ? true : false,
    );
  }

  run(
    process.execPath,
    ["--test", path.relative(APP, ABSOLUTE.test)],
    "Journey-Patch-Test",
    APP,
  );

  for (const script of REQUIRED_SCRIPTS) {
    run(
      "npm",
      ["--workspace", "apps/pfotentechnik", "run", script],
      script,
    );
  }

  const reportPath = path.join(
    APP,
    "reports",
    "topical-authority",
    "water-fountain-commercial-journey-26.8.0.json",
  );
  fs.mkdirSync(path.dirname(reportPath), { recursive: true });
  fs.writeFileSync(
    reportPath,
    `${JSON.stringify(
      {
        patch: PATCH,
        status: "passed",
        decision: "journey-close",
        newPages: 0,
        changedFiles: TARGETS.map((file) => path.relative(ROOT, file)),
        intentOwners: {
          material:
            "/katzentrinkbrunnen-material-edelstahl-keramik-kunststoff/",
          cleaning: "/katzentrinkbrunnen-richtig-reinigen/",
          filter: "/filter-im-katzentrinkbrunnen-wechseln/",
          commercial: "/vergleiche/beste-trinkbrunnen-fuer-katzen/",
          hub: "/trinkbrunnen/",
        },
        validations: REQUIRED_SCRIPTS,
        backup: path.relative(ROOT, BACKUP),
        createdAt: new Date().toISOString(),
      },
      null,
      2,
    )}\n`,
    "utf8",
  );
  log(`Report: ${path.relative(ROOT, reportPath)}`);
  log("Abgeschlossen.");
} catch (error) {
  rollback(TARGETS);
  log(`FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  log("Änderungen wurden zurückgerollt.");
  process.exitCode = 1;
}

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-katzenklappen-hub-title-32.6.23";

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 10; i++) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
}

function patchFile(file, replacements, root) {
  if (!fs.existsSync(file)) {
    throw new Error(`[${PATCH}] Datei fehlt: ${path.relative(root, file)}`);
  }

  let raw = fs.readFileSync(file, "utf8");
  let changed = false;

  for (const [before, after, label] of replacements) {
    if (raw.includes(before)) {
      raw = raw.replace(before, after);
      changed = true;
      console.log(`[${PATCH}] ${label}`);
    }
  }

  if (!changed) {
    throw new Error(
      `[${PATCH}] Erwarteter Titel nicht gefunden in ${path.relative(root, file)}`
    );
  }

  const backup = `${file}.${PATCH}.bak`;
  if (!fs.existsSync(backup)) {
    fs.copyFileSync(file, backup);
    console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
  }

  fs.writeFileSync(file, raw, "utf8");
  console.log(`[${PATCH}] Gepatcht: ${path.relative(root, file)}`);
}

const root = findRoot(process.cwd());

const comparisonFile = path.join(
  root,
  "apps",
  "pfotentechnik",
  "src",
  "content",
  "comparisons",
  "katzenklappen-mit-app-und-beuteerkennung.md"
);

const hubFile = path.join(
  root,
  "apps",
  "pfotentechnik",
  "src",
  "content",
  "pages",
  "katzenklappen.md"
);

patchFile(
  comparisonFile,
  [
    [
      '  title: "App und Beuteerkennung"',
      '  title: "Katzenklappen mit App und Beuteerkennung"',
      "comparison hub.title präzisiert"
    ]
  ],
  root
);

patchFile(
  hubFile,
  [
    [
      '        title: "App und Beuteerkennung"',
      '        title: "Katzenklappen mit App und Beuteerkennung"',
      "Katzenklappen-Hub-Karte präzisiert"
    ]
  ],
  root
);

const reportDir = path.join(
  root,
  "apps",
  "pfotentechnik",
  "reports",
  "comparison-selection"
);
fs.mkdirSync(reportDir, { recursive: true });

const reportPath = path.join(
  reportDir,
  "katzenklappen-hub-title-32.6.23.md"
);

fs.writeFileSync(
  reportPath,
  `# Katzenklappen Hub Title 32.6.23

## Änderung

Zwei uneindeutige Titel wurden präzisiert:

- Vergleichs-Hub: "App und Beuteerkennung" → "Katzenklappen mit App und Beuteerkennung"
- Katzenklappen-Hub-Karte: "App und Beuteerkennung" → "Katzenklappen mit App und Beuteerkennung"

## Nicht verändert

- H1 der Vergleichsseite
- SEO-Titel
- Slug
- Canonical
- Vergleichslogik
- Produktdaten
- Winner-Logik
`,
  "utf8"
);

console.log(`[${PATCH}] Report: ${path.relative(root, reportPath)}`);
console.log(`[${PATCH}] Fertig.`);

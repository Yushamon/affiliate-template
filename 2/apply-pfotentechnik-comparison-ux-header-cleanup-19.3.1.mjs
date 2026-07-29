#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const PATCH = "pfotentechnik-comparison-ux-header-cleanup-19.3.1";
const ROOT = process.cwd();
const runChecks = !process.argv.includes("--skip-checks");

const files = {
  insight: "packages/affiliate-core/src/components/comparison/ComparisonInsightSummary.astro",
  explorer: "packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro",
  explorerCss: "packages/affiliate-core/src/components/comparison/comparison-explorer-v2.css",
  header: "packages/affiliate-core/src/components/Header.astro"
};

const abs = (file) => path.join(ROOT, file);
const log = (message = "") => console.log(`[${PATCH}] ${message}`);
const fail = (message) => {
  console.error(`\n[${PATCH}] FEHLER: ${message}`);
  process.exit(1);
};

function run(command, args) {
  log(`> ${command} ${args.join(" ")}`);
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env
  });
}

function backup(paths) {
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const dir = path.join(ROOT, ".patch-backups", `${PATCH}-${stamp}`);

  for (const relative of paths) {
    const source = abs(relative);
    if (!fs.existsSync(source)) continue;
    const target = path.join(dir, relative);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(source, target);
  }

  return dir;
}

function replaceOnce(source, pattern, replacement, label, alreadyApplied) {
  if (alreadyApplied?.test(source)) {
    log(`Unverändert: ${label} bereits umgesetzt`);
    return source;
  }

  if (!pattern.test(source)) {
    fail(`Erwartete Architektur fehlt: ${label}`);
  }

  return source.replace(pattern, replacement);
}

log("Vorprüfung");

for (const file of Object.values(files)) {
  if (!fs.existsSync(abs(file))) {
    fail(`Datei fehlt: ${file}`);
  }

  const source = fs.readFileSync(abs(file), "utf8");
  if (/<<<<<<<|=======|>>>>>>>/.test(source)) {
    fail(`Merge-Konfliktmarker gefunden: ${file}`);
  }
}

const backupDir = backup(Object.values(files));

/* 1. Kaufberatung */
let insight = fs.readFileSync(abs(files.insight), "utf8");

insight = replaceOnce(
  insight,
  /const strongestDifferences\s*=\s*meaningfulRows\.slice\(0,\s*5\);/,
  "const strongestDifferences = meaningfulRows;",
  "alle relevanten Kriterien anzeigen",
  /const strongestDifferences\s*=\s*meaningfulRows;/
);

insight = insight.replace(
  /\?\s*`\$\{meaningfulRows\.length\} Kriterien unterscheiden die Modelle tatsächlich\.[^`]*`/,
  '? `${meaningfulRows.length} Kriterien unterscheiden die Modelle tatsächlich. Alle relevanten Punkte findest du direkt unten.`'
);

insight = replaceOnce(
  insight,
  /<article>\s*<span aria-hidden="true">\{String\(index \+ 1\)\.padStart\(2,\s*"0"\)\}<\/span>\s*<div>\s*<h3>\{row\.criterion\.label\}<\/h3>\s*<p>\s*\{row\.criterion\.description \?\?\s*"Prüfe im Direktvergleich, welche Ausprägung zu deinem Alltag und deinen Anforderungen passt\."\}\s*<\/p>\s*<\/div>\s*<a href="#direktvergleich">Vergleichen<\/a>\s*<\/article>/m,
  `<a class="comparison-buying-guidance__criterion" href="#direktvergleich">
          <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>{row.criterion.label}</h3>
            <p>
              {row.criterion.description ??
                "Prüfe im Direktvergleich, welche Ausprägung zu deinem Alltag und deinen Anforderungen passt."}
            </p>
          </div>
          <span class="comparison-buying-guidance__criterion-arrow" aria-hidden="true">→</span>
        </a>`,
  "kompakte klickbare Kriterienkarte",
  /comparison-buying-guidance__criterion-arrow/
);

fs.writeFileSync(abs(files.insight), insight, "utf8");
log(`Geändert: ${files.insight}`);

/* 2. Direktvergleich-Markup */
let explorer = fs.readFileSync(abs(files.explorer), "utf8");

explorer = replaceOnce(
  explorer,
  /<details class="comparison-lab__group" open=\{groupIndex < 2\}>/,
  `<details
          class="comparison-lab__group"
          open
          data-comparison-group
          data-group-index={groupIndex}
        >`,
  "Desktop-Gruppen standardmäßig öffnen",
  /data-comparison-group/
);

explorer = replaceOnce(
  explorer,
  /<summary>\s*<span>\{group\}<\/span>\s*<small>\{groupRows\.length\} Kriterien<\/small>\s*<\/summary>/m,
  `<summary>
            <span class="comparison-lab__group-title">
              <strong>{group}</strong>
              <small>{groupRows.length} Kriterien</small>
            </span>
            <span class="comparison-lab__group-toggle" aria-hidden="true">
              <span class="comparison-lab__group-state comparison-lab__group-state--closed">Öffnen</span>
              <span class="comparison-lab__group-state comparison-lab__group-state--open">Schließen</span>
              <span class="comparison-lab__group-chevron">⌄</span>
            </span>
          </summary>`,
  "verständliche Accordion-Kopfzeile",
  /comparison-lab__group-chevron/
);

if (!/const groups = Array\.from\(/.test(explorer)) {
  explorer = replaceOnce(
    explorer,
    /\s+render\(\);\s+\}\);\s*<\/script>\s*$/m,
    `
    const groups = Array.from(
      root.querySelectorAll("[data-comparison-group]")
    ).filter((item) => item instanceof HTMLDetailsElement);

    const syncGroupDefaults = () => {
      const mobile = window.matchMedia("(max-width: 47.99rem)").matches;
      groups.forEach((group, index) => {
        group.open = mobile ? index === 0 : true;
      });
    };

    const groupMedia = window.matchMedia("(max-width: 47.99rem)");
    groupMedia.addEventListener("change", syncGroupDefaults);
    syncGroupDefaults();
    render();
  });
</script>
`,
    "responsive Accordion-Initialisierung"
  );
} else {
  log("Unverändert: responsive Accordion-Initialisierung bereits vorhanden");
}

fs.writeFileSync(abs(files.explorer), explorer, "utf8");
log(`Geändert: ${files.explorer}`);

/* 3. Direktvergleich-CSS */
let css = fs.readFileSync(abs(files.explorerCss), "utf8");

if (!/\.comparison-lab__group-toggle\s*\{/.test(css)) {
  css = replaceOnce(
    css,
    /\.comparison-lab__group > summary \{[\s\S]*?\}\s*\.comparison-lab__group > summary small \{[\s\S]*?\}/m,
    `.comparison-lab__group > summary {
  position: sticky;
  z-index: 3;
  left: 0;
  display: flex;
  min-height: 3.75rem;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  padding: .8rem 1rem;
  color: var(--comparison-text);
  background: var(--comparison-surface-soft);
  cursor: pointer;
  list-style: none;
}

.comparison-lab__group > summary::-webkit-details-marker {
  display: none;
}

.comparison-lab__group-title {
  display: grid;
  gap: .15rem;
}

.comparison-lab__group-title strong {
  font-weight: 850;
}

.comparison-lab__group-title small {
  color: var(--comparison-muted);
  font-weight: 650;
}

.comparison-lab__group-toggle {
  display: inline-flex;
  min-width: 6.5rem;
  align-items: center;
  justify-content: flex-end;
  gap: .45rem;
  color: var(--comparison-accent);
  font-size: .78rem;
  font-weight: 850;
}

.comparison-lab__group-chevron {
  display: grid;
  width: 2rem;
  height: 2rem;
  place-items: center;
  border: 1px solid var(--comparison-line);
  border-radius: 999px;
  background: var(--comparison-surface);
  font-size: 1.2rem;
  transition: transform .18s ease;
}

.comparison-lab__group-state--open {
  display: none;
}

.comparison-lab__group[open] .comparison-lab__group-state--closed {
  display: none;
}

.comparison-lab__group[open] .comparison-lab__group-state--open {
  display: inline;
}

.comparison-lab__group[open] .comparison-lab__group-chevron {
  transform: rotate(180deg);
}`,
    "Accordion-CSS"
  );
} else {
  log("Unverändert: Accordion-CSS bereits vorhanden");
}

if (!/@media \(max-width: 47\.99rem\)[\s\S]*?\.comparison-lab__group-state\s*\{/.test(css)) {
  css = replaceOnce(
    css,
    /(\s+\.comparison-lab__sticky-products \{\s+top: 3\.75rem;\s+\})/m,
    `$1

  .comparison-lab__group > summary {
    min-height: 4.25rem;
    padding: .75rem;
  }

  .comparison-lab__group-toggle {
    min-width: auto;
  }

  .comparison-lab__group-state {
    display: none !important;
  }

  .comparison-lab__group-chevron {
    width: 2.35rem;
    height: 2.35rem;
    font-size: 1.35rem;
  }`,
    "mobiles Accordion-CSS"
  );
} else {
  log("Unverändert: mobiles Accordion-CSS bereits vorhanden");
}

fs.writeFileSync(abs(files.explorerCss), css, "utf8");
log(`Geändert: ${files.explorerCss}`);

/* 4. Header */
let header = fs.readFileSync(abs(files.header), "utf8");

header = header.replace(
  /const desktop = window\.matchMedia\("\(min-width: 64rem\)"\);/,
  'const desktop = window.matchMedia("(min-width: 48rem)");'
);
header = header.replaceAll("@media (min-width: 64rem)", "@media (min-width: 48rem)");
header = header.replaceAll("@media (max-width: 63.99rem)", "@media (max-width: 47.99rem)");

if (!header.includes('window.matchMedia("(min-width: 48rem)")')) {
  fail("Header-JS-Breakpoint konnte nicht gesetzt werden.");
}
if (!header.includes("@media (max-width: 47.99rem)")) {
  fail("Header-CSS-Breakpoint konnte nicht gesetzt werden.");
}

fs.writeFileSync(abs(files.header), header, "utf8");
log(`Geändert: ${files.header}`);

log(`Backup: ${path.relative(ROOT, backupDir)}`);

if (runChecks) {
  const checks = [
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:components:audit"]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:responsive:audit"]],
    ["npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:audit:strict"]],
    ["npm", ["run", "build:pfotentechnik"]]
  ];

  for (const [command, args] of checks) {
    try {
      run(command, args);
    } catch {
      fail(
        `Validierung fehlgeschlagen: ${command} ${args.join(" ")}\n` +
        `Backup: ${path.relative(ROOT, backupDir)}`
      );
    }
  }
}

log("Abgeschlossen.");

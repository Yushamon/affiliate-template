#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const PATCH = "pfotentechnik-comparison-ux-header-cleanup-19.3.0";
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

function replaceRequired(source, before, after, label) {
  if (!source.includes(before)) {
    fail(`Erwarteter Anker fehlt: ${label}`);
  }
  return source.replace(before, after);
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

/* 1. Kaufberatung: Anzahl und sichtbare Kriterien konsistent machen */
let insight = fs.readFileSync(abs(files.insight), "utf8");

insight = replaceRequired(
  insight,
  `const strongestDifferences = meaningfulRows.slice(0, 5);`,
  `const strongestDifferences = meaningfulRows;`,
  "strongestDifferences.slice(0, 5)"
);

insight = replaceRequired(
  insight,
  `    ? \`\${meaningfulRows.length} Kriterien unterscheiden die Modelle tatsächlich. Konzentriere dich vor allem auf die Punkte unten.\``,
  `    ? \`\${meaningfulRows.length} Kriterien unterscheiden die Modelle tatsächlich. Alle relevanten Punkte findest du direkt unten.\``,
  "Entscheidungshinweis"
);

insight = replaceRequired(
  insight,
  `<article>
          <span aria-hidden="true">{String(index + 1).padStart(2, "0")}</span>
          <div>
            <h3>{row.criterion.label}</h3>
            <p>
              {row.criterion.description ??
                "Prüfe im Direktvergleich, welche Ausprägung zu deinem Alltag und deinen Anforderungen passt."}
            </p>
          </div>
          <a href="#direktvergleich">Vergleichen</a>
        </article>`,
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
  "Kriterienkarte"
);

fs.writeFileSync(abs(files.insight), insight, "utf8");
log(`Geändert: ${files.insight}`);

/* 2. Direktvergleich: Desktop offen, mobile klarer Accordion-Status */
let explorer = fs.readFileSync(abs(files.explorer), "utf8");

explorer = replaceRequired(
  explorer,
  `<details class="comparison-lab__group" open={groupIndex < 2}>`,
  `<details
          class="comparison-lab__group"
          open
          data-comparison-group
          data-group-index={groupIndex}
        >`,
  "Comparison-Gruppen"
);

explorer = replaceRequired(
  explorer,
  `<summary>
            <span>{group}</span>
            <small>{groupRows.length} Kriterien</small>
          </summary>`,
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
  "Accordion-Summary"
);

explorer = replaceRequired(
  explorer,
  `    render();
  });
</script>`,
  `    const groups = Array.from(
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
</script>`,
  "Explorer-Script-Ende"
);

fs.writeFileSync(abs(files.explorer), explorer, "utf8");
log(`Geändert: ${files.explorer}`);

/* 3. Direktvergleich-CSS: sichtbare Accordion-Affordance */
let explorerCss = fs.readFileSync(abs(files.explorerCss), "utf8");

explorerCss = replaceRequired(
  explorerCss,
  `.comparison-lab__group > summary {
  position: sticky;
  z-index: 3;
  left: 0;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .75rem;
  padding: .85rem 1rem;
  color: var(--comparison-text);
  background: var(--comparison-surface-soft);
  font-weight: 850;
  cursor: pointer;
}

.comparison-lab__group > summary small {
  color: var(--comparison-muted);
  font-weight: 650;
}`,
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

explorerCss = replaceRequired(
  explorerCss,
  `  .comparison-lab__sticky-products {
    top: 3.75rem;
  }`,
  `  .comparison-lab__sticky-products {
    top: 3.75rem;
  }

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
  "Mobile Accordion-CSS"
);

fs.writeFileSync(abs(files.explorerCss), explorerCss, "utf8");
log(`Geändert: ${files.explorerCss}`);

/* 4. Header: Desktop-Navigation früher aktivieren, Burger nur echte Mobile-Breiten */
let header = fs.readFileSync(abs(files.header), "utf8");

header = replaceRequired(
  header,
  `const desktop = window.matchMedia("(min-width: 64rem)");`,
  `const desktop = window.matchMedia("(min-width: 48rem)");`,
  "Header JS Breakpoint"
);

header = header.replaceAll(
  `@media (min-width: 64rem)`,
  `@media (min-width: 48rem)`
);

header = header.replaceAll(
  `@media (max-width: 63.99rem)`,
  `@media (max-width: 47.99rem)`
);

if (!header.includes(`@media (min-width: 48rem)`)) {
  fail("Header-Desktop-Breakpoint konnte nicht aktualisiert werden.");
}

fs.writeFileSync(abs(files.header), header, "utf8");
log(`Geändert: ${files.header}`);

log("Umgesetzt:");
log("- alle angekündigten Kaufkriterien werden angezeigt");
log("- kompakte, vollständig klickbare Kriterienkarten");
log("- Direktvergleich Desktop vollständig geöffnet");
log("- Direktvergleich Mobile erste Gruppe offen, klare Chevron-Bedienung");
log("- Desktop-/Tablet-Header zeigt Navigation statt großem Burger/X");
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
        `Die Änderungen bleiben zur Prüfung erhalten. Backup: ${path.relative(ROOT, backupDir)}`
      );
    }
  }
}

log("Abgeschlossen.");

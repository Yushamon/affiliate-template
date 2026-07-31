#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-topical-authority-journey-model-sync-22.10.11";
const SKIP_BUILD = process.argv.includes("--skip-build");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PAGE = path.join(APP, "src", "pages", "admin", "seo", "topical-authority.astro");
const REGISTRY = path.join(APP, "src", "domain", "decisionJourney", "registry.ts");
const TEST = path.join(APP, "test", "topical-authority-journey-model.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const REPORT = path.join(APP, "reports", "seo-copilot", "topical-authority-journey-model-22.10.11.md");
const BACKUP = path.join(
  ROOT,
  ".patch-backups",
  NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"),
);

const log = (message) => console.log("[" + NAME + "] " + message);

function quoteCmdArg(value) {
  const text = String(value);
  if (!/[\s"&|<>^()%!]/.test(text)) return text;
  return '"' + text.replace(/"/g, '""') + '"';
}

function runNpm(args) {
  if (process.platform === "win32") {
    const command = ["npm", ...args].map(quoteCmdArg).join(" ");
    execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", command], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
      windowsHide: true,
    });
    return;
  }

  execFileSync("npm", args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
}

for (const file of [PAGE, REGISTRY, PACKAGE]) {
  if (!fs.existsSync(file)) {
    throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, file));
  }
}

let page = fs.readFileSync(PAGE, "utf8");
let registry = fs.readFileSync(REGISTRY, "utf8");

/* ---------------------------------------------------- */
/* Gemeinsame Journey-Stufen als einzige Wahrheitsquelle */
/* ---------------------------------------------------- */

if (!registry.includes("export const DECISION_STAGE_ORDER")) {
  const stageTypeEnd = `  | "support";`;

  if (!registry.includes(stageTypeEnd)) {
    throw new Error("DecisionStage-Definition entspricht keinem geprüften Stand.");
  }

  registry = registry.replace(
    stageTypeEnd,
    `${stageTypeEnd}

export const DECISION_STAGE_ORDER = Object.freeze([
  "orientation",
  "problem",
  "evaluation",
  "decision",
  "support",
] satisfies readonly DecisionStage[]);`,
  );
}

/* ------------------------------------------------ */
/* Topical Authority nutzt dieselbe Journey-Registry */
/* ------------------------------------------------ */

const importAnchor =
  'import { loadTopicalAuthority } from "../../../lib/seo/topical-authority/loadTopicalAuthority";';

if (!page.includes("DECISION_STAGE_ORDER") || !page.includes("getStageLabel")) {
  if (!page.includes(importAnchor)) {
    throw new Error("Importanker in topical-authority.astro wurde nicht gefunden.");
  }

  page = page.replace(
    importAnchor,
    `${importAnchor}
import {
  DECISION_STAGE_ORDER,
  getStageLabel,
} from "../../../domain/decisionJourney/registry";`,
  );
}

const legacyJourney =
  `<div class="ta-journey" aria-label="Empfohlene interne User Journey">
        <span>Ratgeber</span><b>→</b><span>Vergleich</span><b>→</b><span>Produkt</span><b>→</b><span>Hersteller</span><b>→</b><span>passender Ratgeber</span>
      </div>`;

const newJourney =
  `<div class="ta-journey" aria-label="Globales Decision-Journey-Modell">
        {DECISION_STAGE_ORDER.map((stage, index) => (
          <>
            {index > 0 && <b aria-hidden="true">→</b>}
            <span data-journey-stage={stage}>{getStageLabel(stage)}</span>
          </>
        ))}
      </div>
      <p class="ta-journey-note">
        Seitentypen sind keine feste Reihenfolge. Ratgeber, Vergleiche und Produkte
        führen abhängig von Suchintention und Entscheidungsstand zum nächsten
        sinnvollen Schritt.
      </p>`;

if (page.includes(legacyJourney)) {
  page = page.replace(legacyJourney, newJourney);
} else if (!page.includes('aria-label="Globales Decision-Journey-Modell"')) {
  throw new Error("Legacy-Journey in topical-authority.astro wurde nicht sicher gefunden.");
}

if (!page.includes(".ta-journey-note")) {
  const cssAnchor =
    ".ta-journey{display:flex;align-items:center;flex-wrap:wrap;gap:.5rem}.ta-journey span{padding:.65rem .8rem;border-radius:.75rem;background:var(--seo-surface-subtle,#f3f5f8);font-weight:700}";

  if (!page.includes(cssAnchor)) {
    throw new Error("CSS-Anker der Topical-Authority-Journey wurde nicht gefunden.");
  }

  page = page.replace(
    cssAnchor,
    `${cssAnchor}
  .ta-journey-note{max-width:72ch;margin:.85rem 0 0;color:var(--seo-text-muted,#5f6875);line-height:1.55}`,
  );
}

/* ---------------- */
/* Regressionstests */
/* ---------------- */

const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const app = path.join(ROOT, "apps", "pfotentechnik");
const page = fs.readFileSync(
  path.join(app, "src", "pages", "admin", "seo", "topical-authority.astro"),
  "utf8",
);
const registry = fs.readFileSync(
  path.join(app, "src", "domain", "decisionJourney", "registry.ts"),
  "utf8",
);

test("Topical Authority nutzt die globale Decision-Journey-Registry", () => {
  assert.ok(page.includes("DECISION_STAGE_ORDER"));
  assert.ok(page.includes("getStageLabel"));
  assert.ok(page.includes("DECISION_STAGE_ORDER.map"));
});

test("Legacy-Seitentyp-Kette wird nicht mehr angezeigt", () => {
  assert.ok(!page.includes("<span>Ratgeber</span><b>→</b><span>Vergleich</span>"));
  assert.ok(!page.includes("<span>Hersteller</span>"));
  assert.ok(!page.includes("<span>passender Ratgeber</span>"));
});

test("Globale Journey enthält alle fünf Entscheidungsstufen", () => {
  for (const stage of [
    '"orientation"',
    '"problem"',
    '"evaluation"',
    '"decision"',
    '"support"',
  ]) {
    assert.ok(registry.includes(stage), "Fehlt: " + stage);
  }

  assert.ok(registry.includes("export const DECISION_STAGE_ORDER"));
});

test("Topical Authority erklärt, dass Seitentypen keine starre Reihenfolge sind", () => {
  assert.ok(page.includes("Seitentypen sind keine feste Reihenfolge"));
  assert.ok(page.includes("Suchintention und Entscheidungsstand"));
});
`;

const packageJson = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
packageJson.scripts ||= {};
packageJson.scripts["test:topical-authority:journey-model"] =
  "node --test test/topical-authority-journey-model.test.mjs";
const packageAfter = JSON.stringify(packageJson, null, 2) + "\n";

const reportContent = `# Topical Authority Journey Model Sync 22.10.11

## Behoben

Die Topical-Authority-Seite zeigte noch die alte starre Seitentyp-Kette:

\`Ratgeber → Vergleich → Produkt → Hersteller → passender Ratgeber\`

Diese Darstellung widersprach dem bereits produktiven globalen
Decision-Journey-Modell.

## Neues Modell

- Orientierung
- Problem klären
- Optionen bewerten
- Entscheidung
- Nutzung und Support

Die Anzeige liest diese Stufen nun direkt aus der zentralen
Decision-Journey-Registry. Seitentypen werden nicht mehr fälschlich als
zwingende lineare Abfolge dargestellt.
`;

const desired = new Map([
  [REGISTRY, registry],
  [PAGE, page],
  [TEST, testContent],
  [PACKAGE, packageAfter],
  [REPORT, reportContent],
]);

const changes = [];
for (const [file, content] of desired) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current !== content) changes.push({ file, current, content });
}

fs.mkdirSync(BACKUP, { recursive: true });

try {
  for (const change of changes) {
    const relative = path.relative(ROOT, change.file);

    if (change.current !== null) {
      const backupFile = path.join(BACKUP, relative);
      fs.mkdirSync(path.dirname(backupFile), { recursive: true });
      fs.writeFileSync(backupFile, change.current);
    }

    fs.mkdirSync(path.dirname(change.file), { recursive: true });
    fs.writeFileSync(change.file, change.content);
    log("Geschrieben: " + relative);
  }

  runNpm([
    "--workspace",
    "apps/pfotentechnik",
    "run",
    "test:topical-authority:journey-model",
  ]);

  for (const script of [
    "test:decision-journey",
    "test:seo-copilot",
    "test:css-admin-architecture",
  ]) {
    if (packageJson.scripts?.[script]) {
      runNpm([
        "--workspace",
        "apps/pfotentechnik",
        "run",
        script,
      ]);
    }
  }

  if (!SKIP_BUILD) {
    runNpm([
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "build",
    ]);
  }

  log("BESTANDEN.");
  log("Report: " + path.relative(ROOT, REPORT));
  log("Backup: " + path.relative(ROOT, BACKUP));
} catch (error) {
  log("FEHLER: " + error.message);
  log("Rollback wird ausgeführt.");

  for (const change of [...changes].reverse()) {
    if (change.current === null) {
      if (fs.existsSync(change.file)) fs.unlinkSync(change.file);
    } else {
      fs.mkdirSync(path.dirname(change.file), { recursive: true });
      fs.writeFileSync(change.file, change.current);
    }
  }

  process.exitCode = 1;
}

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-comparison-controls-lightmode-32.1.1";
const root = process.cwd();
const cssFile = path.join(
  root,
  "packages/affiliate-core/src/components/comparison/comparison-experience.css"
);
const testFile = path.join(
  root,
  "apps/pfotentechnik/test/pfotentechnik-comparison-controls-lightmode-32.1.1.test.mjs"
);
const installerFile = path.join(
  root,
  "3/apply-pfotentechnik-comparison-controls-lightmode-32.1.1.mjs"
);

const CSS_BLOCK = "\n/* Comparison controls and light sticky CTA 32.1.1 */\n\n/* Checkbox owner: prevents global .pt-control rules from turning checkboxes into long pills. */\n.comparison-control-box {\n  display: inline-grid;\n  flex: 0 0 1.25rem;\n  width: 1.25rem;\n  height: 1.25rem;\n  min-width: 1.25rem;\n  min-height: 1.25rem;\n  place-items: center;\n  padding: 0;\n  border: 1px solid var(--pt-color-border-strong, var(--pt-color-border));\n  border-radius: .3rem;\n  color: var(--pt-color-action-text);\n  background: var(--pt-color-surface);\n  box-shadow: none;\n}\n\ninput:checked + .comparison-control-box {\n  border-color: var(--pt-color-action-bg);\n  background: var(--pt-color-action-bg);\n}\n\ninput:checked + .comparison-control-box::after {\n  color: var(--pt-color-action-text);\n  font-size: .8rem;\n  font-weight: 900;\n  line-height: 1;\n  content: \"✓\";\n}\n\n.comparison-lab__differences > input,\n.comparison-lab__filter-groups label > input {\n  position: absolute;\n  width: 1px;\n  height: 1px;\n  overflow: hidden;\n  opacity: 0;\n  pointer-events: none;\n}\n\n/* Toolbar */\n.comparison-lab__toolbar {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) auto;\n  gap: .75rem;\n  align-items: center;\n  padding: .875rem;\n}\n\n.comparison-lab__filter-button {\n  width: 100%;\n}\n\n.comparison-lab__differences {\n  display: inline-flex;\n  min-height: 44px;\n  align-items: center;\n  gap: .55rem;\n  color: var(--pt-color-text);\n  font-size: .85rem;\n  font-weight: 750;\n  white-space: nowrap;\n}\n\n.comparison-lab__reset {\n  grid-column: 1 / -1;\n  justify-self: start;\n  min-height: 40px;\n  padding: 0;\n  border: 0;\n  color: var(--pt-color-text-muted);\n  background: transparent;\n  font: inherit;\n  font-size: .82rem;\n  font-weight: 700;\n  text-decoration: underline;\n  text-underline-offset: .2em;\n}\n\n/* Drawer */\n.comparison-lab__filters {\n  width: min(100%, 27rem);\n  padding: 1rem;\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface);\n}\n\n.comparison-lab__filter-header {\n  position: sticky;\n  top: -1rem;\n  z-index: 2;\n  margin: -1rem -1rem 1rem;\n  padding: 1rem;\n  border-bottom: 1px solid var(--pt-color-border);\n  background: var(--pt-color-surface);\n}\n\n.comparison-lab__filter-header small {\n  color: var(--pt-color-text-muted);\n}\n\n.comparison-lab__filter-header button {\n  display: inline-grid;\n  flex: 0 0 2.75rem;\n  width: 2.75rem;\n  height: 2.75rem;\n  place-items: center;\n  padding: 0;\n  border: 1px solid var(--pt-color-border);\n  border-radius: 999px;\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface-raised);\n  font-size: 1.5rem;\n}\n\n.comparison-lab__clear-filters {\n  width: 100%;\n  min-height: 46px;\n  margin-bottom: 1rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-md, .75rem);\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface-raised);\n}\n\n.comparison-lab__filter-groups {\n  gap: 1rem;\n}\n\n.comparison-lab__filter-groups fieldset {\n  gap: .25rem;\n  padding: .75rem;\n  background: var(--pt-color-surface-raised);\n}\n\n.comparison-lab__filter-groups legend {\n  padding-inline: .25rem;\n  font-size: .95rem;\n}\n\n.comparison-lab__filter-groups label {\n  position: relative;\n  display: grid;\n  grid-template-columns: 1.25rem minmax(0, 1fr);\n  min-height: 44px;\n  align-items: center;\n  gap: .7rem;\n  padding: .55rem .35rem;\n  border-top: 1px solid var(--pt-color-border);\n  color: var(--pt-color-text);\n  line-height: 1.35;\n}\n\n.comparison-lab__filter-groups label:first-of-type {\n  border-top: 0;\n}\n\n.comparison-lab__filter-groups label > span:last-child {\n  min-width: 0;\n}\n\n/* Light mode follows the same global surface tokens as every other card.\n   The tokens change automatically in dark mode. */\n.comparison-sticky-bar {\n  color: var(--pt-color-text);\n  border-color: var(--pt-color-border);\n  background: var(--pt-color-surface);\n  box-shadow: var(--pt-shadow-card, 0 12px 32px rgb(0 0 0 / .12));\n}\n\n.comparison-sticky-bar__identity,\n.comparison-sticky-bar__identity strong {\n  color: var(--pt-color-text);\n}\n\n.comparison-sticky-bar__identity span {\n  color: var(--pt-color-text-muted);\n}\n\n@media (min-width: 48rem) {\n  .comparison-lab__toolbar {\n    grid-template-columns: auto auto minmax(0, 1fr);\n  }\n\n  .comparison-lab__filter-button {\n    width: auto;\n  }\n\n  .comparison-lab__reset {\n    grid-column: auto;\n    justify-self: end;\n  }\n}\n";
const TEST_SOURCE = "import test from \"node:test\";\nimport assert from \"node:assert/strict\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\n\nconst root = process.cwd();\nconst file = path.join(\n  root,\n  \"packages/affiliate-core/src/components/comparison/comparison-experience.css\"\n);\nconst css = fs.readFileSync(file, \"utf8\");\n\ntest(\"Checkboxen besitzen einen festen kompakten Owner\", () => {\n  assert.match(css, /\\.comparison-control-box\\s*\\{[^}]*flex:\\s*0 0 1\\.25rem/s);\n  assert.match(css, /\\.comparison-control-box\\s*\\{[^}]*width:\\s*1\\.25rem/s);\n  assert.match(css, /input:checked \\+ \\.comparison-control-box::after/);\n});\n\ntest(\"native Checkboxen werden visuell verborgen\", () => {\n  assert.match(\n    css,\n    /\\.comparison-lab__filter-groups label > input\\s*\\{[^}]*opacity:\\s*0/s\n  );\n});\n\ntest(\"Filterzeilen sind zweispaltig statt pillenförmig\", () => {\n  assert.match(\n    css,\n    /\\.comparison-lab__filter-groups label\\s*\\{[^}]*grid-template-columns:\\s*1\\.25rem minmax\\(0,\\s*1fr\\)/s\n  );\n  assert.match(css, /\\.comparison-lab__filter-groups fieldset\\s*\\{[^}]*background:\\s*var\\(--pt-color-surface-raised\\)/s);\n});\n\ntest(\"Sticky CTA verwendet im Light Mode globale helle Surface\", () => {\n  assert.match(\n    css,\n    /\\.comparison-sticky-bar\\s*\\{[^}]*background:\\s*var\\(--pt-color-surface\\)/s\n  );\n  assert.match(\n    css,\n    /\\.comparison-sticky-bar__identity strong\\s*\\{[^}]*color:\\s*var\\(--pt-color-text\\)/s\n  );\n});\n\ntest(\"keine Theme-Sonderselektoren\", () => {\n  const patch = css.split(\"/* Comparison controls and light sticky CTA 32.1.1 */\").pop() ?? \"\";\n  assert.doesNotMatch(patch, /\\.theme-dark\\b|\\.dark\\b|\\[data-theme/);\n});\n\ntest(\"keine neuen important-Regeln\", () => {\n  const patch = css.split(\"/* Comparison controls and light sticky CTA 32.1.1 */\").pop() ?? \"\";\n  assert.doesNotMatch(patch, /!important/);\n});\n";

if (!fs.existsSync(cssFile)) {
  throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${path.relative(root, cssFile)}`);
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backup = path.join(root, ".patch-backups", `${PATCH}-${stamp}`);
const touched = [cssFile, testFile];
const existed = new Map(touched.map((file) => [file, fs.existsSync(file)]));

const backupFile = (file) => {
  if (!fs.existsSync(file)) return;
  const target = path.join(backup, path.relative(root, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
};

const rollback = () => {
  for (const file of touched) {
    const source = path.join(backup, path.relative(root, file));
    if (fs.existsSync(source)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(source, file);
    } else if (!existed.get(file) && fs.existsSync(file)) {
      fs.rmSync(file);
    }
  }
};

const run = (cmd, args) => {
  console.log(`[${PATCH}] ${cmd} ${args.join(" ")}`);
  const result = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });
  if (result.status !== 0) {
    throw new Error(`[${PATCH}] Befehl fehlgeschlagen: ${cmd} ${args.join(" ")}`);
  }
};

try {
  touched.forEach(backupFile);
  console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);

  let css = fs.readFileSync(cssFile, "utf8");
  css = css.replace(
    /\n?\/\* Comparison controls and light sticky CTA 32\.1\.1 \*\/[\s\S]*$/m,
    ""
  );
  css = `${css.trim()}\n\n${CSS_BLOCK.trim()}\n`;
  fs.writeFileSync(cssFile, css, "utf8");

  fs.mkdirSync(path.dirname(testFile), { recursive: true });
  fs.writeFileSync(testFile, TEST_SOURCE.trimStart(), "utf8");

  run(process.execPath, ["--check", installerFile]);
  run(process.execPath, ["--check", testFile]);
  run(process.execPath, ["--test", testFile]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);

  console.log(`[${PATCH}] Erfolgreich abgeschlossen.`);
} catch (error) {
  rollback();
  console.error(`[${PATCH}] Fehler. Änderungen wurden zurückgerollt.`);
  console.error(error);
  process.exitCode = 1;
}

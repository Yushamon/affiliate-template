#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const VERSION = "3.2.1";
const CHECK = process.argv.includes("--check");
const FILES = {
  scenario: "apps/pfotentechnik/src/components/comparison/ScenarioRecommendations.astro",
  sticky: "packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro"
};
const STYLE_START = "/* comparison-stickybar-theme-3.2.1 */";
const STYLE_END = "/* end comparison-stickybar-theme-3.2.1 */";

function findRoot(start = process.cwd()) {
  let current = path.resolve(start);
  while (true) {
    if (fs.existsSync(path.join(current, FILES.scenario)) && fs.existsSync(path.join(current, FILES.sticky))) return current;
    const parent = path.dirname(current);
    if (parent === current) throw new Error("Repository-Wurzel nicht gefunden.");
    current = parent;
  }
}
function read(root, rel) { return fs.readFileSync(path.join(root, rel), "utf8"); }
function assertContains(content, rel, fragments) {
  const missing = fragments.filter((fragment) => !content.includes(fragment));
  if (missing.length) throw new Error(`${rel}: unbekannter Repository-Stand. Fehlend: ${missing.join(", ")}`);
}
function removeMarkedBlock(content) {
  const start = content.indexOf(STYLE_START);
  if (start === -1) return content;
  const end = content.indexOf(STYLE_END, start);
  if (end === -1) throw new Error("Vorhandener Sticky-Bar-Styleblock ist unvollständig.");
  return content.slice(0, start).trimEnd() + "\n" + content.slice(end + STYLE_END.length).trimStart();
}

const root = findRoot();
const scenarioSource = read(root, FILES.scenario);
const stickySource = read(root, FILES.sticky);
assertContains(scenarioSource, FILES.scenario, ["scenario.score", "scenario-meta", "scenario.alternative"]);
assertContains(stickySource, FILES.sticky, ['class="comparison-sticky-bar"', 'comparison-button--secondary', "price?.url"]);

let scenarioNext = scenarioSource.replace(
  /<span>Score \{Math\.round\(scenario\.score\)\}<\/span>/,
  '<span class="scenario-match">Beste Übereinstimmung</span>'
);
if (!scenarioNext.includes('class="scenario-match"')) throw new Error(`${FILES.scenario}: Score-Ausgabe konnte nicht sicher ersetzt werden.`);

let stickyNext = removeMarkedBlock(stickySource);
const stickyCss = `
<style is:global>
${STYLE_START}
.comparison-sticky-bar {
  position: fixed;
  z-index: 90;
  right: max(1rem, env(safe-area-inset-right));
  bottom: max(1rem, env(safe-area-inset-bottom));
  left: max(1rem, env(safe-area-inset-left));
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  align-items: center;
  gap: 1rem;
  width: auto;
  max-width: 1180px;
  margin-inline: auto;
  padding: .8rem;
  border: 1px solid var(--comparison-line);
  border-radius: 1.15rem;
  color: var(--comparison-text);
  background: color-mix(in srgb, var(--comparison-surface) 96%, transparent);
  box-shadow: 0 -10px 35px rgba(20, 32, 26, .12);
  backdrop-filter: blur(16px);
}
.comparison-sticky-bar > div { min-width: 0; }
.comparison-sticky-bar > div:first-child { display: grid; gap: .12rem; padding-inline: .25rem; }
.comparison-sticky-bar > div:first-child span { color: var(--comparison-muted); font-size: .72rem; font-weight: 750; line-height: 1.2; }
.comparison-sticky-bar > div:first-child strong { min-width: 0; overflow: hidden; color: var(--comparison-text); font-size: .95rem; line-height: 1.25; text-overflow: ellipsis; white-space: nowrap; }
.comparison-sticky-bar > div:last-child { display: grid; grid-template-columns: repeat(2, minmax(138px, auto)); gap: .65rem; }
.comparison-sticky-bar .comparison-button { min-height: 46px; padding-inline: 1.1rem; }
.comparison-sticky-bar .comparison-button--secondary {
  color: var(--comparison-accent) !important;
  border-color: color-mix(in srgb, var(--comparison-accent) 42%, var(--comparison-line)) !important;
  background: var(--comparison-surface) !important;
}
.comparison-sticky-bar .comparison-button--secondary:hover { color: var(--comparison-text) !important; background: var(--comparison-surface-soft) !important; }
.comparison-sticky-bar .comparison-button:focus-visible { outline: 3px solid var(--comparison-focus); outline-offset: 2px; }
.scenario-match { color: var(--comparison-accent); }
@media (max-width: 760px) {
  .comparison-sticky-bar { right: .75rem; bottom: max(.75rem, env(safe-area-inset-bottom)); left: .75rem; grid-template-columns: minmax(0, 1fr); gap: .65rem; padding: .65rem; border-radius: 1rem; }
  .comparison-sticky-bar > div:first-child { display: none; }
  .comparison-sticky-bar > div:last-child { grid-template-columns: minmax(0, .82fr) minmax(0, 1.45fr); width: 100%; }
  .comparison-sticky-bar .comparison-button { width: 100%; min-width: 0; min-height: 48px; padding: .7rem .65rem; font-size: .82rem; line-height: 1.2; }
}
@media (max-width: 390px) { .comparison-sticky-bar > div:last-child { grid-template-columns: minmax(0, 1fr); } }
html[data-theme="dark"] .comparison-sticky-bar,
html.dark .comparison-sticky-bar,
body.dark .comparison-sticky-bar,
[data-theme="dark"] .comparison-sticky-bar {
  border-color: var(--comparison-line);
  color: var(--comparison-text);
  background: color-mix(in srgb, var(--comparison-surface-raised) 96%, transparent);
  box-shadow: 0 -12px 38px rgba(0, 0, 0, .34);
}
@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]):not(.light) .comparison-sticky-bar {
    border-color: var(--comparison-line);
    color: var(--comparison-text);
    background: color-mix(in srgb, var(--comparison-surface-raised) 96%, transparent);
    box-shadow: 0 -12px 38px rgba(0, 0, 0, .34);
  }
}
${STYLE_END}
</style>`;
stickyNext = stickyNext.trimEnd() + "\n\n" + stickyCss.trim() + "\n";

const changes = [
  [FILES.scenario, scenarioSource, scenarioNext],
  [FILES.sticky, stickySource, stickyNext]
].filter(([, before, after]) => before !== after);
console.log(`[comparison-score-stickybar-${VERSION}] Repository: ${root}`);
console.log(`[comparison-score-stickybar-${VERSION}] Modus: ${CHECK ? "--check" : "installieren"}`);
if (!changes.length) { console.log("Bereits vollständig installiert."); process.exit(0); }
for (const [rel] of changes) console.log(`- ${rel}`);
if (CHECK) { console.log(`Check erfolgreich. ${changes.length} Datei(en) würden geändert.`); process.exit(0); }
const backupRoot = path.join(root, ".patch-backups", `comparison-score-stickybar-${VERSION}-${Date.now()}`);
for (const [rel] of changes) {
  const source = path.join(root, rel);
  const backup = path.join(backupRoot, rel);
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(source, backup);
}
for (const [rel, , after] of changes) fs.writeFileSync(path.join(root, rel), after, "utf8");
console.log("Patch erfolgreich installiert.");
console.log(`Backup: ${backupRoot}`);
console.log("Jetzt ausführen:");
console.log("  npm run build:pfotentechnik");

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-visual-qa-foundation-11.7.0";
const args = new Set(process.argv.slice(2));
const NO_BUILD = args.has("--no-build");
const STRICT = args.has("--strict");
const NO_COMMIT = args.has("--no-commit");

const log = (m) => console.log(`[${NAME}] ${m}`);
const fail = (m) => {
  console.error(`[${NAME}] FEHLER: ${m}`);
  process.exit(1);
};

function findRoot(start) {
  let dir = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(dir, "package.json")) &&
      fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))
    ) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) return null;
    dir = parent;
  }
}

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = findRoot(process.cwd()) || findRoot(scriptDir);
if (!root) fail("Repository-Root nicht gefunden.");

const app = path.join(root, "apps", "pfotentechnik");
const dist = path.join(app, "dist");
const scriptsDir = path.join(app, "scripts", "design-system");
const qaScript = path.join(scriptsDir, "visual-qa.mjs");
const packageFile = path.join(app, "package.json");
const reportDir = path.join(app, "reports", "design-system");
const reportMd = path.join(reportDir, "visual-qa-11.7.0.md");
const reportJson = path.join(reportDir, "visual-qa-11.7.0.json");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

function rel(file) {
  return path.relative(root, file).split(path.sep).join("/");
}
function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}
function read(file) {
  return fs.readFileSync(file, "utf8");
}
function backup(file) {
  if (!fs.existsSync(file)) return;
  const target = path.join(backupRoot, rel(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}
function write(file, content) {
  const old = fs.existsSync(file) ? read(file) : null;
  if (old === content) return false;
  if (old !== null) backup(file);
  ensureDir(path.dirname(file));
  fs.writeFileSync(file, content);
  return true;
}
function run(cmd, argv) {
  return spawnSync(cmd, argv, {
    cwd: root,
    stdio: "inherit",
    shell: false,
  }).status === 0;
}

const qaSource = `#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const args = new Set(process.argv.slice(2));
const STRICT = args.has("--strict");
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const appRoot = path.resolve(scriptDir, "..", "..");
const distRoot = path.join(appRoot, "dist");
const reportDir = path.join(appRoot, "reports", "design-system");
const reportJson = path.join(reportDir, "visual-qa-latest.json");
const reportMd = path.join(reportDir, "visual-qa-latest.md");

if (!fs.existsSync(distRoot)) {
  console.error("dist fehlt. Zuerst npm run build:pfotentechnik ausführen.");
  process.exit(1);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(file) : [file];
  });
}
function count(text, regex) {
  return (text.match(regex) || []).length;
}
function routeFor(file) {
  const relative = path.relative(distRoot, file).split(path.sep).join("/");
  if (relative === "index.html") return "/";
  return "/" + relative.replace(/\\/index\\.html$/, "/").replace(/\\.html$/, "/");
}
function classify(route) {
  if (route === "/") return "Startseite";
  if (route.startsWith("/produkte/") || route.startsWith("/produkt/")) return "Produkt";
  if (route.startsWith("/vergleiche/")) return "Vergleich";
  if (route.startsWith("/hersteller/")) return "Hersteller";
  if (route.startsWith("/admin/")) return "Admin";
  if (route.includes("kaufberatung")) return "Kaufberatung";
  return "Ratgeber";
}

const htmlFiles = walk(distRoot).filter((file) => file.endsWith(".html"));
const pages = [];
const totals = {
  pages: 0,
  types: {},
  warnings: 0,
  severe: 0,
};

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const route = routeFor(file);
  const type = classify(route);
  const findings = [];

  const buttons = count(html, /<(?:a|button)\\b[^>]*(?:class="[^"]*(?:button|btn|cta)[^"]*"|role="button")[^>]*>/gi);
  const primitiveButtons = count(html, /<(?:a|button)\\b[^>]*class="[^"]*pt-button[^"]*"[^>]*>/gi);
  const chips = count(html, /class="[^"]*(?:chip|pill|tag)[^"]*"/gi);
  const primitiveChips = count(html, /class="[^"]*pt-chip[^"]*"/gi);
  const surfaces = count(html, /class="[^"]*(?:pt-surface|card|panel)[^"]*"/gi);
  const nestedSurfaceRisk = count(
    html,
    /class="[^"]*(?:pt-surface|card|panel)[^"]*"[^>]*>[\\s\\S]{0,1200}?class="[^"]*(?:pt-surface|card|panel)[^"]*"/gi
  );
  const inlineWidths = count(html, /style="[^"]*(?:width|min-width|max-width)\\s*:/gi);
  const fixedWidths = count(html, /style="[^"]*width\\s*:\\s*\\d{3,}px/gi);
  const overflowHidden = count(html, /(?:overflow-x-hidden|overflow:\\s*hidden|overflow-x:\\s*hidden)/gi);
  const largeImagesWithoutSizes = count(
    html,
    /<img\\b(?![^>]*(?:width=|height=))[^>]*>/gi
  );
  const headings = count(html, /<h[1-6]\\b/gi);
  const h1 = count(html, /<h1\\b/gi);
  const main = count(html, /<main\\b/gi);
  const darkMarkers = count(
    html,
    /(?:data-theme|theme-toggle|dark-mode|prefers-color-scheme)/gi
  );

  if (h1 !== 1) findings.push({ level: "warning", code: "H1_COUNT", value: h1 });
  if (main < 1 && type !== "Admin") findings.push({ level: "warning", code: "MAIN_MISSING", value: main });
  if (buttons > 0 && primitiveButtons / buttons < 0.7) {
    findings.push({
      level: "warning",
      code: "BUTTON_ADOPTION_LOW",
      value: primitiveButtons + "/" + buttons,
    });
  }
  if (chips > 0 && primitiveChips / chips < 0.7) {
    findings.push({
      level: "warning",
      code: "CHIP_ADOPTION_LOW",
      value: primitiveChips + "/" + chips,
    });
  }
  if (nestedSurfaceRisk > 4) {
    findings.push({
      level: "warning",
      code: "NESTED_SURFACE_RISK",
      value: nestedSurfaceRisk,
    });
  }
  if (fixedWidths > 0) {
    findings.push({ level: "severe", code: "FIXED_WIDTH_RISK", value: fixedWidths });
  }
  if (inlineWidths > 5) {
    findings.push({ level: "warning", code: "INLINE_WIDTH_RISK", value: inlineWidths });
  }
  if (overflowHidden > 3) {
    findings.push({
      level: "warning",
      code: "OVERFLOW_MASKING_RISK",
      value: overflowHidden,
    });
  }
  if (largeImagesWithoutSizes > 5) {
    findings.push({
      level: "warning",
      code: "IMAGE_SIZE_HINTS_LOW",
      value: largeImagesWithoutSizes,
    });
  }
  if (headings > 0 && h1 === 0) {
    findings.push({ level: "severe", code: "H1_MISSING", value: 0 });
  }
  if (darkMarkers === 0 && type !== "Admin") {
    findings.push({ level: "warning", code: "DARK_MODE_MARKER_MISSING", value: 0 });
  }

  for (const finding of findings) {
    if (finding.level === "severe") totals.severe++;
    else totals.warnings++;
  }

  totals.pages++;
  totals.types[type] = (totals.types[type] || 0) + 1;
  pages.push({
    route,
    type,
    metrics: {
      buttons,
      primitiveButtons,
      chips,
      primitiveChips,
      surfaces,
      nestedSurfaceRisk,
      inlineWidths,
      fixedWidths,
      overflowHidden,
      largeImagesWithoutSizes,
      headings,
      h1,
      main,
      darkMarkers,
    },
    findings,
  });
}

pages.sort((a, b) => {
  const severity = (page) =>
    page.findings.reduce((sum, item) => sum + (item.level === "severe" ? 10 : 1), 0);
  return severity(b) - severity(a) || a.route.localeCompare(b.route);
});

const report = {
  generatedAt: new Date().toISOString(),
  totals,
  pages,
};

fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(reportJson, JSON.stringify(report, null, 2) + "\\n");

const codeLabels = {
  H1_COUNT: "H1-Anzahl",
  H1_MISSING: "H1 fehlt",
  MAIN_MISSING: "Main-Landmark fehlt",
  BUTTON_ADOPTION_LOW: "Button-Primitives zu gering",
  CHIP_ADOPTION_LOW: "Chip-Primitives zu gering",
  NESTED_SURFACE_RISK: "Box-in-Box-Risiko",
  FIXED_WIDTH_RISK: "Feste Pixelbreite",
  INLINE_WIDTH_RISK: "Viele Inline-Breiten",
  OVERFLOW_MASKING_RISK: "Overflow wird häufig maskiert",
  IMAGE_SIZE_HINTS_LOW: "Viele Bilder ohne Größenhinweis",
  DARK_MODE_MARKER_MISSING: "Dark-Mode-Marker nicht erkannt",
};

const priorityPages = pages.filter((page) => page.findings.length).slice(0, 60);
const md = [
  "# PfotenTechnik Visual QA",
  "",
  "## Zusammenfassung",
  "",
  "- Seiten: **" + totals.pages + "**",
  "- Warnungen: **" + totals.warnings + "**",
  "- Schwere Risiken: **" + totals.severe + "**",
  "",
  "## Seitentypen",
  "",
  ...Object.entries(totals.types)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([type, amount]) => "- " + type + ": **" + amount + "**"),
  "",
  "## Priorisierte Prüfliste",
  "",
  ...(priorityPages.length
    ? priorityPages.map((page) => {
        const labels = page.findings
          .map((item) => (codeLabels[item.code] || item.code) + " (" + item.value + ")")
          .join("; ");
        return "- \\\`" + page.route + "\\\` — " + page.type + ": " + labels;
      })
    : ["- Keine statisch erkennbaren Risiken."]),
  "",
  "## Manuelle Viewport-Matrix",
  "",
  "| Viewport | Zweck |",
  "|---|---|",
  "| 375 × 812 | kleines Smartphone |",
  "| 414 × 896 | großes Smartphone |",
  "| 768 × 1024 | Tablet |",
  "| 1280 × 800 | kleiner Desktop |",
  "| 1440 × 900 | Standard-Desktop |",
  "",
  "Jede priorisierte Route in Light und Dark Mode prüfen.",
  "",
].join("\\n");

fs.writeFileSync(reportMd, md);

console.log("Visual-QA abgeschlossen:");
console.log("- Seiten: " + totals.pages);
console.log("- Warnungen: " + totals.warnings);
console.log("- Schwere Risiken: " + totals.severe);
console.log("- Bericht: " + path.relative(appRoot, reportMd));

if (STRICT && totals.severe > 0) {
  process.exit(1);
}
`;

write(qaScript, qaSource);

const pkg = JSON.parse(read(packageFile));
pkg.scripts ||= {};
pkg.scripts["design-system:visual-qa"] =
  "node scripts/design-system/visual-qa.mjs";
pkg.scripts["design-system:visual-qa:strict"] =
  "node scripts/design-system/visual-qa.mjs --strict";
write(packageFile, JSON.stringify(pkg, null, 2) + "\n");

if (!NO_BUILD && !run("npm", ["run", "build:pfotentechnik"])) {
  fail("Build fehlgeschlagen.");
}

if (!fs.existsSync(dist)) fail("dist fehlt nach Build.");

if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", "design-system:visual-qa"])) {
  fail("Visual-QA fehlgeschlagen.");
}

for (const check of [
  "design-system:check",
]) {
  if (!run("npm", ["--workspace", "apps/pfotentechnik", "run", check])) {
    fail(`${check} fehlgeschlagen.`);
  }
}

const latestJson = path.join(reportDir, "visual-qa-latest.json");
const latestMd = path.join(reportDir, "visual-qa-latest.md");
if (!fs.existsSync(latestJson) || !fs.existsSync(latestMd)) {
  fail("Visual-QA-Berichte wurden nicht erzeugt.");
}

const latest = JSON.parse(read(latestJson));
const summary = {
  pages: latest.totals.pages,
  warnings: latest.totals.warnings,
  severe: latest.totals.severe,
  types: latest.totals.types,
};

write(reportJson, JSON.stringify({
  name: NAME,
  generatedAt: new Date().toISOString(),
  summary,
}, null, 2) + "\n");

write(reportMd, `# PfotenTechnik Visual QA Foundation 11.7.0

## Ergebnis

- analysierte Seiten: **${summary.pages}**
- Warnungen: **${summary.warnings}**
- schwere Risiken: **${summary.severe}**

## Seitentypen

${Object.entries(summary.types).map(([type, count]) => `- ${type}: **${count}**`).join("\n")}

## Dauerhafte Kommandos

\`\`\`bash
npm --workspace apps/pfotentechnik run design-system:visual-qa
npm --workspace apps/pfotentechnik run design-system:visual-qa:strict
\`\`\`

Der nicht-strikte Lauf erzeugt eine priorisierte Prüfliste. Der strikte Lauf schlägt bei festen Pixelbreiten oder fehlenden H1-Strukturen fehl.
`);

log(`Analysierte Seiten: ${summary.pages}`);
log(`Warnungen: ${summary.warnings}`);
log(`Schwere Risiken: ${summary.severe}`);
log(`Backups: ${rel(backupRoot)}`);

if (!NO_COMMIT) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8",
  });

  if (status.status !== 0) fail("git status fehlgeschlagen.");

  if (status.stdout.trim()) {
    if (!run("git", ["add", "-A"])) fail("git add fehlgeschlagen.");
    if (!run("git", ["commit", "-m", "test(pfotentechnik): add visual qa matrix"])) {
      fail("Commit fehlgeschlagen.");
    }
    log("Änderungen lokal committed.");
  } else {
    log("Keine offenen Änderungen vorhanden.");
  }
}

log("Visual QA Foundation 11.7.0 erfolgreich abgeschlossen.");

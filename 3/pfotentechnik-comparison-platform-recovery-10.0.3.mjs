#!/usr/bin/env node
import { promises as fs } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const VERSION = "10.0.3";
const NAME = `pfotentechnik-comparison-platform-recovery-${VERSION}`;
const ROOT = process.cwd();
const APP = path.join(ROOT, "apps", "pfotentechnik");
const COMPARISONS = path.join(APP, "src", "content", "comparisons");
const PAGES = path.join(APP, "src", "content", "pages");
const CONFIG = path.join(APP, "src", "project.config.ts");
const AUDIT = path.join(APP, "scripts", "comparison-platform", "refactor-audit.mjs");

const slugs = [
  "beste-futterautomaten-fuer-berufstaetige",
  "beste-futterautomaten-fuer-hunde",
  "beste-futterautomaten-fuer-katzen",
  "beste-futterautomaten-fuer-kleine-hunde",
  "beste-futterautomaten-fuer-mehrtierhaushalte",
  "beste-futterautomaten-fuer-nassfutter",
  "beste-futterautomaten-fuer-seniorenkatzen",
  "beste-futterautomaten-fuer-welpen",
  "beste-futterautomaten-fuer-zwei-katzen",
  "beste-futterautomaten-mit-akku",
  "beste-futterautomaten-mit-edelstahl-napf",
  "beste-futterautomaten-mit-kamera",
  "beste-futterautomaten-ohne-wlan",
  "beste-futterautomaten-unter-100-euro",
  "futterautomat-fuer-grosse-hunde",
  "futterautomat-gegen-schlingen",
  "futterautomat-mit-app"
];

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => {
  throw new Error(message);
};
const exists = async (file) => {
  try {
    await fs.access(file);
    return true;
  } catch {
    return false;
  }
};
const git = (args, options = {}) => {
  const result = spawnSync("git", args, {
    cwd: ROOT,
    encoding: "utf8",
    stdio: options.capture ? "pipe" : "inherit"
  });
  if (result.status !== 0 && !options.allowFailure) {
    fail(`Git fehlgeschlagen: git ${args.join(" ")}`);
  }
  return result;
};
const escapeRegExp = (value) =>
  value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const walk = async (dir) => {
  if (!(await exists(dir))) return [];
  const result = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) result.push(...await walk(full));
    else if ([".md", ".mdx", ".astro", ".ts", ".tsx", ".js", ".mjs", ".json"].includes(path.extname(entry.name))) {
      result.push(full);
    }
  }
  return result;
};

const replaceRootRoute = (source, slug) => {
  const canonical = `/vergleiche/${slug}/`;
  const escaped = escapeRegExp(slug);

  // Der Prefix darf kein URL-/Slug-Zeichen sein. Damit wird der Treffer in
  // /vergleiche/<slug>/ sicher ausgeschlossen, ein Root-Link aber erfasst.
  const pattern = new RegExp(
    `(^|[^A-Za-z0-9_/-])/${escaped}/?(?=$|[?#"'\\\\s)\\\\]\\\\}>,])`,
    "gm"
  );

  return source.replace(pattern, (_, prefix) => `${prefix}${canonical}`);
};

const fixCanonicals = async () => {
  let changed = 0;
  for (const slug of slugs) {
    const file = path.join(COMPARISONS, `${slug}.md`);
    if (!(await exists(file))) continue;

    const source = await fs.readFile(file, "utf8");
    const expected = `/vergleiche/${slug}/`;
    let next = source;

    if (/^canonical:\s*.+$/m.test(next)) {
      next = next.replace(/^canonical:\s*.+$/m, `canonical: ${expected}`);
    } else if (next.startsWith("---\n")) {
      next = next.replace(/^---\n/, `---\ncanonical: ${expected}\n`);
    }

    if (next !== source) {
      await fs.writeFile(file, next, "utf8");
      changed += 1;
    }
  }
  log(`${changed} Canonical-Dateien korrigiert.`);
};

const fixEditorialLinks = async () => {
  const files = [
    ...(await walk(COMPARISONS)),
    ...(await walk(PAGES)),
    ...(await exists(CONFIG) ? [CONFIG] : [])
  ];

  let changedFiles = 0;
  let replacements = 0;

  for (const file of files) {
    const source = await fs.readFile(file, "utf8");
    let next = source;

    for (const slug of slugs) {
      const before = next;
      next = replaceRootRoute(next, slug);
      if (next !== before) {
        const oldCount = (before.match(new RegExp(`/${escapeRegExp(slug)}`, "g")) || []).length;
        const newCount = (next.match(new RegExp(`/vergleiche/${escapeRegExp(slug)}`, "g")) || []).length;
        replacements += Math.max(1, newCount - (oldCount - newCount));
      }
    }

    if (next !== source) {
      await fs.writeFile(file, next, "utf8");
      changedFiles += 1;
    }
  }

  log(`${changedFiles} Quelldateien mit Root-Links korrigiert.`);
};

const patchAudit = async () => {
  if (!(await exists(AUDIT))) fail(`Audit fehlt: ${path.relative(ROOT, AUDIT)}`);

  const source = await fs.readFile(AUDIT, "utf8");
  let next = source;

  // Repariert sowohl die 10-Zeichen-Prüfung als auch ältere Varianten.
  next = next.replace(
    /const prefix = source\.slice\(Math\.max\(0,\s*index\s*-\s*10\),\s*index\);\s*const isCanonicalTarget =\s*!candidate\.startsWith\("\/vergleiche\/"\)\s*&&\s*prefix\.endsWith\("\/vergleiche"\);/m,
    `const isCanonicalTarget =
        !candidate.startsWith("/vergleiche/") &&
        source.slice(0, index).endsWith("/vergleiche");`
  );

  // Falls der Block bereits anders formatiert wurde, ersetze die Funktion robust.
  const functionPattern =
    /const containsLegacyUrl = \(source, oldUrl\) => \{[\s\S]*?\n\};\n\nfor \(const rootDir of scanRoots\)/m;

  const functionReplacement = `const containsLegacyUrl = (source, oldUrl) => {
  const candidates = [oldUrl, oldUrl.replace(/\\\\\\/$/, "")];
  for (const candidate of candidates) {
    let index = source.indexOf(candidate);
    while (index >= 0) {
      const isCanonicalTarget =
        !candidate.startsWith("/vergleiche/") &&
        source.slice(0, index).endsWith("/vergleiche");
      const nextCharacter = source[index + candidate.length] || "";
      const hasBoundary =
        candidate.endsWith("/") ||
        !/[a-z0-9-]/i.test(nextCharacter);

      if (!isCanonicalTarget && hasBoundary) return true;
      index = source.indexOf(candidate, index + 1);
    }
  }
  return false;
};

for (const rootDir of scanRoots)`;

  if (functionPattern.test(next)) {
    next = next.replace(functionPattern, functionReplacement);
  } else {
    fail("containsLegacyUrl-Funktion im Audit nicht gefunden.");
  }

  if (next !== source) {
    await fs.writeFile(AUDIT, next, "utf8");
    log("Altlink-Erkennung im Refactor-Audit korrigiert.");
  } else {
    log("Refactor-Audit war bereits korrigiert.");
  }
};

const commitIfNeeded = () => {
  const status = git(["status", "--porcelain"], { capture: true }).stdout.trim();
  if (!status) return;
  git(["add",
    "apps/pfotentechnik/src/content/comparisons",
    "apps/pfotentechnik/src/content/pages",
    "apps/pfotentechnik/src/project.config.ts",
    "apps/pfotentechnik/scripts/comparison-platform/refactor-audit.mjs"
  ]);
  const staged = git(["diff", "--cached", "--quiet"], { allowFailure: true });
  if (staged.status !== 0) {
    git(["commit", "-m", "fix(comparisons): repair canonical link migration audit"]);
  }
};

const main = async () => {
  if (!(await exists(path.join(ROOT, ".git")))) {
    fail("Bitte im Repository-Stammverzeichnis ausführen.");
  }

  log("Canonical-Routen werden repariert.");
  await fixCanonicals();

  log("Redaktionelle Root-Links werden sicher kanonisiert.");
  await fixEditorialLinks();

  log("Audit-Falschpositive werden behoben.");
  await patchAudit();

  commitIfNeeded();

  log("Validierung wird ausgeführt.");
  const auditResult = spawnSync(
    process.execPath,
    [path.relative(ROOT, AUDIT)],
    { cwd: ROOT, stdio: "inherit", encoding: "utf8" }
  );
  if (auditResult.status !== 0) {
    fail("Refactor-Audit ist weiterhin fehlgeschlagen.");
  }

  log("Recovery erfolgreich abgeschlossen.");
  log("Als Nächstes: npm run build:pfotentechnik");
};

main().catch((error) => {
  console.error(`\n[${NAME}] FEHLER`);
  console.error(error?.stack || error);
  process.exitCode = 1;
});

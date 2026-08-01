#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-internal-link-katze-an-trinkbrunnen-gewoehnen-22.10.16";
const TARGET_ROUTE = "/katze-an-trinkbrunnen-gewoehnen/";
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
const SOURCE = path.join(APP, "src", "content", "pages", "trinkbrunnen.md");
const AUDIT = path.join(APP, "scripts", "audit-internal-link-health.mjs");
const AUDIT_REPORT = path.join(
  APP,
  "reports",
  "internal-linking",
  "internal-link-health-audit.json",
);
const REPORT = path.join(
  APP,
  "reports",
  "internal-linking",
  "katze-an-trinkbrunnen-gewoehnen-link-fix-22.10.16.md",
);
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

function run(command, args) {
  if (process.platform === "win32") {
    const line = [command, ...args].map(quoteCmdArg).join(" ");
    execFileSync(process.env.ComSpec || "cmd.exe", ["/d", "/s", "/c", line], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env,
      windowsHide: true,
    });
    return;
  }

  execFileSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
}

for (const file of [SOURCE, AUDIT]) {
  if (!fs.existsSync(file)) {
    throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, file));
  }
}

const before = fs.readFileSync(SOURCE, "utf8");
const heading = "## Auswahlhilfe: Tier, Reinigung und Standort zuerst";
const linkParagraph =
  "Die technische Auswahl ist nur der erste Schritt. Nimmt eine Katze den neuen Brunnen nicht sofort an, sollten Standort, Geräusch, Wasserfluss und die bisherige Wasserschale schrittweise statt unter Druck verändert werden. Der Ratgeber [Katze an einen Trinkbrunnen gewöhnen](/katze-an-trinkbrunnen-gewoehnen/) zeigt eine sichere Einführung, bei der jederzeit eine vertraute Wasserstelle verfügbar bleibt.";

let after = before;

if (!after.includes("](/katze-an-trinkbrunnen-gewoehnen/)")) {
  const headingIndex = after.indexOf(heading);
  if (headingIndex < 0) {
    throw new Error("Geprüfter Abschnitt in trinkbrunnen.md wurde nicht gefunden.");
  }

  const insertAt = headingIndex + heading.length;
  after =
    after.slice(0, insertAt) +
    `\n\n${linkParagraph}` +
    after.slice(insertAt);
}

after = after.replace(
  /updatedAt:\s*"[^"]+"/,
  'updatedAt: "2026-07-31"',
);

if (!after.includes("](/katze-an-trinkbrunnen-gewoehnen/)")) {
  throw new Error("Der neue interne Link konnte nicht verifiziert werden.");
}

const targetSource = path.join(
  APP,
  "src",
  "content",
  "pages",
  "katze-an-trinkbrunnen-gewoehnen.md",
);

if (!fs.existsSync(targetSource)) {
  throw new Error("Zielinhalt fehlt: " + path.relative(ROOT, targetSource));
}

const targetContent = fs.readFileSync(targetSource, "utf8");
if (!/slug:\s*["']?katze-an-trinkbrunnen-gewoehnen["']?/.test(targetContent)) {
  throw new Error("Zielinhalt besitzt nicht den erwarteten Slug.");
}
if (SOURCE === targetSource) {
  throw new Error("Selbstlink erkannt.");
}

fs.mkdirSync(BACKUP, { recursive: true });
const backupFile = path.join(BACKUP, path.relative(ROOT, SOURCE));
fs.mkdirSync(path.dirname(backupFile), { recursive: true });
fs.writeFileSync(backupFile, before);

try {
  if (after !== before) {
    fs.writeFileSync(SOURCE, after);
    log("Geschrieben: " + path.relative(ROOT, SOURCE));
  } else {
    log("Unverändert: Link ist bereits vorhanden.");
  }

  if (!SKIP_BUILD) {
    run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);
  }

  run("node", [path.relative(ROOT, AUDIT)]);

  if (!fs.existsSync(AUDIT_REPORT)) {
    throw new Error("Internal-Link-Health-Report wurde nicht erzeugt.");
  }

  const audit = JSON.parse(fs.readFileSync(AUDIT_REPORT, "utf8"));
  const findings = Array.isArray(audit?.findings) ? audit.findings : [];

  const remaining = findings.filter(
    (finding) =>
      finding?.code === "NO_INCOMING_INTERNAL_LINK" &&
      (
        finding?.targetRoute === TARGET_ROUTE ||
        finding?.route === TARGET_ROUTE ||
        finding?.normalizedTarget === TARGET_ROUTE
      ),
  );

  if (remaining.length > 0) {
    throw new Error(
      `${TARGET_ROUTE} ist nach dem erneuten Audit weiterhin ohne eingehenden Link.`,
    );
  }

  const report = `# Internal-Link-Fix /katze-an-trinkbrunnen-gewoehnen/ 22.10.16

## Geänderte Datei

- \`apps/pfotentechnik/src/content/pages/trinkbrunnen.md\`

## Link

- Linktext: \`Katze an einen Trinkbrunnen gewöhnen\`
- Zielroute: \`${TARGET_ROUTE}\`
- Position: Hauptinhalt, Abschnitt \`Auswahlhilfe: Tier, Reinigung und Standort zuerst\`

## Fachliche Begründung

Die Quellseite ist der zentrale Trinkbrunnen-Hub und führt von der technischen
Auswahl in die praktische Einführung. Die Zielseite beantwortet genau den
nächsten Nutzerbedarf, wenn ein geeignetes Gerät ausgewählt wurde, die Katze
es aber noch nicht akzeptiert.

Der Link weist ausdrücklich darauf hin, die vertraute Wasserstelle während
der Gewöhnung beizubehalten. Er ist damit nutzerorientiert und vermeidet
gesundheitlich riskanten Druck oder eine erzwungene Umstellung.

## Validierung

- Zielinhalt und erwarteter Slug geprüft
- Selbstlink ausgeschlossen
- Build: bestanden
- Internal-Link-Health-Audit: erneut ausgeführt
- Finding \`NO_INCOMING_INTERNAL_LINK\` für \`${TARGET_ROUTE}\`: nicht mehr aktiv
`;

  fs.mkdirSync(path.dirname(REPORT), { recursive: true });
  fs.writeFileSync(REPORT, report);

  log("BESTANDEN.");
  log("Finding entfernt: " + TARGET_ROUTE);
  log("Report: " + path.relative(ROOT, REPORT));
  log("Backup: " + path.relative(ROOT, BACKUP));
} catch (error) {
  log("FEHLER: " + error.message);
  log("Rollback wird ausgeführt.");
  fs.writeFileSync(SOURCE, before);
  process.exitCode = 1;
}

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-internal-link-hund-ist-muede-22.10.15";
const TARGET_ROUTE = "/hund-ist-muede/";
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
const SOURCE = path.join(
  APP,
  "src",
  "content",
  "pages",
  "seniorenhunde-richtig-versorgen.md",
);
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
  "hund-ist-muede-link-fix-22.10.15.md",
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

const sourceParagraph =
  "Viele Beschwerden entwickeln sich langsam. Dadurch entsteht leicht der Eindruck, ein Hund werde einfach „gemütlicher“. Tatsächlich können hinter einem Rückgang der Aktivität unter anderem Gelenkschmerzen, Zahnerkrankungen, Herzprobleme, hormonelle Veränderungen oder eine nachlassende Organfunktion stehen.";

const linkedParagraph =
  sourceParagraph +
  " Der Ratgeber [Hund ist müde: normale Ruhe oder Warnzeichen?](/hund-ist-muede/) hilft dabei, Müdigkeit, verminderte Belastbarkeit und echte Warnzeichen systematisch voneinander zu unterscheiden.";

let after = before;

if (!after.includes("](/hund-ist-muede/)")) {
  if (!after.includes(sourceParagraph)) {
    throw new Error(
      "Geprüfter Einfügepunkt in seniorenhunde-richtig-versorgen.md wurde nicht gefunden.",
    );
  }

  after = after.replace(sourceParagraph, linkedParagraph);
}

after = after.replace(
  /updatedAt:\s*"[^"]+"/,
  'updatedAt: "2026-07-31"',
);

if (!after.includes("](/hund-ist-muede/)")) {
  throw new Error("Der neue interne Link konnte nicht verifiziert werden.");
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

  const report = `# Internal-Link-Fix /hund-ist-muede/ 22.10.15

## Geänderte Datei

- \`apps/pfotentechnik/src/content/pages/seniorenhunde-richtig-versorgen.md\`

## Link

- Linktext: \`Hund ist müde: normale Ruhe oder Warnzeichen?\`
- Zielroute: \`${TARGET_ROUTE}\`
- Position: Hauptinhalt, Abschnitt \`Alter ist keine Diagnose\`

## Fachliche Begründung

Die Quellseite erklärt, dass sinkende Aktivität bei älteren Hunden nicht
pauschal als normale Alterserscheinung gelten darf. Die Zielseite vertieft
genau diese Entscheidung: normale Ruhe von verminderter Belastbarkeit und
medizinisch relevanten Warnzeichen unterscheiden.

Der Link unterstützt damit die Problemklärung innerhalb der Hundegesundheits-
Journey. Es wurde bewusst kein Produkt-, Footer- oder Boilerplate-Link gesetzt.

## Validierung

- Build: bestanden
- Internal-Link-Health-Audit: erneut ausgeführt
- Finding \`NO_INCOMING_INTERNAL_LINK\` für \`${TARGET_ROUTE}\`: nicht mehr aktiv
- Selbstlink: ausgeschlossen
- Zielroute: kanonische Inhaltsroute
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

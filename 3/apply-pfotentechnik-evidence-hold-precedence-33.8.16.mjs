#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH = "pfotentechnik-evidence-hold-precedence-33.8.16";
const root = process.cwd();
const app = path.join(root, "apps/pfotentechnik");
const queueFile = path.join(app, "scripts/product-evidence/research-queue.mjs");
const testFile = path.join(app, "test/evidence-hold-precedence-33.8.16.test.mjs");
const backupRoot = path.join(root, ".patch-backups");
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(backupRoot, `${PATCH}-${stamp}`);

const log = (msg) => console.log(`[${PATCH}] ${msg}`);
const fail = (msg) => { throw new Error(msg); };

if (!fs.existsSync(queueFile)) {
  fail(`Erwartete Datei fehlt: ${path.relative(root, queueFile)}`);
}

fs.mkdirSync(backupDir, { recursive: true });

const originals = new Map();
function backup(file) {
  if (!fs.existsSync(file)) return;
  const rel = path.relative(root, file);
  const dest = path.join(backupDir, rel);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(file, dest);
  originals.set(file, dest);
}

function rollback() {
  for (const [file, dest] of originals.entries()) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.copyFileSync(dest, file);
  }
  if (!originals.has(testFile) && fs.existsSync(testFile)) fs.rmSync(testFile);
  log("Änderungen wurden zurückgerollt.");
}

function run(label, cmd, args, opts = {}) {
  log(`Prüfe: ${label}`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: false,
    ...opts
  });
  if (r.status !== 0) fail(`${label} fehlgeschlagen (Exit ${r.status})`);
  log(`BESTANDEN: ${label}`);
}

try {
  backup(queueFile);
  backup(testFile);

  let src = fs.readFileSync(queueFile, "utf8");
  const before = src;

  // 1) constrained-Erkennung muss im Evidence-Objekt verfügbar sein.
  // Unterstützt die bereits eingeführten Varianten evidenceStatus/status/note.
  if (!/constrained\s*[:=]/.test(src.split("const pageSignal")[0] || "")) {
    src = src.replace(
      /const evidence = \(raw\) => \{\s*const ext=block\(raw,"externalEvidence"\);\s*if\(!ext\)return\{([^}]+)\};/,
      (m, fields) => {
        return `const evidence = (raw) => { const ext=block(raw,"externalEvidence"); if(!ext)return{${fields},constrained:false};`;
      }
    );
  }

  // Bestehende return-Objekte von evidence() um constrained ergänzen, falls nötig.
  if (!/return\{status:missingParts\.length\?"partial":"complete"[^}]*constrained/.test(src)) {
    src = src.replace(
      /return\{status:missingParts\.length\?"partial":"complete",professional,userSources,consensus,missingParts\};\s*\};/,
      `const constrained = /(?:evidenceStatus|researchStatus|status):\\s*["']?constrained["']?/i.test(ext) || /\\bconstrained\\b/i.test(ext);
    return{status:missingParts.length?"partial":"complete",professional,userSources,consensus,missingParts,constrained}; };`
    );
  }

  // 2) Entscheidend: HOLD hat absolute Priorität vor fehlendem Suchsignal.
  const classifyRe = /const classifyLane = \(search,\s*ctx,\s*ev\) => \{[\s\S]*?\n\};/;
  const classify = src.match(classifyRe)?.[0];
  if (!classify) fail("classifyLane konnte nicht gefunden werden.");

  const replacement = `const classifyLane = (search, ctx, ev) => {
  // Quellenlage ist eine redaktionelle Zustandsklasse und hat Vorrang vor Search-Signalen.
  // Ein constrained Produkt darf deshalb auch bei 0 Impressions niemals in BACKLOG zurückfallen.
  if (ev.constrained) return "HOLD";
  const hasSearch = search.impressions > 0 || ctx.impressions > 0;
  if (!hasSearch) return "BACKLOG";
  if (search.impressions >= 3 || ctx.impressions >= 5) return "NOW";
  if (ev.status === "partial" && search.impressions >= 1) return "NOW";
  return "WATCH";
};`;

  src = src.replace(classifyRe, replacement);

  // 3) Sortierreihenfolge um HOLD erweitern.
  src = src.replace(
    /const order=\{NOW:0,WATCH:1(?:,HOLD:\d+)?(?:,BACKLOG:\d+)?\};/,
    `const order={NOW:0,WATCH:1,HOLD:2,BACKLOG:3};`
  );

  // 4) Payload-Zähler HOLD sicherstellen.
  if (!/hold:products\.filter\(\(p\)=>p\.lane==="HOLD"\)\.length/.test(src)) {
    src = src.replace(
      /watch:products\.filter\(\(p\)=>p\.lane==="WATCH"\)\.length,/,
      `watch:products.filter((p)=>p.lane==="WATCH").length,hold:products.filter((p)=>p.lane==="HOLD").length,`
    );
  }

  // 5) Report und CLI zeigen HOLD mit an.
  if (!/"- HOLD: "\+payload\.counts\.hold/.test(src)) {
    src = src.replace(
      /"- WATCH: "\+payload\.counts\.watch,/,
      `"- WATCH: "+payload.counts.watch,"- HOLD: "+payload.counts.hold,`
    );
  }
  if (!/· HOLD "\+payload\.counts\.hold/.test(src)) {
    src = src.replace(
      /" · WATCH "\+payload\.counts\.watch\+" · BACKLOG "/,
      `" · WATCH "+payload.counts.watch+" · HOLD "+payload.counts.hold+" · BACKLOG "`
    );
  }

  if (src === before) {
    log("Queue-Datei war möglicherweise bereits korrekt; schreibe nur Regressionstest.");
  } else {
    fs.writeFileSync(queueFile, src);
    log(`Queue-Logik korrigiert: ${path.relative(root, queueFile)}`);
  }

  const test = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const root = path.resolve(app, "../..");
const queueFile = path.join(app, "scripts/product-evidence/research-queue.mjs");
const reportFile = path.join(app, "reports/product-evidence/research-queue.md");
const src = fs.readFileSync(queueFile, "utf8");

test("constrained hat Vorrang vor BACKLOG", () => {
  const block = src.match(/const classifyLane = \\(search, ctx, ev\\) => \\{[\\s\\S]*?\\n\\};/)?.[0] || "";
  assert.ok(block.includes('if (ev.constrained) return "HOLD"'), "HOLD-Regel fehlt");
  assert.ok(block.indexOf('if (ev.constrained) return "HOLD"') < block.indexOf('if (!hasSearch) return "BACKLOG"'),
    "constrained muss vor fehlendem Suchsignal geprüft werden");
});

test("BACKLOG enthält keine bekannten constrained Fälle", () => {
  const r = spawnSync(process.execPath, [queueFile, "--limit=100", "--lane=BACKLOG"], { cwd: app, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const report = fs.readFileSync(reportFile, "utf8");
  const forbidden = [
    "cat-mate-335-pet-fountain",
    "devoko-90l-automatisches-katzenklo",
    "garmin-alpha-tt-25",
    "honeyguardian-a305d",
    "honeyguardian-smart-pet-feeder-s305d",
    "neakasa-m1-lite",
    "oneisall-2-2l-cordless-fountain"
  ];
  for (const slug of forbidden) assert.ok(!report.includes("- Slug: " + slug), slug + " darf nicht im BACKLOG stehen");
});

test("HOLD nimmt constrained Fälle auch ohne Impressionen auf", () => {
  const r = spawnSync(process.execPath, [queueFile, "--limit=100", "--lane=HOLD"], { cwd: app, encoding: "utf8" });
  assert.equal(r.status, 0, r.stderr || r.stdout);
  const report = fs.readFileSync(reportFile, "utf8");
  for (const slug of ["cat-mate-335-pet-fountain","devoko-90l-automatisches-katzenklo","garmin-alpha-tt-25","honeyguardian-a305d"]) {
    assert.ok(report.includes("- Slug: " + slug), slug + " muss in HOLD stehen");
  }
});
`;
  fs.writeFileSync(testFile, test);
  log(`Regressionstest geschrieben: ${path.relative(root, testFile)}`);

  run("Queue-Syntax", process.execPath, ["--check", queueFile]);
  run("Test-Syntax", process.execPath, ["--check", testFile]);
  run("Regressionstests", process.execPath, ["--test", testFile]);

  run("Evidence-Audit", "npm", ["--workspace", "apps/pfotentechnik", "run", "audit:product-evidence"]);
  run("BACKLOG-Queue", "npm", ["--workspace", "apps/pfotentechnik", "run", "product-evidence:research", "--", "--limit=10", "--lane=BACKLOG"]);
  run("HOLD-Queue", "npm", ["--workspace", "apps/pfotentechnik", "run", "product-evidence:research", "--", "--limit=100", "--lane=HOLD"]);

  // Am Ende wieder den nächsten arbeitsfähigen BACKLOG-Report erzeugen.
  run("Nächster BACKLOG", "npm", ["--workspace", "apps/pfotentechnik", "run", "product-evidence:research", "--", "--limit=10", "--lane=BACKLOG"]);

  log("Abgeschlossen.");
  log("Constrained Produkte haben nun unabhängig von Impressionen Vorrang und bleiben in HOLD.");
  log(`Backup: ${path.relative(root, backupDir)}`);
  log("Nächster Batch: apps/pfotentechnik/reports/product-evidence/research-queue.md");
} catch (err) {
  console.error(`[${PATCH}] FEHLER: ${err.message}`);
  rollback();
  process.exit(1);
}

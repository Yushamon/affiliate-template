#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

const VERSION = "1.0.0";
const NAME = `pfotentechnik-performance-stylesheet-inline-${VERSION}`;
const ROOT = process.cwd();
const CONFIG = path.join(ROOT, "apps/pfotentechnik/astro.config.mjs");
const PACKAGE = path.join(ROOT, "apps/pfotentechnik/package.json");
const BACKUP_ROOT = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => {
  throw new Error(message);
};

const read = (file) => fs.readFileSync(file, "utf8");
const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
};

const backup = (file) => {
  const relative = path.relative(ROOT, file);
  const target = path.join(BACKUP_ROOT, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
};

const run = (label, command, args) => {
  log(`Prüfe: ${label}`);
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env,
  });
  log(`BESTANDEN: ${label}`);
};

const restore = () => {
  if (!fs.existsSync(BACKUP_ROOT)) return;
  for (const file of [CONFIG]) {
    const relative = path.relative(ROOT, file);
    const source = path.join(BACKUP_ROOT, relative);
    if (fs.existsSync(source)) {
      fs.copyFileSync(source, file);
    }
  }
};

try {
  if (!fs.existsSync(CONFIG)) fail(`Fehlt: ${path.relative(ROOT, CONFIG)}`);
  if (!fs.existsSync(PACKAGE)) fail(`Fehlt: ${path.relative(ROOT, PACKAGE)}`);

  const original = read(CONFIG);

  if (!original.includes("export default defineConfig({")) {
    fail("astro.config.mjs entspricht keinem geprüften Stand.");
  }

  backup(CONFIG);
  log(`Backup: ${path.relative(ROOT, BACKUP_ROOT)}`);

  let next = original;

  if (!next.includes('inlineStylesheets: "auto"')) {
    next = next.replace(
      '  outDir: "./dist",',
      '  outDir: "./dist",\n\n  // Kleine CSS-Chunks bis 5,5 KB werden gezielt inline ausgegeben.\n  // Dadurch wird EditorialScore in die Seite integriert, während\n  // adapters.css und imageOptimization.css externe Shared-Chunks bleiben.\n  build: {\n    inlineStylesheets: "auto"\n  },'
    );
  }

  const viteBuildBlock = `    build: {
      // Astro verwendet diesen Grenzwert auch für inlineStylesheets: "auto".
      // 5,5 KB erfasst EditorialScore (~4,98 KB), aber nicht adapters (~6,47 KB).
      assetsInlineLimit: 5500
    },`;

  if (!next.includes("assetsInlineLimit: 5500")) {
    next = next.replace(
      "  vite: {\n    resolve:",
      `  vite: {\n${viteBuildBlock}\n    resolve:`
    );
  }

  if (next === original) {
    log("Unverändert: Performance-Konfiguration bereits aktiv.");
  } else {
    write(CONFIG, next);
    log(`Geändert: ${path.relative(ROOT, CONFIG)}`);
  }

  // Statische Vorprüfung
  const patched = read(CONFIG);
  if (!patched.includes('inlineStylesheets: "auto"')) {
    fail("inlineStylesheets-Konfiguration fehlt nach dem Patch.");
  }
  if (!patched.includes("assetsInlineLimit: 5500")) {
    fail("assetsInlineLimit fehlt nach dem Patch.");
  }

  run("Astro-Konfiguration", "node", ["--check", "apps/pfotentechnik/astro.config.mjs"]);
  run("Astro Build", "npm", ["run", "build:pfotentechnik"]);
  run(
    "Performance Audit",
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "audit:performance:strict"]
  );

  const reportPath = path.join(
    ROOT,
    "apps/pfotentechnik/reports/performance/after-latest.json"
  );

  if (!fs.existsSync(reportPath)) {
    fail("Performance-Report wurde nicht erzeugt.");
  }

  const report = JSON.parse(read(reportPath));
  const blocking = (report.findings ?? []).filter(
    (finding) => finding.code === "PERF_RENDER_BLOCKING_STYLESHEET"
  );

  if (blocking.length > 0) {
    fail(
      `Render-blockierende Stylesheet-Befunde verbleiben: ${blocking
        .map((finding) => finding.route)
        .join(", ")}`
    );
  }

  const validationDir = path.join(
    ROOT,
    "apps/pfotentechnik/reports/performance"
  );
  fs.mkdirSync(validationDir, { recursive: true });
  const validationPath = path.join(
    validationDir,
    "stylesheet-inline-validation-latest.json"
  );

  write(
    validationPath,
    JSON.stringify(
      {
        patch: NAME,
        generatedAt: new Date().toISOString(),
        config: {
          inlineStylesheets: "auto",
          assetsInlineLimit: 5500
        },
        result: {
          renderBlockingStylesheetFindings: 0,
          performanceStatus: report.status ?? "unknown"
        }
      },
      null,
      2
    ) + "\n"
  );

  log("Abgeschlossen.");
  log(`Validierung: ${path.relative(ROOT, validationPath)}`);
  log(`Backup: ${path.relative(ROOT, BACKUP_ROOT)}`);
} catch (error) {
  console.error(`[${NAME}] FEHLER: ${error.message}`);
  restore();
  console.error(`[${NAME}] Änderungen wurden zurückgerollt.`);
  process.exitCode = 1;
}

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const VERSION = "1.0.0";
const NAME = `pfotentechnik-responsive-image-breakpoints-${VERSION}`;
const ROOT = process.cwd();
const CONFIG = path.join(ROOT, "apps/pfotentechnik/astro.config.mjs");
const REPORT = path.join(
  ROOT,
  "apps/pfotentechnik/reports/performance/after-latest.json"
);
const BACKUP_ROOT = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => { throw new Error(message); };
const read = (file) => fs.readFileSync(file, "utf8");
const write = (file, content) => {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
};

const backup = (file) => {
  const target = path.join(BACKUP_ROOT, path.relative(ROOT, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
};

const restore = () => {
  const source = path.join(BACKUP_ROOT, path.relative(ROOT, CONFIG));
  if (fs.existsSync(source)) fs.copyFileSync(source, CONFIG);
};

const run = (label, command, args) => {
  log(`Prüfe: ${label}`);
  execFileSync(command, args, {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env
  });
  log(`BESTANDEN: ${label}`);
};

try {
  if (!fs.existsSync(CONFIG)) {
    fail(`Fehlt: ${path.relative(ROOT, CONFIG)}`);
  }

  const original = read(CONFIG);

  if (!original.includes("image: {") || !original.includes('layout: "constrained"')) {
    fail("Die Astro-Image-Konfiguration entspricht keinem geprüften Stand.");
  }

  backup(CONFIG);
  log(`Backup: ${path.relative(ROOT, BACKUP_ROOT)}`);

  let next = original;

  if (!next.includes("breakpoints: [480, 768, 960, 1200]")) {
    next = next.replace(
      /image:\s*\{\s*layout:\s*"constrained"\s*\}/m,
      `image: {
    // Reduzierte responsive Stufen für automatisch verarbeitete
    // Markdown- und Standardbilder. Explizite widths an Image-Komponenten
    // bleiben davon unberührt.
    layout: "constrained",
    breakpoints: [480, 768, 960, 1200]
  }`
    );
  }

  if (next === original) {
    log("Unverändert: Breakpoints sind bereits aktiv.");
  } else {
    write(CONFIG, next);
    log(`Geändert: ${path.relative(ROOT, CONFIG)}`);
  }

  const patched = read(CONFIG);
  if (!patched.includes("breakpoints: [480, 768, 960, 1200]")) {
    fail("Breakpoint-Konfiguration fehlt nach dem Patch.");
  }

  run(
    "Astro-Konfiguration",
    "node",
    ["--check", "apps/pfotentechnik/astro.config.mjs"]
  );

  run("Astro Build", "npm", ["run", "build:pfotentechnik"]);

  run(
    "Performance Audit",
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", "audit:performance:strict"]
  );

  if (!fs.existsSync(REPORT)) {
    fail("Performance-Report wurde nicht erzeugt.");
  }

  const report = JSON.parse(read(REPORT));
  const cornerstone = (report.routes ?? []).find(
    (route) => route.route === "/smarte-futterautomaten/"
  );

  if (!cornerstone) {
    fail("Cornerstone-Route fehlt im Performance-Report.");
  }

  if (report.status !== "ok") {
    fail(`Performance-Audit ist nicht grün: ${report.status}`);
  }

  const validationPath = path.join(
    ROOT,
    "apps/pfotentechnik/reports/performance",
    "responsive-image-breakpoints-validation-latest.json"
  );

  write(
    validationPath,
    JSON.stringify(
      {
        patch: NAME,
        generatedAt: new Date().toISOString(),
        configuration: {
          layout: "constrained",
          breakpoints: [480, 768, 960, 1200]
        },
        cornerstone: {
          route: cornerstone.route,
          imageAssetFiles: cornerstone.metrics?.imageAssetFiles,
          imageBytes: cornerstone.metrics?.imageBytes,
          findings: cornerstone.findings ?? []
        },
        performanceStatus: report.status
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

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import postcss from "postcss";

const NAME = "pfotentechnik-css-lossless-dedup-1.0.1";
const ROOT = process.cwd();
const TARGET = path.join(
  ROOT,
  "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"
);
const REPORT_DIR = path.join(
  ROOT,
  "apps/pfotentechnik/reports/design-system"
);
const REPORT = path.join(
  REPORT_DIR,
  "css-lossless-dedup-validation-latest.json"
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

const backupTarget = path.join(BACKUP_ROOT, path.relative(ROOT, TARGET));

const restore = () => {
  if (fs.existsSync(backupTarget)) {
    fs.copyFileSync(backupTarget, TARGET);
  }
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

const normalize = (value) =>
  String(value ?? "")
    .trim()
    .replace(/\s+/g, " ");

const contextKey = (node) => {
  const parts = [];
  let parent = node.parent;

  while (parent && parent.type !== "root") {
    if (parent.type === "atrule") {
      parts.unshift(`@${parent.name} ${normalize(parent.params)}`);
    } else {
      parts.unshift(`${parent.type}:${normalize(parent.selector)}`);
    }
    parent = parent.parent;
  }

  return parts.join(" > ");
};

const declarationKey = (decl) =>
  [
    normalize(decl.prop).toLowerCase(),
    normalize(decl.value),
    decl.important ? "important" : "normal"
  ].join("\u0000");

const ruleFingerprint = (rule) => {
  const body = [];

  rule.each((node) => {
    if (node.type === "decl") {
      body.push(`decl:${declarationKey(node)}`);
    } else if (node.type === "comment") {
      return;
    } else {
      body.push(`${node.type}:${normalize(node.toString())}`);
    }
  });

  return [
    contextKey(rule),
    normalize(rule.selector),
    body.join("\u0001")
  ].join("\u0002");
};

try {
  if (!fs.existsSync(TARGET)) {
    fail(`Fehlt: ${path.relative(ROOT, TARGET)}`);
  }

  const original = read(TARGET);
  const before = {
    bytes: Buffer.byteLength(original),
    important: (original.match(/!important\b/g) ?? []).length
  };

  fs.mkdirSync(path.dirname(backupTarget), { recursive: true });
  fs.copyFileSync(TARGET, backupTarget);
  log(`Backup: ${path.relative(ROOT, BACKUP_ROOT)}`);

  const root = postcss.parse(original, { from: TARGET });

  let duplicateDeclarationsRemoved = 0;
  let duplicateRulesRemoved = 0;

  root.walkRules((rule) => {
    const seen = new Set();

    for (const node of [...rule.nodes].reverse()) {
      if (node.type !== "decl") continue;

      const key = declarationKey(node);

      if (seen.has(key)) {
        node.remove();
        duplicateDeclarationsRemoved += 1;
        continue;
      }

      seen.add(key);
    }
  });

  const seenRules = new Map();

  root.walkRules((rule) => {
    const fingerprint = ruleFingerprint(rule);
    const previous = seenRules.get(fingerprint);

    if (previous) {
      previous.remove();
      duplicateRulesRemoved += 1;
    }

    seenRules.set(fingerprint, rule);
  });

  const result = root.toResult({
    from: TARGET,
    to: TARGET,
    map: false
  }).css;

  // PostCSS darf nur verlustfreie Deduplizierung bewirken.
  if (duplicateDeclarationsRemoved === 0 && duplicateRulesRemoved === 0) {
    log("Unverändert: Keine exakt identischen Duplikate gefunden.");
  } else {
    write(TARGET, result);
    log(`Geändert: ${path.relative(ROOT, TARGET)}`);
  }

  const afterText = read(TARGET);
  const after = {
    bytes: Buffer.byteLength(afterText),
    important: (afterText.match(/!important\b/g) ?? []).length
  };

  if (after.bytes > before.bytes) {
    fail("CSS-Datei wurde größer; Abbruch.");
  }

  run(
    "Astro Build",
    "npm",
    ["run", "build:pfotentechnik"]
  );

  run(
    "Component Adoption",
    "npm",
    [
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "design-system:components:audit"
    ]
  );

  run(
    "Design System Audit",
    "npm",
    [
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "design-system:audit"
    ]
  );

  run(
    "Performance Audit",
    "npm",
    [
      "--workspace",
      "apps/pfotentechnik",
      "run",
      "audit:performance:strict"
    ]
  );

  fs.mkdirSync(REPORT_DIR, { recursive: true });
  write(
    REPORT,
    JSON.stringify(
      {
        patch: NAME,
        generatedAt: new Date().toISOString(),
        target: path.relative(ROOT, TARGET),
        removed: {
          duplicateDeclarations: duplicateDeclarationsRemoved,
          duplicateRules: duplicateRulesRemoved
        },
        before,
        after,
        delta: {
          bytes: after.bytes - before.bytes,
          important: after.important - before.important
        },
        validation: {
          build: "passed",
          componentAdoption: "passed",
          designSystemAudit: "passed",
          performanceStrict: "passed"
        }
      },
      null,
      2
    ) + "\n"
  );

  log(
    `Entfernt: ${duplicateDeclarationsRemoved} identische Deklarationen, ` +
    `${duplicateRulesRemoved} identische Regeln`
  );
  log(
    `CSS: ${before.bytes} B → ${after.bytes} B ` +
    `(${after.bytes - before.bytes} B)`
  );
  log(
    `!important: ${before.important} → ${after.important}`
  );
  log(`Validierung: ${path.relative(ROOT, REPORT)}`);
  log("Abgeschlossen.");
} catch (error) {
  console.error(`[${NAME}] FEHLER: ${error.message}`);
  restore();
  console.error(`[${NAME}] Änderungen wurden zurückgerollt.`);
  process.exitCode = 1;
}

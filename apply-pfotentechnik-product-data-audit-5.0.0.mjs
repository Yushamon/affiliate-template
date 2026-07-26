import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const PATCH = "pfotentechnik-product-data-audit-5.0.0";
const root = process.cwd();
const target = path.join(
  root,
  "apps",
  "pfotentechnik",
  "scripts",
  "audit-product-data.mjs"
);
const backupDir = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);
const backupFile = path.join(
  backupDir,
  "apps",
  "pfotentechnik",
  "scripts",
  "audit-product-data.mjs"
);

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32"
  });

  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");

  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(" ")} ist fehlgeschlagen.`);
  }
}

function replaceOnce(source, before, after, label) {
  const occurrences = source.split(before).length - 1;
  if (occurrences !== 1) {
    throw new Error(
      `Anker "${label}" wurde ${occurrences} statt genau einmal gefunden.`
    );
  }
  return source.replace(before, after);
}

if (!fs.existsSync(target)) {
  console.error(`[${PATCH}] Zieldatei fehlt: ${path.relative(root, target)}`);
  process.exit(1);
}

const original = fs.readFileSync(target, "utf8");

try {
  fs.mkdirSync(path.dirname(backupFile), { recursive: true });
  fs.writeFileSync(backupFile, original, "utf8");

  let next = original;

  next = replaceOnce(
    next,
    `  errors: results.reduce((sum, item) => sum + item.errors.length, 0),
  warnings: results.reduce((sum, item) => sum + item.warnings.length, 0),
  duplicateSlugs: duplicateSlugs.length`,
    `  errors: results.reduce((sum, item) => sum + item.errors.length, 0),
  warnings: results.reduce((sum, item) => sum + item.warnings.length, 0),
  notes: results.reduce((sum, item) => sum + item.notes.length, 0),
  duplicateSlugs: duplicateSlugs.length`,
    "Zusammenfassung"
  );

  next = replaceOnce(
    next,
    `function auditProduct(product) {
  const errors = [];
  const warnings = [];`,
    `function auditProduct(product) {
  const errors = [];
  const warnings = [];
  const notes = [];`,
    "Audit-Listen"
  );

  next = replaceOnce(
    next,
    `      } else if (status === "unknown") {
        warnings.push(\`Empfohlenes Feld unbestätigt: \${aliases[0]}\`);
      }`,
    `      } else if (status === "unknown") {
        notes.push(
          \`Herstellerangabe dokumentiert, aber nicht bestätigt: \${aliases[0]}\`
        );
      }`,
    "Empfohlene unbestätigte Felder"
  );

  next = replaceOnce(
    next,
    `    errors,
    warnings,
    specs: product.specs,`,
    `    errors,
    warnings,
    notes,
    specs: product.specs,`,
    "Produktergebnis"
  );

  next = replaceOnce(
    next,
    `    \`- Warnungen: \${summary.warnings}\`,
    \`- Doppelte Slugs: \${summary.duplicateSlugs}\`,`,
    `    \`- Warnungen: \${summary.warnings}\`,
    \`- Dokumentierte Hinweise: \${summary.notes}\`,
    \`- Doppelte Slugs: \${summary.duplicateSlugs}\`,`,
    "Markdown-Zusammenfassung"
  );

  next = replaceOnce(
    next,
    `    if (product.warnings.length) {
      lines.push("- Warnungen:");
      for (const issue of product.warnings) lines.push(\`  - \${issue}\`);
    }

    lines.push("");`,
    `    if (product.warnings.length) {
      lines.push("- Warnungen:");
      for (const issue of product.warnings) lines.push(\`  - \${issue}\`);
    }

    if (product.notes.length) {
      lines.push("- Dokumentierte Hinweise:");
      for (const issue of product.notes) lines.push(\`  - \${issue}\`);
    }

    lines.push("");`,
    "Markdown-Produkthinweise"
  );

  next = replaceOnce(
    next,
    `  console.log(\`Warnungen: \${summary.warnings}\`);
  console.log(\`Doppelte Slugs: \${duplicateSlugs.length}\`);`,
    `  console.log(\`Warnungen: \${summary.warnings}\`);
  console.log(\`Dokumentierte Hinweise: \${summary.notes}\`);
  console.log(\`Doppelte Slugs: \${duplicateSlugs.length}\`);`,
    "Konsolen-Zusammenfassung"
  );

  fs.writeFileSync(target, next.replace(/\r\n/g, "\n"), "utf8");

  console.log(`[${PATCH}] Auditlogik aktualisiert.`);
  console.log(
    "Unbestätigte empfohlene Herstellerangaben werden jetzt als Hinweise statt als Qualitätswarnungen geführt."
  );
  console.log("");

  run("node", ["--check", target]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:products:strict"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:audit"]);
  run("npm", ["run", "build:pfotentechnik"]);

  const reportPath = path.join(
    root,
    "apps",
    "pfotentechnik",
    "reports",
    "product-data-audit.json"
  );
  const report = JSON.parse(fs.readFileSync(reportPath, "utf8"));

  if (report.summary.errors !== 0) {
    throw new Error(
      `Der Produktdaten-Audit enthält noch ${report.summary.errors} Fehler.`
    );
  }

  console.log("");
  console.log(`[${PATCH}] Erfolgreich abgeschlossen.`);
  console.log(`Fehler: ${report.summary.errors}`);
  console.log(`Warnungen: ${report.summary.warnings}`);
  console.log(`Dokumentierte Hinweise: ${report.summary.notes}`);
  console.log(`Backup: ${path.relative(root, backupFile)}`);
} catch (error) {
  fs.writeFileSync(target, original, "utf8");
  console.error("");
  console.error(`[${PATCH}] Fehlgeschlagen. Die Auditdatei wurde zurückgesetzt.`);
  console.error(error?.stack || error);
  process.exit(1);
}

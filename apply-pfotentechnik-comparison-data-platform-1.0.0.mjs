#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH_ID = "pfotentechnik-comparison-data-platform-1.0.0";
const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const PAYLOAD_ROOT = path.join(SCRIPT_DIR, "comparison-data-platform-payload");
const CHECK_ONLY = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");
const SKIP_MIGRATION = process.argv.includes("--skip-migration");

const TARGETS = {
  comparisonSchema: "apps/pfotentechnik/src/content/schema/comparison.ts",
  productSchema: "apps/pfotentechnik/src/content/schema/product.ts",
  viewModel: "apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts",
  appPackage: "apps/pfotentechnik/package.json",
  rootPackage: "package.json"
};

function log(message) {
  console.log(`[${PATCH_ID}] ${message}`);
}

function fail(message) {
  throw new Error(message);
}

function isRepoRoot(candidate) {
  return (
    fs.existsSync(path.join(candidate, "package.json")) &&
    fs.existsSync(path.join(candidate, "apps", "pfotentechnik")) &&
    fs.existsSync(path.join(candidate, "packages", "affiliate-core"))
  );
}

function findRepoRoot() {
  for (const start of [process.cwd(), SCRIPT_DIR]) {
    let current = path.resolve(start);
    while (true) {
      if (isRepoRoot(current)) return current;
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  fail("Repository-Hauptverzeichnis nicht gefunden.");
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function writeAtomic(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  const temp = `${file}.${process.pid}.tmp`;
  fs.writeFileSync(temp, content, "utf8");
  fs.renameSync(temp, file);
}

function replaceRequired(source, search, replacement, label) {
  if (!source.includes(search)) fail(`Anker nicht gefunden: ${label}`);
  return source.replace(search, replacement);
}

function patchComparisonSchema(source) {
  let next = source;

  if (!next.includes("source: z.string().optional()")) {
    const oldCriterion = `    weight: z
      .number()
      .min(0)
      .optional()
  });`;
    const newCriterion = `    weight: z
      .number()
      .min(0)
      .optional(),

    source: z.string().optional(),

    format: z
      .enum([
        "auto",
        "text",
        "boolean",
        "number",
        "list"
      ])
      .default("auto"),

    unit: z.string().optional(),

    fallback: z
      .string()
      .default("–")
  });`;
    next = replaceRequired(next, oldCriterion, newCriterion, "comparison.ts: criterion-Erweiterung");
  }

  if (!next.includes("overrides: z")) {
    const oldValues = `    values: z
      .record(
        z.string(),
        z.union([
          z.string(),
          z.number(),
          z.boolean()
        ])
      )
      .default({})`;
    const newValues = `    overrides: z
      .record(
        z.string(),
        z.union([
          z.string(),
          z.number(),
          z.boolean()
        ])
      )
      .default({}),

    values: z
      .record(
        z.string(),
        z.union([
          z.string(),
          z.number(),
          z.boolean()
        ])
      )
      .optional()
      .default({})`;
    next = replaceRequired(next, oldValues, newValues, "comparison.ts: item overrides");
  }

  return next;
}

function patchProductSchema(source) {
  if (source.includes("version: z.literal(1).optional()")) return source;

  const oldSchema = `const productComparisonDataSchema = z
  .record(z.string(), comparisonValueSchema)
  .optional();`;
  const newSchema = `const comparisonRecordSchema =
  z.record(
    z.string(),
    comparisonValueSchema
  );

const productComparisonDataSchema = z
  .object({
    version: z.literal(1).optional(),
    general: comparisonRecordSchema.optional(),
    feeder: comparisonRecordSchema.optional(),
    fountain: comparisonRecordSchema.optional(),
    gps: comparisonRecordSchema.optional(),
    editorial: comparisonRecordSchema.optional(),
    custom: comparisonRecordSchema.optional()
  })
  .catchall(comparisonValueSchema)
  .optional();`;

  return replaceRequired(source, oldSchema, newSchema, "product.ts: comparisonData-Schema");
}

function patchViewModel(source) {
  let next = source;

  if (!next.includes('from "./comparisonDataPlatform"')) {
    next = replaceRequired(
      next,
      'import { buildAutomaticRecommendations } from "./recommendationEngine";',
      'import { buildAutomaticRecommendations } from "./recommendationEngine";\nimport { resolveComparisonValue } from "./comparisonDataPlatform";',
      "buildComparisonViewModel: Resolver-Import"
    );
  }

  if (!next.includes("resolveComparisonValue({")) {
    const start = next.indexOf("  const getCriterionValue = (");
    const end = next.indexOf("\n  const rows: ComparisonRow[]", start);
    if (start < 0 || end < 0) {
      fail("Anker nicht gefunden: buildComparisonViewModel Zellenauflösung");
    }

    const replacement = `  const getCriterionValue = (
    item: (typeof items)[number],
    criterion: (typeof data.criteria)[number]
  ): string =>
    resolveComparisonValue({
      product: productBySlug.get(item.slug),
      item,
      criterion
    });

  const rawRows = data.criteria.map((criterion) => ({
    criterion: {
      key: criterion.key,
      label: criterion.label,
      description: criterion.description
    },
    cells: items.map((item) => ({
      productSlug: item.slug,
      value: getCriterionValue(item, criterion)
    }))
  }));
`;

    next = next.slice(0, start) + replacement + next.slice(end);
  }

  return next;
}

function patchPackage(source, root) {
  const parsed = JSON.parse(source);
  parsed.scripts ??= {};

  if (root) {
    parsed.scripts["comparison:data:audit"] =
      "npm --workspace apps/pfotentechnik run comparison:data:audit";
    parsed.scripts["comparison:data:audit:strict"] =
      "npm --workspace apps/pfotentechnik run comparison:data:audit:strict";
    parsed.scripts["comparison:data:migrate"] =
      "npm --workspace apps/pfotentechnik run comparison:data:migrate";
    parsed.scripts["comparison:data:migrate:check"] =
      "npm --workspace apps/pfotentechnik run comparison:data:migrate:check";
    parsed.scripts["comparison:data:test"] =
      "npm --workspace apps/pfotentechnik run comparison:data:test";
  } else {
    parsed.scripts["comparison:data:audit"] =
      "node scripts/comparison-platform/data-audit.mjs";
    parsed.scripts["comparison:data:audit:strict"] =
      "node scripts/comparison-platform/data-audit.mjs --strict";
    parsed.scripts["comparison:data:migrate"] =
      "node scripts/comparison-platform/migrate-data.mjs --write";
    parsed.scripts["comparison:data:migrate:check"] =
      "node scripts/comparison-platform/migrate-data.mjs";
    parsed.scripts["comparison:data:test"] =
      "node --test test/comparison-data-platform.test.mjs";
  }

  return JSON.stringify(parsed, null, 2) + "\n";
}

function walk(dir, output = []) {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, output);
    else if (entry.isFile()) output.push(full);
  }
  return output;
}

function payloadFiles() {
  if (!fs.existsSync(PAYLOAD_ROOT)) {
    fail(`Payload-Verzeichnis fehlt: ${PAYLOAD_ROOT}`);
  }
  return walk(PAYLOAD_ROOT);
}

function snapshot(root, files, backupRoot) {
  for (const file of files) {
    const rel = path.relative(root, file);
    const destination = path.join(backupRoot, rel);
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    if (fs.existsSync(file)) {
      fs.copyFileSync(file, destination);
      fs.writeFileSync(destination + ".exists", "1");
    } else {
      fs.writeFileSync(destination + ".missing", "1");
    }
  }
}

function restore(root, files, backupRoot) {
  for (const file of files) {
    const rel = path.relative(root, file);
    const backup = path.join(backupRoot, rel);
    if (fs.existsSync(backup + ".exists")) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(backup, file);
    } else if (fs.existsSync(backup + ".missing") && fs.existsSync(file)) {
      fs.rmSync(file, { force: true });
    }
  }
}

function runCommand(root, command, args) {
  let result;
  if (process.platform === "win32") {
    const shell = process.env.ComSpec ||
      path.join(process.env.SystemRoot || "C:\\Windows", "System32", "cmd.exe");
    const line = [command, ...args].map((value) =>
      /[\s"&|<>^()%!]/.test(value)
        ? `"${String(value).replaceAll('"', '""')}"`
        : value
    ).join(" ");
    result = spawnSync(shell, ["/d", "/s", "/c", line], {
      cwd: root,
      stdio: "inherit",
      shell: false
    });
  } else {
    result = spawnSync(command, args, {
      cwd: root,
      stdio: "inherit",
      shell: false
    });
  }

  if (result.error) fail(result.error.message);
  if (result.status !== 0) {
    fail(`${command} ${args.join(" ")} fehlgeschlagen (Exit ${result.status}).`);
  }
}

function countLegacyValues(root) {
  const dir = path.join(root, "apps/pfotentechnik/src/content/comparisons");
  return walk(dir)
    .filter((file) => /\.mdx?$/.test(file))
    .reduce((count, file) =>
      count + (read(file).match(/^    values:\s*$/gm)?.length ?? 0),
    0);
}

function main() {
  const root = findRepoRoot();
  log(`Repository: ${root}`);
  log(`Modus: ${CHECK_ONLY ? "nur prüfen" : "Änderungen anwenden"}`);

  const operations = [
    [TARGETS.comparisonSchema, patchComparisonSchema],
    [TARGETS.productSchema, patchProductSchema],
    [TARGETS.viewModel, patchViewModel],
    [TARGETS.appPackage, (source) => patchPackage(source, false)],
    [TARGETS.rootPackage, (source) => patchPackage(source, true)]
  ];

  const plans = operations.map(([relativePath, patcher]) => {
    const file = path.join(root, relativePath);
    if (!fs.existsSync(file)) fail(`Datei nicht gefunden: ${relativePath}`);
    const original = read(file);
    const content = patcher(original);
    return { relativePath, file, original, content, changed: content !== original };
  });

  for (const payload of payloadFiles()) {
    const relativePath = path.relative(PAYLOAD_ROOT, payload).replaceAll("\\", "/");
    const file = path.join(root, relativePath);
    const original = fs.existsSync(file) ? read(file) : null;
    const content = read(payload);
    plans.push({ relativePath, file, original, content, changed: original !== content });
  }

  for (const plan of plans) {
    log(`${plan.changed ? "ÄNDERN" : "OK"}: ${plan.relativePath}`);
  }

  const legacyCount = countLegacyValues(root);
  log(`Alte values-Blöcke: ${legacyCount}`);

  if (CHECK_ONLY) {
    log(`${plans.filter((plan) => plan.changed).length} Plattformdatei(en) würden geändert.`);
    if (!SKIP_MIGRATION) {
      log("Die Migration würde konsistente technische Werte in Produktdateien verschieben.");
    }
    return;
  }

  const dynamicFiles = [
    ...walk(path.join(root, "apps/pfotentechnik/src/content/products"))
      .filter((file) => /\.mdx?$/.test(file)),
    ...walk(path.join(root, "apps/pfotentechnik/src/content/comparisons"))
      .filter((file) => /\.mdx?$/.test(file))
  ];

  const allFiles = [...new Set([...plans.map((plan) => plan.file), ...dynamicFiles])];
  const backupRoot = path.join(
    root,
    ".patch-backups",
    `${PATCH_ID}-${new Date().toISOString().replace(/[:.]/g, "-")}`
  );

  snapshot(root, allFiles, backupRoot);
  log(`Backup: ${backupRoot}`);

  try {
    for (const plan of plans) {
      if (plan.changed) writeAtomic(plan.file, plan.content);
    }

    runCommand(root, "node", [
      "--test",
      "apps/pfotentechnik/test/comparison-data-platform.test.mjs"
    ]);

    if (!SKIP_MIGRATION) {
      runCommand(root, "node", [
        "apps/pfotentechnik/scripts/comparison-platform/migrate-data.mjs",
        "--write"
      ]);
    } else {
      log("Datenmigration durch --skip-migration übersprungen.");
    }

    runCommand(root, "node", [
      "apps/pfotentechnik/scripts/comparison-platform/data-audit.mjs"
    ]);

    if (!SKIP_BUILD) {
      runCommand(root, "npm", ["run", "build:pfotentechnik"]);
    } else {
      log("Build durch --skip-build übersprungen.");
    }

    log("Comparison Data Platform erfolgreich installiert.");
  } catch (error) {
    console.error(`[${PATCH_ID}] Fehler erkannt. Rollback wird ausgeführt ...`);
    restore(root, allFiles, backupRoot);
    console.error(`[${PATCH_ID}] Rollback abgeschlossen.`);
    throw error;
  }
}

try {
  main();
} catch (error) {
  console.error(`\n[${PATCH_ID}] FEHLER: ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-product-faq-cleanup-25.6.0";
const TARGETS = [
  "petlibro-space-smart-feeder.md",
  "weenect-xs.md",
  "weenect-xt.md"
];
const MAX_FAQ = 12;

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

function splitFrontmatter(source) {
  const match = source.match(/^---\s*\n([\s\S]*?)\n---([\s\S]*)$/);
  if (!match) throw new Error("Frontmatter nicht gefunden.");
  return { frontmatter: match[1], body: match[2] };
}

function extractTopLevelSection(frontmatter, key) {
  const lines = frontmatter.split("\n");
  const start = lines.findIndex((line) => line === `${key}:`);
  if (start < 0) return null;

  let end = lines.length;
  for (let index = start + 1; index < lines.length; index += 1) {
    if (/^[^\s][A-Za-z0-9_-]*:/.test(lines[index])) {
      end = index;
      break;
    }
  }

  return {
    start,
    end,
    header: lines[start],
    lines: lines.slice(start + 1, end),
    allLines: lines
  };
}

function splitFaqItems(lines) {
  const items = [];
  let current = [];

  for (const line of lines) {
    if (/^\s{2}-\s+question:\s*/.test(line)) {
      if (current.length) items.push(current);
      current = [line];
    } else if (current.length) {
      current.push(line);
    }
  }

  if (current.length) items.push(current);
  return items;
}

function rebuildFaq(frontmatter, maxItems) {
  const section = extractTopLevelSection(frontmatter, "faq");
  if (!section) return { frontmatter, before: 0, after: 0, removed: 0 };

  const items = splitFaqItems(section.lines);
  if (items.length <= maxItems) {
    return {
      frontmatter,
      before: items.length,
      after: items.length,
      removed: 0
    };
  }

  const kept = items.slice(0, maxItems);
  const replacement = [
    "faq:",
    ...kept.flatMap((item, index) => [
      ...(index > 0 ? [""] : []),
      ...item
    ])
  ];

  const nextLines = [
    ...section.allLines.slice(0, section.start),
    ...replacement,
    ...section.allLines.slice(section.end)
  ];

  return {
    frontmatter: nextLines.join("\n"),
    before: items.length,
    after: kept.length,
    removed: items.length - kept.length
  };
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PRODUCT_DIR = path.join(APP, "src", "content", "products");
const BACKUP_DIR = path.join(
  ROOT,
  ".patch-backups",
  NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-")
);

const summary = [];

for (const fileName of TARGETS) {
  const target = path.join(PRODUCT_DIR, fileName);
  if (!fs.existsSync(target)) {
    throw new Error(`Produktdatei nicht gefunden: ${path.relative(ROOT, target)}`);
  }

  const source = fs.readFileSync(target, "utf8");
  const parsed = splitFrontmatter(source);
  const result = rebuildFaq(parsed.frontmatter, MAX_FAQ);

  if (result.removed > 0) {
    const backup = path.join(BACKUP_DIR, path.relative(ROOT, target));
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.copyFileSync(target, backup);

    fs.writeFileSync(target, `---\n${result.frontmatter}\n---${parsed.body}`);
    console.log(
      `[${NAME}] ${fileName}: ${result.before} → ${result.after} FAQ`
    );
  } else {
    console.log(
      `[${NAME}] ${fileName}: bereits ${result.after} FAQ, unverändert`
    );
  }

  summary.push({
    file: fileName,
    before: result.before,
    after: result.after,
    removed: result.removed
  });
}

const reportDir = path.join(APP, "reports", "product-standard-3");
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(
  path.join(reportDir, "faq-cleanup-25.6.0.json"),
  JSON.stringify({ version: "25.6.0", summary }, null, 2) + "\n"
);

const testPath = path.join(APP, "test", "product-faq-cleanup-25.6.0.test.mjs");
const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const PRODUCT_DIR = path.join(ROOT, "apps", "pfotentechnik", "src", "content", "products");
const TARGETS = [
  "petlibro-space-smart-feeder.md",
  "weenect-xs.md",
  "weenect-xt.md"
];

function faqCount(source) {
  const lines = source.split("\\n");
  const start = lines.findIndex((line) => line === "faq:");
  if (start < 0) return 0;

  let count = 0;

  for (let index = start + 1; index < lines.length; index += 1) {
    const line = lines[index];

    if (/^[^\\s][A-Za-z0-9_-]*:/.test(line)) break;
    if (/^\\s{2}-\\s+question:/.test(line)) count += 1;
  }

  return count;
}

test("Alle drei Zielseiten haben höchstens zwölf FAQ", () => {
  for (const file of TARGETS) {
    const source = fs.readFileSync(path.join(PRODUCT_DIR, file), "utf8");
    assert.ok(faqCount(source) <= 12, file);
  }
});

test("FAQ-Blöcke bleiben vorhanden", () => {
  for (const file of TARGETS) {
    const source = fs.readFileSync(path.join(PRODUCT_DIR, file), "utf8");
    assert.match(source, /^faq:\\s*$/m, file);
    assert.ok(faqCount(source) >= 8, file);
  }
});
`;

fs.writeFileSync(testPath, testSource);
console.log(`[${NAME}] Geschrieben: ${path.relative(ROOT, testPath)}`);

execFileSync(process.execPath, ["--test", testPath], {
  cwd: ROOT,
  stdio: "inherit"
});

execFileSync(
  "npm",
  ["--workspace", "apps/pfotentechnik", "run", "audit:product-standard-3"],
  {
    cwd: ROOT,
    stdio: "inherit"
  }
);

const auditReport = JSON.parse(
  fs.readFileSync(
    path.join(
      APP,
      "reports",
      "product-standard-3",
      "product-standard-3-latest.json"
    ),
    "utf8"
  )
);

const excessive = auditReport.products
  .flatMap((product) => product.findings)
  .filter((finding) => finding.code === "FAQ_EXCESSIVE");

if (excessive.length > 0) {
  throw new Error(`FAQ_EXCESSIVE weiterhin vorhanden: ${excessive.length}`);
}

console.log(`[${NAME}] Audit ohne FAQ_EXCESSIVE bestanden.`);
console.log(`[${NAME}] Danach vollständiges Release ausführen:`);
console.log(`npm --workspace apps/pfotentechnik run product-standard-3:release`);

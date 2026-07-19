#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const here = path.dirname(fileURLToPath(import.meta.url));

const schemaPath = path.join(root, "apps/pfotentechnik/src/content/schema/page.ts");
const pagePath = path.join(root, "apps/pfotentechnik/src/pages/[slug].astro");

const copiedFiles = [
  "apps/pfotentechnik/src/domain/contentPlatform/assembleContentPage.ts",
  "apps/pfotentechnik/src/domain/contentPlatform/index.ts",
  "apps/pfotentechnik/src/components/AutoContentBlocks.astro",
  "docs/CONTENT_PLATFORM_2.md"
];

for (const file of [schemaPath, pagePath]) {
  if (!fs.existsSync(file)) {
    console.error(`Abbruch: Datei nicht gefunden: ${file}`);
    process.exit(1);
  }
}

const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, `.content-platform-2-backup-${stamp}`);

function backup(file) {
  if (!fs.existsSync(file)) return;
  const relative = path.relative(root, file);
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

backup(schemaPath);
backup(pagePath);
for (const relative of copiedFiles) backup(path.join(root, relative));

let schema = fs.readFileSync(schemaPath, "utf8");
let page = fs.readFileSync(pagePath, "utf8");

const schemaDefinition = `
const contentPlatformSchema =
  z.object({
    version: z.literal(2).default(2),
    cluster: z.string(),
    intent: z
      .enum([
        "informational",
        "buying-guide",
        "comparison-support",
        "troubleshooting",
        "how-to",
        "health-guide"
      ])
      .default("informational"),
    animal: z
      .enum(["dog", "cat", "both"])
      .optional(),
    products: z.array(z.string()).default([]),
    decision: z
      .union([
        z.literal("auto"),
        z.literal("off"),
        z.string()
      ])
      .default("auto"),
    blocks: z
      .array(
        z.enum([
          "summary",
          "recommendation",
          "comparison",
          "fit",
          "checklist",
          "mistakes"
        ])
      )
      .default([]),
    summary: z.array(z.string()).default([]),
    suitableFor: z.array(z.string()).default([]),
    notSuitableFor: z.array(z.string()).default([]),
    checklist: z.array(z.string()).default([]),
    mistakes: z.array(z.string()).default([]),
    faqMode: z
      .enum(["manual", "none"])
      .default("manual"),
    cta: z
      .object({
        mode: z
          .enum(["auto", "off"])
          .default("auto"),
        productKey: z.string().optional(),
        title: z.string().optional(),
        text: z.string().optional()
      })
      .optional(),
    theme: z
      .enum([
        "teal",
        "amber",
        "blue",
        "green",
        "rose",
        "neutral"
      ])
      .optional()
  })
  .optional();

`;

if (!schema.includes("const contentPlatformSchema")) {
  const anchor = "export const createPageContentSchema";
  if (!schema.includes(anchor)) {
    console.error("Abbruch: Schema-Anker nicht gefunden.");
    process.exit(1);
  }
  schema = schema.replace(anchor, schemaDefinition + anchor);
  console.log("ergänzt: contentPlatformSchema");
}

if (!schema.includes("contentPlatform:\n      contentPlatformSchema")) {
  const categoryPathAnchor = /\n\s{4}categoryPath:\s*\n\s{6}z\.string\(\)\.optional\(\),/;
  const match = schema.match(categoryPathAnchor);
  if (!match) {
    console.error("Abbruch: categoryPath-Anker nicht gefunden.");
    process.exit(1);
  }
  schema = schema.replace(
    match[0],
    `\n    contentPlatform:\n      contentPlatformSchema,\n${match[0]}`
  );
  console.log("ergänzt: contentPlatform-Feld");
}

schema = schema.replace(
  /category:\s*z\.string\(\),/,
  "category:\n      z.string().optional(),"
);
schema = schema.replace(
  /categoryLabel:\s*z\.string\(\),/,
  "categoryLabel:\n      z.string().optional(),"
);

function ensureImport(source, importLine, preferredAnchor) {
  if (source.includes(importLine)) return source;
  if (source.includes(preferredAnchor)) {
    return source.replace(preferredAnchor, `${preferredAnchor}\n${importLine}`);
  }
  const lastImport = [...source.matchAll(/^import .*;$/gm)].at(-1);
  if (!lastImport) throw new Error(`Kein Importanker für ${importLine}`);
  const end = lastImport.index + lastImport[0].length;
  return source.slice(0, end) + "\n" + importLine + source.slice(end);
}

page = ensureImport(
  page,
  'import AutoContentBlocks from "../components/AutoContentBlocks.astro";',
  'import HealthBridge from "../components/HealthBridge.astro";'
);
page = ensureImport(
  page,
  'import { assembleContentPage } from "../domain/contentPlatform";',
  'import { projectConfig, siteMeta } from "../project.config";'
);

if (!page.includes("const assembledPage = assembleContentPage(page.data);")) {
  const anchors = [
    "const sourceContexts = getSourceContexts(page.data);",
    "const productBySlug = new Map("
  ];
  const anchor = anchors.find((item) => page.includes(item));
  if (!anchor) {
    console.error("Abbruch: Daten-Anker in [slug].astro nicht gefunden.");
    process.exit(1);
  }
  page = page.replace(anchor, `${anchor}\nconst assembledPage = assembleContentPage(page.data);`);
}

const replacements = [
  ["page.data.decisionKey", "assembledPage.decisionKey"],
  ["page.data.themeColor ?? \"teal\"", "assembledPage.themeColor"],
  ["(page.data.comparisonProducts ?? [])", "assembledPage.comparisonProducts"],
  ["page.data.closingCta", "assembledPage.closingCta"],
  ["page.data.faq", "assembledPage.faq"],
  ["page.data.categoryLabel", "assembledPage.categoryLabel"]
];

for (const [from, to] of replacements) {
  page = page.split(from).join(to);
}

if (!page.includes("<AutoContentBlocks")) {
  const tocPatterns = [
    /(<TableOfContents[^>]*\/>)/,
    /(<TableOfContents[\s\S]*?<\/TableOfContents>)/
  ];
  const tocPattern = tocPatterns.find((pattern) => pattern.test(page));
  if (!tocPattern) {
    console.error("Abbruch: TableOfContents-Anker nicht gefunden.");
    process.exit(1);
  }
  page = page.replace(
    tocPattern,
    `$1\n\n    <AutoContentBlocks\n      page={assembledPage}\n      products={products}\n    />`
  );
}

for (const relative of copiedFiles) {
  const source = path.join(here, "files", relative);
  const target = path.join(root, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

fs.writeFileSync(schemaPath, schema, "utf8");
fs.writeFileSync(pagePath, page, "utf8");

const manifest = {
  installedAt: new Date().toISOString(),
  backupRoot,
  files: [
    path.relative(root, schemaPath),
    path.relative(root, pagePath),
    ...copiedFiles
  ]
};

fs.writeFileSync(
  path.join(root, ".content-platform-2.json"),
  JSON.stringify(manifest, null, 2),
  "utf8"
);

console.log(`Backup erstellt: ${backupRoot}`);
console.log("Content Platform 2.0 installiert.");
console.log("Jetzt ausführen: npm run build:pfotentechnik");

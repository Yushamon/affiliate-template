#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const strict = process.argv.includes("--strict");

const requiredFiles = [
  "src/pages/admin/seo/topical-authority.astro",
  "src/lib/seo/topical-authority/loadTopicalAuthority.ts",
  "src/layouts/SeoAdminLayout.astro",
  "test/topical-authority-center.test.mjs",
];

const checks = requiredFiles.map((file) => ({
  id: "FILE",
  ok: fs.existsSync(path.join(app, file)),
  message: file,
}));

const read = (file) => fs.readFileSync(path.join(app, file), "utf8");
const layout = read("src/layouts/SeoAdminLayout.astro");
const page = read("src/pages/admin/seo/topical-authority.astro");
const loader = read("src/lib/seo/topical-authority/loadTopicalAuthority.ts");
const tests = read("test/topical-authority-center.test.mjs");

checks.push(
  {
    id: "NAV",
    ok: layout.includes("/admin/seo/topical-authority/"),
    message: "Navigation enthält Topical Authority",
  },
  {
    id: "LAYOUT",
    ok: /active\s*=\s*["']topical-authority["']/.test(page),
    message: "Seite nutzt SEO Admin Layout",
  },
  {
    id: "RESPONSIVE",
    ok: /@media\s*\(\s*(?:max-width|min-width)\s*:/.test(page),
    message: "Responsive Regeln vorhanden",
  },
  {
    id: "TOKENS",
    ok: /var\(\s*--seo-/.test(page),
    message: "Dark-Mode-fähige SEO Tokens",
  },
  {
    id: "CLUSTER_SIGNALS",
    ok:
      loader.includes("slugPatterns") &&
      loader.includes("titlePatterns") &&
      loader.includes("excludePatterns") &&
      loader.includes("belongsToCluster"),
    message: "Cluster verwenden gewichtete und ausschließende Signale",
  },
  {
    id: "BODY_GUARD",
    ok: loader.includes("bodyEvidence") && loader.includes("primaryEvidence"),
    message: "Body-Treffer allein erzeugen keine Clusterzuordnung",
  },
  {
    id: "MANUFACTURER_GUARD",
    ok: loader.includes('document.type === "manufacturer"') && loader.includes("manufacturerEvidence"),
    message: "Hersteller werden nicht über generischen Body-Text zugeordnet",
  },
  {
    id: "ZERO_CLUSTER",
    ok: loader.includes("members.length === 0") && loader.includes("? 0"),
    message: "Nicht vorhandene Cluster erhalten Score 0",
  },
  {
    id: "PRODUCT_CATEGORY_SOURCE",
    ok:
      loader.includes("categoryKey: string;") &&
      loader.includes('parseNestedFrontmatterValue(raw, "category", "key")') &&
      loader.includes("const PRODUCT_CATEGORY_CLUSTER_MAP") &&
      loader.includes("function productClusterFromCategory(") &&
      loader.includes("return categoryCluster === definition.id;"),
    message: "Produkte nutzen category.key als verbindliche Clusterquelle",
  },
  {
    id: "PRODUCT_HEURISTIC_GUARD",
    ok: (() => {
      const branch = loader.match(
        /if \(document\.type === "product"\) \{([\s\S]*?)\n  \}/,
      );
      if (!branch) return false;

      return (
        branch[1].includes(
          "return categoryCluster === definition.id;",
        ) &&
        !branch[1].includes("primaryEvidence") &&
        !branch[1].includes("manufacturerEvidence") &&
        !branch[1].includes("bodyEvidence")
      );
    })(),
    message: "Produktcluster werden nicht über Text oder Hersteller geraten",
  },
  {
    id: "REGRESSION_TESTS",
    ok:
      tests.includes(
        "Produktkategorie nutzt category.key als Source of Truth",
      ) &&
      tests.includes(
        "Hersteller und Body bestimmen keine Produktkategorie",
      ) &&
      tests.includes(
        "Fehlende Produktkategorien werden nicht heuristisch geraten",
      ) &&
      tests.includes(
        "Gemeinsame Marken können Produktcluster nicht überschreiben",
      ) &&
      tests.includes("Automatische Katzentoiletten"),
    message: "Regressionstests für strukturierte Produktzuordnung vorhanden",
  },
);

const failed = checks.filter((check) => !check.ok);
const report = {
  patch: "pfotentechnik-topical-authority-behavior-tests-1.2.7",
  generatedAt: new Date().toISOString(),
  status: failed.length ? "failed" : "passed",
  checks,
};

const reportDir = path.join(app, "reports", "topical-authority");
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(
  path.join(reportDir, "topical-authority-center-audit.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

for (const check of checks) {
  console.log(`${check.ok ? "OK" : "FEHLER"}  ${check.id} · ${check.message}`);
}

if (strict && failed.length) process.exit(1);

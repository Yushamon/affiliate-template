#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const packageRoot = path.dirname(fileURLToPath(import.meta.url));

const renderer = path.join(
  root,
  "packages/affiliate-core/src/renderer/PremiumRenderer.astro"
);
const designCss = path.join(
  root,
  "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"
);
const manifest = path.join(
  root,
  ".editorial-design-system-6.1.1-mobile-structural-fix.json"
);

for (const file of [renderer, designCss]) {
  if (!fs.existsSync(file)) {
    console.error("Datei fehlt:", file);
    process.exit(1);
  }
}

let rendererContent = fs.readFileSync(renderer, "utf8");
let designContent = fs.readFileSync(designCss, "utf8");

const backupRoot = path.join(
  root,
  `.editorial-design-system-6.1.1-backup-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`
);

for (const file of [renderer, designCss]) {
  const backup = path.join(backupRoot, path.relative(root, file));
  fs.mkdirSync(path.dirname(backup), { recursive: true });
  fs.copyFileSync(file, backup);
}

/* Fehlerblock-Icon semantisch korrigieren */
rendererContent = rendererContent.replace(
  /mistakes:\s*"[^"]+"/,
  'mistakes: "!"'
);

/* Vorhandenen 6.1.1-Block entfernen */
const start =
  "/* === PfotenTechnik Editorial Design System 6.1.1 Mobile Structural Fix === */";
const end =
  "/* === End PfotenTechnik Editorial Design System 6.1.1 Mobile Structural Fix === */";

for (const target of ["renderer", "design"]) {
  let content = target === "renderer" ? rendererContent : designContent;
  const a = content.indexOf(start);
  const b = content.indexOf(end);

  if (a >= 0 && b > a) {
    content =
      content.slice(0, a).trimEnd() +
      "\n\n" +
      content.slice(b + end.length).trimStart();
  }

  if (target === "renderer") rendererContent = content;
  else designContent = content;
}

const patch = fs
  .readFileSync(path.join(packageRoot, "EditorialDesignSystem.6.1.1.css"), "utf8")
  .trim();

/* CSS bewusst im globalen Design-System einfügen */
designContent = designContent.trimEnd() + "\n\n" + patch + "\n";

fs.writeFileSync(renderer, rendererContent, "utf8");
fs.writeFileSync(designCss, designContent, "utf8");

const checks = [
  [renderer, 'mistakes: "!"'],
  [designCss, "Mobile Structural Fix"],
  [designCss, "grid-template-columns: 22px minmax(0, 1fr)"],
  [designCss, "scroll-snap-type: x mandatory"],
  [designCss, '[class*="screenshot"]']
];

for (const [file, needle] of checks) {
  if (!fs.readFileSync(file, "utf8").includes(needle)) {
    console.error("Verifikation fehlgeschlagen:", needle);
    process.exit(1);
  }
}

const audit = path.join(
  root,
  "apps/pfotentechnik/EDITORIAL_DESIGN_SYSTEM_6_1_1_AUDIT.json"
);

fs.writeFileSync(
  audit,
  JSON.stringify(
    {
      installedAt: new Date().toISOString(),
      version: "6.1.1",
      fixed: [
        "collapsed mobile list text",
        "broken product-card highlights",
        "oversized mobile headers",
        "merged premium backgrounds",
        "wrong green check icons in mistake blocks",
        "overly tall checklists",
        "floating share and screenshot overlays",
        "table spacing"
      ]
    },
    null,
    2
  ) + "\n",
  "utf8"
);

fs.writeFileSync(
  manifest,
  JSON.stringify(
    {
      backupRoot,
      files: [
        path.relative(root, renderer),
        path.relative(root, designCss),
        path.relative(root, audit)
      ]
    },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log("");
console.log("Editorial Design System 6.1.1 installiert.");
console.log("Jetzt:");
console.log("  npm run build:pfotentechnik");

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = process.cwd();
const packageRoot = path.dirname(fileURLToPath(import.meta.url));

const target = path.join(
  root,
  "packages/affiliate-core/src/renderer/PremiumRenderer.astro"
);
const source = path.join(packageRoot, "PremiumRenderer.6.0.2.combined.css");
const manifestPath = path.join(
  root,
  ".editorial-design-system-6.0.2-manifest.json"
);

if (!fs.existsSync(target)) {
  console.error("PremiumRenderer.astro wurde nicht gefunden.");
  process.exit(1);
}

let content = fs.readFileSync(target, "utf8");

if (!content.includes("Editorial Design System 6.0")) {
  console.error("Editorial Design System 6.0 scheint nicht installiert zu sein.");
  process.exit(1);
}

if (!content.includes("premium-v3-product-media")) {
  console.error("Die Produktkartenstruktur aus 6.0 fehlt.");
  process.exit(1);
}

const backupRoot = path.join(
  root,
  `.editorial-design-system-6.0.2-backup-${new Date()
    .toISOString()
    .replace(/[:.]/g, "-")}`
);
const backupPath = path.join(backupRoot, path.relative(root, target));

fs.mkdirSync(path.dirname(backupPath), { recursive: true });
fs.copyFileSync(target, backupPath);

/*
 * OptimizedImage explizit auf contain umstellen.
 * Der Komponentenstandard ist cover, daher reicht CSS allein nicht.
 */
const imageNeedle = `                          width={560}
                          height={420}
                          layout="constrained"
                        />`;

const imageReplacement = `                          width={480}
                          height={300}
                          layout="constrained"
                          fit="contain"
                          position="center"
                          sizes="(max-width: 679px) 70vw, (max-width: 979px) 320px, 280px"
                        />`;

if (!content.includes('fit="contain"')) {
  if (!content.includes(imageNeedle)) {
    console.error("OptimizedImage-Konfiguration der Produktkarte nicht gefunden.");
    process.exit(1);
  }

  content = content.replace(imageNeedle, imageReplacement);
}

/*
 * Alten 6.0.1-Block entfernen, da 6.0.2 ihn vollständig ersetzt.
 */
const oldStart =
  "/* === PfotenTechnik Editorial Design System 6.0.1 Mobile Layout Hotfix === */";
const oldEnd =
  "/* === End PfotenTechnik Editorial Design System 6.0.1 Mobile Layout Hotfix === */";

const oldStartIndex = content.indexOf(oldStart);
const oldEndIndex = content.indexOf(oldEnd);

if (oldStartIndex >= 0 && oldEndIndex > oldStartIndex) {
  content =
    content.slice(0, oldStartIndex).trimEnd() +
    "\n\n" +
    content.slice(oldEndIndex + oldEnd.length).trimStart();
}

/*
 * 6.0.2-Block einsetzen oder ersetzen.
 */
const patch = fs.readFileSync(source, "utf8").trim();
const startMarker =
  "/* === PfotenTechnik Editorial Design System 6.0.2 Combined Fix === */";
const endMarker =
  "/* === End PfotenTechnik Editorial Design System 6.0.2 Combined Fix === */";

const existingStart = content.indexOf(startMarker);
const existingEnd = content.indexOf(endMarker);

if (existingStart >= 0 && existingEnd > existingStart) {
  content =
    content.slice(0, existingStart).trimEnd() +
    "\n\n" +
    patch +
    "\n" +
    content.slice(existingEnd + endMarker.length).trimStart();
} else {
  const closingStyle = content.lastIndexOf("</style>");

  if (closingStyle < 0) {
    console.error("Schließender Style-Tag wurde nicht gefunden.");
    process.exit(1);
  }

  content =
    content.slice(0, closingStyle).trimEnd() +
    "\n\n" +
    patch +
    "\n" +
    content.slice(closingStyle);
}

fs.writeFileSync(target, content, "utf8");

const result = fs.readFileSync(target, "utf8");

const checks = [
  'fit="contain"',
  'width={480}',
  'height={300}',
  "6.0.2 Combined Fix",
  "max-width: 76% !important",
  "aspect-ratio: 16 / 10 !important",
  "grid-template-columns: 42px minmax(0, 1fr)",
  "@media (max-width: 679px)"
];

for (const needle of checks) {
  if (!result.includes(needle)) {
    fs.copyFileSync(backupPath, target);
    console.error("Verifikation fehlgeschlagen:", needle);
    console.error("PremiumRenderer wurde zurückgerollt.");
    process.exit(1);
  }
}

fs.writeFileSync(
  manifestPath,
  JSON.stringify(
    {
      installedAt: new Date().toISOString(),
      backupRoot,
      includesFixes: [
        "6.0.1 mobile grid and list stabilization",
        "product image contain rendering",
        "compact product media sizing",
        "responsive image sizes"
      ],
      files: [path.relative(root, target)]
    },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log("");
console.log("Editorial Design System 6.0.2 installiert.");
console.log("");
console.log("- enthält den vollständigen 6.0.1-Layoutfix");
console.log("- Produktbilder verwenden fit=contain");
console.log("- Bildfläche verkleinert und stabilisiert");
console.log("- Verzerrung und übergroße Darstellung neutralisiert");
console.log("- responsive Bildgrößen ergänzt");
console.log("");
console.log("Jetzt ausführen:");
console.log("  npm run build:pfotentechnik");

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import crypto from "node:crypto";

const NAME = "pfotentechnik-css-product-system-cleanup-22.8.1";
const CHECK = process.argv.includes("--check");
const SKIP_BUILD = process.argv.includes("--skip-build");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const CORE_STYLES = path.join(ROOT, "packages", "affiliate-core", "src", "styles");
const SOURCE = path.join(CORE_STYLES, "product.css");
const PRODUCT_BOX = path.join(CORE_STYLES, "product-box.css");
const TEST = path.join(APP, "test", "css-product-system.test.mjs");
const PACKAGE = path.join(APP, "package.json");
const PREVIOUS_TEST = path.join(APP, "test", "css-comparison-system.test.mjs");
const REPORT_DIR = path.join(APP, "reports", "design-system");
const REPORT_JSON = path.join(REPORT_DIR, "css-product-system-22.8.1.json");
const REPORT_MD = path.join(REPORT_DIR, "css-product-system-22.8.1.md");
const BACKUP = path.join(ROOT, ".patch-backups", NAME + "-" + new Date().toISOString().replace(/[:.]/g, "-"));

const IMPORT = '@import "./product-box.css";';
const MARKER = "/* Product ranking landing page */";

const log = (message) => console.log("[" + NAME + "] " + message);

for (const file of [SOURCE, PACKAGE, PREVIOUS_TEST]) {
  if (!fs.existsSync(file)) {
    throw new Error("Erforderliche Datei fehlt: " + path.relative(ROOT, file));
  }
}

const sourceBefore = fs.readFileSync(SOURCE, "utf8");
const alreadyInstalled =
  sourceBefore.startsWith(IMPORT) &&
  fs.existsSync(PRODUCT_BOX);

let sourceAfter = sourceBefore;
let productBoxContent = fs.existsSync(PRODUCT_BOX)
  ? fs.readFileSync(PRODUCT_BOX, "utf8")
  : "";

if (!alreadyInstalled) {
  const markerIndex = sourceBefore.indexOf(MARKER);
  if (markerIndex < 0) {
    throw new Error("Marker nicht gefunden: " + MARKER);
  }

  const prefix = sourceBefore.slice(0, markerIndex).trim();
  const remainder = sourceBefore.slice(markerIndex).trimStart();

  if (!prefix.includes(".product-box-v2")) {
    throw new Error("Product-Box-System vor dem Ranking-Marker nicht gefunden.");
  }

  if (!prefix.includes("@media")) {
    throw new Error("Responsive Product-Box-Regeln wurden nicht gefunden.");
  }

  if (prefix.includes(MARKER)) {
    throw new Error("Ranking-Marker darf nicht in den Product-Box-Layer migriert werden.");
  }

  productBoxContent =
`/* Product detail hero / product box.
 * Aus product.css extrahiert, ohne Selektoren oder Deklarationen zu verändern.
 */

${prefix}
`;

  sourceAfter = `${IMPORT}\n\n${remainder}`;
}


const PRODUCT_BOX_HEADER =
`/* Product detail hero / product box.
 * Aus product.css extrahiert, ohne Selektoren oder Deklarationen zu verändern.
 */

`;

if (!productBoxContent.startsWith(PRODUCT_BOX_HEADER)) {
  throw new Error("Product-Box-Layer besitzt nicht den erwarteten Migrationsheader.");
}

const migratedPayload = productBoxContent.slice(PRODUCT_BOX_HEADER.length).trim();
const migratedBlockHash = crypto
  .createHash("sha256")
  .update(migratedPayload)
  .digest("hex");

if (!migratedPayload.includes(".product-box-v2")) {
  throw new Error("Migrierter Product-Box-Block ist unvollständig.");
}

const pkg = JSON.parse(fs.readFileSync(PACKAGE, "utf8"));
pkg.scripts ||= {};
pkg.scripts["test:css-product-system"] = "node --test test/css-product-system.test.mjs";
const packageAfter = JSON.stringify(pkg, null, 2) + "\n";

const testContent = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const styles = path.join(ROOT, "packages", "affiliate-core", "src", "styles");
const productFile = path.join(styles, "product.css");
const boxFile = path.join(styles, "product-box.css");
const expectedHash = "${migratedBlockHash}";
const header =
\`/* Product detail hero / product box.
 * Aus product.css extrahiert, ohne Selektoren oder Deklarationen zu verändern.
 */

\`;

test("Product-Box-Layer wird vor product.css geladen", () => {
  const product = fs.readFileSync(productFile, "utf8");
  assert.ok(product.startsWith('@import "./product-box.css";'));
  assert.ok(fs.existsSync(boxFile));
});

test("Exakt migrierter Product-Box-Block ist unverändert", () => {
  const box = fs.readFileSync(boxFile, "utf8");
  assert.ok(box.startsWith(header));
  const payload = box.slice(header.length).trim();
  const actualHash = crypto.createHash("sha256").update(payload).digest("hex");
  assert.equal(actualHash, expectedHash);
});

test("product.css beginnt nach dem Import direkt mit dem Ranking-System", () => {
  const product = fs.readFileSync(productFile, "utf8");
  const remainder = product
    .replace(/^@import "\\.\\/product-box\\.css";\\s*/, "")
    .trimStart();
  assert.ok(remainder.startsWith("/* Product ranking landing page */"));
});

test("Product-Box-Layer enthält Desktop und Responsive Regeln", () => {
  const box = fs.readFileSync(boxFile, "utf8");
  for (const selector of [
    ".product-box-v2",
    ".product-box-image",
    ".product-box-brand",
    ".product-box-rating",
    ".product-box-text",
    ".product-box-highlights",
    ".product-box-specs"
  ]) {
    assert.ok(box.includes(selector), "Fehlt: " + selector);
  }
  assert.ok(box.includes("@media (max-width: 900px)"));
});

test("Ranking-System bleibt in product.css", () => {
  const product = fs.readFileSync(productFile, "utf8");
  assert.ok(product.includes("/* Product ranking landing page */"));
  assert.ok(product.includes(".ranking-page"));
});

test("Weitere legitime Product-Box-Klassennamen sind zulässig", () => {
  const product = fs.readFileSync(productFile, "utf8");
  assert.equal(typeof product.includes(".product-box-specs"), "boolean");
});

test("Product-Box-Layer enthält keine Ranking-Regeln", () => {
  const box = fs.readFileSync(boxFile, "utf8");
  assert.ok(!box.includes(".ranking-page"));
  assert.ok(!box.includes("Product ranking landing page"));
});

test("Migration fügt kein important hinzu", () => {
  const box = fs.readFileSync(boxFile, "utf8");
  assert.ok(!box.includes("!important"));
});
`;

const report = {
  patch: NAME,
  alreadyInstalled,
  sourceBytesBefore: Buffer.byteLength(sourceBefore),
  sourceBytesAfter: Buffer.byteLength(sourceAfter),
  productBoxBytes: Buffer.byteLength(productBoxContent),
  migratedBlockHash,
  migratedSelectors: [
    ".product-box-v2",
    ".product-box-image",
    ".product-box-image img",
    ".product-box-brand",
    ".product-box-v2 h2",
    ".product-box-rating",
    ".product-box-rating span",
    ".product-box-text",
    ".product-box-highlights",
    ".product-box-highlights div",
    ".product-box-specs",
    ".product-box-specs div",
    ".product-box-specs strong",
    ".product-box-specs span"
  ],
  generatedAt: new Date().toISOString()
};

const reportMarkdown =
`# CSS Product System 22.8.1

- Product-CSS vorher: ${report.sourceBytesBefore} Bytes
- Product-CSS nachher: ${report.sourceBytesAfter} Bytes
- Neuer Product-Box-Layer: ${report.productBoxBytes} Bytes
- Migrierte Selektorgruppen: ${report.migratedSelectors.length}\n- SHA-256 des migrierten CSS-Blocks: ${report.migratedBlockHash}

## Umfang

Der zusammenhängende Product-Box-Bereich am Anfang von
\`packages/affiliate-core/src/styles/product.css\` wurde nach
\`product-box.css\` verschoben.

Die Ranking-Landingpage und alle nachfolgenden produktbezogenen Systeme bleiben
in \`product.css\`.

## Sicherheitsgrenzen

- keine Selektoren umbenannt
- keine Deklarationen geändert
- Responsive-Regeln bleiben beim Product-Box-System
- kein neues \`!important\`
- Hash-Prüfung des exakt migrierten Blocks statt pauschaler Klassennamenprüfung\n- weitere legitime Product-Box-Klassennamen bleiben zulässig\n- vollständiger Rollback bei Test-, Audit- oder Buildfehlern
`;

const desired = new Map([
  [SOURCE, sourceAfter],
  [PRODUCT_BOX, productBoxContent],
  [TEST, testContent],
  [PACKAGE, packageAfter],
  [REPORT_JSON, JSON.stringify(report, null, 2) + "\n"],
  [REPORT_MD, reportMarkdown]
]);

const changes = [];
for (const [file, content] of desired) {
  const current = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  if (current === content) {
    log("Unverändert: " + path.relative(ROOT, file));
  } else {
    changes.push({ file, current, content });
  }
}

if (CHECK) {
  log(changes.length ? changes.length + " Änderung(en) erforderlich." : "Bereits installiert.");
  process.exit(changes.length ? 1 : 0);
}

if (!changes.length) {
  log("Keine Änderungen erforderlich.");
  process.exit(0);
}

fs.mkdirSync(BACKUP, { recursive: true });

try {
  for (const change of changes) {
    const relative = path.relative(ROOT, change.file);

    if (change.current !== null) {
      const backupFile = path.join(BACKUP, relative);
      fs.mkdirSync(path.dirname(backupFile), { recursive: true });
      fs.writeFileSync(backupFile, change.current);
    }

    fs.mkdirSync(path.dirname(change.file), { recursive: true });
    fs.writeFileSync(change.file, change.content);
    log("Geschrieben: " + relative);
  }

  log("Product-CSS: " + report.sourceBytesBefore + " -> " + report.sourceBytesAfter + " Bytes");
  log("Product-Box-Layer: " + report.productBoxBytes + " Bytes");

  execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "test:css-product-system"], {
    cwd: ROOT,
    stdio: "inherit",
    env: process.env
  });

  for (const [script, file] of [
    ["test:css-comparison-system", path.join(APP, "test", "css-comparison-system.test.mjs")],
    ["test:css-panel-system", path.join(APP, "test", "css-panel-system.test.mjs")],
    ["test:css-card-system", path.join(APP, "test", "css-card-system.test.mjs")],
    ["test:css-button-system", path.join(APP, "test", "css-button-system.test.mjs")],
    ["test:css-layout-foundation", path.join(APP, "test", "css-layout-foundation.test.mjs")],
    ["test:css-base-layer", path.join(APP, "test", "css-base-layer.test.mjs")],
    ["test:css-foundation", path.join(APP, "test", "css-foundation-tokens.test.mjs")],
    ["test:css-architecture", path.join(APP, "test", "css-architecture.test.mjs")]
  ]) {
    if (fs.existsSync(file) && pkg.scripts?.[script]) {
      execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", script], {
        cwd: ROOT,
        stdio: "inherit",
        env: process.env
      });
    }
  }

  if (fs.existsSync(path.join(APP, "scripts", "design-system", "css-architecture-audit.mjs"))) {
    execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "css:architecture:audit"], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env
    });
  }

  if (!SKIP_BUILD) {
    execFileSync("npm", ["--workspace", "apps/pfotentechnik", "run", "build"], {
      cwd: ROOT,
      stdio: "inherit",
      env: process.env
    });
  }

  log("BESTANDEN.");
  log("Report: " + path.relative(ROOT, REPORT_MD));
  log("Backup: " + path.relative(ROOT, BACKUP));
} catch (error) {
  log("FEHLER: " + error.message);
  log("Rollback wird ausgeführt.");

  for (const change of [...changes].reverse()) {
    if (change.current === null) {
      if (fs.existsSync(change.file)) fs.unlinkSync(change.file);
    } else {
      fs.mkdirSync(path.dirname(change.file), { recursive: true });
      fs.writeFileSync(change.file, change.current);
    }
  }

  process.exitCode = 1;
}

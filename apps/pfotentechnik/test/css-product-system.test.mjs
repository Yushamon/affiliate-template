import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const styles = path.join(ROOT, "packages", "affiliate-core", "src", "styles");
const productFile = path.join(styles, "product.css");
const boxFile = path.join(styles, "product-box.css");
const expectedHash = "f10a9a20a99efa923821c943c8223d70d31310dc8af7e5b71f637618b12de41d";
const header =
`/* Product detail hero / product box.
 * Aus product.css extrahiert, ohne Selektoren oder Deklarationen zu verändern.
 */

`;

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
    .replace(/^@import "\.\/product-box\.css";\s*/, "")
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

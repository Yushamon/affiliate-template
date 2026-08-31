import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { validateDecisionData } from "../scripts/audit-decision-data.mjs";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(app, "package.json"));
const yaml = require("js-yaml");
const productDir = path.join(app, "src", "content", "products");
const parse = (name) => yaml.load(fs.readFileSync(path.join(productDir, name), "utf8").match(/^---\s*\r?\n([\s\S]*?)\r?\n---/)[1], { schema: yaml.JSON_SCHEMA });
const products = fs.readdirSync(productDir).filter((name) => name.endsWith(".md")).map(parse);

test("alle elf automatischen Katzentoiletten besitzen die vollstaendige Streumatrix", () => {
  const litter = products.filter((item) => item.category?.key === "automatische-katzentoiletten");
  assert.equal(litter.length, 11);
  for (const product of litter) {
    assert.deepEqual(Object.keys(product.litterCompatibility).filter((key) => key !== "evidenceSourceUrls").sort(),
      ["bentoniteClumping", "crystal", "nonClumping", "plantBased", "tofu", "woodPellets"].sort());
    assert.ok(product.multiPet);
    assert.deepEqual(validateDecisionData(product), []);
  }
});

test("unknown bleibt ein eigener Status und ungestuetzte Individualclaims werden abgelehnt", () => {
  assert.deepEqual(validateDecisionData({ slug: "unknown-ok", litterCompatibility: Object.fromEntries(
    ["bentoniteClumping", "tofu", "plantBased", "woodPellets", "crystal", "nonClumping"].map((field) => [field, { status: "unknown" }])
  ) }), []);
  assert.ok(validateDecisionData({ slug: "invalid", multiPet: {
    sharedUse: "supported", identificationMethods: ["none"], individualAccess: "supported", evidenceSourceUrls: ["https://example.com"]
  } }).some((message) => message.includes("ohne Identifikationsmethode")));
});

test("Multi-Pet-Daten trennen gemeinsame Nutzung von echter Identifikation", () => {
  const relevant = products.filter((item) => item.multiPet);
  assert.ok(relevant.length >= 19);
  for (const product of relevant) assert.deepEqual(validateDecisionData(product), []);
  assert.ok(relevant.some((item) => item.multiPet.sharedUse === "supported" && item.multiPet.identificationMethods.includes("weight")));
  assert.ok(relevant.some((item) => item.multiPet.identificationMethods.includes("microchip")));
});

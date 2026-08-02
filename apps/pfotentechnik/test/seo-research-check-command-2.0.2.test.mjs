import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const IMPORTER = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "scripts",
  "seo",
  "import-research.mjs"
);

test("research:check validiert ohne Eingabedatei den bestehenden Store", () => {
  const source = fs.readFileSync(IMPORTER, "utf8");
  assert.match(source, /if \(check\) return STORE/);
  assert.match(source, /Research-Store/);
  assert.doesNotMatch(
    source,
    /if\(!input\).*Nutzung: npm --workspace apps\/pfotentechnik run research:import/s
  );
});

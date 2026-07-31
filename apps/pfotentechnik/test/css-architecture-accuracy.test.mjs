import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const TEST_FILE = fileURLToPath(import.meta.url);
const APP = path.resolve(path.dirname(TEST_FILE), "..");
const ROOT = path.resolve(APP, "..", "..");
const AUDIT = path.join(APP, "scripts", "design-system", "css-architecture-audit.mjs");
const REPORT = path.join(APP, "reports", "design-system", "css-architecture-latest.json");

test("gruppierte Selektoren vervielfachen !important nicht", () => {
  const fixture = path.join(APP, "src", "styles", "__css-architecture-accuracy-fixture.css");
  fs.writeFileSync(fixture, ".a, .b, .c { color: red !important; background: white; }\n");
  try {
    execFileSync("node", [AUDIT], { cwd: ROOT, stdio: "pipe" });
    const report = JSON.parse(fs.readFileSync(REPORT, "utf8"));
    const record = report.records.find((item) =>
      item.file.endsWith("__css-architecture-accuracy-fixture.css")
    );
    assert.ok(record, "Fixture fehlt im Audit-Report.");
    assert.equal(record.important, 1);
  } finally {
    if (fs.existsSync(fixture)) fs.unlinkSync(fixture);
    execFileSync("node", [AUDIT], { cwd: ROOT, stdio: "pipe" });
  }
});

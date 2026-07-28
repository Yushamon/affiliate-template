import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const reportFile = path.join(
  appRoot,
  "reports",
  "comparison-platform",
  "comparison-audit.json"
);

test("comparison audit has no release-blocking errors", async () => {
  const execution = spawnSync(
    process.execPath,
    ["apps/pfotentechnik/scripts/comparison-platform/audit.mjs"],
    {
      cwd: repoRoot,
      encoding: "utf8"
    }
  );

  assert.equal(execution.status, 0, execution.stderr || execution.stdout);

  const report = JSON.parse(await fs.readFile(reportFile, "utf8"));
  assert.equal(report.summary.comparisons, 24);
  assert.equal(report.summary.errors, 0);
  assert.ok(report.summary.qualityScore >= 90);
});

test("all comparisons expose at least three complete public criteria", async () => {
  const execution = spawnSync(
    process.execPath,
    ["apps/pfotentechnik/scripts/comparison-platform/data-audit.mjs"],
    {
      cwd: repoRoot,
      encoding: "utf8"
    }
  );

  assert.equal(execution.status, 0, execution.stderr || execution.stdout);

  const report = JSON.parse(
    await fs.readFile(
      path.join(
        appRoot,
        "reports",
        "comparison-platform",
        "comparison-data-platform.json"
      ),
      "utf8"
    )
  );

  assert.equal(report.summary.comparisons, 24);
  assert.ok(report.comparisons.every((item) => item.visibleRows >= 3));
  assert.equal(report.summary.renderedCoverage, 100);
});

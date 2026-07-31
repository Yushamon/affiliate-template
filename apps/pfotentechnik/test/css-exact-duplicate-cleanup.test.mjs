import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const script = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "scripts",
  "design-system",
  "css-exact-duplicate-cleanup.mjs"
);

test("Cleanup-Werkzeug ist installiert", () => {
  assert.ok(fs.existsSync(script));
});

test("exakt identische Deklarationen werden entfernt, Kaskadenwerte bleiben", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pt-css-cleanup-"));
  const repo = path.join(temp, "affiliate-template");
  const app = path.join(repo, "apps", "pfotentechnik");
  const core = path.join(repo, "packages", "affiliate-core", "src");
  fs.mkdirSync(path.join(app, "src"), { recursive: true });
  fs.mkdirSync(path.join(app, "reports", "design-system"), { recursive: true });
  fs.mkdirSync(core, { recursive: true });
  fs.writeFileSync(path.join(app, "package.json"), "{}");
  fs.copyFileSync(script, path.join(app, "scripts.mjs"));

  const cssFile = path.join(app, "src", "fixture.css");
  fs.writeFileSync(cssFile, `
.fixture {
  color: red;
  color: red;
  background: white;
  background: black;
  --local-token: 1;
  --local-token: 1;
  -webkit-user-select: none;
  -webkit-user-select: none;
}
`);

  execFileSync("node", [path.join(app, "scripts.mjs"), "--write"], {
    cwd: repo,
    stdio: "pipe"
  });

  const result = fs.readFileSync(cssFile, "utf8");
  assert.equal((result.match(/color: red/g) || []).length, 1);
  assert.equal((result.match(/background:/g) || []).length, 2);
  assert.equal((result.match(/--local-token:/g) || []).length, 2);
  assert.equal((result.match(/-webkit-user-select:/g) || []).length, 2);
});

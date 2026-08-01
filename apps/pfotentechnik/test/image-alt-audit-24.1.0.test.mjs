import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const SCRIPT = path.join(
  ROOT,
  "apps",
  "pfotentechnik",
  "scripts",
  "seo",
  "audit-image-alt-text.mjs"
);

function fixture(html) {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pt-image-alt-"));
  const repo = path.join(temp, "affiliate-template");
  const app = path.join(repo, "apps", "pfotentechnik");
  fs.mkdirSync(path.join(app, "src"), { recursive: true });
  fs.mkdirSync(path.join(app, "dist"), { recursive: true });
  fs.writeFileSync(path.join(app, "package.json"), "{}\n");
  fs.copyFileSync(SCRIPT, path.join(app, "scripts.mjs"));
  fs.writeFileSync(path.join(app, "dist", "index.html"), html);
  return { repo, app, script: path.join(app, "scripts.mjs") };
}

test("Audit-Skript ist installiert", () => {
  assert.ok(fs.existsSync(SCRIPT));
});

test("alt leer ist dokumentiert, aber kein Strict-Fehler", () => {
  const item = fixture('<img src="/decorative.webp" alt="">');
  const result = spawnSync(process.execPath, [item.script, "--strict"], {
    cwd: item.repo,
    encoding: "utf8"
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Blockierende Fehler: 0/);
});

test("fehlendes alt blockiert Strict", () => {
  const item = fixture('<img src="/informative.webp">');
  const result = spawnSync(process.execPath, [item.script, "--strict"], {
    cwd: item.repo,
    encoding: "utf8"
  });
  assert.equal(result.status, 1);
  assert.match(result.stdout, /Blockierende Fehler: 1/);
});

test("dynamischer Astro-Alt-Text ist gültig", () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), "pt-image-alt-source-"));
  const repo = path.join(temp, "affiliate-template");
  const app = path.join(repo, "apps", "pfotentechnik");
  fs.mkdirSync(path.join(app, "src"), { recursive: true });
  fs.writeFileSync(path.join(app, "package.json"), "{}\n");
  fs.copyFileSync(SCRIPT, path.join(app, "scripts.mjs"));
  fs.writeFileSync(
    path.join(app, "src", "Fixture.astro"),
    '<img src={image.src} alt={image.alt || product.name} />'
  );
  const result = spawnSync(process.execPath, [path.join(app, "scripts.mjs"), "--source-only", "--strict"], {
    cwd: repo,
    encoding: "utf8"
  });
  assert.equal(result.status, 0);
  assert.match(result.stdout, /Blockierende Fehler: 0/);
});

test("wiederholte Build-Fundstellen werden dedupliziert", () => {
  const item = fixture(
    '<img class="thumb" src="/_astro/a.webp" alt="">' +
    '<img class="thumb" src="/_astro/b.webp" alt="">'
  );
  execFileSync(process.execPath, [item.script], { cwd: item.repo, stdio: "pipe" });
  const report = JSON.parse(
    fs.readFileSync(path.join(item.app, "reports", "seo", "image-alt-audit-latest.json"), "utf8")
  );
  assert.equal(report.summary.distRaw, 2);
  assert.equal(report.summary.distUnique, 1);
});

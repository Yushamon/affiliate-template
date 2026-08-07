import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");

test("Frontmatter-Datumsfelder werden vor dem Astro-Build geprüft", () => {
  const pkg = fs.readFileSync(path.join(app, "package.json"), "utf8");
  const preflight = fs.readFileSync(path.join(app, "scripts", "seo", "release-preflight.mjs"), "utf8");
  const audit = fs.readFileSync(path.join(app, "scripts", "seo", "audit-frontmatter-date-scalars.mjs"), "utf8");

  assert.match(pkg, /"audit:frontmatter-dates:strict"/);
  assert.match(preflight, /Frontmatter-Datumsvertrag/);
  assert.match(preflight, /audit:frontmatter-dates:strict/);
  assert.match(audit, /publishedAt\\|updatedAt/);
  assert.match(audit, /Datumsfelder müssen als YAML-String gequotet sein/);
});

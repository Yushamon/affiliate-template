import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const styles = path.join(ROOT, "apps", "pfotentechnik", "src", "styles");
const file = path.join(styles, "seo-admin-content.css");

test("content layer besitzt seine Kernmarker", () => {
  const css = fs.readFileSync(file, "utf8");
  for (const marker of [".seo-table",".seo-list",".seo-empty",".seo-status",".seo-anchor-card"]) {
    assert.ok(css.includes(marker), "Fehlt: " + marker);
  }
});

test("content layer enthält keine fremden Kernsysteme", () => {
  const css = fs.readFileSync(file, "utf8");
  for (const marker of [".seo-finding-list",".seo-workspace-summary","@media"]) {
    assert.ok(!css.includes(marker), "Unerwartet enthalten: " + marker);
  }
});

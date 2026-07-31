import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const styles = path.join(ROOT, "apps", "pfotentechnik", "src", "styles");
const file = path.join(styles, "seo-admin-operations.css");

test("operations layer besitzt seine Kernmarker", () => {
  const css = fs.readFileSync(file, "utf8");
  for (const marker of [".seo-finding-list",".seo-finding",".seo-workspace-summary",".seo-workspace-facts"]) {
    assert.ok(css.includes(marker), "Fehlt: " + marker);
  }
});

test("operations layer enthält keine fremden Kernsysteme", () => {
  const css = fs.readFileSync(file, "utf8");
  for (const marker of [".seo-table",".seo-filter-grid","@media"]) {
    assert.ok(!css.includes(marker), "Unerwartet enthalten: " + marker);
  }
});

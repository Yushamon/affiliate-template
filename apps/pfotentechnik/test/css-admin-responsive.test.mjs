import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const styles = path.join(ROOT, "apps", "pfotentechnik", "src", "styles");
const file = path.join(styles, "seo-admin-responsive.css");

test("responsive layer besitzt seine Kernmarker", () => {
  const css = fs.readFileSync(file, "utf8");
  for (const marker of ["@media (max-width: 900px)","@media (max-width: 680px)","@media (max-width: 430px)","@media (prefers-color-scheme: dark)"]) {
    assert.ok(css.includes(marker), "Fehlt: " + marker);
  }
});

test("responsive layer enthält keine fremden Kernsysteme", () => {
  const css = fs.readFileSync(file, "utf8");
  for (const marker of ["@import \"./seo-admin-"]) {
    assert.ok(!css.includes(marker), "Unerwartet enthalten: " + marker);
  }
});

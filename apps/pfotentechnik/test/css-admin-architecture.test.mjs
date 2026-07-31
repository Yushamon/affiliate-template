import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const styles = path.join(ROOT, "apps", "pfotentechnik", "src", "styles");
const reportDir = path.join(ROOT, "apps", "pfotentechnik", "reports", "design-system");
const manifest = JSON.parse(fs.readFileSync(path.join(reportDir, "admin-css-ownership.json"), "utf8"));
const entry = fs.readFileSync(path.join(styles, manifest.entrypoint), "utf8");

const contents = Object.fromEntries(
  Object.entries(manifest.layers).map(([name, layer]) => [
    name,
    fs.readFileSync(path.join(styles, layer.file), "utf8")
  ])
);

test("Admin CSS Entrypoint enthält ausschließlich geordnete Imports", () => {
  let previous = -1;
  for (const file of manifest.importOrder) {
    const line = '@import "./' + file + '";';
    const index = entry.indexOf(line);
    assert.ok(index > previous, "Import fehlt oder Reihenfolge falsch: " + file);
    previous = index;
  }

  let remainder = entry;
  for (const file of manifest.importOrder) {
    remainder = remainder.replace('@import "./' + file + '";', "");
  }
  assert.equal(remainder.trim(), "");
});

test("Jeder deklarierte Layer existiert", () => {
  for (const layer of Object.values(manifest.layers)) {
    assert.ok(fs.existsSync(path.join(styles, layer.file)), "Fehlt: " + layer.file);
  }
});

test("Ownership-Marker befinden sich im deklarierten Layer", () => {
  for (const [name, layer] of Object.entries(manifest.layers)) {
    for (const marker of layer.owns) {
      assert.ok(contents[name].includes(marker), name + " besitzt Marker nicht: " + marker);
    }
  }
});

test("Statische Ownership-Marker leaken nicht in andere statische Layer", () => {
  for (const [owner, layer] of Object.entries(manifest.layers)) {
    if (owner === "responsive") continue;
    for (const marker of layer.owns) {
      for (const [candidate, css] of Object.entries(contents)) {
        if (candidate === owner || candidate === "responsive") continue;
        assert.ok(!css.includes(marker), marker + " leakt von " + owner + " nach " + candidate);
      }
    }
  }
});

test("Nur Responsive-Layer enthält Media Queries", () => {
  for (const [name, css] of Object.entries(contents)) {
    if (name === "responsive") {
      assert.ok(css.includes("@media"));
    } else {
      assert.ok(!css.includes("@media"), "Media Query außerhalb Responsive: " + name);
    }
  }
});

test("Responsive-Layer enthält Dark-Mode-Fallback", () => {
  const css = contents.responsive;
  assert.ok(css.includes("@media (prefers-color-scheme: dark)"));
  assert.ok(css.includes('html:not([data-theme="light"])'));
  assert.ok(css.includes("color-scheme: dark"));
});

test("Operations-Basis und responsive Overrides sind getrennt", () => {
  assert.ok(contents.operations.includes(".seo-workspace-summary"));
  assert.ok(contents.operations.includes("display: grid"));
  assert.ok(contents.responsive.includes(".seo-workspace-summary"));
  assert.ok(contents.responsive.includes("grid-template-columns: 1fr"));
});

test("Kein Admin-Layer importiert einen anderen Admin-Layer", () => {
  for (const [name, css] of Object.entries(contents)) {
    assert.ok(!css.includes('@import "./seo-admin-'), "Zyklisches Layering in " + name);
  }
});

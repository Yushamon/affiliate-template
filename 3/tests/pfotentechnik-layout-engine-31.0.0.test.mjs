import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..", "..");
const read = (p) => fs.readFileSync(path.join(root, p), "utf8");
const blocks = (css) => [...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].map((match) => ({ selector: match[1].trim(), body: match[2] }));

const layout = read("packages/affiliate-core/src/styles/page-layout-engine.css");
const system = read("packages/affiliate-core/src/components/comparison/comparison-system.css");
const tokens = read("packages/affiliate-core/src/components/comparison/comparison-tokens.css");
const product = read("apps/pfotentechnik/src/pages/produkt/[product].astro");
const comparison = read("apps/pfotentechnik/src/pages/vergleiche/[comparison].astro");
const shell = read("packages/affiliate-core/src/components/comparison/ComparisonShell.astro");

test("ein gemeinsamer Layout-Owner", () => {
  assert.match(layout, /\.container\.container--page\s*\{/);
  assert.match(product, /mainClass="container--page"/);
  assert.match(comparison, /mainClass="container--page"/);
  assert.doesNotMatch(product + "\n" + comparison + "\n" + shell, /container--product|container--immersive|comparison-detail|comparison-shell--premium/);
});

test("identische Breite und mobile Gutter", () => {
  assert.match(layout, /--pt-content-width:\s*1200px/);
  assert.match(layout, /--pt-page-gutter:\s*16px/);
  assert.match(layout, /\.pt-page\s*>\s*\*/);
  assert.match(layout, /\.pt-page\s*>\s*\.comparison-shell/);
  for (const block of blocks(system)) {
    if (block.selector.split(",").some((part) => [".comparison-detail", ".comparison-shell"].includes(part.trim()))) {
      const declarations = Object.fromEntries(
        block.body
          .split(";")
          .map((entry) => entry.trim())
          .filter(Boolean)
          .map((entry) => {
            const separator = entry.indexOf(":");
            return separator < 0
              ? [entry.toLowerCase(), ""]
              : [entry.slice(0, separator).trim().toLowerCase(), entry.slice(separator + 1).trim()];
          })
      );
      assert.ok(!("margin" in declarations), "Root darf keinen eigenen margin-Owner besitzen");
      assert.ok(!("margin-inline" in declarations), "Root darf keinen eigenen margin-inline-Owner besitzen");
      assert.ok(!("padding" in declarations), "Root darf keinen eigenen padding-Owner besitzen");
      if ("width" in declarations) {
        assert.equal(declarations.width, "100%", "Nur neutrale Vollbreite ist erlaubt");
      }
      if ("max-width" in declarations) {
        assert.equal(declarations["max-width"], "100%", "Keine eigene begrenzende Contentbreite erlaubt");
      }
    }
  }
});

test("Produktgalerie bleibt Full-Bleed", () => {
  assert.match(layout, /\[data-mobile-gallery-full-bleed\][\s\S]*width:\s*100vw/);
  assert.match(layout, /margin-inline:\s*calc\(50%\s*-\s*50vw\)/);
});

test("keine eigene Vergleichspalette", () => {
  const all = system + "\n" + tokens;
  assert.doesNotMatch(all, /#16302b|#18743b|#0f5d2d|#e5f5e8/i);
  assert.doesNotMatch(tokens, /--comparison-[\w-]+\s*:\s*#/i);
  for (const token of [
    "--pt-color-surface", "--pt-color-surface-soft", "--pt-color-surface-raised",
    "--pt-color-text", "--pt-color-text-muted", "--pt-color-border",
    "--pt-color-action-bg", "--pt-color-action-bg-hover", "--pt-color-action-text"
  ]) assert.ok(all.includes(token), "Token fehlt: " + token);
});

test("Hero ohne grüne oder weiße Sonderfarbwelt", () => {
  assert.match(system, /\.comparison-hero[\s\S]*background:\s*var\(--pt-color-surface\)/);
  assert.match(system, /\.comparison-hero h1[\s\S]*color:\s*var\(--pt-color-text\)/);
  assert.match(system, /\.comparison-hero__copy\s*>\s*p[\s\S]*color:\s*var\(--pt-color-text-muted\)/);
  assert.doesNotMatch(system, /rgba?\(\s*7\s*,\s*31\s*,\s*27|#b9efc5/i);
});

test("keine Theme-Sonderselektoren oder neuen important-Regeln", () => {
  const clean = (layout + "\n" + system + "\n" + tokens).replace(/\/\*[\s\S]*?\*\//g, "");
  assert.doesNotMatch(clean, /(?:^|[},])\s*(?:\.theme-dark\b|\.dark\b|\[data-theme(?:[=\]])?)[^{]*\{/m);
  assert.doesNotMatch(layout, /!important/);
  assert.doesNotMatch(tokens, /!important/);
  const generatedOverride = system.split("/* Layout Engine 31 theme normalization. */").at(-1) ?? "";
  assert.doesNotMatch(generatedOverride, /!important/);
});

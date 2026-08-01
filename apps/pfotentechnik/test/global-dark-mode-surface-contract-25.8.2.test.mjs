import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const APP = path.join(ROOT, "apps", "pfotentechnik");
const CORE = path.join(ROOT, "packages", "affiliate-core");

const read = (target) => fs.readFileSync(target, "utf8");

const tokens = read(path.join(APP, "src/styles/pfotentechnik-design-tokens.css"));
const home = read(path.join(CORE, "src/components/home/home.css"));
const autoBlocks = read(path.join(APP, "src/components/AutoContentBlocks.astro"));
const comparisons = read(path.join(APP, "src/pages/vergleiche/index.astro"));
const manufacturers = read(path.join(APP, "src/pages/hersteller/index.astro"));
const layout = read(path.join(APP, "src/layouts/ProjectLayout.astro"));
const contract = read(path.join(APP, "src/styles/pfotentechnik-dark-mode-contract.css"));

test("Inverse Vordergrundfarben sind von Theme-Surfaces getrennt", () => {
  assert.match(tokens, /--pt-color-text-inverse:\s*#ffffff/);
  assert.match(tokens, /--pt-color-text-inverse-muted:/);
  assert.match(tokens, /--pt-color-media-stage:\s*#eef1ed/);
});

test("Homepage nutzt Theme-Tokens für Überschriften und Karten", () => {
  assert.match(home, /--home3-text:\s*var\(--pt-color-text\)/);
  assert.match(home, /--home3-line:\s*var\(--pt-color-border\)/);
  assert.match(home, /\.home3-hero h1[\s\S]*?color:\s*var\(--pt-color-text-inverse\)/);
  assert.match(home, /\.home3-button--primary[\s\S]*?color:\s*var\(--pt-color-on-accent\)/);
  assert.doesNotMatch(home, /color:\s*var\(--pt-color-surface\)/);
  assert.doesNotMatch(home, /background:\s*#fff(?:fff)?;/i);
});

test("AutoContentBlocks besitzen nur noch eine semantische Palette", () => {
  assert.match(autoBlocks, /background:\s*var\(--pt-color-surface\)/);
  assert.match(autoBlocks, /color:\s*var\(--pt-color-text\)/);
  assert.doesNotMatch(autoBlocks, /html\[data-theme="dark"\]/);
  assert.doesNotMatch(autoBlocks, /prefers-color-scheme:\s*dark/);
});

test("Vergleichs- und Hersteller-Hubs erben den aktiven Theme-Kontrakt", () => {
  assert.match(comparisons, /--text:\s*var\(--pt-color-text\)/);
  assert.match(comparisons, /--surface:\s*var\(--pt-color-surface\)/);
  assert.match(manufacturers, /manufacturer-hub-hero h1[\s\S]*?color:\s*var\(--pt-color-text\)/);
  assert.match(manufacturers, /manufacturer-card[\s\S]*?background:\s*var\(--pt-color-surface\)/);
});

test("Header und Footer verwenden explizite Vordergrundrollen", () => {
  assert.match(layout, /pfotentechnik-dark-mode-contract\.css/);
  assert.match(contract, /\.site-header-v2 \.brand-name[\s\S]*?var\(--pt-color-text\)/);
  assert.match(contract, /\.footer-v2 \.footer-brand-name[\s\S]*?var\(--pt-color-text-inverse\)/);
  assert.doesNotMatch(contract, /!important/);
});

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
const guideExperience = read(path.join(APP, "src/components/guide/GuideExperience.astro"));
const comparisons = read(path.join(APP, "src/pages/vergleiche/index.astro"));
const manufacturers = read(path.join(APP, "src/pages/hersteller/index.astro"));
const layout = read(path.join(APP, "src/layouts/ProjectLayout.astro"));
const header = read(path.join(CORE, "src/components/Header.astro"));
const footer = read(path.join(CORE, "src/components/Footer.astro"));

test("Inverse Vordergrundfarben sind von Theme-Surfaces getrennt", () => {
  assert.match(tokens, /--pt-color-text-inverse:\s*#ffffff/);
  assert.match(tokens, /--pt-color-text-inverse-muted:/);
  assert.match(tokens, /--pt-color-media-stage:\s*#eef1ed/);
});

test("Homepage nutzt Theme-Tokens für Überschriften und Karten", () => {
  assert.match(home, /--pt-home-text:\s*var\(--pt-color-text\)/);
  assert.match(home, /--pt-home-line:\s*var\(--pt-color-border\)/);
  assert.match(home, /\.pt-home__hero h1[\s\S]*?color:\s*var\(--pt-color-text-inverse\)/);
  assert.match(home, /\.pt-home__button--primary[\s\S]*?color:\s*var\(--pt-color-on-accent\)/);
  assert.doesNotMatch(home, /color:\s*var\(--pt-color-surface\)/);
  assert.doesNotMatch(home, /background:\s*#fff(?:fff)?;/i);
});

test("Guide Experience besitzt nur eine semantische Foundation-Palette", () => {
  assert.match(guideExperience, /background:\s*var\(--pt-color-surface-soft\)/);
  assert.match(guideExperience, /color:\s*var\(--pt-color-text\)/);
  assert.doesNotMatch(guideExperience, /html\[data-theme="dark"\]/);
  assert.doesNotMatch(guideExperience, /prefers-color-scheme:\s*dark/);
});

test("Vergleichs- und Hersteller-Hubs erben den aktiven Theme-Kontrakt", () => {
  assert.match(comparisons, /--comparison-text:\s*var\(--pt-color-text\)/);
  assert.match(comparisons, /--comparison-surface:\s*var\(--pt-color-surface\)/);
  assert.match(manufacturers, /manufacturer-hub-hero h1[\s\S]*?color:\s*var\(--pt-color-text\)/);
  assert.match(manufacturers, /manufacturer-card[\s\S]*?background:\s*var\(--pt-color-surface\)/);
});

test("Header und Footer verwenden explizite Vordergrundrollen", () => {
  assert.match(layout, /pfotentechnik-design-tokens\.css/);
  assert.match(header, /\.site-header-v2 \.brand-name[\s\S]*?var\(--pt-color-text\)/);
  assert.match(footer, /\.footer-brand-name[\s\S]*?var\(--pt-color-on-brand-surface/);
  assert.doesNotMatch(`${header}\n${footer}`, /!important/);
});

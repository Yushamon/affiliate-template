import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const galleryFile = path.join(app, "src/components/product-experience-2/ProductGallery29.astro");
const cssFile = path.join(app, "src/components/product-experience-2/product-gallery-29.css");
const experienceFile = path.join(app, "src/components/product-experience-2/ProductExperience2.astro");
const layoutFile = path.resolve(app, "../../packages/affiliate-core/src/styles/layout.css");

const gallery = fs.readFileSync(galleryFile, "utf8");
const css = fs.readFileSync(cssFile, "utf8");
const experience = fs.readFileSync(experienceFile, "utf8");
const layout = fs.readFileSync(layoutFile, "utf8");

test("Produktcontainer ist auf Mobile der einzige Viewport-Owner", () => {
  assert.match(layout, /\.container\.container--product\s*\{[\s\S]*?padding:\s*0 0 calc\(64px \+ env\(safe-area-inset-bottom\)\)/);
  assert.doesNotMatch(experience, /left:\s*50%|100d?vw|margin-left:\s*-50vw|translateX|calc\(50%\s*-\s*50vw\)/);
  assert.match(experience, /\.px2\s*\{[\s\S]*?width:\s*100%[\s\S]*?margin:\s*0[\s\S]*?padding:\s*0/);
});

test("mobile Galerie und Slides besitzen keinerlei Innen- oder Außenabstand", () => {
  assert.match(css, /\.pg29__mobile\s*\{[\s\S]*?width:\s*100%[\s\S]*?margin:\s*0[\s\S]*?padding:\s*0[\s\S]*?border-radius:\s*0/);
  assert.match(css, /\.pg29__slide\s*\{[\s\S]*?width:\s*100%[\s\S]*?height:\s*100%[\s\S]*?margin:\s*0[\s\S]*?padding:\s*0[\s\S]*?border-radius:\s*0/);
});

test("Galeriebilder überschreiben globale Bildabstände und Radien", () => {
  assert.match(gallery, /class="pg29__image"/);
  assert.match(gallery, /class="pg29-lightbox__image"/);
  assert.match(css, /\.pg29 \.pg29__image\s*\{[\s\S]*?inset:\s*0[\s\S]*?width:\s*100%[\s\S]*?height:\s*100%[\s\S]*?margin:\s*0[\s\S]*?padding:\s*0[\s\S]*?border-radius:\s*0[\s\S]*?object-fit:\s*cover/);
});

test("mobile Galerie besitzt genau drei responsive Höhenregeln", () => {
  const mobileHeightRules = css.match(/\.pg29__mobile\s*\{[^}]*height:/g) ?? [];
  assert.equal(mobileHeightRules.length, 3);
  assert.match(css, /height:\s*min\(42svh,\s*75vw\)/);
});

test("Lightbox verwendet natürliche Bildhöhe statt eines vollhohen Leerraum-Viewports", () => {
  assert.match(css, /\.pg29-lightbox__stage figure\s*\{[\s\S]*?grid-template-rows:\s*auto auto[\s\S]*?height:\s*auto/);
  assert.match(css, /\.pg29-lightbox \.pg29-lightbox__image\s*\{[\s\S]*?width:\s*100%[\s\S]*?height:\s*auto[\s\S]*?border-radius:\s*0[\s\S]*?object-fit:\s*contain/);
});

test("Thumbnailleiste zentriert kleine Bildsätze über eine eigene innere Liste", () => {
  assert.match(gallery, /class="pg29-lightbox__thumb-list"/);
  assert.match(css, /\.pg29-lightbox__thumb-list\s*\{[\s\S]*?display:\s*flex[\s\S]*?justify-content:\s*center[\s\S]*?width:\s*max-content[\s\S]*?min-width:\s*100%[\s\S]*?margin:\s*0 auto/);
  assert.match(css, /\.pg29-lightbox__thumb img\s*\{[\s\S]*?object-fit:\s*cover[\s\S]*?object-position:\s*center/);
});

test("keine neue Override-Schicht oder important-Regel wurde angelegt", () => {
  assert.doesNotMatch(css, /!important/);
  assert.doesNotMatch(css, /legacy|hotfix|override/i);
});

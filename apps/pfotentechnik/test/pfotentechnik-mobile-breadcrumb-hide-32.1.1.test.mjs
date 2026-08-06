import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "../../..");

const read = (...parts) =>
  fs.readFileSync(path.join(root, ...parts), "utf8");

const layoutCss = read(
  "packages",
  "affiliate-core",
  "src",
  "styles",
  "layout.css"
);
const articleCss = read(
  "packages",
  "affiliate-core",
  "src",
  "styles",
  "article.css"
);
const miscCss = read(
  "packages",
  "affiliate-core",
  "src",
  "styles",
  "misc.css"
);

test("mobile Standardseiten beginnen mit kompaktem oberen Abstand", () => {
  assert.match(
    layoutCss,
    /\.container:not\(\.container--page\)[\s\S]*?padding-top:\s*32px;/
  );
  assert.doesNotMatch(
    layoutCss,
    /\.container:not\(\.container--page\)[\s\S]*?padding-top:\s*90px;/
  );
});

test("sichtbare Breadcrumbs sind mobil vollständig ausgeblendet", () => {
  assert.match(
    miscCss,
    /@media \(max-width: 768px\)[\s\S]*?\.breadcrumbs,[\s\S]*?\.breadcrumbs--desktop,[\s\S]*?\.breadcrumbs--mobile\s*{\s*display:\s*none;/
  );
  assert.match(
    miscCss,
    /BreadcrumbList bleibt über das Layout als JSON-LD erhalten/
  );
});

test("Artikelkopf nutzt ohne mobilen Breadcrumb nur einen kleinen Innenabstand", () => {
  assert.match(
    articleCss,
    /@media \(max-width: 820px\)[\s\S]*?\.article-header\s*{\s*padding:\s*12px 0 28px;/
  );
});

test("Patch führt keine important-Regel ein", () => {
  const block =
    miscCss.match(
      /\/\*[\s\S]*?Mobile wird auf sichtbare Breadcrumbs verzichtet[\s\S]*?\n}/
    )?.[0] ?? "";
  assert.doesNotMatch(block, /!important/);
});

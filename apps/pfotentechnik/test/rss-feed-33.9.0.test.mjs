import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const endpoint = path.join(root, "src", "pages", "rss.xml.ts");

test("RSS-Endpoint nutzt zentrale Content-Registry und Site-Konfiguration", () => {
  const source = fs.readFileSync(endpoint, "utf8");
  assert.match(source, /getAllContent/);
  assert.match(source, /from "\.\.\/domain\/content\/registry"/);
  assert.match(source, /from "\.\.\/project\.config"/);
  assert.match(source, /export const prerender = true/);
});

test("RSS-Feed schließt noindex und sitemap:false aus", () => {
  const source = fs.readFileSync(endpoint, "utf8");
  assert.match(source, /data\.seo\?\.noindex === true/);
  assert.match(source, /data\.seo\?\.sitemap === false/);
});

test("RSS-Ausgabe ist XML-sicher und auf 50 Einträge begrenzt", () => {
  const source = fs.readFileSync(endpoint, "utf8");
  assert.match(source, /const MAX_ITEMS = 50/);
  assert.match(source, /escapeXml/);
  assert.match(source, /application\/rss\+xml/);
  assert.match(source, /atom:link/);
});

test("Feed wird unter rss.xml bereitgestellt", () => {
  assert.equal(path.basename(endpoint), "rss.xml.ts");
});

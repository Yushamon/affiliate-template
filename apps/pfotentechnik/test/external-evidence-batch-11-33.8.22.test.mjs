import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const dir = path.join(app, "src/content/products");
const read = (slug) => fs.readFileSync(path.join(dir, slug + ".md"), "utf8");

const complete = ["petkit-purobot-max-pro-2","petlibro-capsule-dog-fountain","petlibro-dockstream-2-smart","petlibro-dockstream-2-smart-cordless","petlibro-dockstream-cordless","petlibro-granary-wifi-feeder"];
const constrained = ["petkit-fresh-element-solo","petlibro-air-wifi-feeder","petlibro-granary-2-vision","petlibro-granary-dual-feeder"];
const all = [...complete, ...constrained];

test("Batch-11-Produkte besitzen externalEvidence", () => {
  for (const slug of all) assert.match(read(slug), /^externalEvidence:\s*$/m, slug);
});

test("vollständige Batch-11-Produkte besitzen Professional Reviews, User Reviews und Consensus", () => {
  for (const slug of complete) {
    const s = read(slug);
    assert.match(s, /externalEvidence:[\s\S]*?professionalReviews:/, slug + " professionalReviews");
    assert.match(s, /externalEvidence:[\s\S]*?userReviews:/, slug + " userReviews");
    assert.match(s, /externalEvidence:[\s\S]*?consensus:/, slug + " consensus");
  }
});

test("schwache Quellenlagen sind constrained statt künstlich vollständig", () => {
  for (const slug of constrained) {
    const s = read(slug);
    assert.match(s, /externalEvidence:[\s\S]*?constrained:\s*true/, slug);
  }
});

test("PfotenTechnik-Ratings bleiben vorhanden", () => {
  for (const slug of all) {
    const s = read(slug);
    assert.match(s, /^rating:\s*[0-9.]+\s*$/m, slug + " rating");
    assert.ok(/^ratings:\s*$/m.test(s) || /^ratings:\s*\{.*\}\s*$/m.test(s), slug + " ratings");
  }
});

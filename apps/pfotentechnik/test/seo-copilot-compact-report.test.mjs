import assert from "node:assert/strict";
import fs from "node:fs";
import test from "node:test";

const advisorFile = new URL("../src/pages/admin/seo/advisor.astro", import.meta.url);
const loaderFile = new URL("../src/lib/seo/advisor/loadWorkPackages.ts", import.meta.url);
const advisor = fs.readFileSync(advisorFile, "utf8");
const loader = fs.readFileSync(loaderFile, "utf8");

test("SEO Co-Pilot baut keine vollständigen Analyse- und Produktberichte mehr auf", () => {
  assert.doesNotMatch(advisor, /loadSeoAdvisorData|loadProductIntelligence|getCopilotWorkspaceStatus/);
  assert.doesNotMatch(advisor, /id="raw-pages"|id="raw-queries"|id="forecast-list"|Product Health vollständig/);
  assert.match(advisor, /SeoWorkPackages/);
});

test("kompakter Loader begrenzt Quellen und sichtbare Pakete", () => {
  assert.match(loader, /MAX_SEARCH_RECOMMENDATIONS = 8/);
  assert.match(loader, /MAX_CONTENT_FINDINGS = 8/);
  assert.match(loader, /MAX_VISIBLE_PACKAGES = 12/);
  assert.doesNotMatch(loader, /loadSeoAdvisorData|loadProductIntelligence|loadAdvisorContent/);
  assert.match(loader, /item\.level === "error"/);
  assert.match(loader, /pkg\.status !== "verified"/);
});

test("Release-Gate und Fachreports werden vom kompakten Loader nicht verändert", () => {
  assert.doesNotMatch(loader, /release-preflight|reports\//);
  assert.match(advisor, /harte Prüfungen bleiben im Release-Gate/);
});

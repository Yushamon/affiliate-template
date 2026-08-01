import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const app = path.join(ROOT, "apps", "pfotentechnik");
const page = fs.readFileSync(
  path.join(app, "src", "pages", "admin", "seo", "topical-authority.astro"),
  "utf8",
);
const registry = fs.readFileSync(
  path.join(app, "src", "domain", "decisionJourney", "registry.ts"),
  "utf8",
);

test("Topical Authority nutzt die globale Decision-Journey-Registry", () => {
  assert.ok(page.includes("DECISION_STAGE_ORDER"));
  assert.ok(page.includes("getStageLabel"));
  assert.ok(page.includes("DECISION_STAGE_ORDER.map"));
});

test("Legacy-Seitentyp-Kette wird im Journey-Bereich nicht mehr angezeigt", () => {
  const journeyStart = page.indexOf('aria-label="Globales Decision-Journey-Modell"');
  assert.ok(journeyStart >= 0, "Neuer Journey-Bereich fehlt.");

  const journeyEnd = page.indexOf("</section>", journeyStart);
  assert.ok(journeyEnd > journeyStart, "Journey-Bereich konnte nicht abgegrenzt werden.");

  const journeySection = page.slice(journeyStart, journeyEnd);

  assert.ok(!journeySection.includes("<span>Ratgeber</span><b>→</b><span>Vergleich</span>"));
  assert.ok(!journeySection.includes("<span>Hersteller</span>"));
  assert.ok(!journeySection.includes("<span>passender Ratgeber</span>"));
});

test("Globale Journey enthält alle fünf Entscheidungsstufen", () => {
  for (const stage of [
    '"orientation"',
    '"problem"',
    '"evaluation"',
    '"decision"',
    '"support"',
  ]) {
    assert.ok(registry.includes(stage), "Fehlt: " + stage);
  }

  assert.ok(registry.includes("export const DECISION_STAGE_ORDER"));
});

test("Topical Authority erklärt, dass Seitentypen keine starre Reihenfolge sind", () => {
  assert.ok(page.includes("Seitentypen sind keine feste Reihenfolge"));
  assert.ok(page.includes("Suchintention und Entscheidungsstand"));
});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const ENGINE = path.join(
  ROOT,
  "apps/pfotentechnik/src/lib/seo/research/visual-generation.ts"
);

test("featureMotifs besitzt genau einen kanonischen Installationspfad", () => {
  const source = fs.readFileSync(ENGINE, "utf8");

  assert.equal(
    (source.match(/const installationTokens/g) ?? []).length,
    1
  );

  assert.equal(
    (source.match(/"installation",/g) ?? []).length,
    1
  );

  assert.match(source, /const mountingWord/);
  assert.match(source, /const surfaceCompound/);
});

test("echte Einbau- und Montagebegriffe werden erkannt", async () => {
  const module = await import(pathToFileURL(ENGINE).href);

  for (const reason of [
    "Wandeinbau erklären",
    "Glaseinbau berücksichtigen",
    "Wandmontage zeigen",
    "Türinstallation darstellen",
    "Montage in einer dicken Wand",
    "Einbau in Glas",
    "Glasausschnitt und Adapter erklären",
    "Wandtunnel visualisieren"
  ]) {
    const plan = module.buildVisualGenerationPlan({
      type: "product",
      title: "Testprodukt",
      reason
    });

    assert.ok(
      plan.assets.some((asset) => asset.id === "installation"),
      reason
    );
  }
});

test("fachfremde ähnliche Wörter werden nicht als Einbau erkannt", async () => {
  const module = await import(pathToFileURL(ENGINE).href);

  for (const title of [
    "Textwand vermeiden",
    "Glasfaser-Ratgeber",
    "Wandern mit Hund",
    "Türkei-Reiseführer"
  ]) {
    const plan = module.buildVisualGenerationPlan({
      type: "product",
      title
    });

    assert.equal(
      plan.assets.some((asset) => asset.id === "installation"),
      false,
      title
    );
  }
});

test("übrige Merkmalsmotive bleiben erhalten", async () => {
  const module = await import(pathToFileURL(ENGINE).href);
  const plan = module.buildVisualGenerationPlan({
    type: "product",
    title: "Mikrochip Futterautomat mit Hub App Batterie Reinigung Nassfutter",
    reason: "Mehrere Tiere"
  });

  for (const id of [
    "hub-system",
    "app",
    "power",
    "cleaning",
    "multi-pet",
    "food-detail"
  ]) {
    assert.ok(plan.assets.some((asset) => asset.id === id), id);
  }
});

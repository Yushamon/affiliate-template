import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../.."
);

const ENGINE = path.join(
  ROOT,
  "apps/pfotentechnik/src/lib/seo/research/visual-generation.ts"
);

test("deutsche Komposita erzeugen das Installationsmotiv", async () => {
  const module = await import(
    pathToFileURL(ENGINE).href
  );

  for (const reason of [
    "Wandeinbau erklären",
    "Glaseinbau berücksichtigen",
    "Wandmontage zeigen",
    "Türinstallation darstellen",
    "Montage in einer dicken Wand",
    "Einbau in Glas"
  ]) {
    const plan =
      module.buildVisualGenerationPlan({
        type: "product",
        title: "Testprodukt",
        reason
      });

    assert.ok(
      plan.assets.some(
        (asset) =>
          asset.id === "installation"
      ),
      reason
    );
  }
});

test("ähnliche, aber fachlich fremde Wörter lösen kein Installationsmotiv aus", async () => {
  const module = await import(
    pathToFileURL(ENGINE).href
  );

  for (const title of [
    "Textwand vermeiden",
    "Glasfaser-Ratgeber",
    "Wandern mit Hund"
  ]) {
    const plan =
      module.buildVisualGenerationPlan({
        type: "product",
        title
      });

    assert.equal(
      plan.assets.some(
        (asset) =>
          asset.id === "installation"
      ),
      false,
      title
    );
  }
});

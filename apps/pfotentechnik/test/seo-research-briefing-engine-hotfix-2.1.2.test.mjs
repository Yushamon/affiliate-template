import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const schemaUrl = pathToFileURL(
  path.join(ROOT, "apps", "pfotentechnik", "src", "lib", "seo", "research", "schema.ts")
).href;

test("implementationBrief ist zur Laufzeit definiert und optional", async () => {
  const { normalizeResearchStore } = await import(schemaUrl + "?hotfix=2.1.2");

  const normalized = normalizeResearchStore({
    version: 2,
    updatedAt: "2026-08-02T00:00:00.000Z",
    provider: "test",
    scope: ["test"],
    items: [{
      id: "belegtes-produkt",
      type: "product",
      title: "Belegtes Produkt",
      status: "open",
      priority: 80,
      confidence: 90,
      reason: "Belegte Produktchance.",
      actions: [],
      evidence: [{
        source: "Hersteller",
        note: "Offizielle Produktangabe."
      }],
      discoveredAt: "2026-08-02T00:00:00.000Z",
      lastConfirmedAt: "2026-08-02T00:00:00.000Z"
    }]
  });

  assert.equal(normalized.items.length, 1);
  assert.equal(normalized.items[0].implementationBrief, undefined);
});

test("implementationBrief wird vollständig normalisiert", async () => {
  const { normalizeResearchStore } = await import(schemaUrl + "?hotfix=2.1.2-brief");

  const normalized = normalizeResearchStore({
    version: 2,
    updatedAt: "2026-08-02T00:00:00.000Z",
    provider: "test",
    scope: ["test"],
    items: [{
      id: "briefing",
      type: "content-refresh",
      title: "Briefing",
      status: "open",
      priority: 80,
      confidence: 90,
      reason: "Belegte Verbesserung.",
      implementationBrief: {
        goal: "Ziel",
        problem: "Problem",
        userValue: "Nutzen",
        implementation: ["Änderung"],
        files: ["datei.ts"],
        doNotChange: ["Score"],
        acceptanceCriteria: ["Kriterium"],
        verification: ["Build"]
      },
      actions: [],
      evidence: [{
        source: "Quelle",
        note: "Beleg."
      }],
      discoveredAt: "2026-08-02T00:00:00.000Z",
      lastConfirmedAt: "2026-08-02T00:00:00.000Z"
    }]
  });

  assert.equal(normalized.items[0].implementationBrief?.goal, "Ziel");
  assert.deepEqual(normalized.items[0].implementationBrief?.verification, ["Build"]);
});

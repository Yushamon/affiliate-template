import test from "node:test";
import assert from "node:assert/strict";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const schemaUrl = pathToFileURL(
  path.join(ROOT, "apps", "pfotentechnik", "src", "lib", "seo", "research", "schema.ts")
).href;

test("alte Research-Items ohne Briefing bleiben gültig", async () => {
  const { normalizeResearchStore } = await import(schemaUrl + "?hotfix=2.1.3-old");
  const result = normalizeResearchStore({
    version: 2,
    updatedAt: "2026-08-02T00:00:00.000Z",
    provider: "test",
    scope: ["test"],
    items: [{
      id: "alt",
      type: "product",
      title: "Altes Item",
      status: "open",
      priority: 80,
      confidence: 90,
      reason: "Belegt.",
      actions: [],
      evidence: [{ source: "Hersteller", note: "Offizielle Angabe." }],
      discoveredAt: "2026-08-02T00:00:00.000Z",
      lastConfirmedAt: "2026-08-02T00:00:00.000Z"
    }]
  });
  assert.equal(result.items[0].implementationBrief, undefined);
});

test("neue Research-Items mit Briefing werden normalisiert", async () => {
  const { normalizeResearchStore } = await import(schemaUrl + "?hotfix=2.1.3-new");
  const result = normalizeResearchStore({
    version: 2,
    updatedAt: "2026-08-02T00:00:00.000Z",
    provider: "test",
    scope: ["test"],
    items: [{
      id: "neu",
      type: "content-refresh",
      title: "Neues Item",
      status: "open",
      priority: 80,
      confidence: 90,
      reason: "Belegt.",
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
      evidence: [{ source: "Quelle", note: "Beleg." }],
      discoveredAt: "2026-08-02T00:00:00.000Z",
      lastConfirmedAt: "2026-08-02T00:00:00.000Z"
    }]
  });
  assert.equal(result.items[0].implementationBrief?.goal, "Ziel");
  assert.deepEqual(result.items[0].implementationBrief?.verification, ["Build"]);
});

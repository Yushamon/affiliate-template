import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../../..");
const app = path.join(ROOT, "apps", "pfotentechnik");
const findingAi = fs.readFileSync(
  path.join(app, "src", "lib", "seo-copilot", "finding-ai.ts"),
  "utf8",
);
const findingList = fs.readFileSync(
  path.join(app, "src", "components", "admin", "SeoFindingList.astro"),
  "utf8",
);

test("jedes Finding erhält eine AI-Aktion", () => {
  assert.ok(findingAi.includes("resolveFindingAiActionIds(finding)"));
  assert.ok(findingAi.includes('resolvedIds : ["codex-send"]'));
  assert.ok(findingAi.includes('actionIds.push("codex-send")'));
});

test("fehlende aiActionIds können keine map-Exception mehr auslösen", () => {
  assert.ok(findingAi.includes("Array.isArray(finding?.aiActionIds)"));
  assert.ok(!/finding\.aiActionIds\s*\.map\(/m.test(findingAi));
});

test("fehlende Route kann die Prompt-Erzeugung nicht mehr abbrechen", () => {
  assert.ok(findingAi.includes('const slugFromRoute = (route?: string)'));
  assert.ok(findingAi.includes('typeof route !== "string" || !route.trim()'));
  assert.ok(findingAi.includes("return undefined"));
});

test("Finding-Liste rendert niemals Lösung undefined", () => {
  assert.ok(findingList.includes("const fallbackSolution ="));
  assert.ok(findingList.includes("recommendedSolution: fallbackSolution(finding)"));
  assert.ok(!findingList.includes("Lösung: ${finding.recommendedSolution}"));
});

test("Internal-Link-Findings erhalten eine konkrete Handlungsanweisung", () => {
  assert.ok(findingList.includes("no_incoming_internal_link"));
  assert.ok(findingList.includes("passende indexierbare Quellseite"));
  assert.ok(findingList.includes("internen Link-Audit erneut ausführen"));
});

test("Auto-Fix bleibt die bevorzugte direkte Aktion", () => {
  const autoFixPosition = findingList.indexOf("if (finding.autoFixPossible)");
  const aiActionPosition = findingList.indexOf("for (const aiAction of finding.aiActions");
  assert.ok(autoFixPosition >= 0);
  assert.ok(aiActionPosition > autoFixPosition);
});

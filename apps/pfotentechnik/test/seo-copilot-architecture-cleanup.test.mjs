import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  PROMPT_REGISTRY,
  listPromptTemplates,
} from "../src/lib/seo-copilot/prompt-registry.ts";
import {
  AI_ACTION_REGISTRY,
  listAiActionDefinitions,
} from "../src/lib/seo-copilot/ai-action-registry.mjs";
import {
  AUTO_FIX_REGISTRY,
  listAutoFixDefinitions,
} from "../src/lib/seo-copilot/auto-fix-registry.mjs";
import { QUALITY_SOURCE_REGISTRY } from "../scripts/quality-ops/sources.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const read = (file) => fs.readFileSync(path.join(ROOT, file), "utf8");

test("Hauptnavigation besteht aus vier Arbeitskontexten und rendert keine Pakete", () => {
  const layout = read("src/layouts/SeoAdminLayout.astro");
  assert.match(layout, /\["work",\s*"\/admin\/seo\/"/);
  assert.match(layout, /\["search",\s*"\/admin\/seo\/cockpit\/"/);
  assert.match(layout, /\["products",\s*"\/admin\/seo\/products\/"/);
  assert.match(layout, /\["system",\s*"\/admin\/seo\/history\/"/);
  assert.doesNotMatch(layout, /import SeoWorkPackages/);
  assert.doesNotMatch(layout, /active === "advisor"/);
});

test("Cockpit verwendet das gemeinsame Layout statt einer zweiten HTML-Anwendung", () => {
  const cockpit = read("src/pages/admin/seo/cockpit.astro");
  assert.match(cockpit, /import SeoAdminLayout/);
  assert.doesNotMatch(cockpit, /<!doctype html>/i);
  assert.doesNotMatch(cockpit, /<style/);
});

test("Promptdefinitionen liegen vollständig in einer Registry", () => {
  const templates = listPromptTemplates();
  assert.ok(templates.length >= 34);
  for (const template of templates) {
    assert.equal(PROMPT_REGISTRY[template.id], template);
    assert.ok(template.title && template.objective && template.contextKind);
    assert.ok(Array.isArray(template.safeguards));
  }

  const compatibilityFile = read("src/lib/seo-copilot/templates.ts");
  assert.match(compatibilityFile, /from "\.\/prompt-registry\.ts"/);
  assert.doesNotMatch(compatibilityFile, /objective:/);
});

test("Jede AI Action referenziert einen vorhandenen Registry-Prompt", () => {
  const actions = listAiActionDefinitions();
  assert.ok(actions.length >= 16);
  for (const action of actions) {
    assert.ok(PROMPT_REGISTRY[action.templateId], `${action.id}: ${action.templateId}`);
  }
  assert.equal(Object.keys(AI_ACTION_REGISTRY).length, actions.length);
});

test("Auto-Fixes sind deklarativ registriert", () => {
  const fixes = listAutoFixDefinitions();
  assert.ok(fixes.length >= 1);
  assert.equal(Object.keys(AUTO_FIX_REGISTRY).length, fixes.length);
  for (const fix of fixes) {
    assert.ok(fix.steps.length >= 3);
    assert.ok(fix.steps.every((step) => step.id && step.phase && Number.isFinite(step.percent)));
  }
});

test("Auditquellen enthalten keine mehrfach gepflegten physischen Pfade", () => {
  const allPaths = QUALITY_SOURCE_REGISTRY
    .flatMap((source) => source.files)
    .map((file) => path.resolve(file));
  assert.equal(new Set(allPaths).size, allPaths.length);
});

test("Produktseiten besitzen einen gemeinsamen Workspace ohne parallelen Store", () => {
  const index = read("src/pages/admin/seo/products/index.astro");
  const workspace = read("src/pages/admin/seo/products/[slug].astro");
  assert.match(index, /readCopilotWorkspace/);
  assert.match(workspace, /readCopilotWorkspace/);
  assert.match(workspace, /SeoFindingList/);
  assert.doesNotMatch(workspace, /localStorage/);
  assert.doesNotMatch(workspace, /new Map\(/);
});

test("gemeinsames Admin-CSS verwendet die modulare Layer-Architektur ohne important-Kaskade", () => {
  const entry = read("src/styles/seo-admin.css");
  const panels = read("src/styles/seo-admin-panels.css");
  const content = read("src/styles/seo-admin-content.css");
  const operations = read("src/styles/seo-admin-operations.css");

  assert.doesNotMatch(entry, /!important/);
  assert.doesNotMatch(panels, /!important/);
  assert.doesNotMatch(content, /!important/);
  assert.doesNotMatch(operations, /!important/);

  assert.match(entry, /@import "\.\/seo-admin-panels\.css";/);
  assert.match(entry, /@import "\.\/seo-admin-content\.css";/);
  assert.match(entry, /@import "\.\/seo-admin-operations\.css";/);

  assert.match(panels, /\.seo-card/);
  assert.match(content, /\.seo-table/);
  assert.match(operations, /\.seo-finding/);
});


test("Produkt-Static-Paths kapseln ihren Statusfilter für Astros isoliertes Bundle", () => {
  const workspace = read("src/pages/admin/seo/products/[slug].astro");
  const functionStart = workspace.indexOf("export async function getStaticPaths()");
  const functionEnd = workspace.indexOf("interface Props", functionStart);
  const staticPaths = workspace.slice(functionStart, functionEnd);
  assert.match(staticPaths, /const activeStatuses = new Set/);
  assert.match(staticPaths, /activeStatuses\.has/);
});

test("Advisor bewahrt kompakte Arbeitspakete ohne Layout-Doppelung", () => {
  const advisor = read("src/pages/admin/seo/advisor.astro");
  const layout = read("src/layouts/SeoAdminLayout.astro");
  assert.match(advisor, /SeoWorkPackages/);
  assert.match(advisor, /harte Prüfungen bleiben im Release-Gate/i);
  assert.doesNotMatch(layout, /SeoWorkPackages/);
});

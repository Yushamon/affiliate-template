import test from "node:test";
import assert from "node:assert/strict";
import { auditGeneratedPrompt, buildCodexPrompt, cleanPromptValue, normalizePromptContextV2,
  buildChatGptPrompt,
} from "../src/lib/seo-copilot/prompts.ts";
import { buildFindingAiActions } from "../src/lib/seo-copilot/finding-ai.ts";

test("Rohobjekte werden semantisch formatiert", () => {
  const value = cleanPromptValue({ code: "BUTTON_ADOPTION_LOW", description: "Button verwendet das Primitive nicht." });
  assert.match(value, /Button verwendet das Primitive nicht/);
  assert.match(value, /BUTTON_ADOPTION_LOW/);
  assert.doesNotMatch(value, /\[object Object\]/);
});

test("Accessibility-Prompt enthält keine Produkt- oder Bildblöcke", () => {
  const result = buildCodexPrompt({
    kind: "codex-remediation",
    title: { description: "Button-Adoption ist zu niedrig." },
    auditSource: "Accessibility",
    findingType: "BUTTON_ADOPTION_LOW",
    area: "accessibility",
    category: "experience",
    priorityScore: 46,
    problems: [{ description: "Button verwendet das gemeinsame Design-System nicht." }],
    acceptanceCriteria: ["Finding quality-29f7ca5ba59c39e95151 ist im erneuten Audit nicht mehr aktiv."],
  }, { templateId: "codex-remediation", generatedAt: "2026-07-31T20:00:00.000Z" });

  assert.match(result.prompt, /BUTTON_ADOPTION_LOW/);
  assert.match(result.prompt, /design-system:components:audit/);
  assert.match(result.prompt, /quality-ops:sync/);
  assert.doesNotMatch(result.prompt, /\[object Object\]/);
  assert.doesNotMatch(result.prompt, /Bildanforderungen|Content-Schema|audit:products:strict/);
  assert.doesNotMatch(result.prompt, /hero\.webp|thumbnail\.webp|gallery-\d\.webp|Belastbare Quellen/);

  const context = normalizePromptContextV2({ kind: "codex-remediation", title: "Button-Adoption", auditSource: "Accessibility", findingType: "BUTTON_ADOPTION_LOW", area: "accessibility" });
  assert.equal(context.profile, "accessibility");
  assert.equal(auditGeneratedPrompt(result.prompt, context).passed, true);
});

test("Produktkontext behält Produktschema, Bildrollen und Produktaudit", () => {
  const result = buildCodexPrompt({ kind: "product-health", title: "Produktdaten vervollständigen", route: "/produkt/beispiel/", entityType: "product", problems: ["Technische Daten fehlen."] }, { templateId: "product-health-fix-all" });
  assert.match(result.prompt, /Content-Schema/);
  assert.match(result.prompt, /Bildanforderungen/);
  assert.match(result.prompt, /audit:products:strict/);
});

test("Finding-Actions übernehmen Auditmetadaten und Quellreport", () => {
  const actions = buildFindingAiActions({
    id: "quality-29f7ca5ba59c39e95151", type: "BUTTON_ADOPTION_LOW", category: "experience", area: "accessibility", severity: "warning", confidence: 1,
    priority: { score: 46, level: "medium", factors: {} }, status: "open", source: "Accessibility", sourceFile: "reports/accessibility/latest.json",
    file: "", route: "", component: "", files: [], urls: [], description: "Button-Adoption ist zu niedrig.", impact: "Kann Nutzung beeinträchtigen.",
    recommendedSolution: "Gemeinsames Button-Primitive verwenden.", recommendedAction: "Betroffene Buttons prüfen.", autoFixPossible: false, autoFixAvailable: false,
    autoFixId: "", manualFixRequired: true, aiActionAvailable: true, aiActionIds: ["codex-send"], codexSuitable: true, releaseBlocker: false,
    createdAt: "2026-07-31T00:00:00.000Z", lastCheckedAt: "2026-07-31T00:00:00.000Z", lastChangedAt: "2026-07-31T00:00:00.000Z",
    snoozedUntil: null, note: "", fingerprint: "test",
  });
  assert.equal(actions.length, 1);
  const prompt = actions[0].prompt;
  assert.match(prompt, /Auditquelle: Accessibility/);
  assert.match(prompt, /Finding-Typ: BUTTON_ADOPTION_LOW/);
  assert.match(prompt, /Quellreport: `reports\/accessibility\/latest\.json`/);
  assert.doesNotMatch(prompt, /\[object Object\]|Bildanforderungen|Content-Schema|audit:products:strict/);
});


test("Finding-Actions akzeptieren gespeicherte Template-IDs als Alias", () => {
  const actions = buildFindingAiActions({
    id: "quality-template-alias",
    type: "BUTTON_ADOPTION_LOW",
    category: "experience",
    area: "accessibility",
    severity: "warning",
    confidence: 1,
    priority: { score: 46, level: "medium", factors: {} },
    status: "open",
    source: "Accessibility",
    sourceFile: "reports/accessibility/latest.json",
    file: "",
    route: "",
    component: "",
    files: [],
    urls: [],
    description: "Button-Adoption ist zu niedrig.",
    impact: "Kann Nutzung beeinträchtigen.",
    recommendedSolution: "Gemeinsames Button-Primitive verwenden.",
    recommendedAction: "Betroffene Buttons prüfen.",
    autoFixPossible: false,
    autoFixAvailable: false,
    autoFixId: "",
    manualFixRequired: true,
    aiActionAvailable: true,
    aiActionIds: ["codex-remediation"],
    codexSuitable: true,
    releaseBlocker: false,
    createdAt: "2026-07-31T00:00:00.000Z",
    lastCheckedAt: "2026-07-31T00:00:00.000Z",
    lastChangedAt: "2026-07-31T00:00:00.000Z",
    snoozedUntil: null,
    note: "",
    fingerprint: "template-alias",
  });

  assert.equal(actions.length, 1);
  assert.equal(actions[0].id, "codex-send");
  assert.equal(actions[0].templateId, "codex-remediation");
});


test("Codex-Prompt bewahrt Repository-Prüfung und Freigabegrenze", () => {
  const { prompt } = buildCodexPrompt(
    {
      kind: "product",
      title: "Model X",
      problems: [],
      existingData: [],
      missingData: [],
      validations: [],
      acceptanceCriteria: [],
    },
    { templateId: "generate-product-draft" },
  );

  assert.match(prompt, /Repository-Stand erneut prüfen/i);
  assert.match(prompt, /explizite Freigabe/i);
});

test("Rechercheprompt trennt Herstellerangaben und Marktsignale", () => {
  const { prompt } = buildCodexPrompt(
    {
      kind: "product",
      title: "Model X",
      problems: [],
      existingData: [],
      missingData: [],
      validations: [],
      acceptanceCriteria: [],
    },
    { templateId: "research-missing-product-data" },
  );

  assert.match(prompt, /Trenne bestätigte Herstellerangaben/i);
  assert.match(prompt, /Marktsignale/i);
});


test("Promptabschnitte erzeugen keine doppelten Listenmarkierungen", () => {
  const { prompt } = buildCodexPrompt(
    {
      kind: "product",
      title: "Model X",
      problems: ["Problem A"],
      existingData: ["Daten A"],
      missingData: ["Daten B"],
      acceptanceCriteria: ["Kriterium A"],
    },
    { templateId: "generate-product-draft" },
  );

  assert.doesNotMatch(prompt, /^-\s+-\s+/m);
  assert.match(prompt, /^- Finding: Model X$/m);
  assert.match(prompt, /^- Datei: aus Auditquelle/m);
});

test("Codex-Recherchetemplate enthält Recherche- und Arbeitsblöcke", () => {
  const { prompt } = buildCodexPrompt(
    {
      kind: "product",
      title: "Model X",
      problems: [],
      existingData: [],
      missingData: [],
      acceptanceCriteria: [],
    },
    { templateId: "research-missing-product-data" },
  );

  assert.match(prompt, /## Rechercheausgabe/);
  assert.match(prompt, /Trenne bestätigte Herstellerangaben/);
  assert.match(prompt, /Repository-Stand erneut prüfen/);
  assert.match(prompt, /expliziter Freigabe/i);
});


test("ChatGPT-Prompt benötigt keinen Codex-Repository-Recheck", () => {
  const { prompt, context } = buildChatGptPrompt(
    {
      kind: "product",
      title: "Model X",
      problems: [],
      existingData: [],
      missingData: [],
      acceptanceCriteria: [],
    },
    { templateId: "research-missing-product-data" },
  );

  assert.doesNotMatch(prompt, /Arbeitsweise für Codex/);
  assert.equal(auditGeneratedPrompt(prompt, context, "chatgpt").passed, true);
});

test("Codex-Prompt bleibt an Repository-Recheck gebunden", () => {
  const context = normalizePromptContextV2({
    kind: "product",
    title: "Model X",
    problems: [],
    existingData: [],
    missingData: [],
    acceptanceCriteria: [],
  });

  const audit = auditGeneratedPrompt(
    "## Rechercheausgabe\n\n- Trenne bestätigte Herstellerangaben und Marktsignale.",
    context,
    "codex",
  );

  assert.equal(audit.passed, false);
  assert.ok(audit.errors.includes("REPOSITORY_RECHECK_MISSING"));
});

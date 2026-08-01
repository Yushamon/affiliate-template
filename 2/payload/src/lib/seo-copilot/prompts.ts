import {
  PROMPT_REGISTRY,
  templateForContext,
  type PromptTemplateId,
} from "./prompt-registry.ts";
import type { PromptResult } from "./types";
import {
  auditGeneratedPrompt,
  normalizePromptContextV2,
  renderPromptContextV2,
  type PromptBuildInput,
  type RuntimePromptContext,
} from "./prompt-engine.ts";

export {
  buildWorkPackagePrompt as buildCodexWorkPackagePrompt,
  redactWorkPackageSecrets,
} from "../seo/advisor/work-packages.ts";

export {
  auditGeneratedPrompt,
  cleanPromptValue,
  detectPromptProfile,
  normalizePromptContextV2,
  renderPromptContextV2,
  uniquePromptValues,
} from "./prompt-engine.ts";

const RESEARCH_TEMPLATE_IDS = new Set<PromptTemplateId>([
  "research-missing-product-data",
]);

const codexSection = () =>
  [
    "## Arbeitsweise für Codex",
    "",
    "1. Arbeite repository-first.",
    "2. Vor Webrecherche, Dateianlage und jeder schreibenden Änderung den Repository-Stand erneut prüfen.",
    "3. Ändere nur den fachlich notwendigen Scope.",
    "4. Schreibende Produkt-, Hersteller- und Veröffentlichungsaktionen erfolgen erst nach expliziter Freigabe.",
    "5. Führe alle genannten Validierungen aus und behebe eigene Fehler.",
  ].join("\n");

const researchSection = () =>
  [
    "## Rechercheausgabe",
    "",
    "- Trenne bestätigte Herstellerangaben, Händlerangaben, unabhängige Tests, Community-Erfahrungen und abgeleitete Marktsignale klar voneinander.",
    "- Nenne Beobachtungsdatum, Aussagekraft, Einschränkung und Confidence.",
    "- Kennzeichne Marktsignale ausdrücklich als Signale und nicht als Verkaufszahlen.",
    "- Übernimm unsichere Werte nicht als bestätigte Produktdaten.",
  ].join("\n");

const finalSections = (
  type: "codex" | "chatgpt",
  templateId: PromptTemplateId,
  context: RuntimePromptContext,
) => {
  const sections: string[] = [];

  if (RESEARCH_TEMPLATE_IDS.has(templateId) || context.requiresResearch) {
    sections.push(researchSection());
  }

  if (type === "codex") {
    sections.push(codexSection());
  }

  return sections;
};

const createResult = (
  type: "codex" | "chatgpt",
  input: PromptBuildInput,
  options: { templateId?: PromptTemplateId; generatedAt?: string } = {},
): PromptResult => {
  const context = normalizePromptContextV2(input);
  const templateId = options.templateId ?? templateForContext(context);
  const template = PROMPT_REGISTRY[templateId];
  const basePrompt = renderPromptContextV2(context, template);
  const prompt = [
    basePrompt,
    ...finalSections(type, templateId, context),
  ]
    .filter(Boolean)
    .join("\n\n");

  const audit = auditGeneratedPrompt(prompt, context, type);

  if (!audit.passed) {
    throw new Error(
      `SEO-Copilot Prompt-Audit fehlgeschlagen: ${audit.errors.join(", ")}`,
    );
  }

  return {
    type,
    templateId,
    title: template.title,
    prompt,
    context,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
  };
};

export const normalizePromptContext = normalizePromptContextV2;

export const buildCodexPrompt = (
  input: PromptBuildInput,
  options: { templateId?: PromptTemplateId; generatedAt?: string } = {},
): PromptResult => createResult("codex", input, options);

export const buildChatGptPrompt = (
  input: PromptBuildInput,
  options: { templateId?: PromptTemplateId; generatedAt?: string } = {},
): PromptResult => createResult("chatgpt", input, options);

export const buildPromptPair = (
  input: PromptBuildInput,
  options: { templateId?: PromptTemplateId; generatedAt?: string } = {},
) => ({
  chatgpt: buildChatGptPrompt(input, options),
  codex: buildCodexPrompt(input, options),
});

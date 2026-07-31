import { PROMPT_REGISTRY, templateForContext, type PromptTemplateId } from "./prompt-registry.ts";
import type { PromptResult } from "./types";
import { auditGeneratedPrompt, normalizePromptContextV2, renderPromptContextV2, type PromptBuildInput } from "./prompt-engine.ts";

export { buildWorkPackagePrompt as buildCodexWorkPackagePrompt, redactWorkPackageSecrets } from "../seo/advisor/work-packages.ts";
export { auditGeneratedPrompt, cleanPromptValue, detectPromptProfile, normalizePromptContextV2, renderPromptContextV2, uniquePromptValues } from "./prompt-engine.ts";

const createResult = (
  type: "codex" | "chatgpt",
  input: PromptBuildInput,
  options: { templateId?: PromptTemplateId; generatedAt?: string } = {},
): PromptResult => {
  const context = normalizePromptContextV2(input);
  const templateId = options.templateId ?? templateForContext(context);
  const template = PROMPT_REGISTRY[templateId];
  const basePrompt = renderPromptContextV2(context, template);
  const suffix = type === "codex"
    ? ["## Arbeitsweise für Codex", "", "1. Arbeite repository-first und prüfe den aktuellen Stand vor jeder Änderung.", "2. Ändere nur den fachlich notwendigen Scope.", "3. Schreibende Produkt-, Hersteller- und Veröffentlichungsaktionen erfolgen erst nach expliziter Freigabe.", "4. Führe alle genannten Validierungen aus und behebe eigene Fehler."].join("\n")
    : ["## Rechercheausgabe", "", "- Trenne bestätigte Primärquellen, Händlerangaben, unabhängige Tests und Community-Erfahrungen.", "- Nenne Beobachtungsdatum, Aussagekraft, Einschränkung und Confidence.", "- Kennzeichne Marktsignale ausdrücklich als Signale und nicht als Verkaufszahlen."].join("\n");
  const prompt = `${basePrompt}\n\n${suffix}`;
  const audit = auditGeneratedPrompt(prompt, context);
  if (!audit.passed) throw new Error(`SEO-Copilot Prompt-Audit fehlgeschlagen: ${audit.errors.join(", ")}`);
  return { type, templateId, title: template.title, prompt, context, generatedAt: options.generatedAt ?? new Date().toISOString() };
};

export const normalizePromptContext = normalizePromptContextV2;
export const buildCodexPrompt = (input: PromptBuildInput, options: { templateId?: PromptTemplateId; generatedAt?: string } = {}): PromptResult => createResult("codex", input, options);
export const buildChatGptPrompt = (input: PromptBuildInput, options: { templateId?: PromptTemplateId; generatedAt?: string } = {}): PromptResult => createResult("chatgpt", input, options);
export const buildPromptPair = (input: PromptBuildInput, options: { templateId?: PromptTemplateId; generatedAt?: string } = {}) => ({ chatgpt: buildChatGptPrompt(input, options), codex: buildCodexPrompt(input, options) });

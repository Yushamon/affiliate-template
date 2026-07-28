import { PRODUCT_IMAGE_ROLES, PRODUCT_SCHEMA_PATH, SEO_COPILOT_PROJECT_PATH } from "./config.ts";
import { PROMPT_LIBRARY, templateForContext, type PromptTemplateId } from "./templates.ts";
import type { PromptContext, PromptResult, SourceEvidence } from "./types";

const clean = (value: unknown, max = 2_000) =>
  String(value ?? "")
    .replace(/[\u0000-\u001f]/g, " ")
    .replace(/(?:client_secret|refresh_token|access_token|api[_-]?key|authorization)\s*[:=]\s*\S+/gi, "$1=[REDACTED]")
    .trim()
    .slice(0, max);

const unique = (values: unknown[], max = 30) =>
  [...new Set(values.map((value) => clean(value)).filter(Boolean))].slice(0, max);

export const normalizePromptContext = (input: Partial<PromptContext> & Pick<PromptContext, "kind" | "title">): PromptContext => ({
  kind: input.kind,
  projectPath: SEO_COPILOT_PROJECT_PATH,
  affectedFile: input.affectedFile ? clean(input.affectedFile, 500) : undefined,
  slug: input.slug ? clean(input.slug, 160) : undefined,
  title: clean(input.title, 240),
  manufacturer: input.manufacturer ? clean(input.manufacturer, 200) : undefined,
  category: input.category ? clean(input.category, 160) : undefined,
  problems: unique(input.problems ?? []),
  existingData: unique(input.existingData ?? []),
  missingData: unique(input.missingData ?? []),
  comparisons: unique(input.comparisons ?? []),
  guides: unique(input.guides ?? []),
  imageRequirements: unique(input.imageRequirements ?? PRODUCT_IMAGE_ROLES.map((role) => `${role}.webp`)),
  schemaPath: clean(input.schemaPath || PRODUCT_SCHEMA_PATH, 500),
  sources: (input.sources ?? []).slice(0, 30).map((source) => ({
    ...source,
    url: clean(source.url, 1_000),
    domain: clean(source.domain, 200),
    title: clean(source.title, 300),
    supports: unique(source.supports ?? [], 20),
  })),
  validationCommands: unique(
    input.validationCommands ?? [
      "npm --workspace apps/pfotentechnik run lint:content",
      "npm --workspace apps/pfotentechnik run audit:products:strict",
      "npm run build:pfotentechnik",
    ],
  ),
  acceptanceCriteria: unique(input.acceptanceCriteria ?? []),
});

const list = (title: string, values: string[], fallback = "Keine") =>
  `${title}:\n${values.length ? values.map((value) => `- ${value}`).join("\n") : `- ${fallback}`}`;

const sourceList = (sources: SourceEvidence[]) =>
  list(
    "Belastbare Quellen",
    sources.map(
      (source) =>
        `${source.sourceType}: ${source.title || source.domain} – ${source.url} (beobachtet ${source.observedAt}; unterstützt: ${source.supports.join(", ") || "noch zuzuordnen"})`,
    ),
    "Keine validierte Quelle im Kontext; zuerst Primärquelle beschaffen.",
  );

const sharedContext = (context: PromptContext, templateId: PromptTemplateId) => {
  const template = PROMPT_LIBRARY[templateId];
  return [
    `Projekt: Yushamon/affiliate-template`,
    `Projektpfad: ${context.projectPath}`,
    context.affectedFile ? `Betroffene Datei: ${context.affectedFile}` : "Betroffene Datei: vor der Arbeit aus dem Repository ermitteln",
    context.slug ? `Slug/Product Key: ${context.slug}` : "Slug/Product Key: noch nicht freigegeben",
    context.manufacturer ? `Hersteller: ${context.manufacturer}` : "Hersteller: noch zu validieren",
    context.category ? `Kategorie: ${context.category}` : "Kategorie: gegen vorhandene Terminologie prüfen",
    `Aufgabe: ${template.title}`,
    `Ziel: ${template.objective}`,
    list("Konkrete Probleme", context.problems),
    list("Vorhandene Daten", context.existingData),
    list("Tatsächlich fehlende Daten", context.missingData),
    list("Relevante vorhandene Vergleiche", context.comparisons),
    list("Relevante vorhandene Ratgeber", context.guides),
    sourceList(context.sources),
    list("Bildanforderungen", context.imageRequirements),
    `Aktuelles Content-Schema: ${context.schemaPath || PRODUCT_SCHEMA_PATH}`,
    list("Sicherheits- und Qualitätsgrenzen", [
      ...template.safeguards,
      "Keine Dummy-Daten, erfundenen Produkte, Verkaufszahlen oder Testerfahrungen.",
      "Vor Webrecherche und vor Dateianlage den aktuellen Repository-Stand erneut prüfen.",
      "Unsichere Werte nicht als bestätigte Frontmatter-Daten übernehmen.",
    ]),
    list("Validierung", context.validationCommands),
    list("Akzeptanzkriterien", context.acceptanceCriteria, "Alle konkret genannten Probleme nachvollziehbar gelöst; keine Regression."),
  ].join("\n\n");
};

export const buildCodexPrompt = (
  input: Partial<PromptContext> & Pick<PromptContext, "kind" | "title">,
  options: { templateId?: PromptTemplateId; generatedAt?: string } = {},
): PromptResult => {
  const context = normalizePromptContext(input);
  const templateId = options.templateId ?? templateForContext(context);
  return {
    type: "codex",
    title: PROMPT_LIBRARY[templateId].title,
    prompt: [
      sharedContext(context, templateId),
      "Arbeitsweise für Codex:",
      "1. Lies zuerst Schema, Zieldatei, Hersteller-, Vergleichs- und Bildbeziehungen.",
      "2. Ändere nur Dateien innerhalb des genannten Scopes.",
      "3. Zeige bei Produktanlagen zuerst Preflight und Entwurf; schreibe erst nach expliziter Freigabe.",
      "4. Führe die genannten Validierungen aus und behebe eigene Fehler.",
      "5. Fasse Datenbezug, geänderte Dateien, Tests und verbleibende Unsicherheiten zusammen.",
    ].join("\n\n"),
    context,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
  };
};

export const buildChatGptPrompt = (
  input: Partial<PromptContext> & Pick<PromptContext, "kind" | "title">,
  options: { templateId?: PromptTemplateId; generatedAt?: string } = {},
): PromptResult => {
  const context = normalizePromptContext(input);
  const templateId = options.templateId ?? templateForContext(context);
  return {
    type: "chatgpt",
    title: PROMPT_LIBRARY[templateId].title,
    prompt: [
      sharedContext(context, templateId),
      "Rechercheausgabe:",
      "- Trenne bestätigte Herstellerangaben, Händlerangaben, unabhängige Tests und Community-Erfahrungen.",
      "- Nenne je Aussage Quelle, Beobachtungsdatum, Aussagekraft, Einschränkung und Confidence.",
      "- Bezeichne Bewertungen, Rankings, Suchinteresse und Händlerabdeckung als Marktsignale, nicht als Verkaufszahlen.",
      "- Liste Widersprüche, regionale Varianten, mögliche Nachfolger sowie alle weiterhin fehlenden Daten.",
      "- Liefere keine fertige Produktdatei, solange Schema und Repository-Preflight nicht vorliegen.",
    ].join("\n\n"),
    context,
    generatedAt: options.generatedAt ?? new Date().toISOString(),
  };
};

export const buildPromptPair = (
  input: Partial<PromptContext> & Pick<PromptContext, "kind" | "title">,
  options: { templateId?: PromptTemplateId; generatedAt?: string } = {},
) => ({
  chatgpt: buildChatGptPrompt(input, options),
  codex: buildCodexPrompt(input, options),
});

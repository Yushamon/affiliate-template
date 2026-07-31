import { PRODUCT_IMAGE_ROLES, PRODUCT_SCHEMA_PATH, SEO_COPILOT_PROJECT_PATH } from "./config.ts";
import type { PromptContext, PromptKind, SourceEvidence } from "./types";
import type { PromptTemplate } from "./prompt-registry.ts";

export type PromptProfile = "accessibility" | "css" | "performance" | "internal-linking" | "schema" | "comparison" | "content" | "media" | "product" | "journey" | "generic";

export interface PromptBuildInput extends Partial<PromptContext> {
  kind: PromptKind;
  title: unknown;
  auditSource?: unknown;
  findingType?: unknown;
  area?: unknown;
  severity?: unknown;
  priorityScore?: unknown;
  sourceReports?: unknown[];
  requiresResearch?: boolean;
  entityType?: "product" | "manufacturer" | "comparison" | "guide" | "page" | "component" | "unknown";
}

export interface RuntimePromptContext extends PromptContext {
  auditSource?: string;
  findingType?: string;
  area?: string;
  severity?: string;
  priorityScore?: number;
  sourceReports: string[];
  requiresResearch: boolean;
  entityType: NonNullable<PromptBuildInput["entityType"]>;
  profile: PromptProfile;
}

const OBJECT_KEYS = ["description", "message", "reason", "recommendation", "recommendedSolution", "recommendedAction", "title", "label", "code", "file", "route", "component"] as const;
const REDACTION = /((?:client_secret|refresh_token|access_token|api[_-]?key|authorization))\s*[:=]\s*\S+/gi;

const primitiveText = (value: unknown): string => {
  if (value === null || value === undefined) return "";
  if (["string", "number", "boolean"].includes(typeof value)) return String(value);
  if (value instanceof Error) return value.message;
  if (Array.isArray(value)) return value.map(primitiveText).filter(Boolean).join("; ");
  if (typeof value === "object") {
    const record = value as Record<string, unknown>;
    const selected = OBJECT_KEYS.map((key) => primitiveText(record[key])).filter(Boolean);
    if (selected.length) return [...new Set(selected)].join(" · ");
    try { return JSON.stringify(record, Object.keys(record).sort()); } catch { return ""; }
  }
  return "";
};

export const cleanPromptValue = (value: unknown, max = 2_000) => primitiveText(value)
  .replace(/[\u0000-\u001f]/g, " ")
  .replace(REDACTION, "$1=[REDACTED]")
  .replace(/\s+/g, " ")
  .trim()
  .slice(0, max);

export const uniquePromptValues = (values: unknown[], max = 30) => [...new Set(values.flatMap((value) => Array.isArray(value) ? value.map((entry) => cleanPromptValue(entry)) : [cleanPromptValue(value)]).filter(Boolean))].slice(0, max);

const signals = (input: PromptBuildInput) => [input.kind, input.category, input.auditSource, input.findingType, input.area, input.title, ...(input.problems ?? [])].map((value) => cleanPromptValue(value).toLowerCase()).join(" ");

export const detectPromptProfile = (input: PromptBuildInput): PromptProfile => {
  const signal = signals(input);
  if (/accessib|a11y|button_adoption|aria|keyboard|focus/.test(signal)) return "accessibility";
  if (/internal.?link|anchor|self_link|orphan/.test(signal)) return "internal-linking";
  if (/schema|structured.?data|json-ld|canonical|technical.?seo/.test(signal)) return "schema";
  if (/performance|render.?blocking|dom|image.?bytes|html.?too.?large|lcp|cls/.test(signal)) return "performance";
  if (/\bcss\b|specificity|important|design.?system|token|primitive/.test(signal)) return "css";
  if (/comparison|vergleich/.test(signal)) return "comparison";
  if (/media|hero|thumbnail|gallery|image/.test(signal)) return "media";
  if (/journey|decision.?tree|funnel/.test(signal)) return "journey";
  if (/product|produkt|manufacturer|hersteller/.test(signal)) return "product";
  if (/content|faq|information.?gain|expert|editorial|eeat/.test(signal)) return "content";
  return "generic";
};

const validationProfiles: Record<PromptProfile, string[]> = {
  accessibility: ["npm --workspace apps/pfotentechnik run design-system:components:audit", "npm --workspace apps/pfotentechnik run design-system:audit", "npm run build:pfotentechnik", "npm --workspace apps/pfotentechnik run quality-ops:sync"],
  css: ["npm --workspace apps/pfotentechnik run design-system:check", "npm --workspace apps/pfotentechnik run css:architecture:check", "npm --workspace apps/pfotentechnik run audit:performance:strict", "npm run build:pfotentechnik", "npm --workspace apps/pfotentechnik run quality-ops:sync"],
  performance: ["npm --workspace apps/pfotentechnik run audit:performance:strict", "npm run build:pfotentechnik", "npm --workspace apps/pfotentechnik run quality-ops:sync"],
  "internal-linking": ["npm --workspace apps/pfotentechnik run audit:internal-links:strict", "npm --workspace apps/pfotentechnik run audit:internal-link-targets:strict", "npm run build:pfotentechnik", "npm --workspace apps/pfotentechnik run quality-ops:sync"],
  schema: ["npm --workspace apps/pfotentechnik run audit:technical-seo:source", "npm --workspace apps/pfotentechnik run audit:technical-seo", "npm run build:pfotentechnik", "npm --workspace apps/pfotentechnik run quality-ops:sync"],
  comparison: ["npm --workspace apps/pfotentechnik run comparison:audit:strict", "npm --workspace apps/pfotentechnik run comparison:data:audit:strict", "npm run build:pfotentechnik", "npm --workspace apps/pfotentechnik run quality-ops:sync"],
  content: ["npm --workspace apps/pfotentechnik run lint:content:strict", "npm --workspace apps/pfotentechnik run audit:content-quality:strict", "npm run build:pfotentechnik", "npm --workspace apps/pfotentechnik run quality-ops:sync"],
  media: ["npm --workspace apps/pfotentechnik run media:audit", "npm --workspace apps/pfotentechnik run audit:performance:strict", "npm run build:pfotentechnik", "npm --workspace apps/pfotentechnik run quality-ops:sync"],
  product: ["npm --workspace apps/pfotentechnik run lint:content:strict", "npm --workspace apps/pfotentechnik run audit:products:strict", "npm run build:pfotentechnik", "npm --workspace apps/pfotentechnik run quality-ops:sync"],
  journey: ["npm --workspace apps/pfotentechnik run audit:decision-journeys:strict", "npm --workspace apps/pfotentechnik run audit:internal-links:strict", "npm run build:pfotentechnik", "npm --workspace apps/pfotentechnik run quality-ops:sync"],
  generic: ["npm --workspace apps/pfotentechnik run audit:repository:strict", "npm run build:pfotentechnik", "npm --workspace apps/pfotentechnik run quality-ops:sync"],
};

const inferEntityType = (input: PromptBuildInput): RuntimePromptContext["entityType"] => {
  if (input.entityType) return input.entityType;
  const route = cleanPromptValue(input.route);
  if (/^\/produkt\//.test(route)) return "product";
  if (/^\/hersteller\//.test(route)) return "manufacturer";
  if (/^\/vergleiche\//.test(route)) return "comparison";
  if (cleanPromptValue(input.component)) return "component";
  if (route) return "page";
  return "unknown";
};

const normalizeSource = (source: SourceEvidence): SourceEvidence => ({ ...source, url: cleanPromptValue(source.url, 1_000), domain: cleanPromptValue(source.domain, 200), title: cleanPromptValue(source.title, 300), observedAt: cleanPromptValue(source.observedAt, 100), supports: uniquePromptValues(source.supports ?? [], 20) });

export const normalizePromptContextV2 = (input: PromptBuildInput): RuntimePromptContext => {
  const profile = detectPromptProfile(input);
  const entityType = inferEntityType(input);
  const productContext = profile === "product" || entityType === "product";
  const mediaContext = profile === "media";
  const requiresResearch = Boolean(input.requiresResearch) || ["product", "content", "media"].includes(profile);
  return {
    kind: input.kind,
    projectPath: SEO_COPILOT_PROJECT_PATH,
    affectedFile: cleanPromptValue(input.affectedFile, 500) || undefined,
    route: cleanPromptValue(input.route, 500) || undefined,
    component: cleanPromptValue(input.component, 240) || undefined,
    slug: cleanPromptValue(input.slug, 160) || undefined,
    title: cleanPromptValue(input.title, 240) || "Unbenanntes Finding",
    manufacturer: productContext ? cleanPromptValue(input.manufacturer, 200) || undefined : undefined,
    category: cleanPromptValue(input.category, 160) || undefined,
    problems: uniquePromptValues(input.problems ?? []),
    existingData: uniquePromptValues(input.existingData ?? []),
    missingData: uniquePromptValues(input.missingData ?? []),
    comparisons: productContext || profile === "comparison" ? uniquePromptValues(input.comparisons ?? []) : [],
    guides: productContext || ["content", "journey"].includes(profile) ? uniquePromptValues(input.guides ?? []) : [],
    imageRequirements: productContext || mediaContext ? uniquePromptValues(input.imageRequirements?.length ? input.imageRequirements : PRODUCT_IMAGE_ROLES.map((role) => `${role}.webp`)) : [],
    schemaPath: productContext ? cleanPromptValue(input.schemaPath || PRODUCT_SCHEMA_PATH, 500) : undefined,
    sources: requiresResearch ? (input.sources ?? []).slice(0, 30).map(normalizeSource) : [],
    validationCommands: uniquePromptValues([...(input.validationCommands ?? []), ...validationProfiles[profile]], 40),
    acceptanceCriteria: uniquePromptValues(input.acceptanceCriteria ?? [], 40),
    auditSource: cleanPromptValue(input.auditSource, 240) || undefined,
    findingType: cleanPromptValue(input.findingType, 240) || undefined,
    area: cleanPromptValue(input.area, 160) || undefined,
    severity: cleanPromptValue(input.severity, 80) || undefined,
    priorityScore: Number.isFinite(Number(input.priorityScore)) ? Number(input.priorityScore) : undefined,
    sourceReports: uniquePromptValues(input.sourceReports ?? [], 20),
    requiresResearch,
    entityType,
    profile,
  };
};

const normalizeListEntry = (entry: string) =>
  entry.replace(/^\s*[-*+]\s+/, "").trim();

const section = (title: string, body: string | string[]) => {
  const value = Array.isArray(body)
    ? body
        .map((entry) => normalizeListEntry(String(entry)))
        .filter(Boolean)
        .map((entry) => `- ${entry}`)
        .join("\n")
    : body.trim();

  return value ? `## ${title}\n\n${value}` : "";
};

const requirements: Record<PromptProfile, string[]> = {
  accessibility: ["Native Semantik beibehalten: Aktionen als `<button>`, Navigation als `<a href>`.", "Tastaturbedienung, sichtbare Fokuszustände und zugängliche Namen erhalten.", "Vorhandene `pt-button`-Primitives und Varianten wiederverwenden.", "Keine lokale Button-CSS-Parallelstruktur und keine zusätzlichen `!important`-Regeln.", "Touch-Ziele, Mobile-Darstellung und Dark Mode nicht verschlechtern."],
  css: ["Ursache in der Kaskade beheben statt einen weiteren Override anzuhängen.", "Design-Tokens und vorhandene Primitives verwenden.", "Keine neue `!important`-Deklaration einführen.", "Mobile, Dark Mode und Viewport-Vertrag erhalten."],
  performance: ["Gemessenen Engpass beheben, nicht nur das Budget anheben.", "HTML, CSS, JS, DOM und Bilder getrennt bewerten.", "Keine Funktions- oder Inhaltsverluste zur reinen Zahlenkosmetik."],
  "internal-linking": ["Nur vorhandene kanonische Ziele verwenden.", "Keine Selbstlinks, Redirect-Ziele oder künstlichen Keyword-Anker erzeugen.", "Journey, Nutzerintention und Satzkontext erhalten."],
  schema: ["Gerenderten Output und Source-Implementierung gemeinsam prüfen.", "Keine nicht sichtbaren oder unbelegten Daten in strukturierte Daten aufnehmen.", "Bestehende Schema-IDs und Canonical-Logik erhalten."],
  comparison: ["Bestehende Comparison-Komponenten und Datenmodelle wiederverwenden.", "Preis und redaktionellen Score getrennt halten.", "Mobile Tabellen, Sticky-Elemente und Dark Mode prüfen."],
  content: ["Keine Fülltexte oder bloßen Umformulierungen ergänzen.", "Information Gain und Nutzerentscheidung müssen konkret erkennbar sein.", "Belegte Aussagen, Quellen und medizinische Grenzen sauber trennen."],
  media: ["Nur vorhandene Bildrollen und belegte Merkmale verwenden.", "Keine erfundenen Funktionen, Logos oder fremde Herstellerfotografie kopieren.", "Mobilzuschnitt, Dateipfad und Performance-Budget berücksichtigen."],
  product: ["Produktschema und bestehende Produktdatei zuerst lesen.", "Nur belegbare Daten übernehmen; Unsicheres offen markieren.", "Keine Slugs, URLs oder Produktidentitäten ohne explizite Freigabe ändern."],
  journey: ["Nutzerfrage und Funnel-Stufe vor der Änderung bestimmen.", "Keine Kreise, Selbstlinks oder redundanten nächsten Schritte erzeugen.", "Vorhandene Journey-Registry und Linklogik wiederverwenden."],
  generic: ["Aktuellen Repository-Stand und Quellreport zuerst lesen.", "Bestehende Architektur erweitern statt Parallelstrukturen anzulegen.", "Änderungen auf den fachlich notwendigen Scope begrenzen."],
};

export const renderPromptContextV2 = (context: RuntimePromptContext, template: PromptTemplate) => {
  const metadata = [
    `- Finding: ${context.title}`,
    context.auditSource ? `- Auditquelle: ${context.auditSource}` : "",
    context.findingType ? `- Finding-Typ: ${context.findingType}` : "",
    context.area ? `- Bereich: ${context.area}` : "",
    context.category ? `- Kategorie: ${context.category}` : "",
    context.severity ? `- Schweregrad: ${context.severity}` : "",
    Number.isFinite(context.priorityScore) ? `- Priorität: ${context.priorityScore}/100` : "",
    `- Prompt-Registry: ${template.id}`,
    `- Aufgabe: ${template.title}`,
    `- Ziel: ${template.objective}`,
  ].filter(Boolean);
  const location = [
    context.affectedFile ? `- Datei: \`${context.affectedFile}\`` : "- Datei: aus Auditquelle und aktuellem Repository-Stand ermitteln",
    context.route ? `- Route: \`${context.route}\`` : "- Route: aus Finding und Renderingpfad ermitteln",
    context.component ? `- Komponente: \`${context.component}\`` : "- Komponente: aus Datei, Imports und Renderingpfad ermitteln",
    ...context.sourceReports.map((report) => `- Quellreport: \`${report}\``),
  ];
  const blocks = [
    `Du arbeitest direkt im GitHub-Repository \`Yushamon/affiliate-template\`.\n\nProjektpfad: \`${context.projectPath}\``,
    section("Auftrag", metadata),
    section("Betroffener Kontext", location),
    section("Konkrete Probleme", context.problems),
    section("Vorhandene Daten", context.existingData),
    section("Fehlende oder zu prüfende Daten", context.missingData),
    context.comparisons.length ? section("Relevante Vergleiche", context.comparisons) : "",
    context.guides.length ? section("Relevante Ratgeber", context.guides) : "",
    context.sources.length ? section("Belastbare Quellen", context.sources.map((source) => `${source.sourceType}: ${source.title || source.domain} – ${source.url}`)) : "",
    context.imageRequirements.length ? section("Bildanforderungen", context.imageRequirements) : "",
    context.schemaPath ? section("Content-Schema", `\`${context.schemaPath}\``) : "",
    section("Anforderungen", [...requirements[context.profile], ...template.safeguards, "Keine Dummy-Daten, erfundenen Produkte, Verkaufszahlen oder Testerfahrungen.", "Eigene Regressionen vollständig beheben."]),
    section("Vorgehen", ["Lies zuerst Quellreport, betroffene Architektur, Zieldatei und unmittelbar beteiligte Komponenten.", "Ermittle Datei, Route und Renderingpfad aus dem aktuellen Repository, sofern sie im Finding fehlen.", "Suche nach vorhandenen Primitives, Komponenten, Stores, APIs und Registries, bevor du Code ergänzt.", "Behebe die Ursache statt weitere Sonderregeln oder parallele Implementierungen anzulegen.", "Ändere nur Dateien innerhalb des fachlich notwendigen Scopes."]),
    section("Validierung", context.validationCommands.map((command) => `\`${command}\``)),
    section("Akzeptanzkriterien", context.acceptanceCriteria.length ? context.acceptanceCriteria : ["Das konkrete Finding ist im erneuten Audit nicht mehr aktiv.", "Alle genannten Prüfungen bestehen."]),
    section("Abschlussbericht", ["Ursache", "Geänderte Dateien und Komponenten", "Entfernte Doppelungen oder Sonderlogik", "Ausgeführte Validierungen und Ergebnisse", "Risiken und verbleibende belastbare Einschränkungen"]),
  ];
  return blocks.filter(Boolean).join("\n\n");
};

export const auditGeneratedPrompt = (
  prompt: string,
  context: RuntimePromptContext,
  target: "codex" | "chatgpt" = "codex",
) => {
  const errors: string[] = [];
  const warnings: string[] = [];
  if (!prompt.trim()) errors.push("PROMPT_EMPTY");
  if (prompt.includes("[object Object]")) errors.push("RAW_OBJECT_RENDERED");
  if (/Data format:\s+RDF-Turtle/i.test(prompt)) errors.push("EDITOR_ARTIFACT_LEAK");
  if (context.profile !== "product" && context.entityType !== "product") {
    if (/Bildanforderungen|Content-Schema/.test(prompt)) errors.push("IRRELEVANT_PRODUCT_SECTION");
    if (/audit:products:strict/.test(prompt)) errors.push("IRRELEVANT_PRODUCT_VALIDATION");
  }
  if (context.profile === "accessibility") {
    if (!/design-system:components:audit/.test(prompt)) errors.push("ACCESSIBILITY_COMPONENT_AUDIT_MISSING");
    if (/hero\.webp|thumbnail\.webp|gallery-\d\.webp/.test(prompt)) errors.push("ACCESSIBILITY_MEDIA_LEAK");
  }

  if (
    target === "codex" &&
    !/Repository-Stand erneut prüfen/i.test(prompt)
  ) {
    errors.push("REPOSITORY_RECHECK_MISSING");
  }

  if (context.requiresResearch) {
    if (!/Trenne bestätigte Herstellerangaben/i.test(prompt)) {
      errors.push("RESEARCH_SOURCE_SEPARATION_MISSING");
    }
    if (!/Marktsignale/i.test(prompt)) {
      errors.push("MARKET_SIGNAL_LABEL_MISSING");
    }
  }
  if (!context.problems.length) warnings.push("NO_CONCRETE_PROBLEM");
  if (!context.affectedFile) warnings.push("AFFECTED_FILE_TO_RESOLVE");
  if (!context.route) warnings.push("ROUTE_TO_RESOLVE");
  if (!context.component) warnings.push("COMPONENT_TO_RESOLVE");
  return { passed: errors.length === 0, errors, warnings };
};

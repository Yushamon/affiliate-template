const action = (id, label, templateId, contextKind, description) =>
  Object.freeze({ id, label, templateId, contextKind, description });

export const AI_ACTION_REGISTRY = Object.freeze({
  "hero-create": action("hero-create", "Hero erstellen", "media-hero", "media-hero", "Konkreten Hero-Prompt aus dem Finding erzeugen."),
  "thumbnail-create": action("thumbnail-create", "Thumbnail erstellen", "media-thumbnail", "media-thumbnail", "Kompakten Thumbnail-Prompt erzeugen."),
  "gallery-create": action("gallery-create", "Gallery erstellen", "media-gallery", "media-gallery", "Fehlende Galerierollen planen."),
  "faq-expand": action("faq-expand", "FAQ erweitern", "faq-expand", "faq", "Belegte FAQ-Lücke schließen."),
  "information-gain": action("information-gain", "Information Gain", "information-gain", "information-gain", "Neue Entscheidungshilfe ergänzen."),
  "expert-box": action("expert-box", "Expertenbox", "expert-box", "expert-box", "Quellenbasierte Einordnung erzeugen."),
  "decision-tree": action("decision-tree", "Entscheidungsbaum", "decision-tree", "decision-tree", "Kriterien in klare Entscheidungen überführen."),
  "journey-improve": action("journey-improve", "Journey verbessern", "decision-journey", "decision-journey", "Entscheidungsbruch schließen."),
  "internal-links": action("internal-links", "Interne Links", "internal-linking-improve", "internal-link", "Natürliche Journey-Links ergänzen."),
  "ux-analyze": action("ux-analyze", "UX analysieren", "ux-review", "ux", "Ablauf und Priorisierung prüfen."),
  "css-analyze": action("css-analyze", "CSS analysieren", "css-cleanup", "css", "Doppelungen und Überschreibungen konsolidieren."),
  "performance-analyze": action("performance-analyze", "Performance analysieren", "performance-review", "performance", "Belastbaren Engpass untersuchen."),
  "dark-mode-analyze": action("dark-mode-analyze", "Dark Mode", "dark-mode-review", "dark-mode", "Theme- und Kontrastprobleme prüfen."),
  "accessibility-analyze": action("accessibility-analyze", "Accessibility", "accessibility-review", "accessibility", "Semantik und Bedienbarkeit prüfen."),
  "comparison-improve": action("comparison-improve", "Vergleich verbessern", "comparison-improve", "comparison", "Finding im bestehenden Vergleichssystem beheben."),
  "codex-send": action("codex-send", "An Codex", "codex-remediation", "codex-remediation", "Vollständigen Remediation-Prompt erzeugen."),
});

const unique = (values) => [...new Set(values.filter(Boolean))];

export function resolveFindingAiActionIds(finding = {}) {
  const text = [
    finding.type,
    finding.category,
    finding.area,
    finding.component,
    finding.description,
    finding.recommendedSolution,
    finding.recommendedAction,
  ].join(" ").toLowerCase();

  const ids = [];
  if (/hero|image.?coverage|media|visual/.test(text)) ids.push("hero-create", "thumbnail-create", "gallery-create");
  if (/faq/.test(text)) ids.push("faq-expand");
  if (/information.?gain|thin.?content|content.?gap|content.?quality|missing.?content/.test(text)) {
    ids.push("information-gain", "expert-box");
  }
  if (/decision.?tree|entscheidung/.test(text)) ids.push("decision-tree");
  if (/journey|dead.?end|funnel|intent.?owner/.test(text)) ids.push("journey-improve");
  if (/internal.?link|anchor|broken.?link|self.?link|link.?target/.test(text)) ids.push("internal-links");
  if (/comparison|vergleich/.test(text)) ids.push("comparison-improve");
  if (/accessib|a11y|aria|contrast|focus/.test(text)) ids.push("accessibility-analyze", "ux-analyze");
  if (/dark.?mode|theme/.test(text)) ids.push("dark-mode-analyze");
  if (/css|style|spacing|padding|layout/.test(text)) ids.push("css-analyze", "ux-analyze");
  if (/performance|lcp|cls|javascript|build.?time|viewport/.test(text)) ids.push("performance-analyze");
  if (/ux|mobile|navigation|workflow|click/.test(text)) ids.push("ux-analyze");

  if (finding.codexSuitable !== false) ids.push("codex-send");
  return unique(ids).slice(0, 5);
}

export function getAiActionDefinition(id) {
  return AI_ACTION_REGISTRY[id] || null;
}

export function listAiActionDefinitions() {
  return Object.values(AI_ACTION_REGISTRY);
}

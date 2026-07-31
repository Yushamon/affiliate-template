import type { PromptContext } from "./types";

export type PromptTemplateId =
  | "product-health-fix-all"
  | "research-missing-product-data"
  | "update-product-data"
  | "validate-new-product"
  | "research-new-manufacturer"
  | "generate-product-draft"
  | "create-product-page"
  | "create-product-images"
  | "check-comparison-assignment"
  | "close-content-gap"
  | "discover-category-products"
  | "discover-category-manufacturers"
  | "validate-niche"
  | "plan-topic-cluster"
  | "add-internal-links"
  | "refresh-sources"
  | "check-successor"
  | "detect-discontinued-products"
  | "media-hero"
  | "media-thumbnail"
  | "media-gallery"
  | "comparison-improve"
  | "faq-expand"
  | "information-gain"
  | "expert-box"
  | "decision-tree"
  | "decision-journey"
  | "internal-linking-improve"
  | "ux-review"
  | "css-cleanup"
  | "performance-review"
  | "codex-remediation"
  | "dark-mode-review"
  | "accessibility-review";

export type PromptSurface = "product" | "content" | "media" | "journey" | "experience" | "system";

export interface PromptTemplate {
  id: PromptTemplateId;
  title: string;
  objective: string;
  surface: PromptSurface;
  contextKind: PromptContext["kind"];
  safeguards: string[];
  validationCommands: string[];
  acceptanceCriteria: string[];
}

const template = (
  id: PromptTemplateId,
  title: string,
  objective: string,
  surface: PromptSurface,
  contextKind: PromptContext["kind"],
  safeguards: string[],
  validationCommands: string[] = [],
  acceptanceCriteria: string[] = [],
): PromptTemplate => ({
  id,
  title,
  objective,
  surface,
  contextKind,
  safeguards,
  validationCommands,
  acceptanceCriteria,
});

export const PROMPT_REGISTRY: Readonly<Record<PromptTemplateId, PromptTemplate>> = Object.freeze({
  "product-health-fix-all": template(
    "product-health-fix-all",
    "Alle Product-Health-Probleme beheben",
    "Behebe ausschließlich die im Finding nachgewiesenen Product-Health-Lücken.",
    "product",
    "product-health",
    ["Bestehende Produktdatei und Schema zuerst lesen.", "Nur belegbare Daten ergänzen.", "Keine Slugs oder URLs ändern."],
    ["npm --workspace apps/pfotentechnik run audit:products:strict"],
  ),
  "research-missing-product-data": template(
    "research-missing-product-data",
    "Fehlende Produktdaten recherchieren",
    "Recherchiere die konkret fehlenden technischen und redaktionellen Produktdaten.",
    "product",
    "product-research",
    ["Primärquellen priorisieren.", "Händler- und Erfahrungsaussagen getrennt kennzeichnen.", "Unbekannte Werte offen lassen."],
  ),
  "update-product-data": template(
    "update-product-data",
    "Produktdaten aktualisieren",
    "Prüfe Modellstatus, technische Daten, App-Abhängigkeiten und Verfügbarkeit auf Aktualität.",
    "product",
    "product-research",
    ["Beobachtungsdatum nennen.", "Keine Preise dauerhaft hart codieren.", "Nachfolger und regionale Varianten prüfen."],
  ),
  "validate-new-product": template(
    "validate-new-product",
    "Neues Produkt validieren",
    "Validiere Produktidentität, Primärquellen, Deutschland-/EU-Verfügbarkeit und Repository-Abdeckung.",
    "product",
    "product-research",
    ["Mehrere Quellenklassen nutzen.", "Keine Produktanlage bei Score unter 60 empfehlen.", "Alias- und Variantenprüfung dokumentieren."],
  ),
  "research-new-manufacturer": template(
    "research-new-manufacturer",
    "Neuen Hersteller recherchieren",
    "Prüfe Markenidentität, offiziellen Unternehmensnamen, Website, Produktportfolio und belastbare Herstellerquellen.",
    "product",
    "manufacturer",
    ["Marke und Unternehmen unterscheiden.", "Sitz oder Land nur mit Quelle nennen.", "Aliasprüfung gegen vorhandene Hersteller durchführen."],
  ),
  "generate-product-draft": template(
    "generate-product-draft",
    "Produktentwurf erzeugen",
    "Erzeuge einen prüfbaren Entwurf außerhalb der Content Collection auf Basis validierter Daten.",
    "product",
    "product-creation",
    ["Kein Schreiben in src/content/products.", "Fehlende Daten sichtbar markieren.", "Vorgeschlagene Dateien und Quellen aufführen."],
  ),
  "create-product-page": template(
    "create-product-page",
    "Produktseite vollständig anlegen",
    "Überführe ausschließlich einen freigegebenen und preflight-validierten Entwurf in die vorhandene Produkt-Collection.",
    "product",
    "product-creation",
    ["Explizite Nutzerfreigabe erforderlich.", "Zieldatei niemals überschreiben.", "Build und Produkt-Audit ausführen."],
    ["npm --workspace apps/pfotentechnik run audit:products:strict", "npm run build:pfotentechnik"],
  ),
  "create-product-images": template(
    "create-product-images",
    "Produktbilder erzeugen",
    "Bereite das vorhandene Bildrollenpaket anhand bestätigter Produktmerkmale vor.",
    "media",
    "media-gallery",
    ["Keine Fantasieprodukte.", "Keine Logos oder kopierten Herstellerbilder.", "Bei unklarer Optik Bilderstellung blockieren."],
  ),
  "check-comparison-assignment": template(
    "check-comparison-assignment",
    "Vergleichszuordnung prüfen",
    "Prüfe die fachliche Eignung für vorhandene Vergleiche anhand strukturierter Produkteigenschaften.",
    "product",
    "comparison",
    ["Nicht nur Kategorie oder Keyword verwenden.", "Vergleichsvorschau vor Änderung liefern.", "Bestehende Kriterien und Terminologie übernehmen."],
    ["npm --workspace apps/pfotentechnik run comparison:audit:strict"],
  ),
  "close-content-gap": template(
    "close-content-gap",
    "Content Gap schließen",
    "Validiere Nutzerbedarf, bestehende Abdeckung und Information Gain, bevor Inhalt ergänzt wird.",
    "content",
    "content-gap",
    ["Kannibalisierung prüfen.", "Vorhandene Search-Daten nutzen.", "Keinen Inhalt ohne belegbare Lücke anlegen."],
    ["npm --workspace apps/pfotentechnik run audit:content-quality:strict"],
  ),
  "discover-category-products": template(
    "discover-category-products",
    "Neue Produkte einer Kategorie finden",
    "Finde relevante Produkte auch außerhalb vorhandener Herstellerlisten und liefere mehrstufige Quellenbelege.",
    "product",
    "product-discovery",
    ["Repository vor Webrecherche prüfen.", "Keine Einzelquelle als ausreichende Validierung.", "Marktsignale nicht als Verkaufszahlen bezeichnen."],
  ),
  "discover-category-manufacturers": template(
    "discover-category-manufacturers",
    "Neue Hersteller einer Kategorie finden",
    "Finde bislang nicht geführte Hersteller mit passenden realen Produkten und offizieller Webpräsenz.",
    "product",
    "manufacturer",
    ["Keine automatisch erzeugten Shops als Primärbeleg.", "Deutschland-/EU-Verfügbarkeit trennen.", "Hersteller nicht automatisch anlegen."],
  ),
  "validate-niche": template(
    "validate-niche",
    "Nischenchance validieren",
    "Bewerte strategische Nähe, Suchpotenzial, Produktlandschaft, interne Verlinkbarkeit und redaktionelle Risiken.",
    "content",
    "niche-opportunity",
    ["Mindestscore respektieren.", "Medizinische Risiken explizit abgrenzen.", "Keine Marktbehauptung ohne Quelle."],
  ),
  "plan-topic-cluster": template(
    "plan-topic-cluster",
    "Neues Themencluster planen",
    "Plane Cornerstone, Vergleiche und Guides nur für eine validierte strategische Nische.",
    "content",
    "content-gap",
    ["Bestehende Cluster auf Kannibalisierung prüfen.", "Hub-zu-Guide-zu-Vergleich-Funnel planen.", "Keine Slugs vor Freigabe festschreiben."],
  ),
  "add-internal-links": template(
    "add-internal-links",
    "Interne Verlinkung ergänzen",
    "Ergänze kontextuelle Links aus vorhandenen Hub-, Guide-, Vergleichs-, Produkt- und Herstellerbeziehungen.",
    "journey",
    "internal-link",
    ["Semantisch gleichwertige Links vorher prüfen.", "Nur vorhandene URLs verwenden.", "Natürlichen Satzkontext liefern."],
    ["npm --workspace apps/pfotentechnik run audit:internal-links:strict"],
  ),
  "refresh-sources": template(
    "refresh-sources",
    "Quellen aktualisieren",
    "Prüfe Quellen auf Aktualität, Primärquellenqualität und konkrete Aussagenabdeckung.",
    "content",
    "content-health",
    ["Quelle, Datum und unterstützte Aussage dokumentieren.", "Tote oder regionale Produktlinks kennzeichnen.", "Keine unbelegten Details übernehmen."],
  ),
  "check-successor": template(
    "check-successor",
    "Produktnachfolger prüfen",
    "Prüfe, ob ein neues Modell Nachfolger, Variante, Alias oder separates Produkt ist.",
    "product",
    "product-research",
    ["Modellnummern und regionale Namen vergleichen.", "Bestehende URL nicht automatisch umwidmen.", "Unsicherheit ausweisen."],
  ),
  "detect-discontinued-products": template(
    "detect-discontinued-products",
    "Eingestellte Produkte erkennen",
    "Prüfe offiziellen Produktstatus, Supportseiten, Nachfolger und aktuelle regionale Verfügbarkeit.",
    "product",
    "product-research",
    ["Fehlender Shop-Link allein beweist keine Einstellung.", "Beobachtungsdatum dokumentieren.", "Statusänderung nur nach manueller Prüfung empfehlen."],
  ),
  "media-hero": template(
    "media-hero",
    "Hero erstellen",
    "Erzeuge einen konkreten, markenkonformen Hero-Prompt für die betroffene Seite und vorhandene Bildrolle.",
    "media",
    "media-hero",
    ["Produktidentität und Proportionen erhalten.", "Keine Logos, Texte oder erfundenen Funktionen.", "Vorhandene Referenzen und Zieldatei zuerst prüfen."],
    ["npm --workspace apps/pfotentechnik run media:audit"],
    ["Hero-Rolle, Seitenkontext, Mobilzuschnitt und Zieldatei sind eindeutig."],
  ),
  "media-thumbnail": template(
    "media-thumbnail",
    "Thumbnail erstellen",
    "Erzeuge einen kompakten Thumbnail-Prompt mit klarer Erkennbarkeit im kleinen Format.",
    "media",
    "media-thumbnail",
    ["Silhouette und Kernmerkmale priorisieren.", "Keine Werbebanner oder Beschriftungen.", "Bestehende Bildsprache übernehmen."],
    ["npm --workspace apps/pfotentechnik run media:audit"],
  ),
  "media-gallery": template(
    "media-gallery",
    "Gallery erstellen",
    "Plane fehlende Galerierollen ohne inhaltliche oder visuelle Doppelungen.",
    "media",
    "media-gallery",
    ["Jede Rolle braucht einen eigenen Informationszweck.", "Keine identischen Perspektiven.", "Nur belegte Produktmerkmale zeigen."],
    ["npm --workspace apps/pfotentechnik run media:audit"],
  ),
  "comparison-improve": template(
    "comparison-improve",
    "Vergleich verbessern",
    "Behebe das Finding im bestehenden Vergleichssystem ohne parallele Darstellung oder neue Sonderlogik.",
    "content",
    "comparison",
    ["Bestehende Comparison-Komponenten wiederverwenden.", "Preis und redaktionellen Score getrennt halten.", "Mobile und Dark Mode prüfen."],
    ["npm --workspace apps/pfotentechnik run comparison:audit:strict"],
  ),
  "faq-expand": template(
    "faq-expand",
    "FAQ gezielt erweitern",
    "Ergänze nur Fragen, die eine belegte Nutzerlücke schließen und nicht bereits im Fließtext beantwortet werden.",
    "content",
    "faq",
    ["Keine Suchwortlisten als FAQ.", "Antworten knapp und belastbar halten.", "FAQ-Schema nur für sichtbare Inhalte verwenden."],
    ["npm --workspace apps/pfotentechnik run audit:content-quality:strict"],
  ),
  "information-gain": template(
    "information-gain",
    "Information Gain erhöhen",
    "Ergänze belastbare Entscheidungshilfe, die auf der Seite und in nahen Konkurrenzformaten noch fehlt.",
    "content",
    "information-gain",
    ["Keine Fülltexte.", "Bestehende Aussagen nicht umformulieren und erneut ausgeben.", "Konkrete Entscheidungssituation benennen."],
    ["npm --workspace apps/pfotentechnik run audit:content-quality:strict"],
  ),
  "expert-box": template(
    "expert-box",
    "Expertenbox erzeugen",
    "Erzeuge eine kompakte, quellenbasierte Experteneinordnung mit klarer praktischer Konsequenz.",
    "content",
    "expert-box",
    ["Keine erfundene Person oder Expertise.", "Quelle und Grenze der Aussage nennen.", "Nicht als Ersatz für medizinische Beratung darstellen."],
  ),
  "decision-tree": template(
    "decision-tree",
    "Entscheidungsbaum erzeugen",
    "Baue aus vorhandenen Kriterien einen kurzen Entscheidungsbaum mit eindeutigen nächsten Schritten.",
    "journey",
    "decision-tree",
    ["Nur bestehende Ziele und belegte Kriterien verwenden.", "Kein Kreis und kein Selbstlink.", "Mobile Scanbarkeit priorisieren."],
    ["npm --workspace apps/pfotentechnik run audit:decision-journeys:strict"],
  ),
  "decision-journey": template(
    "decision-journey",
    "Journey verbessern",
    "Schließe den konkreten Entscheidungsbruch zwischen Ratgeber, Vergleich, Produkt und Hersteller.",
    "journey",
    "decision-journey",
    ["Nutzerfrage und Funnel-Stufe zuerst bestimmen.", "Keine keywordbasierte Linkwolke.", "Rückwege und nächste Entscheidung berücksichtigen."],
    ["npm --workspace apps/pfotentechnik run audit:decision-journeys:strict"],
  ),
  "internal-linking-improve": template(
    "internal-linking-improve",
    "Interne Links verbessern",
    "Ergänze oder korrigiere natürliche Links entlang der tatsächlichen Nutzerentscheidung.",
    "journey",
    "internal-link",
    ["Keine Selbstlinks.", "Keine überoptimierten Anker.", "Nur kanonische vorhandene Ziele."],
    ["npm --workspace apps/pfotentechnik run audit:internal-links:strict"],
  ),
  "ux-review": template(
    "ux-review",
    "UX analysieren",
    "Prüfe den betroffenen Ablauf auf unnötige Schritte, unklare Priorisierung und mobile Reibung.",
    "experience",
    "ux",
    ["Bestehende Komponenten bevorzugen.", "Keine neue Parallelansicht.", "Konkrete Interaktion statt Geschmack bewerten."],
    ["npm --workspace apps/pfotentechnik run design-system:check"],
  ),
  "css-cleanup": template(
    "css-cleanup",
    "CSS analysieren und konsolidieren",
    "Entferne lokale Doppelungen und überschreibende Regeln zugunsten vorhandener Tokens und gemeinsamer Komponenten.",
    "experience",
    "css",
    ["Keine Fix-über-Fix-Regeln.", "Kein neues !important.", "Visuelle Regressionen in Light und Dark Mode prüfen."],
    ["npm --workspace apps/pfotentechnik run design-system:check"],
  ),
  "performance-review": template(
    "performance-review",
    "Performance analysieren",
    "Finde die konkrete Build- oder Laufzeitursache und optimiere nur den belastbaren Engpass.",
    "experience",
    "performance",
    ["Vorher-Nachher-Messung verlangen.", "Keine pauschale Cache-Schicht.", "Build und Browserkosten getrennt betrachten."],
    ["npm --workspace apps/pfotentechnik run audit:performance:strict"],
  ),
  "codex-remediation": template(
    "codex-remediation",
    "Finding an Codex übergeben",
    "Behebe das konkrete Finding im aktuellen Repository-Stand und validiere die Änderung vollständig.",
    "system",
    "codex-remediation",
    ["Scope auf betroffene Dateien begrenzen.", "Vorhandene Architektur erweitern statt parallel neu bauen.", "Eigene Regressionen vollständig beheben."],
  ),
  "dark-mode-review": template(
    "dark-mode-review",
    "Dark Mode analysieren",
    "Prüfe Kontrast, Oberflächenhierarchie, Fokuszustände und Lesbarkeit im vorhandenen Theme-System.",
    "experience",
    "dark-mode",
    ["Keine separaten Komponenten nur für Dark Mode.", "Tokens statt Einzelwerte verwenden.", "Systempräferenz und manuelle Auswahl respektieren."],
    ["npm --workspace apps/pfotentechnik run design-system:visual-qa:strict"],
  ),
  "accessibility-review": template(
    "accessibility-review",
    "Accessibility analysieren",
    "Behebe konkrete Tastatur-, Semantik-, Fokus-, Kontrast- oder Beschriftungsprobleme.",
    "experience",
    "accessibility",
    ["Native Elemente bevorzugen.", "Keine ARIA-Rollen als Ersatz für Semantik.", "Mobile und Tastaturbedienung prüfen."],
    ["npm --workspace apps/pfotentechnik run design-system:visual-qa:strict"],
  ),
});

export const PROMPT_LIBRARY = PROMPT_REGISTRY;

export const getPromptTemplate = (id: PromptTemplateId): PromptTemplate => PROMPT_REGISTRY[id];

export const listPromptTemplates = (): PromptTemplate[] =>
  Object.values(PROMPT_REGISTRY).sort((left, right) =>
    left.surface.localeCompare(right.surface, "de") || left.title.localeCompare(right.title, "de")
  );

export const templateForContext = (context: PromptContext): PromptTemplateId => {
  const direct = Object.values(PROMPT_REGISTRY).find((item) => item.contextKind === context.kind);
  if (direct) return direct.id;
  if (context.kind === "product-health") return "product-health-fix-all";
  if (context.kind === "content-gap") return "close-content-gap";
  if (context.kind === "product-discovery") return "discover-category-products";
  if (context.kind === "niche-opportunity") return "validate-niche";
  if (context.kind === "manufacturer") return "research-new-manufacturer";
  if (context.kind === "comparison") return "check-comparison-assignment";
  if (context.kind === "internal-link") return "add-internal-links";
  if (context.kind === "product-creation") return "create-product-page";
  return "research-missing-product-data";
};

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
  | "detect-discontinued-products";

export interface PromptTemplate {
  id: PromptTemplateId;
  title: string;
  objective: string;
  safeguards: string[];
}

export const PROMPT_LIBRARY: Readonly<Record<PromptTemplateId, PromptTemplate>> = Object.freeze({
  "product-health-fix-all": {
    id: "product-health-fix-all",
    title: "Alle Product-Health-Probleme beheben",
    objective: "Behebe ausschließlich die im Kontext nachgewiesenen Product-Health-Lücken.",
    safeguards: ["Bestehende Produktdatei und Schema zuerst lesen.", "Nur belegbare Daten ergänzen.", "Keine Slugs oder URLs ändern."],
  },
  "research-missing-product-data": {
    id: "research-missing-product-data",
    title: "Fehlende Produktdaten recherchieren",
    objective: "Recherchiere die konkret fehlenden technischen und redaktionellen Produktdaten.",
    safeguards: ["Primärquellen priorisieren.", "Händler- und Erfahrungsaussagen getrennt kennzeichnen.", "Unbekannte Werte offen lassen."],
  },
  "update-product-data": {
    id: "update-product-data",
    title: "Produktdaten aktualisieren",
    objective: "Prüfe Modellstatus, technische Daten, App-Abhängigkeiten und Verfügbarkeit auf Aktualität.",
    safeguards: ["Beobachtungsdatum nennen.", "Keine Preise dauerhaft hart codieren.", "Nachfolger und regionale Varianten prüfen."],
  },
  "validate-new-product": {
    id: "validate-new-product",
    title: "Neues Produkt validieren",
    objective: "Validiere Produktidentität, Primärquellen, Deutschland-/EU-Verfügbarkeit und Repository-Abdeckung.",
    safeguards: ["Mehrere Quellenklassen nutzen.", "Keine Produktanlage bei Score unter 60 empfehlen.", "Alias- und Variantenprüfung dokumentieren."],
  },
  "research-new-manufacturer": {
    id: "research-new-manufacturer",
    title: "Neuen Hersteller recherchieren",
    objective: "Prüfe Markenidentität, offiziellen Unternehmensnamen, Website, Produktportfolio und belastbare Herstellerquellen.",
    safeguards: ["Marke und Unternehmen unterscheiden.", "Sitz oder Land nur mit Quelle nennen.", "Aliasprüfung gegen vorhandene Hersteller durchführen."],
  },
  "generate-product-draft": {
    id: "generate-product-draft",
    title: "Produktentwurf erzeugen",
    objective: "Erzeuge einen prüfbaren Entwurf außerhalb der Content Collection auf Basis der validierten Daten.",
    safeguards: ["Kein Schreiben in src/content/products.", "Fehlende Daten sichtbar markieren.", "Vorgeschlagene Dateien und Quellen aufführen."],
  },
  "create-product-page": {
    id: "create-product-page",
    title: "Produktseite vollständig anlegen",
    objective: "Überführe ausschließlich einen freigegebenen und preflight-validierten Entwurf in die vorhandene Produkt-Collection.",
    safeguards: ["Explizite Nutzerfreigabe erforderlich.", "Zieldatei niemals überschreiben.", "Build und Produkt-Audit ausführen."],
  },
  "create-product-images": {
    id: "create-product-images",
    title: "Produktbilder erzeugen",
    objective: "Bereite das vorhandene Bildrollenpaket anhand bestätigter Produktmerkmale vor.",
    safeguards: ["Keine Fantasieprodukte.", "Keine Logos oder kopierten Herstellerbilder.", "Bei unklarer Optik Bilderstellung blockieren."],
  },
  "check-comparison-assignment": {
    id: "check-comparison-assignment",
    title: "Vergleichszuordnung prüfen",
    objective: "Prüfe die fachliche Eignung für vorhandene Vergleiche anhand strukturierter Produkteigenschaften.",
    safeguards: ["Nicht nur Kategorie oder Keyword verwenden.", "Vergleichsvorschau vor Änderung liefern.", "Bestehende Kriterien und Terminologie übernehmen."],
  },
  "close-content-gap": {
    id: "close-content-gap",
    title: "Content Gap schließen",
    objective: "Validiere Nutzerbedarf, bestehende Abdeckung und Information Gain, bevor ein neuer Inhalt vorgeschlagen wird.",
    safeguards: ["Kannibalisierung prüfen.", "Vorhandene Search-Daten nutzen.", "Keinen Inhalt ohne belegbare Lücke anlegen."],
  },
  "discover-category-products": {
    id: "discover-category-products",
    title: "Neue Produkte einer Kategorie finden",
    objective: "Finde relevante Produkte auch außerhalb der vorhandenen Herstellerlisten und liefere mehrstufige Quellenbelege.",
    safeguards: ["Repository vor Webrecherche prüfen.", "Keine Einzelquelle als ausreichende Validierung.", "Marktsignale nicht als Verkaufszahlen bezeichnen."],
  },
  "discover-category-manufacturers": {
    id: "discover-category-manufacturers",
    title: "Neue Hersteller einer Kategorie finden",
    objective: "Finde bislang nicht geführte Hersteller mit passenden realen Produkten und offizieller Webpräsenz.",
    safeguards: ["Keine automatisch erzeugten Shops als Primärbeleg.", "Deutschland-/EU-Verfügbarkeit trennen.", "Hersteller nicht automatisch anlegen."],
  },
  "validate-niche": {
    id: "validate-niche",
    title: "Nischenchance validieren",
    objective: "Bewerte strategische Nähe, Suchpotenzial, Produktlandschaft, interne Verlinkbarkeit und redaktionelle Risiken.",
    safeguards: ["Mindestscore respektieren.", "Medizinische Risiken explizit abgrenzen.", "Keine Marktbehauptung ohne Quelle."],
  },
  "plan-topic-cluster": {
    id: "plan-topic-cluster",
    title: "Neues Themencluster planen",
    objective: "Plane Cornerstone, Vergleiche und Guides nur für eine validierte strategische Nische.",
    safeguards: ["Bestehende Cluster auf Kannibalisierung prüfen.", "Hub-zu-Guide-zu-Vergleich-Funnel planen.", "Keine Slugs vor Freigabe festschreiben."],
  },
  "add-internal-links": {
    id: "add-internal-links",
    title: "Interne Verlinkung ergänzen",
    objective: "Ergänze kontextuelle Links aus vorhandenen Hub-, Guide-, Vergleichs-, Produkt- und Herstellerbeziehungen.",
    safeguards: ["Semantisch gleichwertige Links vorher prüfen.", "Nur vorhandene URLs verwenden.", "Natürlichen Satzkontext liefern."],
  },
  "refresh-sources": {
    id: "refresh-sources",
    title: "Quellen aktualisieren",
    objective: "Prüfe Quellen auf Aktualität, Primärquellenqualität und konkrete Aussagenabdeckung.",
    safeguards: ["Quelle, Datum und unterstützte Aussage dokumentieren.", "Tote oder regionale Produktlinks kennzeichnen.", "Keine unbelegten Details übernehmen."],
  },
  "check-successor": {
    id: "check-successor",
    title: "Produktnachfolger prüfen",
    objective: "Prüfe, ob ein neues Modell Nachfolger, Variante, Alias oder separates Produkt ist.",
    safeguards: ["Modellnummern und regionale Namen vergleichen.", "Bestehende URL nicht automatisch umwidmen.", "Unsicherheit als solche ausweisen."],
  },
  "detect-discontinued-products": {
    id: "detect-discontinued-products",
    title: "Eingestellte Produkte erkennen",
    objective: "Prüfe offiziellen Produktstatus, Supportseiten, Nachfolger und aktuelle regionale Verfügbarkeit.",
    safeguards: ["Fehlender Shop-Link allein beweist keine Einstellung.", "Beobachtungsdatum dokumentieren.", "Statusänderung nur nach manueller Prüfung empfehlen."],
  },
});

export const templateForContext = (context: PromptContext): PromptTemplateId => {
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

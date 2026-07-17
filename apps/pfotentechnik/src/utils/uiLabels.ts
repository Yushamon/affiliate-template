const exactLabels: Record<string, string> = {
  "große hunde": "Große Hunde",
  "grosse hunde": "Große Hunde",
  "kleine hunde": "Kleine Hunde",
  "mittelgroße hunde": "Mittelgroße Hunde",
  "mittelgrosse hunde": "Mittelgroße Hunde",
  "größere hunde": "Größere Hunde",
  "groessere hunde": "Größere Hunde",
  "große katzen": "Große Katzen",
  "grosse katzen": "Große Katzen",
  "kleine katzen": "Kleine Katzen",
  "mehrhundehaushalte": "Mehrhundehaushalte",
  "mehrkatzenhaushalte": "Mehrkatzenhaushalte",
  "mehrtierhaushalte": "Mehrtierhaushalte",
  "hoher wasserbedarf": "Hoher Wasserbedarf",
  "niedriger wasserbedarf": "Niedriger Wasserbedarf",
  "mit kamera": "Mit Kamera",
  "ohne kamera": "Ohne Kamera",
  "mit app": "Mit App",
  "ohne app": "Ohne App",
  "mit akku": "Mit Akku",
  "ohne akku": "Ohne Akku",
  "nassfutter": "Nassfutter",
  "trockenfutter": "Trockenfutter",
  "mischfütterung": "Mischfütterung",
  "edelstahl": "Edelstahl",
  "kunststoff": "Kunststoff",
  "keramik": "Keramik",
  "akkubetrieb": "Akkubetrieb",
  "netzbetrieb": "Netzbetrieb",
  "sensorbetrieb": "Sensorbetrieb",
  "dauerbetrieb": "Dauerbetrieb",
  "preis-leistung": "Preis-Leistung",
  "preis-leistungs-tipp": "Preis-Leistungs-Tipp",
  "besonders leise": "Besonders leise"
};

const normalizeKey = (value: string) =>
  value.trim().replace(/\s+/g, " ").toLocaleLowerCase("de-DE");

export const formatUiLabel = (value: string): string => {
  const trimmed = value.trim();
  if (!trimmed) return trimmed;
  return exactLabels[normalizeKey(trimmed)]
    ?? trimmed.charAt(0).toLocaleUpperCase("de-DE") + trimmed.slice(1);
};

export const formatRecommendationEyebrow = (value: string): string => {
  const label = formatUiLabel(value);
  const exact: Record<string, string> = {
    "große hunde": "Für große Hunde",
    "größere hunde": "Für größere Hunde",
    "kleine hunde": "Für kleine Hunde",
    "mittelgroße hunde": "Für mittelgroße Hunde",
    "große katzen": "Für große Katzen",
    "kleine katzen": "Für kleine Katzen",
    "katzen": "Für Katzen",
    "hunde": "Für Hunde",
    "mehrhundehaushalte": "Für Mehrhundehaushalte",
    "mehrkatzenhaushalte": "Für Mehrkatzenhaushalte",
    "mehrtierhaushalte": "Für Mehrtierhaushalte",
    "hoher wasserbedarf": "Bei hohem Wasserbedarf",
    "niedriger wasserbedarf": "Bei niedrigem Wasserbedarf",
    "nassfutter": "Für Nassfutter",
    "trockenfutter": "Für Trockenfutter",
    "mit kamera": "Mit Kamera",
    "ohne kamera": "Ohne Kamera",
    "mit app": "Mit App",
    "ohne app": "Ohne App",
    "mit akku": "Mit Akku",
    "ohne akku": "Ohne Akku",
    "preis-leistung": "Preis-Leistungs-Tipp",
    "besonders leise": "Besonders leise"
  };
  return exact[normalizeKey(label)] ?? `Für ${label}`;
};

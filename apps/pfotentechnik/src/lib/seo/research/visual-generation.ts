export type VisualPageType = "product" | "comparison" | "guide" | "manufacturer" | "category" | "homepage" | "landingpage";

export type VisualAsset = {
  id: string;
  purpose: string;
  filename: string;
  alt: string;
  prompt: string;
  required: boolean;
};

export type VisualGenerationPlan = {
  pageType: VisualPageType;
  subject: string;
  target?: string;
  assets: VisualAsset[];
  masterPrompt: string;
  fallbackPrompts: string[];
};

const list = <T>(value: T[] | undefined | null): T[] => Array.isArray(value) ? value : [];
const text = (value: unknown, fallback = ""): string => typeof value === "string" && value.trim() ? value.trim() : fallback;
const normalize = (value: unknown): string => text(value).toLocaleLowerCase("de-DE").replaceAll("ä", "ae").replaceAll("ö", "oe").replaceAll("ü", "ue").replaceAll("ß", "ss").replace(/[^a-z0-9]+/g, " ").trim();
const slugify = (value: string): string => normalize(value).replaceAll(" ", "-") || "visual";

const collectText = (item: any): string => normalize([
  item?.title, item?.type, item?.slug, item?.category, item?.intent, item?.reason,
  item?.repositoryMatch?.route, item?.refreshPlan?.targetRoute,
  ...list<string>(item?.serpGap?.missingVisuals), ...list<string>(item?.refreshPlan?.visuals),
  ...list<any>(item?.actions).flatMap((entry) => [entry?.type, entry?.target, entry?.reason])
].filter(Boolean).join(" "));

export const inferVisualPageType = (item: any): VisualPageType => {
  const route = text(item?.refreshPlan?.targetRoute, text(item?.repositoryMatch?.route));
  const source = collectText(item);
  if (route === "/" || /\b(homepage|startseite)\b/.test(source)) return "homepage";
  if (route.startsWith("/produkt/") || item?.type === "product" || /\bproduktseite\b/.test(source)) return "product";
  if (route.startsWith("/vergleiche/") || /\bvergleich(?:sseite)?\b/.test(source)) return "comparison";
  if (route.startsWith("/hersteller/") || item?.type === "manufacturer") return "manufacturer";
  if (/\b(kategorie|category|cluster hub|themenhub)\b/.test(source)) return "category";
  if (/\b(landingpage|landing page)\b/.test(source)) return "landingpage";
  return "guide";
};

const baseMotifs: Record<VisualPageType, Array<{ id: string; purpose: string; scene: string }>> = {
  product: [
    { id: "hero", purpose: "Hero", scene: "realistische Premium-Studioaufnahme in klarer Dreiviertelansicht" },
    { id: "thumbnail", purpose: "Thumbnail", scene: "kompakte freigestellte Produktansicht mit sofort erkennbarer Silhouette" },
    { id: "front", purpose: "Galerie Front", scene: "realistische frontale Produktansicht" },
    { id: "angle", purpose: "Galerie Perspektive", scene: "realistische 45-Grad-Ansicht mit sichtbarer Tiefe und Materialität" },
    { id: "detail", purpose: "Funktionsdetail", scene: "nahes Detail der wichtigsten kaufentscheidenden Funktion" },
    { id: "usage", purpose: "Nutzung", scene: "realistische Nutzungssituation mit passendem Haustier, ohne das Produkt zu verdecken" }
  ],
  comparison: [
    { id: "hero", purpose: "Hero", scene: "redaktionelles Vergleichshero mit klarer Produkttyp-Silhouette und ruhiger Fläche" },
    { id: "overview", purpose: "Vergleichsübersicht", scene: "mobile-first Übersicht der wichtigsten Vergleichsdimensionen ohne kleine Texte" },
    { id: "decision-tree", purpose: "Entscheidungsbaum", scene: "visueller Entscheidungsbaum mit wenigen klaren Wegen und großen Symbolen" },
    { id: "use-cases", purpose: "Einsatzfälle", scene: "realistische Gegenüberstellung typischer Nutzungssituationen" },
    { id: "tradeoffs", purpose: "Zielkonflikte", scene: "verständliche Visualisierung der wichtigsten Zielkonflikte und Grenzen" }
  ],
  guide: [
    { id: "hero", purpose: "Hero", scene: "realistisches redaktionelles Hero passend zur konkreten Nutzerfrage" },
    { id: "overview", purpose: "Übersicht", scene: "mobile-first Ursachen-, Schritte- oder Kriterienübersicht mit großen Symbolen" },
    { id: "decision-tree", purpose: "Entscheidungshilfe", scene: "klarer Entscheidungsbaum mit wenigen belastbaren nächsten Schritten" },
    { id: "checklist", purpose: "Checkliste", scene: "visuelle Checkliste mit gut unterscheidbaren Situationen statt Textwand" },
    { id: "warning-signs", purpose: "Warnzeichen oder Grenzen", scene: "ruhige sachliche Darstellung wichtiger Warnzeichen, Grenzen oder Ausschlusskriterien" }
  ],
  manufacturer: [
    { id: "hero", purpose: "Markenhero", scene: "ruhiges redaktionelles Markenhero ohne nachgebautes Markenlogo" },
    { id: "portfolio", purpose: "Produktfamilien", scene: "Übersicht der belegten Produktfamilien und ihrer Einsatzzwecke" },
    { id: "ecosystem", purpose: "Ökosystem", scene: "verständliche Darstellung von App, Hub, Zubehör und kompatiblen Produktlinien" },
    { id: "positioning", purpose: "Einordnung", scene: "redaktionelle Einordnung von Stärken, Grenzen und Zielgruppen" }
  ],
  category: [
    { id: "hero", purpose: "Kategoriehero", scene: "realistisches Hero der Produktkategorie mit klaren Nutzungssituationen" },
    { id: "types", purpose: "Produkttypen", scene: "visuelle Übersicht der wichtigsten Bauarten oder Untertypen" },
    { id: "decision-tree", purpose: "Kaufentscheidung", scene: "mobile-first Entscheidungsbaum nach Bedarf und Einsatzfall" },
    { id: "criteria", purpose: "Kaufkriterien", scene: "visuelle Gegenüberstellung der wichtigsten Kaufkriterien" },
    { id: "mistakes", purpose: "Fehlkäufe", scene: "verständliche Darstellung typischer Fehlkäufe und ihrer Folgen" }
  ],
  homepage: [
    { id: "hero", purpose: "Homepage Hero", scene: "hochwertiges redaktionelles Hero für smarte Haustiertechnik mit klarer Orientierung" },
    { id: "categories", purpose: "Kategorien", scene: "visuelle Übersicht der zentralen Produktkategorien" },
    { id: "method", purpose: "Arbeitsweise", scene: "ruhige Infografik zur unabhängigen redaktionellen Einordnung" }
  ],
  landingpage: [
    { id: "hero", purpose: "Landingpage Hero", scene: "realistisches Hero exakt zur Suchintention und Nutzeraufgabe" },
    { id: "benefits", purpose: "Nutzenübersicht", scene: "mobile-first Darstellung der wichtigsten konkreten Vorteile" },
    { id: "decision", purpose: "Entscheidungshilfe", scene: "visuelle Auswahlhilfe mit wenigen klaren Optionen" },
    { id: "proof", purpose: "Beleg und Grenzen", scene: "sachliche Visualisierung belegter Fakten und wichtiger Grenzen" }
  ]
};

const featureMotifs = (item: any): Array<{ id: string; purpose: string; scene: string }> => {
  const source = collectText(item);
  const additions: Array<{ id: string; purpose: string; scene: string }> = [];

  const add = (
    condition: boolean,
    id: string,
    purpose: string,
    scene: string
  ) => {
    if (condition) additions.push({ id, purpose, scene });
  };

  add(
    /\b(hub|gateway|bridge)\b/.test(source),
    "hub-system",
    "Hub und System",
    "realistische Systemansicht aus Hauptgerät, Hub und Smartphone, ohne erfundene App-Oberfläche"
  );

  add(
    /\b(app|smartphone|wlan|wifi)\b/.test(source),
    "app",
    "App-Funktion",
    "realistische Nutzung mit Smartphone; App-Inhalte nur abstrakt und ohne erfundene Messwerte"
  );

  add(
    /\b(kamera|camera|video)\b/.test(source),
    "camera-detail",
    "Kameradetail",
    "nahes realistisches Detail der belegten Kamera- oder Sensorposition"
  );

  add(
    /\b(batterie|akku|battery)\b/.test(source),
    "power",
    "Stromversorgung",
    "realistische Detailansicht der belegten Stromversorgung oder des Batteriefachs"
  );

  const installationTokens = source.split(/\s+/).filter(Boolean);
  const hasInstallationContext = installationTokens.some((token) => {
    const mountingWord =
      /^(?:einbau|montage|installation|montieren|einbauen)$/.test(token);

    const surfaceCompound =
      /^(?:wand|wall|glas|glass|tuer|door)(?:einbau|montage|installation|durchbruch|ausschnitt|adapter|tunnel)$/.test(token);

    return mountingWord || surfaceCompound;
  });

  add(
    hasInstallationContext,
    "installation",
    "Einbau",
    "realistische Einbausituation passend zu den belegten Montagearten"
  );

  add(
    /\b(filter|reinigung|cleaning)\b/.test(source),
    "cleaning",
    "Reinigung",
    "realistische zerlegte oder geöffnete Ansicht der tatsächlich entnehmbaren Reinigungsteile"
  );

  add(
    /\b(mehrtier|mehrere tiere|multi pet|dual scan|mikrochip|rfid)\b/.test(source),
    "multi-pet",
    "Mehrtier-Nutzung",
    "realistische Mehrtier-Situation, die Zugang, Trennung oder individuelle Nutzung verständlich zeigt"
  );

  add(
    /\b(nassfutter|wet food|trockenfutter|dry food|portion)\b/.test(source),
    "food-detail",
    "Futter und Portion",
    "realistische Detailansicht der belegten Futterart, Schale oder Portionierung"
  );

  return additions;
};

const explicitMotifs = (item: any) => [
  ...list<string>(item?.serpGap?.missingVisuals),
  ...list<string>(item?.refreshPlan?.visuals)
].map((entry) => text(entry)).filter(Boolean).map((entry, index) => ({
  id: `research-${index + 1}-${slugify(entry).slice(0, 40)}`,
  purpose: "Research-Visual",
  scene: entry
}));

const dedupe = (motifs: Array<{ id: string; purpose: string; scene: string }>) => {
  const seen = new Set<string>();
  return motifs.filter((motif) => {
    const key = normalize(`${motif.purpose} ${motif.scene}`);
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};

const assetPrompt = (subject: string, pageType: VisualPageType, motif: { purpose: string; scene: string }, sources: string[]) => [
  `Create one image for the PfotenTechnik ${pageType} page about "${subject}".`,
  `Image purpose: ${motif.purpose}.`,
  `Scene: ${motif.scene}.`,
  "Use a highly realistic, premium editorial or commercial photography style unless the motif explicitly requires an infographic.",
  "Design mobile first: the main subject and meaning must remain clear at 375 px width.",
  "Keep visual identity consistent with every other image in this set.",
  "Do not invent product controls, accessories, measurements, app screens, medical claims, labels or functions.",
  "No promotional banners, watermarks, decorative text, fake ratings or unrelated logos.",
  sources.length ? `Before generating, inspect these cited references for factual and visual identity where accessible: ${sources.join(", ")}.` : "Use only the facts contained in this conversation. For an exact branded product without visual references, do not guess hidden details."
].join("\n");

export const buildVisualGenerationPlan = (item: any): VisualGenerationPlan => {
  const pageType = inferVisualPageType(item);
  const subject = text(item?.title, text(item?.slug, "PfotenTechnik-Inhalt"));
  const target = text(item?.refreshPlan?.targetRoute, text(item?.repositoryMatch?.route)) || undefined;
  const sources = list<any>(item?.evidence).map((entry) => text(entry?.url)).filter(Boolean).slice(0, 6);
  const motifs = dedupe([...baseMotifs[pageType], ...featureMotifs(item), ...explicitMotifs(item)]).slice(0, 12);
  const baseName = slugify(text(item?.slug) || target?.split("/").filter(Boolean).at(-1) || subject);
  const assets = motifs.map((motif, index): VisualAsset => ({
    id: motif.id,
    purpose: motif.purpose,
    filename: `${baseName}-${String(index + 1).padStart(2, "0")}-${slugify(motif.id)}.webp`,
    alt: `${motif.purpose} zu ${subject}`,
    prompt: assetPrompt(subject, pageType, motif, sources),
    required: index < Math.min(4, motifs.length)
  }));
  const manifest = assets.map((asset, index) => `${index + 1}. ${asset.purpose}\n   Datei: ${asset.filename}\n   Alt: ${asset.alt}\n   Auftrag: ${asset.prompt.replaceAll("\n", " ")}`).join("\n\n");
  const masterPrompt = [
    "Du erstellst in ChatGPT den vollständigen Bildsatz für PfotenTechnik.", "",
    `SEITE: ${subject}`, `SEITENTYP: ${pageType}`, target ? `ZIELROUTE: ${target}` : "", "",
    "ARBEITSMODUS FÜR CHATGPT",
    "- Erzeuge alle unten aufgeführten Motive als eigenständige Bilder, nicht als Collage und nicht als Kontaktbogen.",
    "- Verwende für jedes Motiv einen separaten Bildgenerierungsaufruf.",
    "- Arbeite die Liste strikt in der angegebenen Reihenfolge ab und überspringe kein Motiv.",
    "- Falls die Oberfläche technisch nur ein Bild pro Antwort erzeugt, beginne mit Bild 1. Wenn ich danach nur „weiter“ schreibe, erzeuge ohne Rückfrage exakt das nächste noch offene Bild.",
    "- Nach „weiter“ darfst du weder den Master-Prompt wiederholen noch ein bereits erzeugtes Motiv neu erstellen.",
    "- Zeige vor oder nach dem Bild nur die laufende Nummer, den Dateinamen und den kurzen Zweck.", "",
    "QUALITÄTSREGELN",
    "- Möglichst realistisch und hochwertig, bei Produktmotiven wie glaubwürdige Herstellerfotografie.",
    "- Mobile first: Motiv und Aussage müssen bei 375 px Breite sofort verständlich bleiben.",
    "- Keine erfundenen Funktionen, Bedienelemente, Maße, App-Werte, Testergebnisse oder Werbeaussagen.",
    "- Keine Wasserzeichen, Preisangaben, Sternebewertungen oder fremde Logos.", "",
    "BILDLISTE", manifest, "",
    "Beginne jetzt mit Bild 1. Arbeite bei technisch möglicher Mehrfachgenerierung selbstständig bis zum letzten Bild weiter."
  ].filter(Boolean).join("\n");
  return {
    pageType, subject, target, assets, masterPrompt,
    fallbackPrompts: assets.map((asset, index) => [`Bild ${index + 1} von ${assets.length}`, `Dateiname: ${asset.filename}`, asset.prompt].join("\n"))
  };
};

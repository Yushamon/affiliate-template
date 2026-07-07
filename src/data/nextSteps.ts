import type { CollectionEntry } from "astro:content";

type Page = CollectionEntry<"pages">;

export type NextStep = {
  title: string;
  text: string;
  href: string;
  button: string;
};

const journeyBySlug: Record<string, NextStep> = {
  "balkonkraftwerk-speicher": {
    title: "Jetzt die passende Speichergröße berechnen",
    text: "Du weißt jetzt, wann ein Speicher sinnvoll ist. Im nächsten Schritt findest du heraus, welche Größe zu deinem Haushalt passt.",
    href: "/balkonspeicher-groesse-berechnen",
    button: "Speichergröße berechnen"
  },

  "balkonspeicher-groesse-berechnen": {
    title: "Lohnt sich ein Balkonspeicher überhaupt?",
    text: "Jetzt kennst du die passende Speichergröße. Prüfe als Nächstes, ob sich ein Speicher für deinen Haushalt wirtschaftlich lohnt.",
    href: "/lohnt-sich-ein-balkonspeicher",
    button: "Wirtschaftlichkeit prüfen"
  },

  "lohnt-sich-ein-balkonspeicher": {
    title: "Jetzt passende Balkonspeicher vergleichen",
    text: "Wenn sich ein Speicher für dich lohnt, solltest du jetzt passende Systeme vergleichen.",
    href: "/beste-balkonspeicher",
    button: "Speicher vergleichen"
  },

  "balkonspeicher-wirtschaftlichkeit": {
    title: "Jetzt die richtige Speichergröße finden",
    text: "Die Wirtschaftlichkeit hängt stark von der passenden Speichergröße ab.",
    href: "/balkonspeicher-groesse-berechnen",
    button: "Speichergröße berechnen"
  },

  "speicher-fuer-balkonkraftwerk-nachruesten": {
    title: "Jetzt passende Speicher ansehen",
    text: "Du weißt jetzt, worauf es bei der Nachrüstung ankommt. Jetzt kannst du geeignete Speichersysteme vergleichen.",
    href: "/beste-balkonspeicher",
    button: "Speicher vergleichen"
  },

  "balkonspeicher-kosten": {
    title: "Rechnet sich der Speicher überhaupt?",
    text: "Der Preis allein entscheidet nicht. Prüfe jetzt, ob sich ein Balkonspeicher für deinen Haushalt wirtschaftlich lohnt.",
    href: "/balkonspeicher-wirtschaftlichkeit",
    button: "Wirtschaftlichkeit prüfen"
  },

  "balkonspeicher-installieren": {
    title: "Jetzt passende Speicher auswählen",
    text: "Du kennst jetzt den Installationsablauf. Im nächsten Schritt kannst du geeignete Balkonspeicher vergleichen.",
    href: "/beste-balkonspeicher",
    button: "Speicher vergleichen"
  },

  "balkonspeicher-lebensdauer": {
    title: "Garantie richtig verstehen",
    text: "Lebensdauer und Garantie werden häufig verwechselt. Hier erfährst du, worauf du wirklich achten solltest.",
    href: "/balkonspeicher-garantie",
    button: "Zur Garantie"
  },

  "balkonspeicher-garantie": {
    title: "Jetzt passende Hersteller vergleichen",
    text: "Du weißt jetzt, worauf es bei Garantie und Support ankommt. Jetzt lohnt sich der Vergleich konkreter Speicher.",
    href: "/beste-balkonspeicher",
    button: "Speicher vergleichen"
  },

  "balkonspeicher-im-winter": {
    title: "Wirtschaftlichkeit über das ganze Jahr prüfen",
    text: "Der Winter ist nur ein Teil des Jahres. Entscheidend ist, ob sich ein Speicher langfristig für deinen Haushalt lohnt.",
    href: "/balkonspeicher-wirtschaftlichkeit",
    button: "Zur Wirtschaftlichkeit"
  },

  "ecoflow-vs-anker": {
    title: "EcoFlow im Detail ansehen",
    text: "Der Vergleich zeigt die Unterschiede. Lies jetzt die ausführliche Bewertung zur EcoFlow STREAM Ultra.",
    href: "/produkt/ecoflow-stream-ultra",
    button: "EcoFlow ansehen"
  },

  "ecoflow-vs-zendure": {
    title: "EcoFlow im Detail ansehen",
    text: "Du kennst jetzt die Unterschiede zu Zendure. Lies jetzt die ausführliche Bewertung zur EcoFlow STREAM Ultra.",
    href: "/produkt/ecoflow-stream-ultra",
    button: "EcoFlow ansehen"
  },

  "anker-vs-zendure": {
    title: "Anker im Detail ansehen",
    text: "Du kennst jetzt die Unterschiede zu Zendure. Lies jetzt die ausführliche Bewertung zur Anker SOLIX Solarbank 3 Pro.",
    href: "/produkt/anker-solix-solarbank-3-pro",
    button: "Anker ansehen"
  }
};

export function getNextStep(page: Page): NextStep | null {
  const slug = page.data.slug;

  if (journeyBySlug[slug]) {
    return journeyBySlug[slug];
  }

  if (page.data.intent === "produkt") {
    return {
      title: "Jetzt Alternativen vergleichen",
      text: "Ein Produkttest ist ein guter Einstieg. Vergleiche jetzt weitere Speicher, bevor du dich entscheidest.",
      href: "/beste-balkonspeicher",
      button: "Speicher vergleichen"
    };
  }

  if (page.data.intent === "vergleich") {
    return {
      title: "Jetzt die besten Speicher ansehen",
      text: "Du kennst jetzt die wichtigsten Unterschiede. Im nächsten Schritt findest du unsere aktuellen Empfehlungen.",
      href: "/beste-balkonspeicher",
      button: "Beste Speicher ansehen"
    };
  }

  if (page.data.topic === "wirtschaftlichkeit") {
    return {
      title: "Jetzt passende Speichergröße berechnen",
      text: "Die Wirtschaftlichkeit hängt stark davon ab, ob die Speichergröße zu deinem Haushalt passt.",
      href: "/balkonspeicher-groesse-berechnen",
      button: "Speichergröße berechnen"
    };
  }

  if (page.data.topic === "groesse") {
    return {
      title: "Jetzt Wirtschaftlichkeit prüfen",
      text: "Wenn du die passende Größe kennst, solltest du prüfen, ob sich ein Speicher für deinen Haushalt lohnt.",
      href: "/balkonspeicher-wirtschaftlichkeit",
      button: "Wirtschaftlichkeit prüfen"
    };
  }

  if (page.data.category === "balkonspeicher") {
    return {
      title: "Jetzt passende Balkonspeicher vergleichen",
      text: "Du kennst jetzt die wichtigsten Grundlagen. Im nächsten Schritt kannst du konkrete Speicher vergleichen.",
      href: "/beste-balkonspeicher",
      button: "Speicher vergleichen"
    };
  }

  return null;
}
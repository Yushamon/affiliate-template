export type JourneyStage =
  | "guide"
  | "comparison"
  | "product"
  | "manufacturer";

export const journeyTransitions: Record<
  JourneyStage,
  Partial<Record<JourneyStage, number>>
> = {
  guide: {
    comparison: 120,
    product: 55,
    guide: 25
  },
  comparison: {
    product: 120,
    manufacturer: 60,
    guide: 20
  },
  product: {
    manufacturer: 120,
    comparison: 65,
    guide: 45
  },
  manufacturer: {
    guide: 120,
    product: 55,
    comparison: 35
  }
};

export const getJourneyStage = (
  value?: string
): JourneyStage => {
  if (value === "comparison") return "comparison";
  if (value === "product") return "product";
  if (value === "manufacturer") return "manufacturer";
  return "guide";
};

export const getJourneyTransitionWeight = (
  source: JourneyStage,
  target: JourneyStage
) => journeyTransitions[source][target] ?? Number.NEGATIVE_INFINITY;

export const isForwardJourneyTransition = (
  source: JourneyStage,
  target: JourneyStage
) =>
  (source === "guide" && target === "comparison") ||
  (source === "comparison" && target === "product") ||
  (source === "product" && target === "manufacturer") ||
  (source === "manufacturer" && target === "guide");

type NaturalLinkTextInput = {
  source: JourneyStage;
  target: JourneyStage;
  targetTitle?: string;
  manufacturerName?: string;
};

export const getNaturalJourneyLabel = ({
  source,
  target,
  targetTitle,
  manufacturerName
}: NaturalLinkTextInput) => {
  if (source === "guide" && target === "comparison") {
    return "Modelle nach diesen Kriterien vergleichen";
  }
  if (source === "guide" && target === "product") {
    return "Empfohlenes Modell im Detail prüfen";
  }
  if (source === "comparison" && target === "product") {
    return "Empfehlung im Detail prüfen";
  }
  if (source === "comparison" && target === "manufacturer") {
    return manufacturerName
      ? `${manufacturerName} als Hersteller einordnen`
      : "Hersteller der Empfehlung einordnen";
  }
  if (source === "product" && target === "manufacturer") {
    return manufacturerName
      ? `Mehr über ${manufacturerName} erfahren`
      : "Hersteller und Service einordnen";
  }
  if (source === "product" && target === "comparison") {
    return "Mit passenden Alternativen vergleichen";
  }
  if (source === "product" && target === "guide") {
    return "Kaufkriterien noch einmal prüfen";
  }
  if (source === "comparison" && target === "guide") {
    return "Auswahlkriterien vertiefen";
  }
  if (source === "manufacturer" && target === "guide") {
    return "Passende Kaufberatung lesen";
  }
  if (source === "manufacturer" && target === "product") {
    return manufacturerName
      ? `${manufacturerName}-Modelle im Detail ansehen`
      : "Passende Modelle im Detail ansehen";
  }
  if (source === "manufacturer" && target === "comparison") {
    return "Sortiment mit Alternativen vergleichen";
  }
  if (source === "guide" && target === "guide") {
    return "Passenden Praxisratgeber lesen";
  }
  if (source === "comparison" && target === "comparison") {
    return "Weitere Auswahl gegenüberstellen";
  }
  if (source === "product" && target === "product") {
    return "Passendes Alternativmodell prüfen";
  }
  if (source === "manufacturer" && target === "manufacturer") {
    return "Mit einem anderen Hersteller vergleichen";
  }
  return targetTitle
    ? `${targetTitle} weiterlesen`
    : "Thematisch passend weiterlesen";
};

export const getJourneyEyebrow = (
  source: JourneyStage,
  target: JourneyStage
) => {
  if (isForwardJourneyTransition(source, target)) {
    return target === "comparison"
      ? "Nächster Entscheidungsschritt"
      : target === "product"
        ? "Konkrete Empfehlung"
        : target === "manufacturer"
          ? "Marke und Service"
          : "Zurück zur Kaufberatung";
  }
  return target === "comparison"
    ? "Alternativen"
    : target === "product"
      ? "Passendes Modell"
      : target === "manufacturer"
        ? "Hersteller"
        : "Vertiefung";
};

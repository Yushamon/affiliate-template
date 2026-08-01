export type FitQuestion = {
  key: string;
  label: string;
  options: Array<{ value: string; label: string }>;
};

export type FitProfile = {
  productName: string;
  category: "feeder" | "fountain" | "tracker" | "cat-flap" | "generic";
  animals: string[];
  petSizes: string[];
  foodTypes: string[];
  supportsMultiplePets: boolean | null;
  hasWifi: boolean | null;
  worksOffline: boolean | null;
  hasCamera: boolean | null;
  hasBattery: boolean | null;
  material: string;
  subscriptionRequired: boolean | null;
  suitableForOutdoor: boolean | null;
  supportsChip: boolean | null;
  hasTimer: boolean | null;
  installTypes: string[];
};

export type FitEvaluation = {
  score: number;
  verdict: "open" | "strong" | "conditional" | "weak";
  headline: string;
  reasons: Array<{ kind: "positive" | "neutral" | "negative"; text: string }>;
  mismatchKeys: string[];
};

const questionSets: Record<FitProfile["category"], FitQuestion[]> = {
  feeder: [
    { key: "animal", label: "Für welches Tier?", options: [{ value: "cat", label: "Katze" }, { value: "dog", label: "Hund" }] },
    { key: "animalCount", label: "Wie viele Tiere?", options: [{ value: "1", label: "Ein Tier" }, { value: "2", label: "Zwei Tiere" }, { value: "3", label: "Drei oder mehr" }] },
    { key: "foodType", label: "Welches Futter?", options: [{ value: "dry", label: "Trockenfutter" }, { value: "wet", label: "Nassfutter" }] },
    { key: "wifi", label: "App und WLAN?", options: [{ value: "required", label: "Gewünscht" }, { value: "optional", label: "Egal" }, { value: "offline", label: "Möglichst offline" }] },
    { key: "camera", label: "Kamera?", options: [{ value: "required", label: "Wichtig" }, { value: "optional", label: "Egal" }, { value: "unwanted", label: "Lieber ohne" }] }
  ],
  fountain: [
    { key: "animal", label: "Für welches Tier?", options: [{ value: "cat", label: "Katze" }, { value: "dog", label: "Hund" }] },
    { key: "animalCount", label: "Wie viele Tiere?", options: [{ value: "1", label: "Ein Tier" }, { value: "2", label: "Zwei Tiere" }, { value: "3", label: "Drei oder mehr" }] },
    { key: "material", label: "Welches Material ist dir wichtig?", options: [{ value: "steel", label: "Edelstahl" }, { value: "ceramic", label: "Keramik" }, { value: "flexible", label: "Egal" }] },
    { key: "power", label: "Stromversorgung?", options: [{ value: "battery", label: "Akku bevorzugt" }, { value: "cable", label: "Kabel ist okay" }, { value: "flexible", label: "Egal" }] },
    { key: "wifi", label: "App und WLAN?", options: [{ value: "required", label: "Gewünscht" }, { value: "optional", label: "Egal" }, { value: "offline", label: "Möglichst offline" }] }
  ],
  tracker: [
    { key: "animal", label: "Für welches Tier?", options: [{ value: "cat", label: "Katze" }, { value: "dog", label: "Hund" }] },
    { key: "petSize", label: "Wie groß ist dein Tier?", options: [{ value: "small", label: "Klein" }, { value: "medium", label: "Mittel" }, { value: "large", label: "Groß" }] },
    { key: "environment", label: "Wo wird der Tracker genutzt?", options: [{ value: "city", label: "Stadt" }, { value: "mixed", label: "Gemischt" }, { value: "outdoor", label: "Wald und Gelände" }] },
    { key: "subscription", label: "Abo akzeptabel?", options: [{ value: "yes", label: "Ja" }, { value: "no", label: "Nein" }] },
    { key: "power", label: "Was ist wichtiger?", options: [{ value: "battery", label: "Lange Laufzeit" }, { value: "live", label: "Häufiges Live-Tracking" }] }
  ],
  "cat-flap": [
    { key: "animalCount", label: "Wie viele Katzen?", options: [{ value: "1", label: "Eine" }, { value: "2", label: "Zwei" }, { value: "3", label: "Drei oder mehr" }] },
    { key: "chip", label: "Mikrochip-Steuerung?", options: [{ value: "required", label: "Erforderlich" }, { value: "optional", label: "Egal" }] },
    { key: "installType", label: "Wo wird eingebaut?", options: [{ value: "door", label: "Tür" }, { value: "wall", label: "Wand" }, { value: "glass", label: "Glas" }] },
    { key: "timer", label: "Zeitsteuerung?", options: [{ value: "required", label: "Wichtig" }, { value: "optional", label: "Egal" }] },
    { key: "wifi", label: "App-Steuerung?", options: [{ value: "required", label: "Gewünscht" }, { value: "optional", label: "Egal" }, { value: "offline", label: "Lieber ohne" }] }
  ],
  generic: [
    { key: "animal", label: "Für welches Tier?", options: [{ value: "cat", label: "Katze" }, { value: "dog", label: "Hund" }] },
    { key: "wifi", label: "App und WLAN?", options: [{ value: "required", label: "Gewünscht" }, { value: "optional", label: "Egal" }, { value: "offline", label: "Möglichst offline" }] }
  ]
};

export const questionsForCategory = (category: FitProfile["category"]): FitQuestion[] =>
  questionSets[category] ?? questionSets.generic;

type Check = { key: string; factor: number; positive?: string; neutral?: string; negative?: string };

export const evaluateCategoryFit = (
  profile: FitProfile,
  answers: Record<string, string>
): FitEvaluation => {
  const checks: Check[] = [];

  const knownMatch = (key: string, values: string[], selected?: string, label = "Anforderung") => {
    if (!selected) return;
    if (!values.length) {
      checks.push({ key, factor: .7, neutral: `${label} ist in den Produktdaten nicht eindeutig dokumentiert.` });
    } else if (values.includes(selected)) {
      checks.push({ key, factor: 1, positive: `${label} passt.` });
    } else {
      checks.push({ key, factor: .1, negative: `${label} passt nicht zur ausgewiesenen Eignung.` });
    }
  };

  knownMatch("animal", profile.animals, answers.animal, "Tierart");
  knownMatch("petSize", profile.petSizes, answers.petSize, "Tiergröße");

  if (answers.animalCount) {
    const multiple = Number(answers.animalCount) > 1;
    if (!multiple) checks.push({ key: "animalCount", factor: 1, positive: "Die Nutzung mit einem Tier ist unkritisch." });
    else if (profile.supportsMultiplePets === true) checks.push({ key: "animalCount", factor: 1, positive: "Mehrtiereignung ist ausgewiesen." });
    else if (profile.supportsMultiplePets === false) checks.push({ key: "animalCount", factor: .25, negative: "Für mehrere Tiere fehlen klare Mehrtierfunktionen." });
    else checks.push({ key: "animalCount", factor: .65, neutral: "Mehrtiereignung ist nicht eindeutig dokumentiert." });
  }

  knownMatch("foodType", profile.foodTypes, answers.foodType, "Futterart");

  if (answers.wifi) {
    if (answers.wifi === "optional") checks.push({ key: "wifi", factor: 1, neutral: "App und WLAN sind nicht kaufentscheidend." });
    else if (answers.wifi === "required") {
      checks.push(profile.hasWifi === true
        ? { key: "wifi", factor: 1, positive: "App- oder WLAN-Funktionen sind vorhanden." }
        : profile.hasWifi === false
          ? { key: "wifi", factor: .15, negative: "App- oder WLAN-Funktionen fehlen." }
          : { key: "wifi", factor: .65, neutral: "App- oder WLAN-Funktionen sind nicht eindeutig belegt." });
    } else {
      checks.push(profile.worksOffline === true || profile.hasWifi === false
        ? { key: "wifi", factor: 1, positive: "Ein sinnvoller Offline-Betrieb ist möglich." }
        : { key: "wifi", factor: .35, negative: "Der gewünschte Offline-Betrieb ist nicht klar abgesichert." });
    }
  }

  if (answers.camera) {
    if (answers.camera === "optional") checks.push({ key: "camera", factor: 1, neutral: "Eine Kamera ist nicht kaufentscheidend." });
    else if (answers.camera === "required") checks.push(profile.hasCamera
      ? { key: "camera", factor: 1, positive: "Eine Kamera ist vorhanden." }
      : { key: "camera", factor: .1, negative: "Eine Kamera ist nicht ausgewiesen." });
    else checks.push(profile.hasCamera === false
      ? { key: "camera", factor: 1, positive: "Das Produkt verzichtet auf eine Kamera." }
      : { key: "camera", factor: .55, neutral: "Das Produkt kann eine Kamera besitzen." });
  }

  if (answers.material && answers.material !== "flexible") {
    const desired = answers.material === "steel" ? "edelstahl" : "keramik";
    const match = profile.material.includes(desired);
    checks.push(match
      ? { key: "material", factor: 1, positive: "Das gewünschte Material passt." }
      : { key: "material", factor: .35, negative: "Das gewünschte Material ist nicht ausgewiesen." });
  }

  if (answers.power === "battery") {
    checks.push(profile.hasBattery === true
      ? { key: "power", factor: 1, positive: "Akkubetrieb ist vorgesehen." }
      : profile.hasBattery === false
        ? { key: "power", factor: .2, negative: "Das Produkt ist nicht für Akkubetrieb ausgewiesen." }
        : { key: "power", factor: .65, neutral: "Akkubetrieb ist nicht eindeutig dokumentiert." });
  }

  if (answers.environment === "outdoor") {
    checks.push(profile.suitableForOutdoor === true
      ? { key: "environment", factor: 1, positive: "Außeneignung ist dokumentiert." }
      : { key: "environment", factor: .45, negative: "Für Wald und Gelände fehlen klare Belastbarkeitsdaten." });
  } else if (answers.environment) {
    checks.push({ key: "environment", factor: .9, neutral: "Die reale Ortungsleistung hängt zusätzlich von Netz und Umgebung ab." });
  }

  if (answers.subscription) {
    if (answers.subscription === "no" && profile.subscriptionRequired === true) {
      checks.push({ key: "subscription", factor: .1, negative: "Für die Nutzung ist ein laufendes Abo erforderlich." });
    } else if (answers.subscription === "no" && profile.subscriptionRequired === false) {
      checks.push({ key: "subscription", factor: 1, positive: "Kein verpflichtendes Abo ist ausgewiesen." });
    } else {
      checks.push({ key: "subscription", factor: .9, neutral: "Abo-Kosten sollten in die Gesamtkosten einfließen." });
    }
  }

  if (answers.chip === "required") {
    checks.push(profile.supportsChip === true
      ? { key: "chip", factor: 1, positive: "Mikrochip-Steuerung ist vorhanden." }
      : { key: "chip", factor: .1, negative: "Mikrochip-Steuerung ist nicht ausgewiesen." });
  }

  if (answers.timer === "required") {
    checks.push(profile.hasTimer === true
      ? { key: "timer", factor: 1, positive: "Zeitsteuerung ist vorhanden." }
      : { key: "timer", factor: .2, negative: "Zeitsteuerung ist nicht ausgewiesen." });
  }

  if (answers.installType) {
    if (!profile.installTypes.length) {
      checks.push({ key: "installType", factor: .65, neutral: "Der gewünschte Einbau ist nicht eindeutig dokumentiert." });
    } else {
      checks.push(profile.installTypes.includes(answers.installType)
        ? { key: "installType", factor: 1, positive: "Der gewünschte Einbau ist vorgesehen." }
        : { key: "installType", factor: .2, negative: "Der gewünschte Einbau ist nicht ausgewiesen." });
    }
  }

  const score = checks.length
    ? Math.round(checks.reduce((sum, item) => sum + item.factor, 0) / checks.length * 100)
    : 0;
  const mismatchKeys = checks.filter((item) => item.factor < .6).map((item) => item.key);
  const verdict = !checks.length ? "open" : score >= 82 && !mismatchKeys.length ? "strong" : score >= 62 ? "conditional" : "weak";
  const headline = verdict === "strong"
    ? "Passt sehr gut zu deinen Angaben"
    : verdict === "conditional"
      ? "Passt, aber nicht ohne Einschränkung"
      : verdict === "weak"
        ? "Eine Alternative passt wahrscheinlich besser"
        : "Beantworte die Fragen für eine persönliche Einordnung";

  const reasons = checks.flatMap((item) => [
    item.positive ? { kind: "positive" as const, text: item.positive } : null,
    item.neutral ? { kind: "neutral" as const, text: item.neutral } : null,
    item.negative ? { kind: "negative" as const, text: item.negative } : null
  ].filter(Boolean) as Array<{ kind: "positive" | "neutral" | "negative"; text: string }>);

  return { score, verdict, headline, reasons, mismatchKeys };
};

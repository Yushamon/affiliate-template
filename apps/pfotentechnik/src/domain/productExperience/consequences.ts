type DecisionFact = {
  label: string;
  value: string;
  consequence: string;
  source: "product-data" | "technical-specification" | "editorial";
};

const text = (value: unknown): string => {
  if (typeof value === "string") return value.trim();
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return "";
};

const normalize = (value: unknown): string =>
  text(value)
    .toLocaleLowerCase("de-DE")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();

const implicationFor = (
  label: string,
  value: string,
  category: string
): string | null => {
  const key = normalize(label);
  const normalizedValue = normalize(value);
  const normalizedCategory = normalize(category);

  if (key.includes("kapazitaet") || key.includes("volumen")) {
    if (normalizedCategory.includes("futter")) {
      return "Die tatsächliche Reichweite hängt von Portionsgröße, Futterdichte und Anzahl der Tiere ab.";
    }
    if (normalizedCategory.includes("trink") || normalizedCategory.includes("brunnen")) {
      return "Mehr Volumen bedeutet selteneres Nachfüllen, ersetzt aber keine regelmäßige Reinigung.";
    }
    return "Die Größe beeinflusst, wie häufig nachgefüllt oder gewartet werden muss.";
  }

  if (key.includes("app") || key.includes("wlan") || key.includes("wifi")) {
    if (["ja", "vorhanden", "app", "wlan app", "mit app"].some((term) => normalizedValue.includes(term))) {
      return "Einstellungen lassen sich aus der Ferne ändern; Einrichtung, Konto und Netzstabilität werden dafür wichtiger.";
    }
    if (["nein", "ohne", "nicht vorhanden"].some((term) => normalizedValue.includes(term))) {
      return "Die Nutzung bleibt unabhängiger von Konto, Cloud und WLAN.";
    }
  }

  if (key.includes("kamera")) {
    if (["ja", "vorhanden", "integriert"].some((term) => normalizedValue.includes(term))) {
      return "Du kannst nicht nur die Geräteaktion, sondern auch die Situation am Napf oder Aufenthaltsort kontrollieren.";
    }
    if (["nein", "ohne"].some((term) => normalizedValue.includes(term))) {
      return "Die Kontrolle beschränkt sich auf Statusmeldungen und Protokolle.";
    }
  }

  if (key.includes("akku")) {
    if (["nein", "kein", "ohne", "nicht vorhanden", "nicht vorgesehen"].some((term) => normalizedValue.includes(term))) {
      return "Kein integrierter Akku: Ohne Netzstrom läuft das Gerät nur weiter, wenn eine separate Batterie- oder Notstromlösung ausdrücklich vorgesehen ist.";
    }
    return "Ein integrierter Akku erlaubt einen flexibleren Standort. Laufzeit, Ladezeit und Verhalten während des Ladens bleiben dabei kaufentscheidend.";
  }

  if (key.includes("batterie") || key.includes("notstrom")) {
    return "Batterien oder Notstrom überbrücken einen Stromausfall. Das ist nicht automatisch mit dauerhaftem kabellosem Betrieb gleichzusetzen.";
  }

  if (key.includes("stromversorgung") || key.includes("netzteil") || key.includes("netzbetrieb")) {
    return "Die Angabe zeigt, ob das Gerät am Netz, kabellos oder nur mit einer Backup-Lösung arbeitet und was bei Stromausfall weiterläuft.";
  }

  if (key.includes("material")) {
    if (normalizedValue.includes("edelstahl")) {
      return "Edelstahl nimmt Gerüche meist weniger stark an und lässt sich in der Regel leichter hygienisch reinigen.";
    }
    if (normalizedValue.includes("keramik")) {
      return "Keramik ist schwer und standfest, kann bei Stößen aber beschädigt werden.";
    }
    if (normalizedValue.includes("kunststoff")) {
      return "Kunststoff ist leicht, sollte wegen Kratzern und Geruchsaufnahme besonders gründlich kontrolliert werden.";
    }
  }

  if (key.includes("gewicht")) {
    if (normalizedCategory.includes("gps") || normalizedCategory.includes("tracker")) {
      return "Beim Tier zählt das Gesamtgewicht aus Gerät, Halterung und Halsband, nicht nur das Trackergewicht.";
    }
    return "Das Gewicht beeinflusst Standfestigkeit, Transport und Handhabung.";
  }

  if (key.includes("abmess") || key.includes("groesse") || key.includes("durchgang")) {
    return "Die Maße sollten nicht nur zum Stellplatz, sondern auch zur Körpergröße und Nutzung des Tieres passen.";
  }

  if (key.includes("filter")) {
    return "Filter verbessern die Wasser- oder Luftqualität nur bei regelmäßigem Wechsel und verursachen laufende Kosten.";
  }

  if (key.includes("laut") || key.includes("geraeusch")) {
    return "Geräusche können bei schreckhaften Tieren oder im Schlafzimmer kaufentscheidend sein.";
  }

  if (key.includes("portion")) {
    return "Entscheidend ist nicht nur die Anzahl der Stufen, sondern wie gleichmäßig die tatsächliche Futtermenge ausgegeben wird.";
  }

  if (key.includes("abo") || key.includes("monat") || key.includes("laufende kosten")) {
    return "Für den realen Preisvergleich zählen die Gesamtkosten über mehrere Jahre, nicht nur der Gerätepreis.";
  }

  if (key.includes("schutz") || key.includes("wasserdicht") || key.includes("ip")) {
    return "Die Schutzklasse ist besonders bei Regen, Reinigung und dauerhaftem Außeneinsatz relevant.";
  }

  return null;
};

const GENERIC_POWER_CONSEQUENCE =
  "Die Stromversorgung entscheidet, wie zuverlässig das Gerät bei Stromausfall oder unterwegs weiterarbeitet.";

export const buildDecisionFacts = (
  data: any,
  specs: Array<{ label: string; value: string }>
): DecisionFact[] => {
  const category = text(data?.category?.label ?? data?.category?.key ?? data?.category);
  const explicit = Array.isArray(data?.decisionFacts)
    ? data.decisionFacts
        .map((item: any) => {
          const label = text(item?.label);
          const value = text(item?.value);
          const supplied = text(item?.consequence);
          const derived = implicationFor(label, value, category);
          const consequence =
            !supplied || supplied === GENERIC_POWER_CONSEQUENCE
              ? derived ?? supplied
              : supplied;
          return {
            label,
            value,
            consequence,
            source: "editorial" as const
          };
        })
        .filter((item: DecisionFact) => item.label && item.value && item.consequence)
    : [];

  if (explicit.length > 0) return explicit.slice(0, 6);

  const output: DecisionFact[] = [];
  const seen = new Set<string>();

  for (const spec of specs) {
    const consequence = implicationFor(spec.label, spec.value, category);
    if (!consequence) continue;
    const key = normalize(spec.label);
    if (seen.has(key)) continue;
    seen.add(key);
    output.push({
      label: spec.label,
      value: spec.value,
      consequence,
      source: "technical-specification"
    });
    if (output.length >= 6) break;
  }

  return output;
};

export type { DecisionFact };

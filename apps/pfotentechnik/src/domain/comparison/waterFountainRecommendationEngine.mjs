export function buildWaterFountainRecommendations(products, audience) {
  const scenarios = audience === "dog"
    ? [
        { key: "small-dog", label: "Kleine Hunde", targetLiters: 2.5, minimumLiters: 1.5 },
        { key: "medium-dog", label: "Mittelgroße Hunde", targetLiters: 3.5, minimumLiters: 2.5 },
        { key: "large-dog", label: "Große Hunde", targetLiters: 5.5, minimumLiters: 4 },
        { key: "multi-dog", label: "Mehrhundehaushalte", targetLiters: 7, minimumLiters: 5 }
      ]
    : [
        { key: "single-cat", label: "Eine Katze", targetLiters: 2.2, minimumLiters: 1.5 },
        { key: "multi-cat", label: "Mehrkatzenhaushalte", targetLiters: 3.5, minimumLiters: 2.5 },
        { key: "compact-cat", label: "Wenig Stellfläche", targetLiters: 2, minimumLiters: 1.5 }
      ];

  const rank = (scenario) => products
    .map((product) => ({
      product,
      score: scoreWaterFountain(product, audience, scenario),
      reasons: buildReasons(product, audience, scenario)
    }))
    .sort((a, b) =>
      b.score - a.score ||
      Number(b.product.rating ?? 0) - Number(a.product.rating ?? 0) ||
      String(a.product.title).localeCompare(String(b.product.title), "de")
    );

  const overallScenario = audience === "dog"
    ? { key: "overall-dog", label: "Gesamt", targetLiters: 4, minimumLiters: 2.5 }
    : { key: "overall-cat", label: "Gesamt", targetLiters: 2.8, minimumLiters: 1.8 };

  return {
    overall: rank(overallScenario),
    scenarios: scenarios.map((scenario) => ({ ...scenario, ranking: rank(scenario) }))
  };
}

export function scoreWaterFountain(product, audience, scenario) {
  const evidence = normalize([
    product.title,
    product.recommendation,
    product.capacity,
    product.audienceText,
    ...(product.features ?? []),
    ...(product.strengths ?? []),
    ...(product.specs ?? []).map((spec) => `${spec.label}: ${String(spec.value)}`)
  ].filter(Boolean).join(" "));

  const liters = extractCapacityLiters(product);
  let score = Number(product.rating ?? 0) * 10;

  if (audience === "dog") {
    const dogEvidence = /hund|hunde|dog fountain|dog water/.test(evidence);
    const catEvidence = /katze|katzen|cat fountain/.test(evidence);
    if (dogEvidence) score += 18;
    if (catEvidence && !dogEvidence) score -= 45;
  } else {
    const catEvidence = /katze|katzen|cat fountain/.test(evidence);
    const dogOnly = /hundebrunnen|dog fountain/.test(evidence) && !catEvidence;
    if (catEvidence) score += 12;
    if (dogOnly) score -= 50;
  }

  if (Number.isFinite(liters)) {
    score += Math.max(0, 24 - Math.abs(liters - scenario.targetLiters) * 7);
    if (liters < scenario.minimumLiters) score -= 35;

    if (scenario.key === "large-dog") {
      if (liters < 4) score -= 35;
      if (liters >= 5) score += 25;
    }
    if (scenario.key === "multi-dog") {
      if (liters < 5) score -= 30;
      if (liters >= 6) score += 25;
    }
  } else {
    score -= 12;
  }

  if (/edelstahl|stainless/.test(evidence)) score += 6;
  if (/standfest|rutschfest|breite trinkflaeche|breite trinkfläche/.test(evidence)) {
    score += audience === "dog" ? 10 : 5;
  }
  if (/leicht zu reinigen|spuelmaschine|spülmaschine|zerlegbar/.test(evidence)) score += 6;
  if (/app|smart|wlan|wi-fi|wifi/.test(evidence)) score += 2;

  return Math.round(score * 10) / 10;
}

export function extractCapacityLiters(product) {
  const text = [
    product.capacity,
    ...(product.specs ?? [])
      .filter((spec) => /kapazitaet|kapazität|volumen|fassungsvermoegen|fassungsvermögen/i.test(spec.label))
      .map((spec) => String(spec.value))
  ].filter(Boolean).join(" ");

  const liters = text.match(/(\d+(?:[.,]\d+)?)\s*l(?:iter)?\b/i);
  if (liters) return Number.parseFloat(liters[1].replace(",", "."));

  const ml = text.match(/(\d+(?:[.,]\d+)?)\s*ml\b/i);
  if (ml) return Number.parseFloat(ml[1].replace(",", ".")) / 1000;

  return Number.NaN;
}

export function renderScenarioRecommendationMarkdown(result, audience) {
  const heading = audience === "dog"
    ? "Empfehlungen nach Hundegröße"
    : "Empfehlungen nach Haushaltsgröße";

  const rows = result.scenarios.map((scenario) => {
    const winner = scenario.ranking[0];
    if (!winner) return null;
    return `| ${scenario.label} | ${winner.product.title} | ${winner.reasons.join("; ")} |`;
  }).filter(Boolean).join("\n");

  return `## ${heading}

Die Empfehlungen werden aus dokumentierter Tier-Eignung, Kapazität, Bauform und Gesamtbewertung berechnet. Eine hohe allgemeine Bewertung reicht nicht aus, wenn der Brunnen für die jeweilige Tiergröße ungeeignet ist.

| Einsatz | Empfehlung | Begründung |
|---|---|---|
${rows}

> **Größenlogik:** Ein kompakter 3-Liter-Brunnen kann für kleine Hunde sehr gut abschneiden, wird bei großen Hunden oder Mehrhundehaushalten jedoch automatisch abgewertet.`;
}

function buildReasons(product, audience, scenario) {
  const liters = extractCapacityLiters(product);
  const reasons = [];
  if (Number.isFinite(liters)) reasons.push(`${formatNumber(liters)} Liter Kapazität`);
  reasons.push(`Scoring für ${scenario.label}`);
  return reasons;
}

function formatNumber(value) {
  return new Intl.NumberFormat("de-DE", { maximumFractionDigits: 1 }).format(value);
}

function normalize(value) {
  return String(value)
    .toLocaleLowerCase("de")
    .replaceAll("ä", "ae")
    .replaceAll("ö", "oe")
    .replaceAll("ü", "ue")
    .replaceAll("ß", "ss");
}

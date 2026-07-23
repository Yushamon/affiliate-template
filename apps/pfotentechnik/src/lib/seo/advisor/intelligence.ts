import { normalizeSeoPath } from "../loadDashboard.ts";
import type {
  AdvisorForecast,
  AdvisorOpportunity,
  ContentDocument,
  ConversionInsight,
  EditorialCalendarItem,
  GraphGapFinding,
  SeoAdvisorInput,
} from "./types";

const DAY = 86_400_000;

const ctrBenchmark = (position: number): number => {
  if (position <= 3) return 8;
  if (position <= 5) return 5;
  if (position <= 10) return 3;
  if (position <= 20) return 1.5;
  return 0.8;
};

export const buildForecast = ({
  impressions,
  ctr,
  position,
  confidence,
  rangeKey,
}: {
  impressions: number;
  ctr: number;
  position: number;
  confidence: number;
  rangeKey: string;
}): AdvisorForecast => {
  const benchmark = ctrBenchmark(position);
  const ctrPotential = Number(Math.max(0, Math.min(2.5, benchmark - ctr)).toFixed(2));
  const positionPotential = position >= 4 && position <= 20 ? (position <= 10 ? 1 : 2) : 0;
  const clickPotential = Math.max(0, Math.round(impressions * ctrPotential / 100));
  const trafficPotential = impressions > 0 ? Number((clickPotential / impressions * 100).toFixed(2)) : 0;
  return {
    ctrPotential,
    positionPotential,
    clickPotential,
    trafficPotential,
    confidence,
    assumptions: [
      `Szenario: CTR nähert sich höchstens um ${ctrPotential.toFixed(2)} Prozentpunkte einem konservativen Positionskorridor.`,
      positionPotential
        ? `Ranking-Szenario von höchstens ${positionPotential} Position${positionPotential === 1 ? "" : "en"}; kein Ranking-Versprechen.`
        : "Kein belastbares Positionsszenario für diese Empfehlung.",
      "Suchvolumen und SERP bleiben im Szenario unverändert.",
    ],
    dataBasis: `${rangeKey}: ${impressions} Impressionen, CTR ${ctr.toFixed(2)} %, Position ${position.toFixed(1)}.`,
  };
};

export const estimateMinutes = (effortValue: number): number =>
  effortValue <= 1.5 ? 20 : effortValue <= 2.5 ? 45 : effortValue <= 3.5 ? 90 : 180;

export const buildGraphGaps = (input: SeoAdvisorInput): GraphGapFinding[] => {
  const incoming = new Map<string, number>();
  const outgoing = new Map<string, number>();
  for (const edge of input.graph.edges) {
    incoming.set(edge.target, (incoming.get(edge.target) ?? 0) + 1);
    outgoing.set(edge.source, (outgoing.get(edge.source) ?? 0) + 1);
  }
  const gaps: GraphGapFinding[] = [];
  const clusters = new Map<string, typeof input.graph.nodes>();
  for (const node of input.graph.nodes) {
    if (node.cluster) clusters.set(node.cluster, [...(clusters.get(node.cluster) ?? []), node]);
    const linksIn = incoming.get(node.id) ?? 0;
    const linksOut = outgoing.get(node.id) ?? 0;
    if (linksIn === 0) {
      gaps.push({
        id: `orphan|${node.id}`,
        kind: "verwaiste-seite",
        route: node.route,
        cluster: node.cluster,
        evidence: "Der aktuelle Content Graph enthält keinen eingehenden Link zu dieser Seite.",
        recommendation: "Einen kontextuell passenden Link aus Hub, Guide oder Vergleich prüfen.",
        priority: node.priority && node.priority >= 80 ? "high" : "medium",
      });
    } else if (linksIn + linksOut <= 2) {
      gaps.push({
        id: `weak|${node.id}`,
        kind: "schwache-verlinkung",
        route: node.route,
        cluster: node.cluster,
        evidence: `Im Content Graph sind nur ${linksIn} eingehende und ${linksOut} ausgehende Kanten erfasst.`,
        recommendation: "Linkrolle im Cluster prüfen und nur semantisch notwendige Verbindungen ergänzen.",
        priority: "medium",
      });
    }
  }
  for (const [cluster, nodes] of clusters) {
    if (nodes.length < 2) {
      gaps.push({
        id: `cluster|${cluster}`,
        kind: "fehlender-cluster",
        cluster,
        evidence: `Der Cluster „${cluster}“ enthält im aktuellen Graph nur ${nodes.length} Seite.`,
        recommendation: "Zuerst Search-Nachfrage und Intent-Abgrenzung prüfen; keine Seite automatisch erzeugen.",
        priority: "low",
      });
    }
    if (!nodes.some((node) => node.cornerstone)) {
      gaps.push({
        id: `cornerstone|${cluster}`,
        kind: "fehlender-cornerstone",
        cluster,
        evidence: `Im Cluster „${cluster}“ ist kein Node als Cornerstone markiert.`,
        recommendation: "Bestehenden Hub und Graph-Metadaten prüfen, bevor neuer Content geplant wird.",
        priority: nodes.length >= 4 ? "high" : "medium",
      });
    }
  }
  return gaps
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
    .slice(0, 20);
};

export const buildEditorialCalendar = (documents: ContentDocument[], now = new Date()): EditorialCalendarItem[] => {
  const month = now.getMonth() + 1;
  const seasonal = month >= 5 && month <= 8
    ? /trink|wasser|hitze|gps|entlaufen/i
    : month >= 10 || month <= 1
      ? /futter|gewicht|indoor|kamera/i
      : /gps|tracker|futter|trink/i;
  return documents.flatMap((document) => {
    const timestamp = Date.parse(document.updatedAt || document.publishedAt);
    const ageDays = Number.isFinite(timestamp) ? Math.floor((now.getTime() - timestamp) / DAY) : undefined;
    const reasons: string[] = [];
    if (ageDays === undefined) reasons.push("Kein belastbares Aktualisierungsdatum");
    else if (ageDays > 540) reasons.push(`Seit ${ageDays} Tagen nicht aktualisiert`);
    if (seasonal.test(`${document.title} ${document.topics.join(" ")}`)) reasons.push("Aktuell saisonal relevantes Thema");
    if (document.collection === "products" && !document.hasProductDataSource) reasons.push("Produktdatenquelle redaktionell offen");
    if (!reasons.length) return [];
    const overdue = ageDays === undefined || ageDays > 540 || !document.hasProductDataSource && document.collection === "products";
    return [{
      id: `calendar|${document.id}`,
      route: document.route,
      title: document.title,
      reason: reasons.join(" · "),
      due: overdue ? "überfällig" : "diesen-monat",
      ageDays,
      priority: overdue ? "high" : "medium",
    } satisfies EditorialCalendarItem];
  }).sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]))
    .slice(0, 20);
};

export const buildConversionInsights = (input: SeoAdvisorInput): ConversionInsight[] =>
  [...input.range.pages]
    .sort((a, b) => b.impressions - a.impressions)
    .flatMap((row) => {
      const document = input.documents.find((item) => normalizeSeoPath(item.route) === row.normalizedPath);
      if (!document) return [];
      const body = document.body;
      const missingSignals: string[] = [];
      if (!/\/produkt\//i.test(body)) missingSignals.push("kein Produktlink im Markdown");
      if (!/\/vergleiche\//i.test(body)) missingSignals.push("kein Vergleichslink im Markdown");
      if (!/cta|jetzt vergleichen|preis|verfügbarkeit/i.test(body)) missingSignals.push("kein erkennbarer CTA-Hinweis im Inhalt");
      if (!missingSignals.length) return [];
      return [{
        id: `conversion|${row.normalizedPath}`,
        route: row.normalizedPath,
        impressions: row.impressions,
        clicks: row.clicks,
        missingSignals,
        evidence: `${row.impressions} Search-Impressionen; strukturelle Prüfung des Quelldokuments: ${missingSignals.join(", ")}. Interaktions- oder Affiliate-Klickdaten liegen nicht vor.`,
        recommendation: "Funnel im gerenderten Seitentyp prüfen und nur einen zur Suchintention passenden nächsten Schritt ergänzen.",
        confidence: row.impressions >= 100 ? 0.72 : row.impressions >= 20 ? 0.58 : 0.4,
      } satisfies ConversionInsight];
    })
    .slice(0, 12);

export const quickWins = (opportunities: AdvisorOpportunity[]): AdvisorOpportunity[] =>
  opportunities
    .filter((item) => item.effortValue <= 2.5 && item.impact >= 3 && item.confidence >= 0.6)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

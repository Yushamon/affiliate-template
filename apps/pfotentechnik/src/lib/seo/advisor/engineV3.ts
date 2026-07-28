import { getCornerstoneEntries, normalizeTaxonomyPath, normalizeTaxonomyTerm } from "../../../domain/content/linkTaxonomy";
import { normalizeSeoPath } from "../loadDashboard";
import { buildSeoAdvisor as buildBaseSeoAdvisor } from "./engine";
import type { LinkRecommendation, SeoAdvisorInput, SeoAdvisorResult } from "./types";

const stableId = (...parts: string[]) => parts.join("|").toLocaleLowerCase("de-DE").replace(/[^a-z0-9|/-]+/g, "-");
const cornerstoneEntries = getCornerstoneEntries();

const containsEffectiveLink = (body: string, route: string) =>
  body.includes(`](${route}`) || body.includes(`href="${route}`) || body.includes(`href='${route}`);

const dynamicLinkRecommendations = (input: SeoAdvisorInput): LinkRecommendation[] => {
  const visibleRoutes = new Set(input.range.pages.map((page) => normalizeSeoPath(page.normalizedPath)));
  return input.documents.flatMap((document) => {
    const sourceRoute = normalizeSeoPath(document.route);
    const documentTopics = new Set([
      ...document.topics.map(normalizeTaxonomyTerm),
      normalizeTaxonomyTerm(document.cluster)
    ].filter(Boolean));
    const candidates = cornerstoneEntries
      .map((entry) => ({
        entry,
        overlap: entry.topics.filter((topic) => documentTopics.has(normalizeTaxonomyTerm(topic))).length
      }))
      .filter(({ entry, overlap }) => overlap > 0 && normalizeSeoPath(normalizeTaxonomyPath(entry.href)) !== sourceRoute)
      .sort((a, b) => b.overlap - a.overlap || a.entry.id.localeCompare(b.entry.id, "de"));
    const candidate = candidates[0];
    if (!candidate) return [];
    const targetRoute = normalizeTaxonomyPath(candidate.entry.href);
    if (containsEffectiveLink(document.body, targetRoute)) return [];
    return [{
      id: stableId("link-v3", sourceRoute, targetRoute),
      sourceRoute,
      sourceFile: document.filePath,
      targetRoute,
      anchorText: candidate.entry.title,
      context: `Im Abschnitt, der „${document.title}“ dem Themencluster zuordnet.`,
      rationale: `Die zentrale Linktaxonomie erkennt ${candidate.overlap} gemeinsame Themen mit dem Cornerstone. Weder gerendertes HTML noch simulierte Auto-Link-Ausgabe enthält das Ziel.`,
      priority: visibleRoutes.has(sourceRoute) ? "high" : "medium"
    } satisfies LinkRecommendation];
  });
};

export const buildSeoAdvisor = (input: SeoAdvisorInput): SeoAdvisorResult => {
  const base = buildBaseSeoAdvisor(input);
  const effectiveMissing = dynamicLinkRecommendations(input);
  const stillMissing = base.linkRecommendations.filter((recommendation) => {
    const document = input.documents.find((candidate) => normalizeSeoPath(candidate.route) === normalizeSeoPath(recommendation.sourceRoute));
    return document ? !containsEffectiveLink(document.body, normalizeTaxonomyPath(recommendation.targetRoute)) : true;
  });
  const linkRecommendations = [...stillMissing, ...effectiveMissing]
    .filter((item, index, items) => items.findIndex((candidate) => candidate.sourceRoute === item.sourceRoute && candidate.targetRoute === item.targetRoute) === index)
    .sort((a, b) => ({ high: 0, medium: 1, low: 2 }[a.priority] - { high: 0, medium: 1, low: 2 }[b.priority]) || a.sourceRoute.localeCompare(b.sourceRoute, "de"))
    .slice(0, 12);
  return { ...base, linkRecommendations };
};

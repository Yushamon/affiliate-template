import { getAiActionDefinition, resolveFindingAiActionIds } from "./ai-action-registry.mjs";
import { buildCodexPrompt } from "./prompts.ts";
import type { QualityFinding } from "./types";
import type { PromptTemplateId } from "./prompt-registry.ts";

const slugFromRoute = (route?: string) => {
  if (typeof route !== "string" || !route.trim()) return undefined;
  const match = route.match(/^\/(?:produkt|vergleiche)\/([^/]+)\/?$/);
  return match?.[1];
};

export const buildFindingAiActions = (finding: QualityFinding) => {
  const configuredIds = Array.isArray(finding?.aiActionIds)
    ? finding.aiActionIds.filter(
        (actionId): actionId is string =>
          typeof actionId === "string" && actionId.trim().length > 0,
      )
    : [];

  const resolvedIds = configuredIds.length
    ? configuredIds
    : resolveFindingAiActionIds(finding);

  const actionIds = [...new Set(
    (resolvedIds.length ? resolvedIds : ["codex-send"])
      .filter((actionId) => typeof actionId === "string" && actionId.trim().length > 0),
  )];

  if (!actionIds.length) actionIds.push("codex-send");

  return actionIds
    .map((actionId) => {
      const action = getAiActionDefinition(actionId);
      if (!action) return null;
      const result = buildCodexPrompt(
        {
          kind: action.contextKind,
          title: finding.description,
          affectedFile: finding.file || undefined,
          route: finding.route || undefined,
          component: finding.component || undefined,
          slug: slugFromRoute(finding.route),
          category: finding.category,
          problems: [finding.description, finding.impact].filter(Boolean),
          existingData: [
            `Auditquelle: ${finding.source}`,
            `Finding-Typ: ${finding.type}`,
            `Bereich: ${finding.area}`,
            `Priorität: ${finding.priority.score}/100`,
          ],
          missingData: [finding.recommendedSolution].filter(Boolean),
          acceptanceCriteria: [
            `Finding ${finding.id} ist im erneuten Audit nicht mehr aktiv.`,
            finding.releaseBlocker ? "Der Release-Blocker ist nachweislich aufgehoben." : "",
          ].filter(Boolean),
        },
        { templateId: action.templateId as PromptTemplateId },
      );
      return {
        id: action.id,
        label: action.label,
        description: action.description,
        prompt: result.prompt,
        templateId: result.templateId,
      };
    })
    .filter(Boolean);
};
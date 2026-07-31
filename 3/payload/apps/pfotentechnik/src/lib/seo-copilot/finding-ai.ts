import { getAiActionDefinition } from "./ai-action-registry.mjs";
import { buildCodexPrompt } from "./prompts.ts";
import type { QualityFinding } from "./types";
import type { PromptTemplateId } from "./prompt-registry.ts";

const slugFromRoute = (route: string) => {
  const match = route.match(/^\/(?:produkt|vergleiche)\/([^/]+)\/?$/);
  return match?.[1];
};

export const buildFindingAiActions = (finding: QualityFinding) =>
  finding.aiActionIds
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

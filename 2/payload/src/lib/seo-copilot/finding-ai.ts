import {
  getAiActionDefinition,
  listAiActionDefinitions,
  resolveFindingAiActionIds,
} from "./ai-action-registry.mjs";
import { buildCodexPrompt, cleanPromptValue } from "./prompts.ts";
import type { QualityFinding } from "./types";
import type { PromptTemplateId } from "./prompt-registry.ts";

const slugFromRoute = (route: unknown) =>
  cleanPromptValue(route, 500).match(/^\/(?:produkt|vergleiche)\/([^/]+)\/?$/)?.[1];

const compact = (values: unknown[]) =>
  values.map((value) => cleanPromptValue(value)).filter(Boolean);

export const buildFindingAiActions = (finding: QualityFinding) => {
  const requestedActionIds = Array.isArray(finding?.aiActionIds)
    ? finding.aiActionIds.filter(
        (actionId): actionId is string =>
          typeof actionId === "string" && actionId.trim().length > 0,
      )
    : [];

  const actionIds = requestedActionIds.length
    ? requestedActionIds
    : resolveFindingAiActionIds(finding);

  const definitions = listAiActionDefinitions();
  const resolveAction = (actionId: string) =>
    getAiActionDefinition(actionId) ||
    definitions.find((definition) => definition.templateId === actionId) ||
    null;

  return actionIds
    .map((actionId) => {
      const action = resolveAction(actionId);
      if (!action) return null;

      const result = buildCodexPrompt(
        {
          kind: action.contextKind,
          title: finding.description || finding.type || action.label,
          affectedFile: finding.file || undefined,
          route: finding.route || undefined,
          component: finding.component || undefined,
          slug: slugFromRoute(finding.route),
          category: finding.category,
          auditSource: finding.source,
          findingType: finding.type,
          area: finding.area,
          severity: finding.severity,
          priorityScore: finding.priority?.score,
          sourceReports: compact([finding.sourceFile]),
          entityType: finding.route?.startsWith("/produkt/")
            ? "product"
            : finding.route?.startsWith("/hersteller/")
              ? "manufacturer"
              : finding.route?.startsWith("/vergleiche/")
                ? "comparison"
                : finding.component
                  ? "component"
                  : finding.route
                    ? "page"
                    : "unknown",
          problems: compact([finding.description, finding.impact]),
          existingData: compact([
            finding.recommendedAction
              ? `Vorgesehene Aktion: ${finding.recommendedAction}`
              : "",
            finding.autoFixAvailable
              ? `Sicherer Auto-Fix registriert: ${finding.autoFixId}`
              : "",
            finding.releaseBlocker ? "Release-Blocker: ja" : "",
          ]),
          missingData: compact([
            finding.recommendedSolution,
            !finding.file
              ? "Betroffene Datei aus dem Quellreport ermitteln."
              : "",
            !finding.route
              ? "Betroffene Route aus Finding und Renderingpfad ermitteln."
              : "",
            !finding.component
              ? "Betroffene Komponente aus Imports und Renderingpfad ermitteln."
              : "",
          ]),
          acceptanceCriteria: compact([
            `Finding ${finding.id} ist im erneuten Audit nicht mehr aktiv.`,
            finding.releaseBlocker
              ? "Der Release-Blocker ist nachweislich aufgehoben."
              : "",
          ]),
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

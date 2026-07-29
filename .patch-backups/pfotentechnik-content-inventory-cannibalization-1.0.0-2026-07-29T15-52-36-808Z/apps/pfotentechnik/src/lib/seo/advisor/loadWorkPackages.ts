import { buildSeoWorkPackages, tasksFromProductHealth } from "./work-packages";
import { mergeGeneratedPackagesIntoWorkspace } from "../../seo-copilot/package-workflow.mjs";
import { readCopilotWorkspace } from "../../seo-copilot/store.mjs";
import { loadSeoAdvisorData } from "./loadAdvisorData";

const loadSeoWorkPackageDataUncached = async () => {
  const { payload, results, productIntelligence } = await loadSeoAdvisorData();
  const workspace = readCopilotWorkspace();
  const productTaskIds = tasksFromProductHealth(productIntelligence.health).map((task) => task.id);
  const rangeEntries = Object.entries(payload.ranges).map(([key, range]) => {
    const result = results[key];
    if (!result) {
      throw new Error(`SEO-Advisor-Ergebnis für Zeitraum "${key}" fehlt.`);
    }
    const packages = buildSeoWorkPackages({
      opportunities: result.opportunities,
      rangeKey: key,
      productHealth: productIntelligence.health,
      storedPackages: workspace.workPackages,
    });
    const suppressed = new Set(
      packages
        .filter((pkg) => [
          "sent-to-codex",
          "verification-pending",
          "waiting-window",
          "review-due",
          "snoozed",
          "verified",
          "needs-work",
        ].includes(pkg.status))
        .flatMap((pkg) => pkg.taskIds),
    );
    return [key, {
      label: range.label,
      packages,
      activeTaskIds: [...new Set([
        ...result.opportunities.map((task) => task.id),
        ...productTaskIds,
      ])],
      individualTasks: result.opportunities.filter((task) => !suppressed.has(task.id)),
    }] as const;
  });

  mergeGeneratedPackagesIntoWorkspace(rangeEntries.flatMap(([, value]) => value.packages));

  return {
    defaultRange: payload.defaultRange,
    generatedAt: payload.generatedAt,
    ranges: Object.fromEntries(rangeEntries),
  };
};

let seoWorkPackageDataPromise: ReturnType<typeof loadSeoWorkPackageDataUncached> | undefined;

export const loadSeoWorkPackageData = () => {
  seoWorkPackageDataPromise ??= loadSeoWorkPackageDataUncached();
  return seoWorkPackageDataPromise;
};

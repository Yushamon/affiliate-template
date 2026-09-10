export const featureGates = Object.freeze({
  fountainRunningCosts: Object.freeze({
    productionEnabled: false,
    previewEnvironmentVariable: "PFOTENTECHNIK_FOUNTAIN_COSTS_PREVIEW"
  })
});

export function resolveFountainRunningCostsGate({
  isDev = false,
  previewRequested = false
}: {
  isDev?: boolean;
  previewRequested?: boolean;
} = {}) {
  return featureGates.fountainRunningCosts.productionEnabled || (isDev && previewRequested);
}

export const AUTO_FIX_REGISTRY = Object.freeze({
  "comparison-safe-autofix": Object.freeze({
    id: "comparison-safe-autofix",
    label: "Comparison-Metadaten sicher normalisieren",
    description: "Führt ausschließlich den vorhandenen Comparison-Auto-Fix mit Vorprüfung und Strict-Nachprüfung aus.",
    steps: Object.freeze([
      { id: "comparison-fix-check", phase: "preflight", label: "Comparison-Auto-Fix ohne Schreibzugriff prüfen", percent: 10 },
      { id: "comparison-fix", phase: "apply", label: "Freigegebenen Comparison-Auto-Fix ausführen", percent: 35 },
      { id: "comparison-audit-strict", phase: "verification", label: "Comparison Strict-Audit ausführen", percent: 65 },
      { id: "quality-ops-sync", phase: "verification", label: "Quality Operations erneut synchronisieren", percent: 85 },
    ]),
    successNote: "Comparison-Auto-Fix, Strict-Audit und zentraler Abgleich erfolgreich.",
  }),
});

export function getAutoFixDefinition(id) {
  return AUTO_FIX_REGISTRY[id] || null;
}

export function listAutoFixDefinitions() {
  return Object.values(AUTO_FIX_REGISTRY);
}

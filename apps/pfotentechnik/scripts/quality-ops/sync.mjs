#!/usr/bin/env node
import { appendCopilotAudit, readCopilotWorkspace, writeCopilotWorkspace } from "../../src/lib/seo-copilot/store.mjs";
import {
  groupQualityFindings,
  reconcileQualityFindings,
  summarizeQualityOperations,
} from "../../src/lib/seo-copilot/quality-operations.mjs";
import { collectQualitySources } from "./sources.mjs";

const args = new Set(process.argv.slice(2));
const strict = args.has("--strict");
const now = new Date().toISOString();
const workspace = readCopilotWorkspace();
const collected = collectQualitySources();
const reconciled = reconcileQualityFindings(collected.findings, workspace.qualityFindings, { now });
const groups = groupQualityFindings(reconciled.findings);
const summary = summarizeQualityOperations(reconciled.findings, collected.sources);
const snapshot = {
  id: `quality-snapshot-${now}`,
  generatedAt: now,
  summary,
  sourceCount: collected.sources.length,
};

const next = writeCopilotWorkspace({
  ...workspace,
  qualityFindings: reconciled.findings,
  qualityGroups: groups,
  qualitySources: collected.sources,
  qualityHistory: [...workspace.qualityHistory, ...reconciled.history].slice(-5000),
  qualitySnapshots: [...workspace.qualitySnapshots, snapshot].slice(-90),
});
appendCopilotAudit({
  action: "quality-operations.sync",
  sources: collected.sources.filter((item) => item.status === "available").map((item) => item.reportPath),
  warnings: collected.sources.filter((item) => item.status !== "available").map((item) => `${item.label}: ${item.status}`),
  summary,
});

console.log(`Quality Operations: ${summary.active} aktiv, ${summary.releaseBlockers} Release-Blocker, ${summary.regressions} Regressionen.`);
console.log(`Quellen: ${summary.sourcesAvailable} verfügbar, ${summary.sourcesMissing} fehlend. Gruppen: ${groups.length}.`);
console.log(`Workspace: ${next.updatedAt}`);
if (strict && summary.releaseBlockers > 0) {
  console.error(`Release blockiert: ${summary.releaseBlockers} aktive Quality-Operations-Blocker.`);
  process.exitCode = 1;
}

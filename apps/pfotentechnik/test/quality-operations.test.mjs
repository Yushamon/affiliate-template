import test from "node:test";
import assert from "node:assert/strict";
import {
  QUALITY_STATUSES,
  calculateQualityPriority,
  groupQualityFindings,
  normalizeQualityFinding,
  reconcileQualityFindings,
  summarizeQualityOperations,
} from "../src/lib/seo-copilot/quality-operations.mjs";
import { QUALITY_SOURCE_REGISTRY, collectQualitySources } from "../scripts/quality-ops/sources.mjs";
import { ALLOWED_SEARCH_ACTIONS } from "../src/lib/search/action-service.mjs";

const now = "2026-07-29T12:00:00.000Z";
const raw = {
  type: "CANONICAL_MISSING",
  severity: "error",
  source: "Technical SEO",
  reportPath: "reports/test.json",
  file: "src/pages/test.astro",
  route: "/test/",
  description: "Canonical fehlt.",
  recommendedAction: "Canonical ergänzen.",
};

test("ein Finding besitzt das vollständige einheitliche Aufgabenmodell", () => {
  const finding = normalizeQualityFinding(raw, { now });
  for (const key of [
    "id", "type", "category", "area", "severity", "confidence", "priority", "status", "source",
    "files", "urls", "description", "impact", "autoFixAvailable", "manualFixRequired",
    "recommendedAction", "createdAt", "lastCheckedAt", "lastChangedAt",
  ]) assert.ok(Object.hasOwn(finding, key), key);
  assert.equal(finding.area, "canonicals");
  assert.equal(finding.status, "open");
});

test("Priorisierung gewichtet Release-Blocker höher als gleichartige Hinweise", () => {
  const blocker = calculateQualityPriority({ severity: "error", releaseBlocker: true, effort: 50 });
  const notice = calculateQualityPriority({ severity: "warning", releaseBlocker: false, effort: 50 });
  assert.ok(blocker.score > notice.score);
  assert.equal(blocker.level, "high");
});

test("behobene Findings werden historisiert und erneutes Auftreten ist eine Regression", () => {
  const first = reconcileQualityFindings([raw], [], { now });
  const fixed = reconcileQualityFindings([], first.findings, { now: "2026-07-30T12:00:00.000Z" });
  assert.equal(fixed.findings[0].status, "fixed");
  const regression = reconcileQualityFindings([raw], fixed.findings, { now: "2026-07-31T12:00:00.000Z" });
  assert.equal(regression.findings[0].status, "regression");
  assert.equal(regression.history[0].from, "fixed");
});

test("intelligente Gruppen bleiben auf vier Findings und fünf Dateien begrenzt", () => {
  const findings = Array.from({ length: 9 }, (_, index) => normalizeQualityFinding({
    ...raw,
    id: `finding-${index}`,
    description: `Canonical ${index} fehlt.`,
  }, { now }));
  const groups = groupQualityFindings(findings);
  assert.ok(groups.length >= 3);
  assert.ok(groups.every((group) => group.findingIds.length <= 4 && group.files.length <= 5));
});

test("Statusmodell enthält alle geforderten Operations-Zustände", () => {
  for (const status of ["open", "in-progress", "fixed", "ignored", "snoozed", "waiting", "manual-review", "auto-fixed", "regression"]) {
    assert.ok(QUALITY_STATUSES.includes(status));
  }
});

test("Ignored bleibt stabil und ein abgelaufenes Snooze wird wieder geöffnet", () => {
  const ignored = normalizeQualityFinding(raw, { now, previous: { ...normalizeQualityFinding(raw, { now }), status: "ignored" } });
  assert.equal(ignored.status, "ignored");
  const snoozed = normalizeQualityFinding(raw, {
    now,
    previous: { ...normalizeQualityFinding(raw, { now }), status: "snoozed", snoozedUntil: "2026-07-28T12:00:00.000Z" },
  });
  assert.equal(snoozed.status, "open");
});

test("Registry deckt alle geforderten Audit-Bereiche ab und liest vorhandene Reports", () => {
  assert.ok(QUALITY_SOURCE_REGISTRY.length >= 27);
  const collected = collectQualitySources();
  assert.equal(collected.sources.length, QUALITY_SOURCE_REGISTRY.length);
  assert.ok(collected.sources.some((source) => source.id === "repository-audit" && source.status === "available"));
  assert.ok(collected.findings.length > 0);
});

test("Zusammenfassung erkennt Blocker, Regression und manuelle Prüfung", () => {
  const findings = [
    normalizeQualityFinding({ ...raw, releaseBlocker: true }, { now }),
    normalizeQualityFinding({ ...raw, id: "regression", status: "regression" }, { now }),
    normalizeQualityFinding({ ...raw, id: "manual", status: "manual-review" }, { now }),
  ];
  const summary = summarizeQualityOperations(findings, [{ status: "available" }, { status: "missing" }]);
  assert.equal(summary.releaseBlockers, 1);
  assert.equal(summary.regressions, 1);
  assert.equal(summary.manualReview, 1);
  assert.equal(summary.sourcesAvailable, 1);
});

test("Admin-Allowlist enthält Status- und sicheren Auto-Fix, aber keine generische Shell", () => {
  assert.ok(ALLOWED_SEARCH_ACTIONS.includes("quality.finding.status"));
  assert.ok(ALLOWED_SEARCH_ACTIONS.includes("quality.finding.auto-fix"));
  assert.equal(ALLOWED_SEARCH_ACTIONS.some((action) => /shell|exec/i.test(action)), false);
});

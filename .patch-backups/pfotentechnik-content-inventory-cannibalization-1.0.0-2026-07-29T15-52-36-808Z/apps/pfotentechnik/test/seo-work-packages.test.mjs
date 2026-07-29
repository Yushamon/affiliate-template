import test from "node:test";
import assert from "node:assert/strict";
import {
  applyStoredPackageState,
  buildSeoWorkPackages,
  calculatePackageImpact,
  resolvePackageLifecycle,
  suppressedTaskIdsForPackages,
  visibleIndividualTasks,
} from "../src/lib/seo/advisor/work-packages.ts";
import { migrateCopilotWorkspace } from "../src/lib/seo-copilot/store.mjs";
import { ALLOWED_SEARCH_ACTIONS } from "../src/lib/search/action-service.mjs";

const now = "2026-07-28T08:00:00.000Z";
const opportunity = (overrides = {}) => ({
  id: "task-a",
  title: "Aufgabe A",
  description: "Konkreter Befund",
  category: "technical",
  priority: "medium",
  impact: 3,
  effortValue: 2,
  effort: "niedrig",
  confidence: 0.9,
  score: 65,
  estimatedMinutes: 30,
  forecast: { ctrPotential: 0, positionPotential: 0, clickPotential: 0, trafficPotential: 0, confidence: 0.9, assumptions: [], dataBasis: "test" },
  url: "/ratgeber/",
  rationale: "Audit-Befund",
  nextAction: "Gezielt korrigieren",
  source: "Test-Audit",
  rangeKey: "28d",
  lowData: false,
  expectedBenefit: "hoch",
  steps: ["Datei prüfen", "Befund korrigieren"],
  pageType: "Ratgeber",
  affectedFile: "apps/pfotentechnik/src/content/pages/ratgeber.md",
  dataBasis: { impressions: 40, clicks: 2, ctr: 5, position: 8 },
  prompt: "prompt",
  codexPrompt: "codex",
  ...overrides,
});

const build = (items, storedPackages = []) => buildSeoWorkPackages({ opportunities: items, rangeKey: "28d", storedPackages, now });

test("Paketbildung ist mit festem Zeitstempel deterministisch", () => {
  assert.deepEqual(build([opportunity()]), build([opportunity()]));
});

test("Ein Paket enthält höchstens vier Aufgaben", () => {
  const items = Array.from({ length: 9 }, (_, index) => opportunity({ id: `task-${index}`, title: `Aufgabe ${index}`, description: `Befund ${index}` }));
  assert.ok(build(items).every((pkg) => pkg.tasks.length <= 4));
});

test("Verschiedene Prüfmodi werden nicht gemischt", () => {
  const packages = build([
    opportunity({ id: "technical", category: "technical" }),
    opportunity({ id: "ranking", category: "ranking", affectedFile: "apps/pfotentechnik/src/content/pages/other.md" }),
  ]);
  assert.ok(packages.every((pkg) => new Set(pkg.tasks.map((task) => task.verificationMode)).size === 1));
});

test("Ein High-Priority-Paket steht vor mehreren Low-Priority-Paketen", () => {
  const packages = build([
    opportunity({ id: "high", priority: "high", score: 78, impact: 4, affectedFile: "apps/pfotentechnik/src/content/pages/high.md" }),
    ...Array.from({ length: 8 }, (_, index) => opportunity({ id: `low-${index}`, priority: "low", score: 30, impact: 1, affectedFile: `apps/pfotentechnik/src/content/pages/low-${index}.md` })),
  ]);
  assert.equal(packages[0].priority, "high");
});

test("Paket-Impact bleibt zwischen 0 und 100", () => {
  const packages = build([opportunity({ score: 500, impact: 100 })]);
  assert.ok(packages.every((pkg) => pkg.impact >= 0 && pkg.impact <= 100));
  assert.equal(calculatePackageImpact([]), 0);
});

test("Aufgaben derselben Datei werden bevorzugt gebündelt", () => {
  const packages = build([
    opportunity({ id: "same-1", description: "Erster Befund" }),
    opportunity({ id: "same-2", description: "Zweiter Befund" }),
    opportunity({ id: "other", affectedFile: "apps/pfotentechnik/src/content/pages/other.md", description: "Dritter Befund" }),
  ]);
  assert.ok(packages.some((pkg) => pkg.taskIds.includes("same-1") && pkg.taskIds.includes("same-2")));
});

test("Paket-Prompt enthält alle Task-IDs", () => {
  const pkg = build([opportunity({ id: "id-one", description: "Eins" }), opportunity({ id: "id-two", description: "Zwei" })])[0];
  assert.match(pkg.codexPrompt, /id-one/);
  assert.match(pkg.codexPrompt, /id-two/);
});

test("Gemeinsame Validierungen erscheinen nur einmal", () => {
  const prompt = build([opportunity(), opportunity({ id: "task-b", description: "Anderer Befund" })])[0].codexPrompt;
  const command = "npm run build:pfotentechnik";
  assert.equal(prompt.split(command).length - 1, 1);
  assert.equal(prompt.split("Gemeinsame Validierung, nur einmal am Ende ausführen:").length - 1, 1);
});

test("Secret-Redaktion bleibt im Paket-Prompt aktiv", () => {
  const pkg = build([opportunity({ description: "api_key=super-secret" })])[0];
  assert.equal(pkg.codexPrompt.includes("super-secret"), false);
  assert.match(pkg.codexPrompt, /\[REDACTED\]/);
});

test("Workspace-Migration verliert keine bestehenden Daten", () => {
  const migrated = migrateCopilotWorkspace({ schemaVersion: 1, productCandidates: [{ id: "candidate" }], productDrafts: [{ id: "draft" }], jobs: [{ id: "job" }] });
  assert.equal(migrated.schemaVersion, 2);
  assert.equal(migrated.productCandidates[0].id, "candidate");
  assert.equal(migrated.productDrafts[0].id, "draft");
  assert.equal(migrated.jobs[0].id, "job");
  assert.deepEqual(migrated.workPackages, []);
});

test("Snooze unterdrückt Aufgaben bis zum Enddatum", () => {
  const base = build([opportunity()])[0];
  const stored = { id: base.id, status: "snoozed", createdAt: now, updatedAt: now, snoozedUntil: "2026-08-11T08:00:00.000Z" };
  const pkg = build([opportunity()], [stored])[0];
  assert.equal(pkg.status, "snoozed");
  assert.ok(suppressedTaskIdsForPackages([pkg]).has("task-a"));
});

test("Abgelaufenes Snooze erscheint wieder offen", () => {
  const base = build([opportunity()])[0];
  const stored = { id: base.id, status: "snoozed", createdAt: now, updatedAt: now, snoozedUntil: "2026-07-27T08:00:00.000Z" };
  assert.equal(build([opportunity()], [stored])[0].status, "open");
});

test("Search-Paket wird vor verifyAfter nicht voreilig verifiziert", () => {
  const result = resolvePackageLifecycle({ verificationMode: "search-window", verifyAfter: "2026-08-11T08:00:00.000Z", sentAt: now, taskIds: ["ranking"] }, { now, activeTaskIds: [], checks: [{ command: "build", status: "passed" }], searchGeneratedAt: "2026-07-29T08:00:00.000Z" });
  assert.equal(result.status, "waiting-window");
});

test("Verbleibende Befunde erzeugen needs-work", () => {
  const result = resolvePackageLifecycle({ verificationMode: "immediate", verifyAfter: null, sentAt: now, taskIds: ["task-a"] }, { now, activeTaskIds: ["task-a"], checks: [{ command: "build", status: "passed" }] });
  assert.equal(result.status, "needs-work");
  assert.deepEqual(result.unresolvedTaskIds, ["task-a"]);
});

test("Verified entsteht nur nach bestandenen Checks und verschwundenen Befunden", () => {
  const result = resolvePackageLifecycle({ verificationMode: "immediate", verifyAfter: null, sentAt: now, taskIds: ["task-a"] }, { now, activeTaskIds: [], checks: [{ command: "build", status: "passed" }] });
  assert.equal(result.status, "verified");
});

test("Action-Allowlist enthält Paketaktionen und keine generische Shell", () => {
  for (const action of ["copilot.package.sent", "copilot.package.snooze", "copilot.package.verify", "copilot.package.reconcile", "copilot.package.reopen"]) assert.ok(ALLOWED_SEARCH_ACTIONS.includes(action));
  assert.equal(ALLOWED_SEARCH_ACTIONS.some((action) => /shell|exec/i.test(action)), false);
});

test("Unterdrückte Aufgaben erscheinen nicht erneut als Einzelaufgaben", () => {
  const pkg = build([opportunity()])[0];
  const storedPkg = applyStoredPackageState({ ...pkg, codexPrompt: undefined }, { id: pkg.id, status: "sent-to-codex", createdAt: now, updatedAt: now }, new Date(now));
  const visible = visibleIndividualTasks([opportunity(), opportunity({ id: "task-b", description: "B" })], [{ status: storedPkg.status, taskIds: pkg.taskIds }]);
  assert.deepEqual(visible.map((task) => task.id), ["task-b"]);
});

test("Auditierbare Product-Health-Befunde werden als eigenes Paket aufgenommen", () => {
  const packages = buildSeoWorkPackages({
    opportunities: [],
    rangeKey: "28d",
    now,
    productHealth: [{
      slug: "model-x",
      title: "Model X",
      score: 42,
      status: "kritisch",
      checks: [{ id: "schema", ok: false, severity: "kritisch", group: "Grunddaten", label: "Schema", evidence: "Pflichtfeld fehlt." }],
    }],
  });
  assert.equal(packages[0].family, "product-health");
  assert.equal(packages[0].verificationMode, "immediate");
  assert.match(packages[0].validationCommands.join("\n"), /audit:products:strict/);
});

test("Ein laufendes Paket bleibt sichtbar, wenn sein Befund bereits verschwunden ist", () => {
  const original = build([opportunity()])[0];
  const stored = {
    id: original.id,
    status: "sent-to-codex",
    createdAt: now,
    updatedAt: now,
    sentAt: now,
    verificationMode: original.verificationMode,
    packageSnapshot: { ...original, codexPrompt: undefined },
  };
  const packages = buildSeoWorkPackages({ opportunities: [], rangeKey: "28d", storedPackages: [stored], now });
  assert.equal(packages.length, 1);
  assert.equal(packages[0].status, "sent-to-codex");
  assert.deepEqual(packages[0].taskIds, ["task-a"]);
});

test("Search-Befund wird erst nach Prüffenster und neuem Sync als Nacharbeit bewertet", () => {
  const before = resolvePackageLifecycle(
    { verificationMode: "search-window", verifyAfter: "2026-08-11T08:00:00.000Z", sentAt: now, taskIds: ["ranking"] },
    { now, activeTaskIds: ["ranking"], checks: [{ command: "build", status: "passed" }], searchGeneratedAt: "2026-07-29T08:00:00.000Z" },
  );
  assert.equal(before.status, "waiting-window");
  const due = resolvePackageLifecycle(
    { verificationMode: "search-window", verifyAfter: "2026-08-11T08:00:00.000Z", sentAt: now, taskIds: ["ranking"] },
    { now: "2026-08-12T08:00:00.000Z", activeTaskIds: ["ranking"], checks: [{ command: "build", status: "passed" }], searchGeneratedAt: "2026-08-12T07:00:00.000Z" },
  );
  assert.equal(due.status, "needs-work");
});

test("Nicht ausgeführte Pflichtprüfung verhindert verified", () => {
  const result = resolvePackageLifecycle(
    { verificationMode: "immediate", verifyAfter: null, sentAt: now, taskIds: ["task-a"] },
    { now, activeTaskIds: [], checks: [{ command: "build", status: "not-run" }] },
  );
  assert.equal(result.status, "needs-work");
});


test("Bereits beanspruchte Task-IDs erzeugen bei veränderter Paketbildung kein zweites offenes Paket", () => {
  const original = build([
    opportunity({ id: "claimed-a", description: "A" }),
    opportunity({ id: "claimed-b", description: "B" }),
  ])[0];
  const stored = {
    id: original.id,
    status: "sent-to-codex",
    createdAt: now,
    updatedAt: now,
    sentAt: now,
    verificationMode: original.verificationMode,
    packageSnapshot: { ...original, codexPrompt: undefined },
  };
  const packages = build([
    opportunity({ id: "claimed-b", description: "B" }),
    opportunity({ id: "new-c", description: "C", affectedFile: "apps/pfotentechnik/src/content/pages/new.md" }),
  ], [stored]);
  assert.equal(packages.filter((pkg) => pkg.taskIds.includes("claimed-b")).length, 1);
  assert.equal(packages.find((pkg) => pkg.taskIds.includes("claimed-b"))?.status, "sent-to-codex");
  assert.equal(packages.find((pkg) => pkg.taskIds.includes("new-c"))?.status, "open");
});

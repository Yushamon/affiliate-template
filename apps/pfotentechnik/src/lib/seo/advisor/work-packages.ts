import type { AdvisorEffort, AdvisorOpportunity, AdvisorPriority } from "./types";

export type SeoWorkPackageFamily =
  | "technical-structure"
  | "eeat-content-quality"
  | "ranking-snippet"
  | "search-intent-content-gap"
  | "product-health";

export type SeoVerificationMode = "immediate" | "search-window" | "manual";
export type SeoWorkPackageStatus =
  | "open"
  | "sent-to-codex"
  | "verification-pending"
  | "waiting-window"
  | "review-due"
  | "needs-work"
  | "verified"
  | "snoozed";

export type SeoWorkPackageTask = {
  id: string;
  title: string;
  priority: AdvisorPriority;
  score: number;
  explicitImpact: number;
  confidence: number;
  effortValue: number;
  effort: AdvisorEffort;
  family: SeoWorkPackageFamily;
  verificationMode: SeoVerificationMode;
  url?: string;
  query?: string;
  affectedFile?: string;
  problem: string;
  dataBasis: string;
  nextAction: string;
  steps: string[];
  acceptanceCriteria: string[];
  pageType: string;
  lowConfidence: boolean;
  sourceKind: "advisor" | "product-health";
};

export type SeoPackageCheck = {
  command: string;
  status: "passed" | "failed" | "not-run";
  output?: string;
  checkedAt?: string;
};

export type StoredSeoWorkPackage = {
  id: string;
  status: SeoWorkPackageStatus;
  createdAt: string;
  updatedAt: string;
  sentAt?: string | null;
  verifyAfter?: string | null;
  snoozedUntil?: string | null;
  snoozeReason?: string | null;
  verificationMode?: SeoVerificationMode;
  lastVerification?: {
    checkedAt: string;
    searchGeneratedAt?: string | null;
    manifest?: unknown;
    reason?: string;
  } | null;
  unresolvedTaskIds?: string[];
  passedChecks?: SeoPackageCheck[];
  failedChecks?: SeoPackageCheck[];
  packageSnapshot?: Partial<SeoWorkPackage>;
};

export type SeoWorkPackage = {
  id: string;
  title: string;
  rangeKey: string;
  family: SeoWorkPackageFamily;
  priority: AdvisorPriority;
  impact: number;
  confidence: number;
  effortValue: number;
  effort: AdvisorEffort;
  verificationMode: SeoVerificationMode;
  verifyAfter: string | null;
  taskIds: string[];
  affectedFiles: string[];
  tasks: SeoWorkPackageTask[];
  validationCommands: string[];
  codexPrompt: string;
  status: SeoWorkPackageStatus;
  createdAt: string;
  updatedAt: string;
  sentAt: string | null;
  snoozedUntil: string | null;
  snoozeReason: string | null;
  lastVerification: StoredSeoWorkPackage["lastVerification"];
  unresolvedTaskIds: string[];
  passedChecks: SeoPackageCheck[];
  failedChecks: SeoPackageCheck[];
};

export type ProductHealthInput = {
  slug: string;
  title: string;
  score: number;
  status: string;
  filePath?: string;
  checks?: Array<{
    id: string;
    ok: boolean;
    severity: string;
    group: string;
    label: string;
    evidence: string;
  }>;
};

export type WorkPackageBuildInput = {
  opportunities: AdvisorOpportunity[];
  rangeKey: string;
  productHealth?: ProductHealthInput[];
  storedPackages?: StoredSeoWorkPackage[];
  now?: Date | string;
};

const PRIORITY_WEIGHT: Record<AdvisorPriority, number> = { high: 3, medium: 2, low: 1 };
const EFFORT_LABEL: Array<[number, AdvisorEffort]> = [[2, "niedrig"], [3.5, "mittel"], [Number.POSITIVE_INFINITY, "hoch"]];
const ACTIVE_SUPPRESSION_STATUSES = new Set<SeoWorkPackageStatus>([
  "sent-to-codex",
  "verification-pending",
  "waiting-window",
  "review-due",
  "snoozed",
  "verified",
  "needs-work",
]);

const clamp = (value: number, minimum = 0, maximum = 100) => Math.min(maximum, Math.max(minimum, value));
const unique = <T>(values: T[]) => [...new Set(values)];
const dateValue = (value: Date | string | undefined) => value instanceof Date ? value : new Date(value ?? Date.now());
const addDays = (date: Date, days: number) => new Date(date.getTime() + days * 86_400_000);
const normalizedText = (value: string) => value.toLocaleLowerCase("de-DE").normalize("NFD").replace(/\p{Diacritic}/gu, "").replace(/[^a-z0-9]+/g, " ").trim();
const stableHash = (value: string) => {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(36).padStart(7, "0");
};

export const redactWorkPackageSecrets = (value: unknown): string => String(value ?? "")
  .replace(/(?:client_secret|refresh_token|access_token|api[_-]?key|authorization)\s*[:=]\s*\S+/gi, (match) => `${match.split(/[=:]/)[0]}=[REDACTED]`)
  .replace(/\b(?:ghp|github_pat|sk)-[A-Za-z0-9_-]{12,}\b/g, "[REDACTED]")
  .replace(/[\u0000-\u0008\u000b\u000c\u000e-\u001f]/g, " ")
  .trim();

const familyForOpportunity = (category: AdvisorOpportunity["category"]): SeoWorkPackageFamily => {
  if (category === "technical" || category === "internal-link" || category === "cannibalization") return "technical-structure";
  if (category === "eeat") return "eeat-content-quality";
  if (category === "ranking" || category === "ctr") return "ranking-snippet";
  return "search-intent-content-gap";
};

const verificationForFamily = (family: SeoWorkPackageFamily): SeoVerificationMode =>
  family === "ranking-snippet" || family === "search-intent-content-gap" ? "search-window" : "immediate";

const acceptanceCriteriaFor = (opportunity: AdvisorOpportunity): string[] => [
  "Die konkrete Aufgabe ist im genannten Scope umgesetzt oder nachvollziehbar als blockiert dokumentiert.",
  "Bestehende Slugs, URLs, Frontmatter-Strukturen und belegte Aussagen bleiben erhalten.",
  opportunity.category === "internal-link" ? "Der Link ist kontextuell sinnvoll und kein semantisch gleichwertiger Link ist bereits vorhanden." : "Der ursprüngliche Befund ist im aktuellen Advisor nicht mehr aktiv oder fachlich begründet nachzubessern.",
];

const dataBasisFor = (opportunity: AdvisorOpportunity): string => {
  const data = opportunity.dataBasis;
  const parts = [
    `${data.impressions ?? 0} Impressionen`,
    `${data.clicks ?? 0} Klicks`,
    `CTR ${(data.ctr ?? 0).toFixed(2)} %`,
    `Position ${(data.position ?? 0).toFixed(1)}`,
    opportunity.source,
  ];
  if (data.note) parts.push(data.note);
  return parts.join("; ");
};

export const taskFromOpportunity = (opportunity: AdvisorOpportunity): SeoWorkPackageTask => {
  const family = familyForOpportunity(opportunity.category);
  return {
    id: opportunity.id,
    title: opportunity.title,
    priority: opportunity.priority,
    score: clamp(opportunity.score),
    explicitImpact: clamp(opportunity.impact * 20),
    confidence: clamp(opportunity.confidence, 0, 1),
    effortValue: opportunity.effortValue,
    effort: opportunity.effort,
    family,
    verificationMode: verificationForFamily(family),
    url: opportunity.url,
    query: opportunity.query,
    affectedFile: opportunity.affectedFile,
    problem: opportunity.description,
    dataBasis: dataBasisFor(opportunity),
    nextAction: opportunity.nextAction,
    steps: opportunity.steps,
    acceptanceCriteria: acceptanceCriteriaFor(opportunity),
    pageType: opportunity.pageType,
    lowConfidence: opportunity.confidence < 0.55 || opportunity.lowData,
    sourceKind: "advisor",
  };
};

const LOCAL_PRODUCT_HEALTH_CHECKS = new Set([
  "schema",
  "identity",
  "summary",
  "strengths",
  "weaknesses",
  "best-for",
  "attention",
  "alternatives",
  "verdict",
  "transparency",
  "meta-title",
  "meta-description",
  "canonical",
  "internal-links",
  "comparisons",
]);

export const tasksFromProductHealth = (products: ProductHealthInput[] = []): SeoWorkPackageTask[] => products.flatMap((product) => {
  if (!/kritisch|wichtig/i.test(product.status)) return [];
  const affectedFile = product.filePath ?? `apps/pfotentechnik/src/content/products/${product.slug}.md`;
  return (product.checks ?? [])
    .filter((check) => !check.ok
      && /kritisch|wichtig/i.test(check.severity)
      && check.group !== "Visuals"
      && LOCAL_PRODUCT_HEALTH_CHECKS.has(check.id)
      && !/provider|bildgenerierung|herstellerrecherche|externe recherche/i.test(`${check.label} ${check.evidence}`))
    .map((check) => ({
      id: `product-health|${product.slug}|${check.id}`,
      title: `${product.title}: ${check.label}`,
      priority: /kritisch/i.test(check.severity) ? "high" as const : "medium" as const,
      score: clamp(100 - product.score + (/kritisch/i.test(check.severity) ? 30 : 15)),
      explicitImpact: /kritisch/i.test(check.severity) ? 90 : 68,
      confidence: 0.95,
      effortValue: 2.5,
      effort: "mittel" as const,
      family: "product-health" as const,
      verificationMode: "immediate" as const,
      url: `/produkt/${product.slug}/`,
      affectedFile,
      problem: check.evidence,
      dataBasis: `Vorhandener Product-Health-Audit; Produkt-Score ${product.score}/100; Schweregrad ${check.severity}.`,
      nextAction: `${check.group} · ${check.label} in der bestehenden Produktdatei gezielt korrigieren.`,
      steps: [
        "Die bestehende Produktdatei und das aktuelle Produktschema prüfen.",
        "Nur den belegten Audit-Befund korrigieren; keine Herstellerdaten erfinden.",
        "Product-Audit und Build ausführen.",
      ],
      acceptanceCriteria: [
        "Der konkrete Product-Health-Check ist bestanden.",
        "Die Produktdatei bleibt schemakonform.",
        "Keine Produktentdeckung, Produktanlage, Bildgenerierung oder unvalidierte Herstellerrecherche wurde in das Paket gemischt.",
      ],
      pageType: "Produkt",
      lowConfidence: false,
      sourceKind: "product-health" as const,
    }));
});

const semanticTaskKey = (task: SeoWorkPackageTask) => [
  task.family,
  task.affectedFile ?? task.url ?? task.query ?? "unknown",
  normalizedText(`${task.problem} ${task.nextAction}`).split(" ").slice(0, 12).join(" "),
].join("|");

export const dedupePackageTasks = (tasks: SeoWorkPackageTask[]): SeoWorkPackageTask[] => {
  const byKey = new Map<string, SeoWorkPackageTask>();
  for (const task of tasks) {
    const key = semanticTaskKey(task);
    const current = byKey.get(key);
    if (!current || PRIORITY_WEIGHT[task.priority] > PRIORITY_WEIGHT[current.priority] || task.score > current.score) byKey.set(key, task);
  }
  return [...byKey.values()].sort((left, right) =>
    (left.affectedFile ?? "~").localeCompare(right.affectedFile ?? "~", "de")
    || PRIORITY_WEIGHT[right.priority] - PRIORITY_WEIGHT[left.priority]
    || right.score - left.score
    || left.id.localeCompare(right.id, "de"));
};

const groupingKey = (task: SeoWorkPackageTask) => [
  task.affectedFile || "__no-file__",
  task.family,
  task.verificationMode,
  task.lowConfidence ? "low-confidence" : "normal-confidence",
].join("|");

const hasContradictoryGoal = (left: SeoWorkPackageTask, right: SeoWorkPackageTask): boolean => {
  const leftText = normalizedText(`${left.problem} ${left.nextAction} ${left.steps.join(" ")}`);
  const rightText = normalizedText(`${right.problem} ${right.nextAction} ${right.steps.join(" ")}`);
  const leftStructural = /redirect|canonical|slug|url dublette|weiterleitung/.test(leftText);
  const rightStructural = /redirect|canonical|slug|url dublette|weiterleitung/.test(rightText);
  const leftRewrite = /neu schreiben|neufassung|komplett ersetzen|vollstaendig ersetzen/.test(leftText);
  const rightRewrite = /neu schreiben|neufassung|komplett ersetzen|vollstaendig ersetzen/.test(rightText);
  const leftObserve = /beobachten|keine aenderung|nicht aendern/.test(leftText);
  const rightObserve = /beobachten|keine aenderung|nicht aendern/.test(rightText);
  return (leftStructural && rightRewrite)
    || (rightStructural && leftRewrite)
    || (leftObserve && !rightObserve)
    || (rightObserve && !leftObserve);
};

const groupTasks = (tasks: SeoWorkPackageTask[]): SeoWorkPackageTask[][] => {
  const pending = [...tasks];
  const groups: SeoWorkPackageTask[][] = [];
  while (pending.length) {
    const seed = pending.shift()!;
    const group = [seed];
    const files = new Set(seed.affectedFile ? [seed.affectedFile] : []);
    for (let index = 0; index < pending.length && group.length < 4;) {
      const candidate = pending[index];
      const sameFile = Boolean(seed.affectedFile && candidate.affectedFile === seed.affectedFile);
      const compatible = candidate.family === seed.family
        && candidate.verificationMode === seed.verificationMode
        && candidate.lowConfidence === seed.lowConfidence
        && (sameFile || groupingKey(candidate).split("|").slice(1).join("|") === groupingKey(seed).split("|").slice(1).join("|"));
      const nextFiles = new Set(files);
      if (candidate.affectedFile) nextFiles.add(candidate.affectedFile);
      if (!compatible || nextFiles.size > 5 || group.some((task) => hasContradictoryGoal(task, candidate))) { index += 1; continue; }
      group.push(candidate);
      files.clear();
      nextFiles.forEach((file) => files.add(file));
      pending.splice(index, 1);
    }
    groups.push(group);
  }
  return groups;
};

const strategicPageScore = (pageType: string): number => {
  if (pageType === "Cornerstone") return 100;
  if (pageType === "Vergleich" || pageType === "Produkt") return 90;
  if (pageType === "Hersteller") return 72;
  return 60;
};

export const calculatePackageImpact = (tasks: SeoWorkPackageTask[]): number => {
  if (!tasks.length) return 0;
  const maximumScore = Math.max(...tasks.map((task) => task.score));
  const averageScore = tasks.reduce((sum, task) => sum + task.score, 0) / tasks.length;
  const explicitImpact = tasks.reduce((sum, task) => sum + task.explicitImpact, 0) / tasks.length;
  const confidence = tasks.reduce((sum, task) => sum + task.confidence, 0) / tasks.length * 100;
  const strategic = Math.max(...tasks.map((task) => strategicPageScore(task.pageType)));
  const effort = tasks.reduce((sum, task) => sum + task.effortValue, 0) / tasks.length;
  const highShare = tasks.filter((task) => task.priority === "high").length / tasks.length * 100;
  return Math.round(clamp(
    maximumScore * 0.35
    + averageScore * 0.12
    + explicitImpact * 0.16
    + confidence * 0.12
    + strategic * 0.1
    + highShare * 0.2
    - effort * 1.25,
  ));
};

const packagePriority = (tasks: SeoWorkPackageTask[]): AdvisorPriority =>
  tasks.some((task) => task.priority === "high") ? "high" : tasks.some((task) => task.priority === "medium") ? "medium" : "low";

const titleFor = (family: SeoWorkPackageFamily, tasks: SeoWorkPackageTask[]): string => {
  const file = tasks.length && tasks.every((task) => task.affectedFile === tasks[0].affectedFile) ? tasks[0].affectedFile?.split("/").pop() : undefined;
  const base: Record<SeoWorkPackageFamily, string> = {
    "technical-structure": "Technik und interne Struktur konsolidieren",
    "eeat-content-quality": "EEAT und redaktionelle Qualität stärken",
    "ranking-snippet": "Ranking und Snippet gezielt optimieren",
    "search-intent-content-gap": "Suchintention und Content Gap bearbeiten",
    "product-health": "Product Health reparieren",
  };
  return file ? `${base[family]} · ${file}` : base[family];
};

const validationsFor = (family: SeoWorkPackageFamily, tasks: SeoWorkPackageTask[]): string[] => {
  const commands = [
    "npm --workspace apps/pfotentechnik run lint:content",
    "npm --workspace apps/pfotentechnik run seo:release:check:no-build",
    "npm run build:pfotentechnik",
  ];
  if (family === "technical-structure" || tasks.some((task) => task.nextAction.toLocaleLowerCase("de-DE").includes("link"))) {
    commands.splice(1, 0, "npm --workspace apps/pfotentechnik run build:content-graph");
  }
  if (family === "product-health") commands.splice(1, 0, "npm --workspace apps/pfotentechnik run audit:products:strict");
  return unique(commands);
};

export const recommendedReviewDays = (tasks: SeoWorkPackageTask[]): number => {
  if (tasks.some((task) => task.family === "search-intent-content-gap" && task.lowConfidence)) return 28;
  if (tasks.some((task) => /provider|extern|datenblock/i.test(`${task.problem} ${task.dataBasis}`))) return 30;
  return 14;
};

export const buildWorkPackagePrompt = (pkg: Omit<SeoWorkPackage, "codexPrompt">): string => redactWorkPackageSecrets([
  "Arbeite im Repository Yushamon/affiliate-template.",
  "Projektpfad: apps/pfotentechnik.",
  "",
  `CODEX-ARBEITSPAKET ${pkg.id}`,
  `Titel: ${pkg.title}`,
  `Zeitraum: ${pkg.rangeKey}`,
  `Familie: ${pkg.family}`,
  `Priorität: ${pkg.priority}`,
  `Impact: ${pkg.impact}/100`,
  `Confidence: ${Math.round(pkg.confidence * 100)}/100`,
  `Aufwand: ${pkg.effort}`,
  `Prüfmodus: ${pkg.verificationMode}`,
  `Früheste Wirkungsprüfung: ${pkg.verifyAfter ?? "sofort nach technischer Validierung"}`,
  "",
  "Scope:",
  ...(pkg.affectedFiles.length ? pkg.affectedFiles.map((file) => `- ${file}`) : ["- Betroffene Dateien zuerst aus URL und Repository auflösen; nicht raten."]),
  "",
  "Teilaufgaben:",
  ...pkg.tasks.flatMap((task, index) => [
    `${index + 1}. ${task.title}`,
    `   Task-ID: ${task.id}`,
    `   URL/Query: ${task.url ?? task.query ?? "keine eindeutige Zuordnung"}`,
    `   Quelldatei: ${task.affectedFile ?? "vor Änderung im Repository ermitteln"}`,
    `   Problem: ${task.problem}`,
    `   Datenbasis: ${task.dataBasis}`,
    `   Nächste Aktion: ${task.nextAction}`,
    "   Einzelschritte:",
    ...task.steps.map((step) => `   - ${step}`),
    "   Akzeptanzkriterien:",
    ...task.acceptanceCriteria.map((criterion) => `   - ${criterion}`),
    "",
  ]),
  "Unsichere oder blockierte Teilaufgaben:",
  ...(pkg.tasks.some((task) => task.lowConfidence)
    ? pkg.tasks.filter((task) => task.lowConfidence).map((task) => `- ${task.id}: geringe Datenbasis oder Low Confidence. Separat dokumentieren und keine starke Wirkungsaussage ableiten.`)
    : ["- Keine bereits erkannte unsichere oder blockierte Teilaufgabe. Neue Blocker im Abschlussmanifest ausweisen."]),
  "",
  "Arbeitsgrenzen:",
  "- Keine unnötigen Architekturänderungen.",
  "- Keine neuen Dependencies ohne zwingenden, dokumentierten Grund.",
  "- Keine Slug- oder URL-Änderung ohne expliziten technischen Befund.",
  "- Keine pauschale Neufassung bestehender Inhalte.",
  "- Bestehende Komponenten, Frontmatter-Strukturen, Quellen und belegte Produktdaten erhalten.",
  "- Blockierte oder unsichere Aufgaben separat ausweisen. Nicht stillschweigend überspringen.",
  "- Produktentdeckung, Produktanlage und normale SEO-Pflege nicht vermischen.",
  "",
  "Gemeinsame Validierung, nur einmal am Ende ausführen:",
  ...pkg.validationCommands.map((command) => `- ${command}`),
  "",
  "Gib am Ende zusätzlich exakt ein JSON-Manifest mit dieser Struktur aus:",
  JSON.stringify({
    packageId: pkg.id,
    completedTaskIds: [],
    blockedTaskIds: [],
    changedFiles: [],
    validation: [],
    remainingRisks: [],
    recommendedReviewAfter: pkg.verifyAfter,
  }, null, 2),
  "",
  "Fülle validation im Abschlussmanifest für jeden oben einmal genannten Validierungsbefehl mit status passed, failed oder not-run.",
  "Das Manifest ist nur eine Zusammenfassung. Der SEO Co-Pilot prüft Repository, Audits und aktuelle Befunde selbst.",
].join("\n"));

const effortLabel = (value: number): AdvisorEffort => EFFORT_LABEL.find(([limit]) => value <= limit)?.[1] ?? "hoch";

const basePackageFromTasks = (tasks: SeoWorkPackageTask[], rangeKey: string, now: Date): Omit<SeoWorkPackage, "codexPrompt"> => {
  const family = tasks[0].family;
  const verificationMode = tasks[0].verificationMode;
  const affectedFiles = unique(tasks.map((task) => task.affectedFile).filter((value): value is string => Boolean(value))).slice(0, 5);
  const confidence = tasks.reduce((sum, task) => sum + task.confidence, 0) / tasks.length;
  const effortValue = tasks.reduce((sum, task) => sum + task.effortValue, 0) / tasks.length;
  const idSeed = [rangeKey, family, verificationMode, ...tasks.map((task) => task.id).sort()].join("|");
  const id = `seo-package-${stableHash(idSeed)}`;
  const verifyAfter = verificationMode === "search-window" ? addDays(now, recommendedReviewDays(tasks)).toISOString() : null;
  return {
    id,
    title: titleFor(family, tasks),
    rangeKey,
    family,
    priority: packagePriority(tasks),
    impact: calculatePackageImpact(tasks),
    confidence,
    effortValue,
    effort: effortLabel(effortValue),
    verificationMode,
    verifyAfter,
    taskIds: tasks.map((task) => task.id),
    affectedFiles,
    tasks,
    validationCommands: validationsFor(family, tasks),
    status: "open",
    createdAt: now.toISOString(),
    updatedAt: now.toISOString(),
    sentAt: null,
    snoozedUntil: null,
    snoozeReason: null,
    lastVerification: null,
    unresolvedTaskIds: [],
    passedChecks: [],
    failedChecks: [],
  };
};

export const applyStoredPackageState = (pkg: Omit<SeoWorkPackage, "codexPrompt">, stored: StoredSeoWorkPackage | undefined, now: Date): Omit<SeoWorkPackage, "codexPrompt"> => {
  if (!stored) return pkg;
  let status = stored.status;
  const snoozedUntil = stored.snoozedUntil ?? null;
  const verifyAfter = stored.verifyAfter ?? pkg.verifyAfter;
  if (status === "snoozed" && snoozedUntil && new Date(snoozedUntil) <= now) status = "open";
  if (status === "waiting-window" && verifyAfter && new Date(verifyAfter) <= now) status = "review-due";
  return {
    ...pkg,
    status,
    createdAt: stored.createdAt || pkg.createdAt,
    updatedAt: stored.updatedAt || pkg.updatedAt,
    sentAt: stored.sentAt ?? null,
    verifyAfter: verifyAfter ?? null,
    snoozedUntil,
    snoozeReason: stored.snoozeReason ?? null,
    lastVerification: stored.lastVerification ?? null,
    unresolvedTaskIds: stored.unresolvedTaskIds ?? [],
    passedChecks: stored.passedChecks ?? [],
    failedChecks: stored.failedChecks ?? [],
  };
};

export const compareSeoWorkPackages = (left: SeoWorkPackage, right: SeoWorkPackage): number => {
  const statusWeight = (status: SeoWorkPackageStatus) => {
    if (status === "needs-work") return 0;
    if (status === "review-due") return 1;
    if (status === "waiting-window") return 3;
    if (status === "verified") return 4;
    if (status === "snoozed") return 5;
    return 2;
  };
  return statusWeight(left.status) - statusWeight(right.status)
    || PRIORITY_WEIGHT[right.priority] - PRIORITY_WEIGHT[left.priority]
    || right.impact - left.impact
    || right.confidence - left.confidence
    || left.effortValue - right.effortValue
    || left.id.localeCompare(right.id, "de");
};

const packageFromStoredSnapshot = (stored: StoredSeoWorkPackage, rangeKey: string, now: Date): SeoWorkPackage | null => {
  const snapshot = stored.packageSnapshot;
  if (!snapshot || snapshot.rangeKey !== rangeKey || !snapshot.family || !snapshot.priority || !snapshot.verificationMode) return null;
  const base: Omit<SeoWorkPackage, "codexPrompt"> = {
    id: stored.id,
    title: snapshot.title ?? stored.id,
    rangeKey,
    family: snapshot.family,
    priority: snapshot.priority,
    impact: clamp(snapshot.impact ?? 0),
    confidence: clamp(snapshot.confidence ?? 0, 0, 1),
    effortValue: snapshot.effortValue ?? 3,
    effort: snapshot.effort ?? effortLabel(snapshot.effortValue ?? 3),
    verificationMode: snapshot.verificationMode,
    verifyAfter: stored.verifyAfter ?? snapshot.verifyAfter ?? null,
    taskIds: snapshot.taskIds ?? [],
    affectedFiles: snapshot.affectedFiles ?? [],
    tasks: snapshot.tasks ?? [],
    validationCommands: snapshot.validationCommands ?? [],
    status: stored.status,
    createdAt: stored.createdAt || now.toISOString(),
    updatedAt: stored.updatedAt || now.toISOString(),
    sentAt: stored.sentAt ?? null,
    snoozedUntil: stored.snoozedUntil ?? null,
    snoozeReason: stored.snoozeReason ?? null,
    lastVerification: stored.lastVerification ?? null,
    unresolvedTaskIds: stored.unresolvedTaskIds ?? [],
    passedChecks: stored.passedChecks ?? [],
    failedChecks: stored.failedChecks ?? [],
  };
  const withState = applyStoredPackageState(base, stored, now);
  return { ...withState, codexPrompt: buildWorkPackagePrompt(withState) };
};

export const buildSeoWorkPackages = (input: WorkPackageBuildInput): SeoWorkPackage[] => {
  const now = dateValue(input.now);
  const storedPackages = input.storedPackages ?? [];
  const stored = new Map(storedPackages.map((pkg) => [pkg.id, pkg]));
  const storedViews = storedPackages
    .map((pkg) => packageFromStoredSnapshot(pkg, input.rangeKey, now))
    .filter((pkg): pkg is SeoWorkPackage => Boolean(pkg));
  const claimedTaskIds = new Set(storedViews
    .filter((pkg) => ACTIVE_SUPPRESSION_STATUSES.has(pkg.status))
    .flatMap((pkg) => pkg.taskIds));
  const tasks = dedupePackageTasks([
    ...input.opportunities.map(taskFromOpportunity),
    ...tasksFromProductHealth(input.productHealth),
  ]).filter((task) => !claimedTaskIds.has(task.id));
  const generated = groupTasks(tasks).map((group) => {
    const base = basePackageFromTasks(group, input.rangeKey, now);
    const withState = applyStoredPackageState(base, stored.get(base.id), now);
    return { ...withState, codexPrompt: buildWorkPackagePrompt(withState) };
  });
  const currentIds = new Set(generated.map((pkg) => pkg.id));
  const retained = storedViews.filter((pkg) => pkg.status !== "open" && !currentIds.has(pkg.id));
  return [...generated, ...retained].sort(compareSeoWorkPackages);
};

export const suppressedTaskIdsForPackages = (packages: Array<Pick<SeoWorkPackage, "status" | "taskIds">>): Set<string> =>
  new Set(packages.filter((pkg) => ACTIVE_SUPPRESSION_STATUSES.has(pkg.status)).flatMap((pkg) => pkg.taskIds));

export const visibleIndividualTasks = (tasks: AdvisorOpportunity[], packages: Array<Pick<SeoWorkPackage, "status" | "taskIds">>): AdvisorOpportunity[] => {
  const suppressed = suppressedTaskIdsForPackages(packages);
  return tasks.filter((task) => !suppressed.has(task.id));
};

export type PackageLifecycleInput = {
  now: Date | string;
  activeTaskIds: string[];
  checks: SeoPackageCheck[];
  searchGeneratedAt?: string | null;
};

export const resolvePackageLifecycle = (pkg: Pick<SeoWorkPackage, "verificationMode" | "verifyAfter" | "sentAt" | "taskIds">, input: PackageLifecycleInput): {
  status: SeoWorkPackageStatus;
  unresolvedTaskIds: string[];
  passedChecks: SeoPackageCheck[];
  failedChecks: SeoPackageCheck[];
  reason: string;
} => {
  const now = dateValue(input.now);
  const unresolvedTaskIds = pkg.taskIds.filter((id) => input.activeTaskIds.includes(id));
  const failedChecks = input.checks.filter((check) => check.status === "failed");
  const passedChecks = input.checks.filter((check) => check.status === "passed");
  const checksIncomplete = input.checks.length === 0 || input.checks.some((check) => check.status !== "passed");

  if (failedChecks.length || checksIncomplete) {
    return {
      status: "needs-work",
      unresolvedTaskIds,
      passedChecks,
      failedChecks,
      reason: failedChecks.length
        ? "Mindestens eine verpflichtende Prüfung ist fehlgeschlagen."
        : "Nicht alle verpflichtenden Prüfungen wurden erfolgreich ausgeführt.",
    };
  }

  if (pkg.verificationMode === "search-window") {
    if (pkg.verifyAfter && now < new Date(pkg.verifyAfter)) {
      return { status: "waiting-window", unresolvedTaskIds, passedChecks, failedChecks, reason: "Das Search-Prüffenster ist noch nicht erreicht." };
    }
    const searchGeneratedAt = input.searchGeneratedAt ? new Date(input.searchGeneratedAt) : null;
    const sentAt = pkg.sentAt ? new Date(pkg.sentAt) : null;
    if (!searchGeneratedAt || (sentAt && searchGeneratedAt <= sentAt)) {
      return { status: "waiting-window", unresolvedTaskIds, passedChecks, failedChecks, reason: "Seit der Übergabe liegt noch kein neuer Search-Sync vor." };
    }
    if (unresolvedTaskIds.length) {
      return { status: "needs-work", unresolvedTaskIds, passedChecks, failedChecks, reason: "Mindestens ein gleichwertiger Befund ist nach dem neuen Search-Sync weiterhin aktiv." };
    }
    return { status: "verified", unresolvedTaskIds, passedChecks, failedChecks, reason: "Die technischen Prüfungen sind bestanden, ein neuer Search-Sync liegt vor und die Befunde sind nicht mehr aktiv." };
  }

  if (unresolvedTaskIds.length) {
    return { status: "needs-work", unresolvedTaskIds, passedChecks, failedChecks, reason: "Mindestens ein gleichwertiger Befund ist weiterhin aktiv." };
  }
  return { status: "verified", unresolvedTaskIds, passedChecks, failedChecks, reason: "Alle verpflichtenden Prüfungen sind bestanden und die Befunde sind nicht mehr aktiv." };
};

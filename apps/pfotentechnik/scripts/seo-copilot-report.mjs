import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { readCopilotWorkspace } from "../src/lib/seo-copilot/store.mjs";
import { detectProductSchema, loadRepositoryProducts } from "../src/lib/seo-copilot/preflight.ts";

const APP_ROOT = fileURLToPath(new URL("../", import.meta.url));
const REPORT_DIR = path.join(APP_ROOT, "reports");
const JSON_FILE = path.join(REPORT_DIR, "seo-copilot-report.json");
const MARKDOWN_FILE = path.join(REPORT_DIR, "seo-copilot-report.md");
const MANUFACTURER_DIR = path.join(APP_ROOT, "src", "content", "manufacturers");
const COMPARISON_DIR = path.join(APP_ROOT, "src", "content", "comparisons");

const products = loadRepositoryProducts();
const workspace = readCopilotWorkspace();
const schema = detectProductSchema();
const manufacturerSlugs = new Set(fs.readdirSync(MANUFACTURER_DIR).filter((file) => file.endsWith(".md")).map((file) => path.basename(file, ".md")));
const comparisonSlugs = new Set(fs.readdirSync(COMPARISON_DIR).filter((file) => file.endsWith(".md")).map((file) => path.basename(file, ".md")));

const findings = products.map((product) => {
  const source = product.source;
  const frontmatter = source.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/m)?.[1] || "";
  const comparisons = [...frontmatter.matchAll(/comparisons:\s*\[([^\]]*)\]/g)]
    .flatMap((match) => [...match[1].matchAll(/["']([^"']+)["']/g)].map((entry) => entry[1]));
  const galleryRoles = [...frontmatter.matchAll(/gallery-(\d+)\.webp/gi)].map((match) => `gallery-${match[1]}`);
  const problems = [];
  if (!/^##\s+Quellen/im.test(source) || !/https?:\/\//i.test(source)) problems.push("keine ausreichenden sichtbaren Quellen");
  if (!comparisons.some((slug) => comparisonSlugs.has(slug))) problems.push("keine gültige Vergleichszuordnung");
  if (!manufacturerSlugs.has(product.manufacturerSlug)) problems.push("keine Herstellerseite");
  for (const role of ["hero", "thumbnail", "comparison", "gallery-1", "gallery-2", "gallery-3"]) {
    const present = role.startsWith("gallery-")
      ? galleryRoles.includes(role)
      : new RegExp(`^\\s{2}${role}:\\s*\\{[^\\r\\n]*\\.webp`, "mi").test(frontmatter);
    if (!present) problems.push(`Bild fehlt: ${role}.webp`);
  }
  if (!/^updatedAt:\s*["']?\d{4}-\d{2}-\d{2}/m.test(frontmatter)) problems.push("Aktualisierungsdatum fehlt");
  return { slug: product.slug, title: product.name, manufacturer: product.brand, problems };
});

const report = {
  schemaVersion: 1,
  generatedAt: new Date().toISOString(),
  schema: { detected: schema.detected, version: schema.version, path: schema.path, requiredFields: schema.requiredFields },
  productHealth: {
    total: findings.length,
    complete: findings.filter((item) => item.problems.length === 0).length,
    critical: findings.filter((item) => item.problems.some((problem) => /quelle|hersteller/i.test(problem))).length,
    findings: findings.filter((item) => item.problems.length),
  },
  productCandidates: workspace.productCandidates,
  newManufacturers: workspace.productCandidates.filter((candidate) => !candidate.existingCoverage?.manufacturerSlug).map((candidate) => ({ id: candidate.id, manufacturer: candidate.manufacturer })),
  contentGaps: workspace.contentGaps,
  nicheOpportunities: workspace.nicheOpportunities,
  blockedCreations: workspace.productDrafts.filter((draft) => draft.status === "blocked"),
  drafts: workspace.productDrafts.map(({ content, ...draft }) => draft),
  jobs: workspace.jobs.slice(-100),
  recommendedNextActions: [
    ...findings.filter((item) => item.problems.length).slice(0, 20).map((item) => ({ type: "product-health", target: item.slug, action: item.problems[0] })),
    ...workspace.contentGaps.slice(0, 20).map((gap) => ({ type: "content-gap", target: gap.title, action: gap.recommendedAction })),
  ],
};

const markdown = [
  "# PfotenTechnik SEO-Copilot-Report",
  "",
  `Erstellt: ${report.generatedAt}`,
  "",
  "## Product Health",
  "",
  `- Produkte: ${report.productHealth.total}`,
  `- Ohne lokal erkannte Lücke: ${report.productHealth.complete}`,
  `- Mit kritischem Quellen-/Herstellerproblem: ${report.productHealth.critical}`,
  `- Produktschema: ${report.schema.detected ? report.schema.version : "nicht erkannt"}`,
  "",
  "## Produktkandidaten und Chancen",
  "",
  `- Produktkandidaten: ${report.productCandidates.length}`,
  `- Potenziell neue Hersteller: ${report.newManufacturers.length}`,
  `- Content Gaps: ${report.contentGaps.length}`,
  `- Nischenchancen: ${report.nicheOpportunities.length}`,
  `- Blockierte Anlagen: ${report.blockedCreations.length}`,
  "",
  "## Kritische Produktprobleme",
  "",
  ...(report.productHealth.findings.length
    ? report.productHealth.findings.slice(0, 50).map((item) => `- **${item.title}** (\`${item.slug}\`): ${item.problems.join("; ")}`)
    : ["Keine lokal erkannten Produktprobleme."]),
  "",
  "## Sicherheits- und Datengrenzen",
  "",
  "- Marktsignale sind keine Verkaufszahlen.",
  "- Kandidaten und Entwürfe werden außerhalb der Content Collections gespeichert.",
  "- Jede Produktanlage benötigt aktuellen Preflight, belastbare Primärquellen und explizite Freigabe.",
  "- Der Report enthält keine Secrets oder vollständigen externen Response-Bodies.",
  "",
].join("\n");

fs.mkdirSync(REPORT_DIR, { recursive: true });
fs.writeFileSync(JSON_FILE, `${JSON.stringify(report, null, 2)}\n`, "utf8");
fs.writeFileSync(MARKDOWN_FILE, markdown, "utf8");
console.log(`SEO Copilot: ${findings.length} Produkte, ${workspace.productCandidates.length} Kandidaten, ${workspace.contentGaps.length} Content Gaps.`);
console.log(`JSON: ${path.relative(APP_ROOT, JSON_FILE)}`);
console.log(`Markdown: ${path.relative(APP_ROOT, MARKDOWN_FILE)}`);

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const roots = [
  "apps/pfotentechnik/src/content/pages",
  "apps/pfotentechnik/src/content/products",
  "apps/pfotentechnik/src/content/comparisons",
  "apps/pfotentechnik/src/content/manufacturers"
];
const strict = process.argv.includes("--strict");

const walk = (dir, result = []) => {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, result);
    else if (/\.(md|mdx)$/i.test(entry.name)) result.push(full);
  }
  return result;
};

const scalar = (value) => {
  const v = value.trim().replace(/^["']|["']$/g, "");
  if (v === "true") return true;
  if (v === "false") return false;
  if (/^-?\d+(\.\d+)?$/.test(v)) return Number(v);
  return v;
};

const frontmatter = (source) => {
  const match = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return { data: {}, body: source };
  const data = {};
  const lines = match[1].split(/\r?\n/);
  const stack = [{ indent: -1, value: data }];
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (!line.trim() || line.trimStart().startsWith("#")) continue;
    const indent = line.match(/^\s*/)?.[0].length ?? 0;
    const text = line.trim();
    while (stack.length > 1 && indent <= stack.at(-1).indent) stack.pop();
    const parent = stack.at(-1).value;
    if (text.startsWith("- ")) {
      if (Array.isArray(parent)) parent.push(scalar(text.slice(2)));
      continue;
    }
    const pos = text.indexOf(":");
    if (pos < 0) continue;
    const key = text.slice(0, pos).trim();
    const raw = text.slice(pos + 1).trim();
    if (!raw) {
      const next = lines[i + 1] ?? "";
      const container = next.trim().startsWith("- ") ? [] : {};
      parent[key] = container;
      stack.push({ indent, value: container });
    } else if (raw.startsWith("[") && raw.endsWith("]")) {
      parent[key] = raw.slice(1, -1).split(",").map(scalar).filter(Boolean);
    } else parent[key] = scalar(raw);
  }
  return { data, body: source.slice(match[0].length) };
};

const normalize = (value) => String(value ?? "")
  .toLowerCase()
  .replace(/ä/g, "ae").replace(/ö/g, "oe")
  .replace(/ü/g, "ue").replace(/ß/g, "ss")
  .replace(/[^a-z0-9]+/g, " ").trim();

const documents = roots.flatMap((item) => walk(path.join(root, item))).sort()
  .map((file) => {
    const source = fs.readFileSync(file, "utf8");
    const { data, body } = frontmatter(source);
    const relative = path.relative(root, file).replace(/\\/g, "/");
    const slug = data.slug ?? path.basename(file).replace(/\.(md|mdx)$/i, "");
    const type = relative.includes("/products/") ? "product"
      : relative.includes("/comparisons/") ? "comparison"
      : relative.includes("/manufacturers/") ? "manufacturer" : "page";
    const issues = [];
    const add = (severity, code, message) => issues.push({ severity, code, message });

    if (!data.title) add("error", "META_TITLE", "Titel fehlt.");
    if (!data.description) add("error", "META_DESCRIPTION", "Description fehlt.");
    else if (String(data.description).length < 90 || String(data.description).length > 180)
      add("warning", "META_DESCRIPTION_LENGTH", "Description sollte ungefähr 90–180 Zeichen lang sein.");
    if (!data.updatedAt && !data.publishedAt)
      add("warning", "CONTENT_DATE", "publishedAt und updatedAt fehlen.");

    const faqCount = [...body.matchAll(/^#{2,4}\s+.*(faq|häufige fragen)/gim)].length;
    if (faqCount > 1) add("error", "DUPLICATE_FAQ", `${faqCount} FAQ-Bereiche erkannt.`);

    const checklistCount = [...body.matchAll(/^#{2,4}\s+.*checkliste/gim)].length;
    if (checklistCount > 1) add("warning", "CHECKLIST_OVERUSE", `${checklistCount} Checklisten erkannt.`);

    for (const match of body.matchAll(/!\[([^\]]*)\]\(([^)]+)\)/g)) {
      if (!match[1].trim()) add("error", "IMAGE_ALT", `Alt-Text fehlt bei ${match[2]}.`);
    }

    if (type === "page" && !data.sources && !/\bquellen\b/i.test(body))
      add("warning", "SOURCES_MISSING", "Keine Quellenmetadaten oder Quellenüberschrift erkannt.");

    const clusterRole = data.cluster?.role;
    const roles = ["cornerstone", "comparison", "supporting-guide", "product", "manufacturer", "troubleshooting"];
    if (data.cluster && !roles.includes(clusterRole))
      add("error", "CLUSTER_ROLE", `Unbekannte Cluster-Rolle: ${clusterRole}`);

    const medical = type === "page" && /(hund-|katze-|durchfall|erbrechen|trinkt|frisst|dehydr|gesund|krank|mued)/i.test(slug);
    if (medical) {
      if (!/(tierarzt|tierärzt|notfall|sofort|atemnot|kollaps)/i.test(body))
        add("error", "MEDICAL_ESCALATION", "Kein Tierarzt- oder Notfallhinweis erkannt.");
      if (/\b(garantiert|heilt|immer harmlos)\b/i.test(body))
        add("error", "MEDICAL_PROMISE", "Problematische medizinische Zusicherung erkannt.");
      if (/\b\d+([,.]\d+)?\s*(mg|ml|tabletten?)\b/i.test(body))
        add("warning", "MEDICATION_DOSAGE", "Mögliche Dosierungsangabe gefunden.");
      if (!/\bwelp/i.test(body) && !/\bsenior/i.test(body))
        add("warning", "MEDICAL_RISK_GROUPS", "Welpen und Senioren möglicherweise nicht berücksichtigt.");
    }

    if (type === "product") {
      const allowed = ["hands-on", "editorial-review", "manufacturer-data", "long-term-test", "not-tested"];
      if (!data.testStatus) add("warning", "TEST_STATUS", "testStatus fehlt.");
      else if (!allowed.includes(data.testStatus))
        add("error", "TEST_STATUS_VALUE", `Unbekannter Teststatus: ${data.testStatus}`);
      if (!data.productStatus) add("warning", "PRODUCT_STATUS", "productStatus fehlt.");
      if ((!data.testStatus || ["editorial-review", "manufacturer-data", "not-tested"].includes(data.testStatus))
          && /\b(wir haben getestet|in unserem test|praxistest|langzeittest)\b/i.test(body))
        add("error", "TEST_CLAIM_CONFLICT", "Testbehauptung widerspricht dem Teststatus.");
    }

    return { file: relative, slug: normalize(slug), title: data.title ?? slug, type, data, issues };
  });

const portfolio = [];
const owners = new Map();
for (const doc of documents) {
  const primary = doc.data.queryOwnership?.primary ?? [];
  for (const query of (Array.isArray(primary) ? primary : [primary])) {
    if (!query) continue;
    const key = normalize(query);
    owners.set(key, [...(owners.get(key) ?? []), doc]);
  }
}
for (const [query, docs] of owners) {
  if (docs.length > 1) portfolio.push({
    severity: "error",
    code: "QUERY_CANNIBALIZATION",
    message: `„${query}“ gehört mehreren Seiten: ${docs.map(d => d.title).join(", ")}`
  });
}

const findings = documents.flatMap(doc => doc.issues.map(issue => ({ ...issue, file: doc.file })));
const errors = findings.filter(x => x.severity === "error").length
  + portfolio.filter(x => x.severity === "error").length;
const warnings = findings.filter(x => x.severity === "warning").length
  + portfolio.filter(x => x.severity === "warning").length;

const reportDir = path.join(root, "reports/seo-platform");
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(path.join(reportDir, "seo-platform-report.json"),
  JSON.stringify({ generatedAt: new Date().toISOString(), errors, warnings, portfolio, documents }, null, 2));

const md = [
  "# PfotenTechnik SEO Platform Report", "",
  `- Dokumente: ${documents.length}`,
  `- Fehler: ${errors}`,
  `- Warnungen: ${warnings}`, "",
  "## Portfolio-Befunde", "",
  ...(portfolio.length ? portfolio.map(x => `- **${x.severity.toUpperCase()} · ${x.code}:** ${x.message}`)
    : ["Keine Portfolio-Konflikte erkannt."]), "",
  "## Datei-Befunde", "",
  ...(findings.length ? findings.map(x => `- **${x.severity.toUpperCase()} · ${x.code}** — \`${x.file}\`: ${x.message}`)
    : ["Keine Befunde erkannt."]), ""
].join("\n");
fs.writeFileSync(path.join(reportDir, "seo-platform-report.md"), md);

console.log(`SEO Platform: ${documents.length} Dokumente, ${errors} Fehler, ${warnings} Warnungen.`);
console.log("Report: reports/seo-platform/seo-platform-report.md");
if (strict && errors > 0) process.exit(1);

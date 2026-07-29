#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  ANCHOR_OWNER_OVERRIDES,
  BLOCKED_ANCHOR_SET,
  LINK_TAXONOMY,
  detectTaxonomyIntents,
  detectTaxonomyTopics,
  isBlockedAnchor,
  normalizeTaxonomyPath,
  normalizeTaxonomyTerm,
  sanitizeAnchorAliases
} from "../apps/pfotentechnik/src/domain/content/linkTaxonomy.data.mjs";
import {
  asStringArray,
  normalizeSlug,
  parseFrontmatter,
  stripMarkdown,
  walkFiles
} from "../apps/pfotentechnik/scripts/internal-linking-utils.mjs";

const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(scriptDir, "..");
const appRoot = path.join(root, "apps/pfotentechnik");
const strict = process.argv.includes("--strict");
const reportDir = path.join(appRoot, "reports/internal-linking");
fs.mkdirSync(reportDir, { recursive: true });

const sources = [
  { collection: "pages", dir: "src/content/pages", group: "knowledge", route: (slug) => `/${slug}/`, budget: 7 },
  { collection: "products", dir: "src/content/products", group: "product", route: (slug) => `/produkt/${slug}/`, budget: 5 },
  { collection: "comparisons", dir: "src/content/comparisons", group: "comparison", route: (slug) => `/vergleiche/${slug}/`, budget: 6 },
  { collection: "manufacturers", dir: "src/content/manufacturers", group: "manufacturer", route: (slug) => `/hersteller/${slug}/`, budget: 6 }
];
const cornerstoneRoutes = new Set(LINK_TAXONOMY.filter((entry) => entry.cornerstone && entry.href).map((entry) => normalizeTaxonomyPath(entry.href)));

const findings = [];
const addFinding = (severity, code, message, details = {}) => findings.push({ severity, code, message, ...details });
const docs = [];
for (const source of sources) {
  for (const file of walkFiles(path.join(appRoot, source.dir)).filter((item) => /\.(md|mdx)$/i.test(item))) {
    const raw = fs.readFileSync(file, "utf8");
    const { data, body } = parseFrontmatter(raw);
    const slug = normalizeSlug(data.slug || path.basename(file, path.extname(file)));
    const route = normalizeTaxonomyPath(data.productUrl || data.route || source.route(slug));
    const linking = data.linking && typeof data.linking === "object" ? data.linking : {};
    const taxonomyEntries = LINK_TAXONOMY.filter((entry) => entry.href && normalizeTaxonomyPath(entry.href) === route);
    const title = String(data.title || data.name || slug);
    let aliases = [];
    if (source.collection === "pages") aliases = [...taxonomyEntries.flatMap((entry) => entry.anchorAliases), ...asStringArray(linking.keywords)];
    if (source.collection === "products") aliases = [title, ...asStringArray(data.aliases)];
    if (source.collection === "comparisons") aliases = [title, ...asStringArray(data.aliases), ...asStringArray(data.seo?.title)];
    if (source.collection === "manufacturers") aliases = [String(data.name || title), ...asStringArray(data.aliases)];
    const rawAliases = aliases.map(String).filter(Boolean);
    const cleanedAliases = sanitizeAnchorAliases(rawAliases);
    const values = [title, data.description, data.category, data.category?.key, data.category?.label, data.contentPlatform?.cluster, ...asStringArray(data.tags), ...asStringArray(data.hub?.sections), ...asStringArray(linking.contexts)];
    const topics = detectTaxonomyTopics(values);
    const intents = detectTaxonomyIntents(values);
    const group = cornerstoneRoutes.has(route) ? "hub" : source.group;
    docs.push({
      collection: source.collection, group, budget: group === "hub" ? 8 : source.budget,
      file, filePath: path.relative(root, file).replace(/\\/g, "/"), slug, route,
      title, data, body, aliases: cleanedAliases, rawAliases, topics, intents,
      exclusiveAnchors: taxonomyEntries.flatMap((entry) => entry.exclusiveAnchors ?? [])
    });

    if (source.collection === "pages" && !data.linking && taxonomyEntries.length === 0) {
      addFinding("warning", "LINKING_METADATA_MISSING", `${route} besitzt keine Linking-Metadaten.`, { sourceRoute: route, file: path.relative(root, file) });
    }
    for (const alias of rawAliases.filter(isBlockedAnchor)) {
      addFinding("error", "BLOCKED_GENERIC_ANCHOR", `Blockierter Einzelanker „${alias}“ ist für ${route} gepflegt.`, { sourceRoute: route, anchor: alias, file: path.relative(root, file) });
    }
    if (source.collection === "products") {
      const normalized = normalizeTaxonomyTerm(title);
      const generic = new Set(["smart", "pro", "mini", "ultra", "connect", "vision", "produkt", "futterautomat", "trinkbrunnen", "tracker"]);
      const tokens = normalized.split(" ").filter(Boolean);
      if (normalized.length < 6 || tokens.every((token) => generic.has(token))) {
        addFinding("warning", "PRODUCT_NAME_TOO_GENERIC", `Produktname „${title}“ ist für automatische Verlinkung zu kurz oder generisch.`, { sourceRoute: route, file: path.relative(root, file) });
      }
    }
  }
}

const contentRouteSet = new Set(docs.map((doc) => doc.route));

const routeForBuildFile = (file) => {
  const relative = path.relative(path.join(appRoot, "dist"), file).replace(/\\/g, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) {
    return normalizeTaxonomyPath(`/${relative.slice(0, -11)}/`);
  }
  if (relative.endsWith(".html")) {
    return normalizeTaxonomyPath(`/${relative.slice(0, -5)}/`);
  }
  return "";
};

const buildRouteSet = new Set(
  walkFiles(path.join(appRoot, "dist"))
    .filter((file) => file.endsWith(".html"))
    .map(routeForBuildFile)
    .filter(Boolean)
);

const routeSet = new Set([...contentRouteSet, ...buildRouteSet]);
const definitions = docs.flatMap((doc) => {
  const taxonomyAliasSet = new Set(
    LINK_TAXONOMY
      .filter((entry) => entry.href && normalizeTaxonomyPath(entry.href) === doc.route)
      .flatMap((entry) => entry.anchorAliases ?? [])
      .map(normalizeTaxonomyTerm)
  );
  const normalizedTitle = normalizeTaxonomyTerm(doc.title);

  return doc.aliases.map((anchor) => {
    const normalizedAnchor = normalizeTaxonomyTerm(anchor);
    return {
      id: `${doc.collection}:${doc.slug}`,
      anchor,
      normalizedAnchor,
      href: doc.route,
      group: doc.group,
      topics: doc.topics,
      exclusive: doc.exclusiveAnchors.some(
        (item) => normalizeTaxonomyTerm(item) === normalizedAnchor
      ),
      taxonomyOwned: taxonomyAliasSet.has(normalizedAnchor),
      exactTitle: normalizedTitle === normalizedAnchor,
      filePath: doc.filePath
    };
  });
});
for (const entry of LINK_TAXONOMY.filter((item) => item.href)) {
  const href = normalizeTaxonomyPath(entry.href);
  if (!routeSet.has(href)) addFinding("error", "TARGET_ROUTE_MISSING", `Taxonomie-Ziel ${href} existiert nicht im Content-Bestand.`, { targetRoute: href, taxonomyId: entry.id });
}

const ownersByAnchor = new Map();
for (const definition of definitions) {
  const owners = ownersByAnchor.get(definition.normalizedAnchor) ?? [];
  owners.push(definition);
  ownersByAnchor.set(definition.normalizedAnchor, owners);
}
for (const [anchor, owners] of ownersByAnchor) {
  const distinctTargets = [...new Set(owners.map((owner) => owner.href))];
  if (distinctTargets.length <= 1) continue;
  const exclusiveOwners = owners.filter((owner) => owner.exclusive);
  const taxonomyOwners = owners.filter((owner) => owner.taxonomyOwned);
  const exactTitleOwners = owners.filter((owner) => owner.exactTitle);

  const uniqueOwnerTarget = (candidates) => {
    const targets = [...new Set(candidates.map((item) => item.href))];
    return targets.length === 1 ? targets[0] : "";
  };

  const configuredOwner =
    ANCHOR_OWNER_OVERRIDES[anchor]
      ? normalizeTaxonomyPath(ANCHOR_OWNER_OVERRIDES[anchor])
      : "";

  const configuredOwnerIsCandidate =
    configuredOwner &&
    distinctTargets.includes(configuredOwner);

  const resolvedByExclusive = uniqueOwnerTarget(exclusiveOwners);
  const resolvedByTaxonomy = uniqueOwnerTarget(taxonomyOwners);
  const resolvedByExactTitle = uniqueOwnerTarget(exactTitleOwners);
  const resolvedTarget =
    (configuredOwnerIsCandidate ? configuredOwner : "") ||
    resolvedByExclusive ||
    resolvedByTaxonomy ||
    resolvedByExactTitle;

  if (resolvedTarget) {
    const resolution =
      configuredOwnerIsCandidate
        ? "configured-owner"
        : resolvedByExclusive
          ? "exclusive-anchor"
          : resolvedByTaxonomy
            ? "taxonomy-owner"
            : "exact-title-owner";

    addFinding(
      "info",
      "ANCHOR_CONFLICT_RESOLVED_BY_OWNER",
      `„${anchor}“ besitzt den eindeutigen Eigentümer ${resolvedTarget} (${resolution}).`,
      {
        anchor,
        owner: resolvedTarget,
        resolution,
        targets: distinctTargets
      }
    );
  } else {
    if (configuredOwner && !configuredOwnerIsCandidate) {
      addFinding(
        "error",
        "CONFIGURED_ANCHOR_OWNER_INVALID",
        `„${anchor}“ ist auf ${configuredOwner} konfiguriert, dieses Ziel gehört aber nicht zu den Konfliktkandidaten.`,
        {
          anchor,
          owner: configuredOwner,
          targets: distinctTargets
        }
      );
      continue;
    }

    addFinding(
      "error",
      "UNRESOLVED_ANCHOR_CONFLICT",
      `„${anchor}“ wird von mehreren Zielen ohne eindeutigen Eigentümer beansprucht.`,
      {
        anchor,
        targets: distinctTargets,
        files: owners.map((owner) => owner.filePath)
      }
    );
  }
}

const manufacturerAliases = definitions.filter((item) => item.group === "manufacturer");
const productAliases = definitions.filter((item) => item.group === "product");
for (const manufacturer of manufacturerAliases) {
  for (const product of productAliases) {
    if (manufacturer.normalizedAnchor === product.normalizedAnchor) {
      addFinding("error", "MANUFACTURER_PRODUCT_ALIAS_CONFLICT", `Hersteller und Produkt beanspruchen exakt „${manufacturer.anchor}“.`, { anchor: manufacturer.anchor, targets: [manufacturer.href, product.href] });
    }
  }
}

const explicitLinks = (body) => [...body.matchAll(/\[[^\]]+\]\((\/[^)#?]+\/?)(?:[?#][^)]*)?\)|href=["'](\/[^"'#?]+\/?)/g)]
  .map((match) => normalizeTaxonomyPath(match[1] || match[2])).filter(Boolean);
const boundaryRegex = (anchor) => new RegExp(`(?<![\\p{L}\\p{N}])${anchor.replace(/[.*+?^${}()|[\]\\]/g, "\\$&").replace(/\\ /g, "\\s+")}(?![\\p{L}\\p{N}])`, "giu");
const linkedTargetsBySource = new Map();
const incoming = new Map(docs.map((doc) => [doc.route, 0]));
const renderedAnchors = [];

for (const doc of docs) {
  const plain = stripMarkdown(doc.body);
  const existing = new Set(explicitLinks(doc.body));
  const sourceTopics = new Set(doc.topics);
  const candidates = [];
  for (const definition of definitions) {
    if (definition.href === doc.route || existing.has(definition.href)) continue;
    const pattern = boundaryRegex(definition.anchor);
    const match = pattern.exec(plain);
    if (!match) continue;
    const targetTopics = new Set(definition.topics);
    const sharedTopics = [...sourceTopics].filter((topic) => targetTopics.has(topic));
    const topicScore = sharedTopics.length * 100;
    const specificity = normalizeTaxonomyTerm(definition.anchor).split(" ").length * 1000 + definition.anchor.length;
    const intentScore = doc.intents.includes("comparison") && definition.group === "comparison" ? 150 :
      (doc.intents.includes("how-to") || doc.intents.includes("troubleshooting")) && definition.group === "comparison" ? -150 : 0;
    candidates.push({ ...definition, matched: match[0], index: match.index, score: (definition.exclusive ? 5000 : 0) + specificity + topicScore + intentScore, sharedTopics });
  }
  candidates.sort((a, b) => b.score - a.score || b.anchor.length - a.anchor.length || a.id.localeCompare(b.id, "de") || a.index - b.index);
  const selected = [];
  const targets = new Set(existing);
  for (const candidate of candidates) {
    if (selected.length >= doc.budget || targets.has(candidate.href)) continue;
    if (selected.some((item) => item.index < candidate.index + candidate.matched.length && item.index + item.matched.length > candidate.index)) continue;
    selected.push(candidate);
    targets.add(candidate.href);
  }
  linkedTargetsBySource.set(doc.route, targets);
  for (const target of targets) if (incoming.has(target)) incoming.set(target, (incoming.get(target) ?? 0) + 1);
  for (const item of selected) {
    renderedAnchors.push({ sourceRoute: doc.route, targetRoute: item.href, anchor: item.matched, score: item.score });
    if (sourceTopics.size && item.topics.length && item.sharedTopics.length === 0 && item.score > 1000) {
      addFinding("error", "WRONG_CLUSTER_TARGET_HIGH_CONFIDENCE", `${doc.route} würde „${item.matched}“ fachfremd auf ${item.href} verlinken.`, { sourceRoute: doc.route, targetRoute: item.href, anchor: item.matched });
    }
  }
  if (selected.length > doc.budget) addFinding("error", "PAGE_LINK_BUDGET_EXCEEDED", `${doc.route} überschreitet das Budget ${doc.budget}.`, { sourceRoute: doc.route, count: selected.length });
  if (targets.size !== new Set(targets).size) addFinding("error", "DUPLICATE_TARGET_ON_PAGE", `${doc.route} enthält doppelte automatische Ziele.`, { sourceRoute: doc.route });
  for (const target of targets) {
    if (!routeSet.has(target) && target.startsWith("/")) addFinding("error", "LINK_TARGET_ROUTE_MISSING", `${doc.route} verlinkt auf die nicht vorhandene Route ${target}.`, { sourceRoute: doc.route, targetRoute: target });
    if (target === doc.route) addFinding("error", "SELF_LINK", `${doc.route} enthält einen Selbstlink.`, { sourceRoute: doc.route });
  }
}

for (const [route, count] of incoming) {
  if (count === 0 && !route.startsWith("/admin/")) addFinding("warning", "NO_INCOMING_INTERNAL_LINK", `${route} besitzt im simulierten und expliziten Linkgraph keinen eingehenden Link.`, { targetRoute: route });
}
if (/semanticKeywordGroups|expandSemanticKeywords/.test(fs.readFileSync(path.join(appRoot, "src/domain/content/internalLinks.ts"), "utf8"))) {
  addFinding("error", "SEMANTIC_ANCHOR_EXPANSION_PRESENT", "Die alte semantische Anchor-Erweiterung ist noch vorhanden.");
}
for (const blocked of BLOCKED_ANCHOR_SET) {
  if (definitions.some((definition) => definition.normalizedAnchor === blocked)) {
    addFinding("error", "BLOCKED_ANCHOR_EFFECTIVE", `Der blockierte Anker „${blocked}“ ist nach Bereinigung noch wirksam.`, { anchor: blocked });
  }
}

const severityOrder = { error: 0, warning: 1, info: 2 };
findings.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity] || a.code.localeCompare(b.code) || a.message.localeCompare(b.message, "de"));
const errors = findings.filter((item) => item.severity === "error");
const warnings = findings.filter((item) => item.severity === "warning");
const criticalCodes = new Set(["TARGET_ROUTE_MISSING", "LINK_TARGET_ROUTE_MISSING", "UNRESOLVED_ANCHOR_CONFLICT", "BLOCKED_GENERIC_ANCHOR", "BLOCKED_ANCHOR_EFFECTIVE", "SELF_LINK", "WRONG_CLUSTER_TARGET_HIGH_CONFIDENCE", "SEMANTIC_ANCHOR_EXPANSION_PRESENT"]);
const critical = errors.filter((item) => criticalCodes.has(item.code));
const report = {
  version: "3.0.3",
  generatedAt: new Date().toISOString(),
  strict,
  summary: {
    documents: docs.length,
    contentRoutes: contentRouteSet.size,
    buildRoutes: buildRouteSet.size,
    validRoutes: routeSet.size,
    definitions: definitions.length,
    renderedAutomaticLinks: renderedAnchors.length,
    errors: errors.length,
    warnings: warnings.length,
    critical: critical.length
  },
  blockedAnchors: [...BLOCKED_ANCHOR_SET].sort(),
  findings,
  renderedAnchors,
  incomingLinks: Object.fromEntries([...incoming.entries()].sort())
};
fs.writeFileSync(path.join(reportDir, "internal-link-audit.json"), `${JSON.stringify(report, null, 2)}\n`, "utf8");
const md = [
  "# Audit interne Verlinkung 3.0",
  "",
  `Erstellt: ${report.generatedAt}`,
  "",
  "## Ergebnis",
  "",
  `- Dokumente: ${report.summary.documents}`,
  `- Linkdefinitionen: ${report.summary.definitions}`,
  `- Simulierte automatische Links: ${report.summary.renderedAutomaticLinks}`,
  `- Fehler: ${report.summary.errors}`,
  `- Warnungen: ${report.summary.warnings}`,
  `- Strict-kritisch: ${report.summary.critical}`,
  "",
  "## Befunde",
  "",
  ...(findings.length ? findings.map((item) => `- **${item.severity.toUpperCase()} ${item.code}:** ${item.message}`) : ["Keine Befunde."]),
  "",
  "## Tatsächlich simulierte Anchor-Texte",
  "",
  ...(renderedAnchors.length ? renderedAnchors.map((item) => `- ${item.sourceRoute} → ${item.targetRoute}: „${item.anchor}“`) : ["Keine automatischen Treffer im prüfbaren Markdown-Text."]),
  ""
].join("\n");
fs.writeFileSync(path.join(reportDir, "internal-link-audit.md"), md, "utf8");

const blockedMetadata = docs.flatMap((doc) => doc.rawAliases.filter(isBlockedAnchor).map((anchor) => ({ file: doc.filePath, anchor })));
const migration = [
  "# Migrationsbericht interne Verlinkung 3.0",
  "",
  "Die Migration ändert keine Fließtexte pauschal. Die neue Engine bereinigt nur Linking-Metadaten und verwirft blockierte Einzelanker deterministisch.",
  "",
  "## Geänderte Architekturdateien",
  "",
  "- zentrale Taxonomie und Ownership-Regeln",
  "- globale Linkauswahl und gemeinsames Seitenbudget",
  "- Related Content, Next Steps, Content Graph und SEO-Co-Pilot auf gemeinsame Themenlogik ausgerichtet",
  "",
  "## Entfernte oder blockierte Anker aus bestehenden Metadaten",
  "",
  ...(blockedMetadata.length ? blockedMetadata.map((item) => `- ${item.file}: „${item.anchor}“`) : ["- Keine problematischen Einzelanker in den gelesenen Metadaten."]),
  "",
  "## Konfliktauflösungen",
  "",
  ...findings.filter((item) => item.code.includes("CONFLICT") || item.code.includes("OWNER")).map((item) => `- ${item.message}`),
  "",
  "## Verbleibende manuelle Entscheidungen",
  "",
  ...warnings.filter((item) => ["PRODUCT_NAME_TOO_GENERIC", "LINKING_METADATA_MISSING"].includes(item.code)).map((item) => `- ${item.message}`),
  ""
].join("\n");
fs.writeFileSync(path.join(reportDir, "internal-link-migration.md"), migration, "utf8");

console.log(`Interne Verlinkung: ${docs.length} Dokumente, ${errors.length} Fehler, ${warnings.length} Warnungen, ${critical.length} strict-kritisch.`);
console.log(`Berichte: ${path.relative(root, reportDir)}/internal-link-audit.{json,md}`);
if (strict && critical.length) process.exit(1);

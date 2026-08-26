#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import {
  activeOpportunities,
  loadContentDocuments,
  matchDemandNodes,
  nodesFromGroundTruth,
  nodesFromSearch,
  renderOpportunities,
} from "../../src/lib/demand-discovery/engine.mjs";

const appRoot = fileURLToPath(new URL("../../", import.meta.url));
const read = async (relative) => JSON.parse(await fs.readFile(path.join(appRoot, relative), "utf8"));
const generatedAt = new Date().toISOString();
const [graph, search, groundTruth, gpsDataAsset] = await Promise.all([
  read("src/generated/content-graph.json"),
  read("src/data/seo/search-dashboard-ranges.json"),
  read("reports/demand-enhancement/demand-enhancement-1.json"),
  read("reports/authority-distribution/data-assets/gps-subscriptions.json"),
]);
const documents = await loadContentDocuments(appRoot, graph);
const researchNodes = nodesFromGroundTruth(groundTruth, groundTruth.generatedAt ?? generatedAt).map((node) => {
  const references = node.sourceSignals.flatMap((item) => item.references ?? []);
  return references.some((reference) => String(reference).includes("gps-subscriptions.json"))
    ? { ...node, publicationGate: gpsDataAsset.finding?.status ?? "unknown" }
    : node;
});
const searchNodes = nodesFromSearch(search, { rangeKey: "28d", limit: Math.max(0, 20 - researchNodes.length) });
const nodes = [...researchNodes, ...searchNodes];
const matches = matchDemandNodes(nodes, documents, { search, rangeKey: "28d" });
const outputDir = path.join(appRoot, "reports/demand-discovery");
await fs.mkdir(outputDir, { recursive: true });

const infrastructure = [
  "Search Platform: src/data/seo/search-dashboard-ranges.json (Combined GSC/Bing; keine neue Provider-Schicht)",
  "Content Graph: src/generated/content-graph.json (Route, Cluster, Topics, Aliases und Verknüpfungen)",
  "Content Collections: bestehendes Frontmatter, SEO-Titel, Überschriften und Body",
  "Topical Authority: vorhandene Intent-Owner und Cluster-Metadaten",
  "Research Engine: demand-enhancement-1.json als bestehende Research-Evidence und Regression",
  "Admin/Cockpit: bestehender Research-/SEO-Bereich als künftiger read-only Listen-Consumer",
];
const inputs = {
  searchGeneratedAt: search.generatedAt,
  googleUpdatedAt: search.dataUpdatedAt?.google,
  bingUpdatedAt: search.dataUpdatedAt?.bing,
  graphGeneratedAt: graph.generatedAt,
  groundTruthGeneratedAt: groundTruth.generatedAt ?? null,
};
const counts = Object.fromEntries(["covered", "partial", "fragmented", "missing", "overcovered", "uncertain"].map((status) => [status, matches.filter((item) => item.status === status).length]));
await fs.writeFile(path.join(outputDir, "demand-nodes.json"), `${JSON.stringify({ schemaVersion: 1, generatedAt, mode: "read-only", inputs, nodes }, null, 2)}\n`);
await fs.writeFile(path.join(outputDir, "demand-matching.json"), `${JSON.stringify({ schemaVersion: 1, generatedAt, mode: "read-only", counts, activeOpportunities: activeOpportunities(matches).length, matches }, null, 2)}\n`);
await fs.writeFile(path.join(outputDir, "demand-opportunities.md"), renderOpportunities({ generatedAt, matches, infrastructure, inputs }));
console.log(`Demand Discovery: ${nodes.length} Nodes; ${matches.length} Matches; ${activeOpportunities(matches).length} aktive Opportunities.`);
console.log(`Status: ${Object.entries(counts).map(([key, value]) => `${key} ${value}`).join(", ")}.`);

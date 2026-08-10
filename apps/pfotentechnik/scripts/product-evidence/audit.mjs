#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const dir = path.join(app, "src", "content", "products");
const out = path.join(app, "reports", "product-evidence");
fs.mkdirSync(out, { recursive: true });
const block = (raw, key) => {
  const lines = raw.split(/\r?\n/);
  const start = lines.findIndex((line) => new RegExp("^" + key + ":\\s*$").test(line));
  if (start < 0) return "";
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) {
    if (/^[A-Za-z0-9_äöüÄÖÜß-]+:\s*/.test(lines[i])) { end = i; break; }
  }
  return lines.slice(start, end).join("\n");
};
const rows = fs.readdirSync(dir).filter((n) => /\.mdx?$/i.test(n)).sort().map((name) => {
  const raw = fs.readFileSync(path.join(dir, name), "utf8");
  const slug = (raw.match(/^slug:\s*["']?([^"'\n]+)["']?/m)?.[1] || name.replace(/\.mdx?$/i, "")).trim();
  const ext = block(raw, "externalEvidence");
  const hasExternal = Boolean(ext);
  const professional = (ext.match(/^\s*-\s+publisher:\s*/gm) || []).length;
  const userSources = (ext.match(/^\s*-\s+platform:\s*/gm) || []).length;
  const consensus = (ext.match(/^\s*-\s+finding:\s*/gm) || []).length;
  const missingParts = [];
  if (!professional) missingParts.push("professionalReviews");
  if (!userSources) missingParts.push("userReviews");
  if (!consensus) missingParts.push("consensus");
  const status = !hasExternal ? "missing" : missingParts.length ? "partial" : "complete";
  return { slug, file: "src/content/products/" + name, status, hasExternal, professional, userSources, consensus, missingParts };
});
const summary = {
  products: rows.length,
  covered: rows.filter((r) => r.hasExternal).length,
  complete: rows.filter((r) => r.status === "complete").length,
  partial: rows.filter((r) => r.status === "partial").length,
  missing: rows.filter((r) => r.status === "missing").length,
};
fs.writeFileSync(path.join(out, "latest.json"), JSON.stringify({ generatedAt: new Date().toISOString(), summary, rows }, null, 2) + "\n");
const g = (status) => rows.filter((r) => r.status === status);
fs.writeFileSync(path.join(out, "latest.md"), [
  "# Product External Evidence Audit", "",
  "- Produkte: " + summary.products,
  "- Mit externalEvidence: " + summary.covered,
  "- Vollständig: " + summary.complete,
  "- Teilweise: " + summary.partial,
  "- Ohne Evidenz: " + summary.missing, "",
  "## Vollständig", "",
  ...(g("complete").length ? g("complete").map((r) => "- " + r.slug) : ["Keine."]), "",
  "## Teilweise", "",
  ...(g("partial").length ? g("partial").map((r) => "- " + r.slug + " · fehlt: " + r.missingParts.join(", ")) : ["Keine."]), "",
  "## Ohne Evidenz", "",
  ...(g("missing").length ? g("missing").map((r) => "- " + r.slug) : ["Keine."]), "",
].join("\n"));
console.log("External Evidence: " + summary.covered + "/" + summary.products + "; vollständig: " + summary.complete + "; teilweise: " + summary.partial + "; fehlend: " + summary.missing);

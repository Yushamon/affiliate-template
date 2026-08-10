#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const strict = process.argv.includes("--strict");
const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const root = path.resolve(app, "../..");
const governanceFile = path.join(app, "src/domain/content/anchor-governance.generated.json");
const redirectsFile = path.join(app, "public/_redirects");
const dist = path.join(app, "dist");
const reportDir = path.join(app, "reports/internal-linking");
const findings = [];

const add = (severity, code, details) => findings.push({ severity, code, ...details });
const normalize = (value) => String(value ?? "").trim().toLocaleLowerCase("de-DE").normalize("NFKC").replace(/[\u00a0\u202f]/g, " ").replace(/[‐‑‒–—]/g, "-").replace(/\s+/g, " ");
const normPath = (value) => {
  try {
    const url = new URL(String(value ?? ""), "https://pfotentechnik.de/");
    let pathname = decodeURI(url.pathname).replace(/\/{2,}/g, "/");
    return pathname === "/" ? "/" : pathname.replace(/\/+$/, "") + "/";
  } catch { return ""; }
};

if (!fs.existsSync(governanceFile)) {
  add("error", "ANCHOR_GOVERNANCE_MISSING", { reason: "Governance-Inventar fehlt.", file: path.relative(root, governanceFile) });
} else {
  const data = JSON.parse(fs.readFileSync(governanceFile, "utf8"));
  const owners = data.owners ?? {};
  // Governance is a source-level contract. The release preflight runs before a
  // fresh Astro build, so dist/ can legitimately be stale. Build the route
  // inventory from source content first and only use dist as an additional
  // signal for static/non-content routes.
  const routes = new Set();
  const addRoute = (value) => {
    const route = normPath(value);
    if (route) routes.add(route);
  };
  const readSlug = (file) => {
    const source = fs.readFileSync(file, "utf8");
    const frontmatter = source.match(/^---\\s*\\n([\\s\\S]*?)\\n---/);
    if (!frontmatter) return "";
    const slug = frontmatter[1].match(/^slug:\\s*["']?([^"'\\n#]+?)["']?\\s*$/m);
    return slug ? slug[1].trim() : "";
  };
  const collectContentRoutes = (dir, prefix = "/") => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) collectContentRoutes(file, prefix);
      else if (entry.isFile() && /\\.mdx?$/.test(entry.name)) {
        const slug = readSlug(file) || entry.name.replace(/\\.mdx?$/, "");
        addRoute(prefix + slug + "/");
      }
    }
  };
  collectContentRoutes(path.join(app, "src/content/pages"), "/");
  collectContentRoutes(path.join(app, "src/content/comparisons"), "/vergleiche/");
  collectContentRoutes(path.join(app, "src/content/products"), "/produkt/");
  collectContentRoutes(path.join(app, "src/content/manufacturers"), "/hersteller/");

  const walkDist = (dir) => {
    if (!fs.existsSync(dir)) return;
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
      const file = path.join(dir, entry.name);
      if (entry.isDirectory()) walkDist(file);
      else if (entry.name === "index.html") {
        const relative = path.relative(dist, file).replace(/\\/g, "/");
        addRoute(relative === "index.html" ? "/" : "/" + relative.slice(0, -10));
      }
    }
  };
  walkDist(dist);

  const redirects = new Map();
  if (fs.existsSync(redirectsFile)) {
    for (const line of fs.readFileSync(redirectsFile, "utf8").split(/\r?\n/)) {
      const parts = line.trim().split(/\s+/);
      if (parts.length >= 3 && /^30[1278]$/.test(parts[2])) redirects.set(normPath(parts[0]), normPath(parts[1]));
    }
  }

  const seen = new Map();
  for (const [rawAnchor, owner] of Object.entries(owners)) {
    const anchor = normalize(rawAnchor);
    if (!anchor) add("error", "ANCHOR_RULE_EMPTY", { anchor: rawAnchor });
    if (seen.has(anchor)) add("error", "ANCHOR_RULE_DUPLICATE", { anchor, targets: [seen.get(anchor), owner.target] });
    seen.set(anchor, owner.target);
    const target = normPath(owner.target);
    if (redirects.has(target)) add("error", "ANCHOR_TARGET_REDIRECT", { anchor, target, finalTarget: redirects.get(target) });
    if (routes.size && !routes.has(target)) add("error", "ANCHOR_TARGET_MISSING", { anchor, target });
    if (!Number.isFinite(owner.priority)) add("error", "ANCHOR_PRIORITY_INVALID", { anchor, target });
  }

  const entries = Object.entries(owners);
  for (let i = 0; i < entries.length; i += 1) {
    for (let j = i + 1; j < entries.length; j += 1) {
      const [leftAnchor, left] = entries[i];
      const [rightAnchor, right] = entries[j];
      const a = normalize(leftAnchor);
      const b = normalize(rightAnchor);
      if (a !== b && (a.includes(b) || b.includes(a)) && left.target !== right.target) {
        const specific = a.length > b.length ? left : right;
        const generic = a.length > b.length ? right : left;
        if ((specific.priority ?? 0) <= (generic.priority ?? 0)) {
          add("error", "ANCHOR_OVERLAP_CONFLICT", {
            anchors: [leftAnchor, rightAnchor],
            targets: [left.target, right.target],
            reason: "Spezifischer Anchor besitzt keinen höheren Vorrang."
          });
        }
      }
    }
  }

  for (const unresolved of data.unresolved ?? []) {
    add("warning", "ANCHOR_TARGET_UNRESOLVED", {
      anchor: unresolved.anchor,
      candidates: unresolved.candidates,
      intent: unresolved.intent,
      reason: "Keine vorhandene Zielroute; Regel bleibt deaktiviert."
    });
  }
}

const errors = findings.filter((item) => item.severity === "error");
const warnings = findings.filter((item) => item.severity === "warning");
fs.mkdirSync(reportDir, { recursive: true });
const report = { version: "1.0.0", generatedAt: new Date().toISOString(), summary: { errors: errors.length, warnings: warnings.length }, findings };
fs.writeFileSync(path.join(reportDir, "anchor-governance-audit.json"), JSON.stringify(report, null, 2) + "\n", "utf8");
fs.writeFileSync(path.join(reportDir, "anchor-governance-audit.md"), [
  "# Anchor Governance Audit", "",
  "- Fehler: " + errors.length,
  "- Warnungen: " + warnings.length, "",
  ...findings.map((item) => "- **" + item.severity.toUpperCase() + " " + item.code + "** " + (item.anchor ?? item.anchors?.join(" / ") ?? "") + " " + (item.target ?? ""))
].join("\n") + "\n", "utf8");
console.log("Anchor Governance: " + errors.length + " Fehler, " + warnings.length + " Warnungen.");
if (errors.length) process.exit(1);

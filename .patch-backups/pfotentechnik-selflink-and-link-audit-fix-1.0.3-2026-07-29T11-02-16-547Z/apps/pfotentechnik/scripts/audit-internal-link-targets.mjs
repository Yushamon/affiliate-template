#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const strict = process.argv.includes("--strict");
const scriptDir = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(scriptDir, "..");
const root = path.resolve(app, "../..");
const dist = path.join(app, "dist");
const redirectsFile = path.join(app, "public", "_redirects");
const reportDir = path.join(app, "reports", "internal-linking");

const HOSTS = new Set(["pfotentechnik.de", "www.pfotentechnik.de"]);
const FUNCTIONAL_QUERY_KEYS = new Set(["filter", "tab", "sort", "view", "page", "step"]);
const findings = [];

const add = (severity, code, details) => findings.push({ severity, code, ...details });

const safeDecode = (value) => {
  try { return decodeURI(value); } catch { return value; }
};

const normalizePath = (value) => {
  const input = String(value ?? "").trim();
  if (!input) return "";
  if (input.startsWith("#")) return input;
  if (/^(?:mailto:|tel:|sms:|javascript:|data:|blob:)/i.test(input)) return "";

  try {
    const url = new URL(input, "https://pfotentechnik.de/");
    if (!HOSTS.has(url.hostname.toLowerCase())) return "";
    let pathname = safeDecode(url.pathname).replace(/\\/g, "/").replace(/\/{2,}/g, "/");
    const segments = [];
    for (const part of pathname.split("/")) {
      if (!part || part === ".") continue;
      if (part === "..") segments.pop();
      else segments.push(part);
    }
    pathname = "/" + segments.join("/");
    return pathname === "/" ? "/" : pathname.replace(/\/+$/, "") + "/";
  } catch {
    return "";
  }
};

const parseRedirects = () => {
  const map = new Map();
  for (const [index, rawLine] of fs.readFileSync(redirectsFile, "utf8").split(/\r?\n/).entries()) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const parts = line.split(/\s+/);
    if (parts.length < 3 || !/^30[1278]$/.test(parts[2])) continue;
    const from = normalizePath(parts[0]);
    const to = normalizePath(parts[1]);
    if (!from || !to) continue;
    if (map.has(from) && map.get(from) !== to) {
      add("error", "REDIRECT_CONFLICT", {
        sourceFile: path.relative(root, redirectsFile),
        line: index + 1,
        sourceRoute: from,
        originalTarget: parts[1],
        normalizedTarget: to,
        reason: "Ein Redirect-Alias besitzt mehrere Ziele.",
        recommendation: "Den Konflikt in public/_redirects auflösen."
      });
    }
    map.set(from, to);
  }
  return map;
};

const redirects = parseRedirects();

const resolveRedirect = (value) => {
  let current = normalizePath(value);
  const chain = [];
  const seen = new Set();

  while (redirects.has(current)) {
    if (seen.has(current)) {
      return { final: current, chain, loop: true };
    }
    seen.add(current);
    chain.push(current);
    current = redirects.get(current);
  }
  return { final: current, chain, loop: false };
};

for (const alias of redirects.keys()) {
  const resolved = resolveRedirect(alias);
  if (resolved.loop) {
    add("error", "REDIRECT_LOOP", {
      sourceFile: path.relative(root, redirectsFile),
      sourceRoute: alias,
      originalTarget: alias,
      normalizedTarget: alias,
      finalTarget: resolved.final,
      redirectChain: resolved.chain,
      reason: "Redirectloop erkannt.",
      recommendation: "Redirectloop auflösen."
    });
  } else if (resolved.chain.length > 1) {
    // Eine vorhandene Redirectkette ist nur dann release-blockierend,
    // wenn produktives HTML tatsächlich auf ihren Start-Alias verlinkt.
    // Die Linkschleife unten meldet solche Fälle weiterhin als REDIRECT_CHAIN.
  }
}

const walk = (dir, output = []) => {
  if (!fs.existsSync(dir)) return output;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(file, output);
    else output.push(file);
  }
  return output;
};

const htmlFiles = walk(dist).filter((file) => file.endsWith(".html"));
const routeForFile = (file) => {
  const relative = path.relative(dist, file).replace(/\\/g, "/");
  if (relative === "index.html") return "/";
  if (relative.endsWith("/index.html")) return "/" + relative.slice(0, -11) + "/";
  return "/" + relative.replace(/\.html$/i, "") + "/";
};
const existingRoutes = new Set(htmlFiles.map(routeForFile));

const isAssetOrFile = (value) => {
  try {
    const url = new URL(value, "https://pfotentechnik.de/");
    return /\.[a-z0-9]{2,8}$/i.test(url.pathname);
  } catch {
    return false;
  }
};

const functionalQuery = (value) => {
  try {
    const url = new URL(value, "https://pfotentechnik.de/");
    const result = new URLSearchParams();
    for (const [key, val] of url.searchParams) {
      if (FUNCTIONAL_QUERY_KEYS.has(key)) result.append(key, val);
    }
    return result.toString();
  } catch {
    return "";
  }
};

const extractCanonical = (html) =>
  html.match(/<link\b[^>]*rel=["']canonical["'][^>]*href=["']([^"']+)["']/i)?.[1]
  ?? html.match(/<link\b[^>]*href=["']([^"']+)["'][^>]*rel=["']canonical["']/i)?.[1]
  ?? "";

const extractMain = (html) =>
  html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? "";

const idsIn = (html) => new Set(
  [...html.matchAll(/\bid=["']([^"']+)["']/gi)].map((match) => safeDecode(match[1]))
);

const stripTags = (html) => html.replace(/<[^>]+>/g, "").replace(/&nbsp;/gi, " ").trim();

for (const file of htmlFiles) {
  const html = fs.readFileSync(file, "utf8");
  const sourceRoute = routeForFile(file);
  const canonicalRaw = extractCanonical(html);
  const canonicalResolved = resolveRedirect(canonicalRaw);
  const canonical = canonicalResolved.final;
  const sourceFile = path.relative(root, file).replace(/\\/g, "/");

  if (!canonical) {
    add("error", "CANONICAL_MISSING", {
      sourceFile,
      sourceRoute,
      originalTarget: canonicalRaw,
      normalizedTarget: "",
      finalTarget: "",
      reason: "Keine auswertbare interne Canonical-URL vorhanden.",
      recommendation: "Canonical-Ausgabe der Seite prüfen."
    });
    continue;
  }

  if (!existingRoutes.has(canonical)) {
    add("error", "CANONICAL_TARGET_MISSING", {
      sourceFile,
      sourceRoute,
      originalTarget: canonicalRaw,
      normalizedTarget: normalizePath(canonicalRaw),
      finalTarget: canonical,
      reason: "Canonical-Ziel ist nicht im Build-Routeninventar vorhanden.",
      recommendation: "Canonical und erzeugte Route abgleichen."
    });
  }

  const main = extractMain(html);
  if (!main) continue;
  const documentIds = idsIn(html);

  for (const match of main.matchAll(/<a\b([^>]*?)href=["']([^"']*)["']([^>]*)>([\s\S]*?)<\/a>/gi)) {
    const attrs = `${match[1]} ${match[3]}`;
    const href = match[2].trim();
    const inner = match[4];
    const className = attrs.match(/class=["']([^"']+)["']/i)?.[1] ?? "";
    const ariaCurrent = attrs.match(/aria-current=["']([^"']+)["']/i)?.[1] ?? "";
    const role = attrs.match(/role=["']([^"']+)["']/i)?.[1] ?? "";

    if (!href) {
      add("error", "EMPTY_LINK_TARGET", {
        sourceFile,
        sourceRoute,
        originalTarget: href,
        normalizedTarget: "",
        finalTarget: "",
        reason: "Leeres href im Hauptinhalt.",
        recommendation: "Link entfernen oder ein gültiges Ziel setzen.",
        className
      });
      continue;
    }

    if (/^(?:mailto:|tel:|sms:|javascript:|data:|blob:)/i.test(href)) continue;

    let url;
    try { url = new URL(href, "https://pfotentechnik.de/"); }
    catch {
      add("warning", "UNRESOLVED_DYNAMIC_LINK", {
        sourceFile,
        sourceRoute,
        originalTarget: href,
        normalizedTarget: "",
        finalTarget: "",
        reason: "Link konnte nicht statisch aufgelöst werden.",
        recommendation: "Nur bei dynamischer Erzeugung im gerenderten HTML weiter prüfen."
      });
      continue;
    }

    if (!HOSTS.has(url.hostname.toLowerCase())) continue;
    if (isAssetOrFile(href)) continue;

    const rawPath = normalizePath(href);
    const resolved = resolveRedirect(href);
    const finalTarget = resolved.final;
    const functional = functionalQuery(href);
    const hash = safeDecode(url.hash.replace(/^#/, ""));

    if (resolved.loop) {
      add("error", "REDIRECT_LOOP", {
        sourceFile,
        sourceRoute,
        originalTarget: href,
        normalizedTarget: rawPath,
        finalTarget,
        redirectChain: resolved.chain,
        reason: "Verlinktes Ziel führt in einen Redirectloop.",
        recommendation: "Link auf ein funktionierendes finales Ziel umstellen."
      });
      continue;
    }

    if (resolved.chain.length > 1) {
      add("error", "REDIRECT_CHAIN", {
        sourceFile,
        sourceRoute,
        originalTarget: href,
        normalizedTarget: rawPath,
        finalTarget,
        redirectChain: resolved.chain,
        reason: "Interner Link führt über eine Redirectkette.",
        recommendation: "Direkt auf das finale Ziel verlinken."
      });
    } else if (resolved.chain.length === 1) {
      add("warning", "INTERNAL_REDIRECT", {
        sourceFile,
        sourceRoute,
        originalTarget: href,
        normalizedTarget: rawPath,
        finalTarget,
        reason: "Interner Link zeigt auf einen funktionierenden Redirect-Alias.",
        recommendation: "Bei Gelegenheit direkt auf das finale Ziel umstellen."
      });
    }

    if (hash) {
      if (finalTarget === canonical || finalTarget === sourceRoute) {
        if (!documentIds.has(hash)) {
          add("error", "MISSING_HASH_TARGET", {
            sourceFile,
            sourceRoute,
            originalTarget: href,
            normalizedTarget: rawPath,
            finalTarget,
            reason: `Hash-Ziel #${hash} existiert nicht im Dokument.`,
            recommendation: "Hash korrigieren oder Link entfernen."
          });
        }
        continue;
      }
    }

    const isBreadcrumbCurrent =
      /breadcrumb/i.test(className) &&
      (ariaCurrent === "page" || /current/i.test(className));
    const isNavigationState =
      ariaCurrent === "page" ||
      /(?:nav|menu|pagination|tabs?)/i.test(className) ||
      role === "tab";

    if (
      finalTarget === canonical &&
      !functional &&
      !hash &&
      !isBreadcrumbCurrent &&
      !isNavigationState
    ) {
      add("error", "SELF_LINK", {
        sourceFile,
        sourceRoute,
        originalTarget: href,
        normalizedTarget: rawPath,
        finalTarget,
        reason: "Link im Hauptinhalt zeigt auf die eigene Canonical-Route.",
        recommendation: "Linktext entlinken oder den Empfehlungs-/CTA-Eintrag entfernen.",
        className
      });
    }

    if (
      finalTarget &&
      finalTarget.startsWith("/") &&
      !existingRoutes.has(finalTarget) &&
      !finalTarget.startsWith("/api/")
    ) {
      add("error", "MISSING_TARGET", {
        sourceFile,
        sourceRoute,
        originalTarget: href,
        normalizedTarget: rawPath,
        finalTarget,
        reason: "Internes Ziel ist nicht im Build-Routeninventar vorhanden.",
        recommendation: "Link korrigieren oder fehlende Route wiederherstellen."
      });
    }

    if (/\b(?:card|cta)\b/i.test(className) && !stripTags(inner)) {
      add("error", "EMPTY_LINK_CARD", {
        sourceFile,
        sourceRoute,
        originalTarget: href,
        normalizedTarget: rawPath,
        finalTarget,
        reason: "Leere verlinkte Karte oder CTA im Hauptinhalt.",
        recommendation: "Block nicht rendern oder sichtbaren Inhalt ergänzen."
      });
    }
  }

  for (const section of main.matchAll(/<section\b[^>]*(?:pt-next-steps|related)[^>]*>([\s\S]*?)<\/section>/gi)) {
    if (!/<a\b|<button\b/i.test(section[1])) {
      add("error", "EMPTY_RECOMMENDATION_BLOCK", {
        sourceFile,
        sourceRoute,
        reason: "Empfehlungsblock wird ohne interaktive Einträge gerendert.",
        recommendation: "Komponente bei leerer Liste vollständig ausblenden."
      });
    }
  }
}

for (const route of ["/", "/vergleiche/", "/hersteller/", "/wissen/", "/kontakt/"]) {
  if (!existingRoutes.has(route)) {
    add("error", "ROUTE_INVENTORY_MISSING", {
      sourceRoute: route,
      originalTarget: route,
      normalizedTarget: route,
      finalTarget: route,
      reason: "Erwartete statische Kernroute fehlt im Build-Routeninventar.",
      recommendation: "Astro-Build und Seitenstruktur prüfen."
    });
  }
}

const errors = findings.filter((finding) => finding.severity === "error");
const warnings = findings.filter((finding) => finding.severity === "warning");

fs.mkdirSync(reportDir, { recursive: true });
const report = {
  version: "2.0.1",
  generatedAt: new Date().toISOString(),
  strict,
  summary: {
    pages: htmlFiles.length,
    routes: existingRoutes.size,
    redirectAliases: redirects.size,
    errors: errors.length,
    warnings: warnings.length
  },
  findings
};

fs.writeFileSync(
  path.join(reportDir, "internal-link-target-audit.json"),
  JSON.stringify(report, null, 2) + "\n",
  "utf8"
);

const markdown = [
  "# Audit interne Linkziele und Selbstlinks",
  "",
  `Erstellt: ${report.generatedAt}`,
  "",
  `- Gebaute Seiten: ${report.summary.pages}`,
  `- Routen im Inventar: ${report.summary.routes}`,
  `- Redirect-Aliasse: ${report.summary.redirectAliases}`,
  `- Fehler: ${report.summary.errors}`,
  `- Warnungen: ${report.summary.warnings}`,
  "",
  "## Befunde",
  "",
  ...(findings.length
    ? findings.map((finding) =>
        `- **${finding.severity.toUpperCase()} ${finding.code}:** ${finding.sourceFile ?? finding.sourceRoute ?? ""} ${finding.originalTarget ?? ""}${finding.finalTarget && finding.finalTarget !== finding.originalTarget ? " → " + finding.finalTarget : ""} — ${finding.reason ?? ""}`
      )
    : ["Keine Befunde."]),
  ""
].join("\n");

fs.writeFileSync(
  path.join(reportDir, "internal-link-target-audit.md"),
  markdown,
  "utf8"
);

console.log(
  `Interne Linkziele: ${htmlFiles.length} Seiten, ${errors.length} Fehler, ${warnings.length} Warnungen.`
);

if (errors.length) process.exit(1);

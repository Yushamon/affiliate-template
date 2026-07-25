#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { fileURLToPath } from "node:url";
import { spawnSync } from "node:child_process";

const PATCH_ID = "pfotentechnik-seo-week1-consolidation-9.0.0";
const APP_REL = "apps/pfotentechnik";
const CHECK_ONLY = process.argv.includes("--check");

const routeMap = [
  {
    from: "/beste-futterautomaten-fuer-katzen",
    to: "/vergleiche/beste-futterautomaten-fuer-katzen/",
    page: "src/content/pages/beste-futterautomaten-fuer-katzen.md"
  },
  {
    from: "/beste-futterautomaten-fuer-hunde",
    to: "/vergleiche/beste-futterautomaten-fuer-hunde/",
    page: "src/content/pages/beste-futterautomaten-fuer-hunde.md"
  },
  {
    from: "/beste-futterautomaten-fuer-zwei-katzen",
    to: "/vergleiche/beste-futterautomaten-fuer-zwei-katzen/",
    page: "src/content/pages/beste-futterautomaten-fuer-zwei-katzen.md"
  },
  {
    from: "/beste-futterautomaten-fuer-nassfutter",
    to: "/vergleiche/beste-futterautomaten-fuer-nassfutter/",
    page: "src/content/pages/beste-futterautomaten-fuer-nassfutter.md"
  }
];

const textExtensions = new Set([
  ".md", ".mdx", ".astro", ".ts", ".tsx", ".js", ".mjs", ".json", ".yml", ".yaml"
]);

function log(message = "") {
  console.log(`[${PATCH_ID}] ${message}`);
}

function fail(message) {
  throw new Error(message);
}

function parseRepoArg() {
  const index = process.argv.indexOf("--repo");
  return index >= 0 ? process.argv[index + 1] : undefined;
}

function isRepoRoot(candidate) {
  return fs.existsSync(path.join(candidate, "package.json")) &&
    fs.existsSync(path.join(candidate, APP_REL, "src"));
}

function findRepoRoot() {
  const explicit = parseRepoArg();
  if (explicit) {
    const resolved = path.resolve(explicit);
    if (!isRepoRoot(resolved)) fail(`Kein passendes Repository unter --repo: ${resolved}`);
    return resolved;
  }

  const starts = [process.cwd(), path.dirname(fileURLToPath(import.meta.url))];
  for (const start of starts) {
    let current = path.resolve(start);
    while (true) {
      if (isRepoRoot(current)) return current;
      const parent = path.dirname(current);
      if (parent === current) break;
      current = parent;
    }
  }
  fail(`Repository nicht gefunden. Starte im Repository-Root oder nutze --repo <pfad>.`);
}

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content, "utf8");
}

function walk(dir, result = []) {
  if (!fs.existsSync(dir)) return result;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (["node_modules", "dist", ".astro", ".git", ".patch-backups", "reports"].includes(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, result);
    else result.push(full);
  }
  return result;
}

function shouldScanSource(file, appRoot) {
  const rel = path.relative(appRoot, file).replaceAll(path.sep, "/");
  if (!textExtensions.has(path.extname(file).toLowerCase())) return false;
  if (rel.startsWith("src/data/seo/")) return false;
  if (rel.startsWith("reports/")) return false;
  if (rel === "public/_redirects") return false;
  return rel.startsWith("src/") || rel === "package.json" || rel === "astro.config.mjs";
}

function replaceLegacyRoutes(content) {
  let next = content;
  for (const route of routeMap) {
    const escaped = route.from.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
    const pattern = new RegExp(
      `(^|[\\s\\"'\\(=:])${escaped}(?:/)?(?=$|[\\s\\"'\\)#?])`,
      "gm"
    );
    next = next.replace(pattern, (_match, prefix) => `${prefix}${route.to}`);
  }
  return next;
}

function containsLegacyRoute(content, route) {
  const escaped = route.from.replace(/[.*+?^$()|[\]\\]/g, "\\$&");
  const pattern = new RegExp(
    `(^|[\\s\\"'\\(=:])${escaped}(?:/)?(?=$|[\\s\\"'\\)#?])`,
    "m"
  );
  return pattern.test(content);
}

function normalizeRedirects(content) {
  const originalLines = content ? content.replace(/\r\n/g, "\n").split("\n") : [];
  const sources = new Set(routeMap.flatMap((route) => [route.from, `${route.from}/`]));
  const canonicalComment = "# pfotentechnik: kanonische Comparison-Routen";
  const kept = originalLines.filter((line) => {
    const trimmed = line.trim();
    if (trimmed === canonicalComment) return false;
    if (!trimmed || trimmed.startsWith("#")) return true;
    const source = trimmed.split(/\s+/)[0];
    return !sources.has(source);
  });

  while (kept.length && kept.at(-1) === "") kept.pop();
  if (kept.length) kept.push("");
  kept.push("# pfotentechnik: kanonische Comparison-Routen");
  for (const route of routeMap) {
    kept.push(`${route.from} ${route.to} 301`);
    kept.push(`${route.from}/ ${route.to} 301`);
  }
  return `${kept.join("\n")}\n`;
}

function patchComparisonViewModel(content) {
  let next = content;

  if (!next.includes("const explicitItems = data.items.filter")) {
    const explicitPattern = /  const explicitSlugs = new Set\(\s*data\.items\.map\(\(item\) => item\.slug\)\s*\);/m;
    if (!explicitPattern.test(next)) {
      fail("Anker für explicitSlugs in buildComparisonViewModel.ts nicht gefunden.");
    }
    next = next.replace(explicitPattern, `  const explicitItems = data.items.filter(\n    (item, index, source) =>\n      source.findIndex(\n        (candidate) =>\n          candidate.type === item.type &&\n          candidate.slug === item.slug\n      ) === index\n  );\n\n  const explicitSlugs = new Set(\n    explicitItems.map((item) => item.slug)\n  );`);
  }

  const autoStart = `  const automaticItems = products\n    .filter(`;
  if (!next.includes("const automaticItems = explicitItems.length === 0")) {
    if (!next.includes(autoStart)) fail("Anker für automaticItems nicht gefunden.");
    next = next.replace(autoStart, `  // Kuratierte Vergleichslisten sind autoritativ. Automatische\n  // Produktzuordnung dient nur als Fallback, wenn keine items gepflegt sind.\n  const automaticItems = explicitItems.length === 0\n    ? products\n      .filter(`);

    const autoEnd = `    .map((product) => ({\n      slug: product.data.slug,\n      label: product.data.title,\n      type: "product" as const,\n      recommendation: product.data.recommendation,\n      values: {}\n    }));`;
    if (!next.includes(autoEnd)) fail("Endanker für automaticItems nicht gefunden.");
    next = next.replace(autoEnd, `      .map((product) => ({\n        slug: product.data.slug,\n        label: product.data.title,\n        type: "product" as const,\n        recommendation: product.data.recommendation,\n        values: {}\n      }))\n    : [];`);
  }

  next = next.replace(
    "  const items = [...data.items, ...automaticItems];",
    "  const items = [...explicitItems, ...automaticItems];"
  );

  return next;
}

function dedupeComparisonFrontmatter(content) {
  const newline = content.includes("\r\n") ? "\r\n" : "\n";
  const lines = content.replace(/\r\n/g, "\n").split("\n");
  const boundaries = [];
  lines.forEach((line, index) => { if (line.trim() === "---") boundaries.push(index); });
  if (boundaries.length < 2) return content;
  const start = lines.findIndex((line, index) => index > boundaries[0] && index < boundaries[1] && /^items:\s*$/.test(line));
  if (start < 0) return content;

  let end = boundaries[1];
  for (let index = start + 1; index < boundaries[1]; index += 1) {
    if (/^[A-Za-z][A-Za-z0-9_-]*:\s*/.test(lines[index])) {
      end = index;
      break;
    }
  }

  const prefix = lines.slice(0, start + 1);
  const region = lines.slice(start + 1, end);
  const suffix = lines.slice(end);
  const preItems = [];
  const blocks = [];
  let current = null;

  for (const line of region) {
    if (/^\s{2}-\s+slug:\s*/.test(line)) {
      if (current) blocks.push(current);
      current = [line];
    } else if (current) {
      current.push(line);
    } else {
      preItems.push(line);
    }
  }
  if (current) blocks.push(current);
  if (!blocks.length) return content;

  const seen = new Set();
  const unique = [];
  for (const block of blocks) {
    const match = block[0].match(/^\s{2}-\s+slug:\s*["']?([^"'\s]+)["']?\s*$/);
    if (!match) {
      unique.push(block);
      continue;
    }
    const slug = match[1];
    if (seen.has(slug)) continue;
    seen.add(slug);
    unique.push(block);
  }

  const rebuilt = [...prefix, ...preItems, ...unique.flat(), ...suffix].join("\n");
  return newline === "\r\n" ? rebuilt.replace(/\n/g, "\r\n") : rebuilt;
}

const AUDIT_SCRIPT_BASE64 = "IyEvdXNyL2Jpbi9lbnYgbm9kZQppbXBvcnQgZnMgZnJvbSAibm9kZTpmcyI7CmltcG9ydCBwYXRoIGZyb20gIm5vZGU6cGF0aCI7CmltcG9ydCB7IGZpbGVVUkxUb1BhdGggfSBmcm9tICJub2RlOnVybCI7Cgpjb25zdCBhcHBSb290ID0gcGF0aC5yZXNvbHZlKHBhdGguZGlybmFtZShmaWxlVVJMVG9QYXRoKGltcG9ydC5tZXRhLnVybCkpLCAiLi4vLi4iKTsKY29uc3Qgcm91dGVzID0gWwogIHsKICAgICJmcm9tIjogIi9iZXN0ZS1mdXR0ZXJhdXRvbWF0ZW4tZnVlci1rYXR6ZW4iLAogICAgInRvIjogIi92ZXJnbGVpY2hlL2Jlc3RlLWZ1dHRlcmF1dG9tYXRlbi1mdWVyLWthdHplbi8iLAogICAgInBhZ2UiOiAic3JjL2NvbnRlbnQvcGFnZXMvYmVzdGUtZnV0dGVyYXV0b21hdGVuLWZ1ZXIta2F0emVuLm1kIgogIH0sCiAgewogICAgImZyb20iOiAiL2Jlc3RlLWZ1dHRlcmF1dG9tYXRlbi1mdWVyLWh1bmRlIiwKICAgICJ0byI6ICIvdmVyZ2xlaWNoZS9iZXN0ZS1mdXR0ZXJhdXRvbWF0ZW4tZnVlci1odW5kZS8iLAogICAgInBhZ2UiOiAic3JjL2NvbnRlbnQvcGFnZXMvYmVzdGUtZnV0dGVyYXV0b21hdGVuLWZ1ZXItaHVuZGUubWQiCiAgfSwKICB7CiAgICAiZnJvbSI6ICIvYmVzdGUtZnV0dGVyYXV0b21hdGVuLWZ1ZXItendlaS1rYXR6ZW4iLAogICAgInRvIjogIi92ZXJnbGVpY2hlL2Jlc3RlLWZ1dHRlcmF1dG9tYXRlbi1mdWVyLXp3ZWkta2F0emVuLyIsCiAgICAicGFnZSI6ICJzcmMvY29udGVudC9wYWdlcy9iZXN0ZS1mdXR0ZXJhdXRvbWF0ZW4tZnVlci16d2VpLWthdHplbi5tZCIKICB9LAogIHsKICAgICJmcm9tIjogIi9iZXN0ZS1mdXR0ZXJhdXRvbWF0ZW4tZnVlci1uYXNzZnV0dGVyIiwKICAgICJ0byI6ICIvdmVyZ2xlaWNoZS9iZXN0ZS1mdXR0ZXJhdXRvbWF0ZW4tZnVlci1uYXNzZnV0dGVyLyIsCiAgICAicGFnZSI6ICJzcmMvY29udGVudC9wYWdlcy9iZXN0ZS1mdXR0ZXJhdXRvbWF0ZW4tZnVlci1uYXNzZnV0dGVyLm1kIgogIH0KXTsKY29uc3QgZXJyb3JzID0gW107CmNvbnN0IGV4dHMgPSBuZXcgU2V0KFsiLm1kIiwgIi5tZHgiLCAiLmFzdHJvIiwgIi50cyIsICIudHN4IiwgIi5qcyIsICIubWpzIiwgIi5qc29uIiwgIi55bWwiLCAiLnlhbWwiXSk7CgpmdW5jdGlvbiB3YWxrKGRpciwgcmVzdWx0ID0gW10pIHsKICBpZiAoIWZzLmV4aXN0c1N5bmMoZGlyKSkgcmV0dXJuIHJlc3VsdDsKICBmb3IgKGNvbnN0IGVudHJ5IG9mIGZzLnJlYWRkaXJTeW5jKGRpciwgeyB3aXRoRmlsZVR5cGVzOiB0cnVlIH0pKSB7CiAgICBpZiAoWyJub2RlX21vZHVsZXMiLCAiZGlzdCIsICIuYXN0cm8iLCAiLmdpdCIsICIucGF0Y2gtYmFja3VwcyIsICJyZXBvcnRzIl0uaW5jbHVkZXMoZW50cnkubmFtZSkpIGNvbnRpbnVlOwogICAgY29uc3QgZnVsbCA9IHBhdGguam9pbihkaXIsIGVudHJ5Lm5hbWUpOwogICAgaWYgKGVudHJ5LmlzRGlyZWN0b3J5KCkpIHdhbGsoZnVsbCwgcmVzdWx0KTsgZWxzZSByZXN1bHQucHVzaChmdWxsKTsKICB9CiAgcmV0dXJuIHJlc3VsdDsKfQoKZnVuY3Rpb24gZXNjYXBlUmVnZXgodmFsdWUpIHsKICByZXR1cm4gdmFsdWUucmVwbGFjZSgvWy4qKz9eJCgpfFtcXVxcXS9nLCAiXFwkJiIpOwp9Cgpjb25zdCByZWRpcmVjdHNQYXRoID0gcGF0aC5qb2luKGFwcFJvb3QsICJwdWJsaWMvX3JlZGlyZWN0cyIpOwpjb25zdCByZWRpcmVjdHMgPSBmcy5leGlzdHNTeW5jKHJlZGlyZWN0c1BhdGgpID8gZnMucmVhZEZpbGVTeW5jKHJlZGlyZWN0c1BhdGgsICJ1dGY4IikgOiAiIjsKZm9yIChjb25zdCByb3V0ZSBvZiByb3V0ZXMpIHsKICBjb25zdCBwYWdlID0gcGF0aC5qb2luKGFwcFJvb3QsIHJvdXRlLnBhZ2UpOwogIGlmIChmcy5leGlzdHNTeW5jKHBhZ2UpKSBlcnJvcnMucHVzaChgQWx0c2VpdGUgZXhpc3RpZXJ0IG5vY2g6ICR7cm91dGUucGFnZX1gKTsKICBmb3IgKGNvbnN0IHNvdXJjZSBvZiBbcm91dGUuZnJvbSwgcm91dGUuZnJvbSArICIvIl0pIHsKICAgIGNvbnN0IGxpbmUgPSBgJHtzb3VyY2V9ICR7cm91dGUudG99IDMwMWA7CiAgICBpZiAoIXJlZGlyZWN0cy5zcGxpdCgvXHI/XG4vKS5pbmNsdWRlcyhsaW5lKSkgZXJyb3JzLnB1c2goYFJlZGlyZWN0IGZlaGx0OiAke2xpbmV9YCk7CiAgfQp9Cgpmb3IgKGNvbnN0IGZpbGUgb2Ygd2FsayhwYXRoLmpvaW4oYXBwUm9vdCwgInNyYyIpKSkgewogIGNvbnN0IHJlbCA9IHBhdGgucmVsYXRpdmUoYXBwUm9vdCwgZmlsZSkucmVwbGFjZUFsbChwYXRoLnNlcCwgIi8iKTsKICBpZiAoIWV4dHMuaGFzKHBhdGguZXh0bmFtZShmaWxlKS50b0xvd2VyQ2FzZSgpKSB8fCByZWwuc3RhcnRzV2l0aCgic3JjL2RhdGEvc2VvLyIpKSBjb250aW51ZTsKICBjb25zdCB0ZXh0ID0gZnMucmVhZEZpbGVTeW5jKGZpbGUsICJ1dGY4Iik7CiAgZm9yIChjb25zdCByb3V0ZSBvZiByb3V0ZXMpIHsKICAgIGNvbnN0IHBhdHRlcm4gPSBuZXcgUmVnRXhwKGAoXnxbXHNcIidcKD06XSkke2VzY2FwZVJlZ2V4KHJvdXRlLmZyb20pfSg/Oi8pPyg/PSR8W1xzXCInXCkjP10pYCwgIm0iKTsKICAgIGlmIChwYXR0ZXJuLnRlc3QodGV4dCkpIGVycm9ycy5wdXNoKGBWZXJhbHRldGVyIGludGVybmVyIExpbmsgaW4gJHtyZWx9OiAke3JvdXRlLmZyb219YCk7CiAgfQp9Cgpjb25zdCBjb21wYXJpc29uc0RpciA9IHBhdGguam9pbihhcHBSb290LCAic3JjL2NvbnRlbnQvY29tcGFyaXNvbnMiKTsKZm9yIChjb25zdCBmaWxlIG9mIHdhbGsoY29tcGFyaXNvbnNEaXIpLmZpbHRlcigoZmlsZSkgPT4gZmlsZS5lbmRzV2l0aCgiLm1kIikpKSB7CiAgY29uc3QgdGV4dCA9IGZzLnJlYWRGaWxlU3luYyhmaWxlLCAidXRmOCIpOwogIGNvbnN0IGZyb250bWF0dGVyID0gdGV4dC5zcGxpdCgvXi0tLVxzKiQvbSlbMV0gPz8gIiI7CiAgY29uc3QgaXRlbVBhcnQgPSBmcm9udG1hdHRlci5tYXRjaCgvXml0ZW1zOlxzKiQoW1xzXFNdKj8pKD89XltBLVphLXpdW0EtWmEtejAtOV8tXSo6fCQpL20pPy5bMV0gPz8gIiI7CiAgY29uc3Qgc2x1Z3MgPSBbLi4uaXRlbVBhcnQubWF0Y2hBbGwoL15cc3syfS1ccytzbHVnOlxzKlsiJ10/KFteIidcc10rKVsiJ10/L2dtKV0ubWFwKChtYXRjaCkgPT4gbWF0Y2hbMV0pOwogIGNvbnN0IGR1cGxpY2F0ZXMgPSBzbHVncy5maWx0ZXIoKHNsdWcsIGluZGV4KSA9PiBzbHVncy5pbmRleE9mKHNsdWcpICE9PSBpbmRleCk7CiAgaWYgKGR1cGxpY2F0ZXMubGVuZ3RoKSBlcnJvcnMucHVzaChgRG9wcGVsdGUgaXRlbXMgaW4gJHtwYXRoLmJhc2VuYW1lKGZpbGUpfTogJHtbLi4ubmV3IFNldChkdXBsaWNhdGVzKV0uam9pbigiLCAiKX1gKTsKfQoKY29uc3Qgdmlld01vZGVsUGF0aCA9IHBhdGguam9pbihhcHBSb290LCAic3JjL2RvbWFpbi9jb21wYXJpc29uL2J1aWxkQ29tcGFyaXNvblZpZXdNb2RlbC50cyIpOwpjb25zdCB2aWV3TW9kZWwgPSBmcy5yZWFkRmlsZVN5bmModmlld01vZGVsUGF0aCwgInV0ZjgiKTsKaWYgKCF2aWV3TW9kZWwuaW5jbHVkZXMoImNvbnN0IGV4cGxpY2l0SXRlbXMgPSBkYXRhLml0ZW1zLmZpbHRlciIpKSBlcnJvcnMucHVzaCgiUnVudGltZS1EZWR1cGxpemllcnVuZyBmZWhsdC4iKTsKaWYgKCF2aWV3TW9kZWwuaW5jbHVkZXMoImNvbnN0IGF1dG9tYXRpY0l0ZW1zID0gZXhwbGljaXRJdGVtcy5sZW5ndGggPT09IDAiKSkgZXJyb3JzLnB1c2goIkt1cmF0aWVydGUgaXRlbXMgc2luZCBub2NoIG5pY2h0IGF1dG9yaXRhdGl2LiIpOwppZiAodmlld01vZGVsLmluY2x1ZGVzKCJjb25zdCBpdGVtcyA9IFsuLi5kYXRhLml0ZW1zLCAuLi5hdXRvbWF0aWNJdGVtc10iKSkgZXJyb3JzLnB1c2goIkFsdGUgSXRlbXMtWnVzYW1tZW5mw7xocnVuZyBpc3Qgbm9jaCBha3Rpdi4iKTsKCmlmIChlcnJvcnMubGVuZ3RoKSB7CiAgY29uc29sZS5lcnJvcigiU0VPLVdvY2hlLTEtQXVkaXQgZmVobGdlc2NobGFnZW46Iik7CiAgZXJyb3JzLmZvckVhY2goKGVycm9yKSA9PiBjb25zb2xlLmVycm9yKCItICIgKyBlcnJvcikpOwogIHByb2Nlc3MuZXhpdCgxKTsKfQpjb25zb2xlLmxvZygiU0VPLVdvY2hlLTEtQXVkaXQgZXJmb2xncmVpY2g6IFJvdXRlbiBrb25zb2xpZGllcnQsIEFsdGxpbmtzIGVudGZlcm50LCBDb21wYXJpc29uLUxpc3RlbiBlaW5kZXV0aWcuIik7Cg==";

function auditScriptContent() {
  return Buffer.from(AUDIT_SCRIPT_BASE64, "base64").toString("utf8");
}

function buildPlan(repoRoot) {
  const appRoot = path.join(repoRoot, APP_REL);
  const changes = new Map();
  const deletions = new Set();

  const redirectsPath = path.join(appRoot, "public/_redirects");
  const redirectsBefore = fs.existsSync(redirectsPath) ? read(redirectsPath) : "";
  const redirectsAfter = normalizeRedirects(redirectsBefore);
  if (redirectsBefore !== redirectsAfter) changes.set(redirectsPath, redirectsAfter);

  for (const route of routeMap) {
    const oldPage = path.join(appRoot, route.page);
    if (fs.existsSync(oldPage)) deletions.add(oldPage);
  }

  const sourceFiles = walk(appRoot).filter((file) => shouldScanSource(file, appRoot));
  for (const file of sourceFiles) {
    if (deletions.has(file)) continue;
    const before = read(file);
    let after = replaceLegacyRoutes(before);
    if (file.includes(`${path.sep}src${path.sep}content${path.sep}comparisons${path.sep}`) && file.endsWith(".md")) {
      after = dedupeComparisonFrontmatter(after);
    }
    if (after !== before) changes.set(file, after);
  }

  const viewModelPath = path.join(appRoot, "src/domain/comparison/buildComparisonViewModel.ts");
  if (!fs.existsSync(viewModelPath)) fail(`Pflichtdatei fehlt: ${path.relative(repoRoot, viewModelPath)}`);
  const viewBefore = changes.get(viewModelPath) ?? read(viewModelPath);
  const viewAfter = patchComparisonViewModel(viewBefore);
  if (viewAfter !== read(viewModelPath)) changes.set(viewModelPath, viewAfter);

  const auditPath = path.join(appRoot, "scripts/seo/audit-week1-consolidation.mjs");
  const auditContent = auditScriptContent();
  if (!fs.existsSync(auditPath) || read(auditPath) !== auditContent) changes.set(auditPath, auditContent);

  return { appRoot, changes, deletions, auditPath };
}

function validatePlanned(plan) {
  const getPlanned = (file) => plan.changes.get(file) ?? (fs.existsSync(file) ? read(file) : "");
  const redirects = getPlanned(path.join(plan.appRoot, "public/_redirects"));
  for (const route of routeMap) {
    for (const source of [route.from, `${route.from}/`]) {
      const expected = `${source} ${route.to} 301`;
      if (!redirects.split(/\r?\n/).includes(expected)) fail(`Geplanter Redirect fehlt: ${expected}`);
    }
  }

  const view = getPlanned(path.join(plan.appRoot, "src/domain/comparison/buildComparisonViewModel.ts"));
  if (!view.includes("const explicitItems = data.items.filter")) fail("Geplante Runtime-Deduplizierung fehlt.");
  if (!view.includes("const automaticItems = explicitItems.length === 0")) fail("Geplante kuratierte Items-Logik fehlt.");
  if (view.includes("const items = [...data.items, ...automaticItems]")) fail("Alte Items-Zusammenführung wäre weiterhin aktiv.");

  for (const [file, content] of plan.changes) {
    if (file.endsWith("_redirects") || file === plan.auditPath) continue;
    for (const route of routeMap) {
      if (containsLegacyRoute(content, route)) {
        fail(`Geplanter Inhalt enthält noch Altlink ${route.from}: ${file}`);
      }
    }
  }
}

function backupFiles(repoRoot, files) {
  const stamp = new Date().toISOString().replaceAll(":", "-").replaceAll(".", "-");
  const backupRoot = path.join(repoRoot, ".patch-backups", `${PATCH_ID}-${stamp}`);
  for (const file of files) {
    if (!fs.existsSync(file)) continue;
    const rel = path.relative(repoRoot, file);
    const target = path.join(backupRoot, rel);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.copyFileSync(file, target);
  }
  return backupRoot;
}

function restore(repoRoot, backupRoot, touched, created) {
  for (const file of created) {
    if (fs.existsSync(file)) fs.rmSync(file, { force: true });
  }
  for (const file of touched) {
    const backup = path.join(backupRoot, path.relative(repoRoot, file));
    if (fs.existsSync(backup)) {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.copyFileSync(backup, file);
    }
  }
}

function runAudit(auditPath) {
  const result = spawnSync(process.execPath, [auditPath], { stdio: "inherit" });
  if (result.status !== 0) fail("SEO-Woche-1-Audit ist fehlgeschlagen.");
}

function main() {
  const repoRoot = findRepoRoot();
  const plan = buildPlan(repoRoot);
  validatePlanned(plan);

  log(`Repository: ${repoRoot}`);
  log(`Modifizieren/erstellen: ${plan.changes.size}`);
  log(`Entfernen: ${plan.deletions.size}`);

  for (const file of plan.changes.keys()) log(`${CHECK_ONLY ? "PRÜFEN" : "ÄNDERN"}: ${path.relative(repoRoot, file)}`);
  for (const file of plan.deletions) log(`${CHECK_ONLY ? "PRÜFEN" : "ENTFERNEN"}: ${path.relative(repoRoot, file)}`);

  if (CHECK_ONLY) {
    log("Vorprüfung erfolgreich. Es wurde nichts verändert.");
    return;
  }

  const allTouched = new Set([...plan.changes.keys(), ...plan.deletions]);
  const existingBefore = new Set([...allTouched].filter((file) => fs.existsSync(file)));
  const created = new Set([...plan.changes.keys()].filter((file) => !fs.existsSync(file)));
  const backupRoot = backupFiles(repoRoot, existingBefore);

  try {
    for (const [file, content] of plan.changes) write(file, content);
    for (const file of plan.deletions) fs.rmSync(file, { force: true });
    runAudit(plan.auditPath);
    log(`Backup: ${path.relative(repoRoot, backupRoot)}`);
    log("Patch erfolgreich angewendet.");
    log("Nächster Schritt: npm run build:pfotentechnik");
  } catch (error) {
    restore(repoRoot, backupRoot, existingBefore, created);
    log("Fehler erkannt; alle Änderungen wurden zurückgesetzt.");
    throw error;
  }
}

try {
  main();
} catch (error) {
  console.error(`\n[${PATCH_ID}] ${error instanceof Error ? error.message : String(error)}`);
  process.exit(1);
}

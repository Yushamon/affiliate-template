#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";

const NAME = "pfotentechnik-bing-image-alt-cleanup-24.0.0";
const VERSION = "24.0.0";
const CHECK = process.argv.includes("--check");
const SKIP_TESTS = process.argv.includes("--skip-tests");

function findRoot(start) {
  let dir = path.resolve(start);
  for (let index = 0; index < 12; index += 1) {
    if (fs.existsSync(path.join(dir, "apps", "pfotentechnik", "package.json"))) return dir;
    const parent = path.dirname(dir);
    if (parent === dir) break;
    dir = parent;
  }
  throw new Error("Repository-Wurzel nicht gefunden. Starte den Installer im affiliate-template-Repository.");
}

const ROOT = findRoot(process.cwd());
const APP = path.join(ROOT, "apps", "pfotentechnik");
const PACKAGE_JSON = path.join(APP, "package.json");
const AUDIT_FILE = path.join(APP, "scripts", "seo", "audit-image-alt-text.mjs");
const TEST_FILE = path.join(APP, "test", "image-alt-text-24.0.0.test.mjs");
const REPORT_DIR = path.join(APP, "reports", "seo");
const REPORT_JSON = path.join(REPORT_DIR, "image-alt-cleanup-24.0.0.json");
const REPORT_MD = path.join(REPORT_DIR, "image-alt-cleanup-24.0.0.md");
const BACKUP_DIR = path.join(
  ROOT,
  ".patch-backups",
  `${NAME}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const log = (message) => console.log(`[${NAME}] ${message}`);
const relative = (file) => path.relative(ROOT, file).replaceAll(path.sep, "/");

const replacements = [
  {
    file: "packages/affiliate-core/src/components/home/HomeHero.astro",
    description: "Homepage-Hero erhält einen nicht leeren Alt-Text",
    before: '      alt=""\n      layout="full-width"',
    after: '      alt={hero.title}\n      layout="full-width"'
  },
  {
    file: "apps/pfotentechnik/src/components/product-experience-2/ProductGallery2.astro",
    description: "Galerie-Thumbnails erhalten eindeutige Alt-Texte",
    before: '            alt=""\n            loading="lazy"',
    after: '            alt={`${item.alt || name} – Ansicht ${index + 1}`}\n            loading="lazy"'
  },
  {
    file: "apps/pfotentechnik/src/components/product-standard-2/AlternativesGrid.astro",
    description: "Alternativenkarten beschreiben das gezeigte Produkt",
    before: '{item.image && <img src={item.image} alt="" loading="lazy" decoding="async" />}',
    after: '{item.image && <img src={item.image} alt={`${item.title} – Produktansicht`} loading="lazy" decoding="async" />}'
  },
  {
    file: "packages/affiliate-core/src/components/ComparisonExperience.astro",
    description: "Produktbilder in der klassischen Vergleichstabelle erhalten Alt-Texte",
    before: '                      alt=""\n                      loading="lazy"',
    after: '                      alt={`${product.name} im Direktvergleich`}\n                      loading="lazy"'
  },
  {
    file: "packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro",
    description: "Produktbilder im interaktiven Direktvergleich erhalten Alt-Texte",
    before: '                    alt=""\n                    width={120}',
    after: '                    alt={`${product.title} im Direktvergleich`}\n                    width={120}'
  },
  {
    file: "packages/affiliate-core/src/components/ImageLightbox.astro",
    description: "Der Lightbox-Platzhalter besitzt bereits im statischen HTML einen Alt-Text",
    before: '        alt=""\n        decoding="async"',
    after: '        alt="Vergrößerte Bildansicht"\n        decoding="async"'
  },
  {
    file: "packages/affiliate-core/src/components/ImageLightbox.astro",
    description: "Die Lightbox verwendet auch bei fehlenden Quelldaten einen Alt-Fallback",
    before: '      preview.alt = sourceImage.alt || "";',
    after: '      preview.alt = sourceImage.alt?.trim() || "Vergrößerte Bildansicht";'
  },
  {
    file: "packages/affiliate-core/src/components/ImageLightbox.astro",
    description: "Beim Schließen fällt die Lightbox nicht auf einen leeren Alt-Text zurück",
    before: '      preview.alt = "";\n      caption.textContent = "";',
    after: '      preview.alt = "Vergrößerte Bildansicht";\n      caption.textContent = "";'
  }
];

const auditContent = "#!/usr/bin/env node\nimport fs from \"node:fs\";\nimport path from \"node:path\";\n\nconst STRICT = process.argv.includes(\"--strict\");\nconst SOURCE_ONLY = process.argv.includes(\"--source-only\");\n\nfunction findRoot(start) {\n  let dir = path.resolve(start);\n  for (let index = 0; index < 12; index += 1) {\n    if (fs.existsSync(path.join(dir, \"apps\", \"pfotentechnik\", \"package.json\"))) return dir;\n    const parent = path.dirname(dir);\n    if (parent === dir) break;\n    dir = parent;\n  }\n  throw new Error(\"Repository-Wurzel nicht gefunden.\");\n}\n\nconst ROOT = findRoot(process.cwd());\nconst APP = path.join(ROOT, \"apps\", \"pfotentechnik\");\nconst DIST = path.join(APP, \"dist\");\nconst REPORT_DIR = path.join(APP, \"reports\", \"seo\");\nconst REPORT_JSON = path.join(REPORT_DIR, \"image-alt-audit-latest.json\");\nconst REPORT_MD = path.join(REPORT_DIR, \"image-alt-audit-latest.md\");\nconst SOURCE_ROOTS = [\n  path.join(APP, \"src\"),\n  path.join(ROOT, \"packages\", \"affiliate-core\", \"src\")\n];\nconst IGNORE_DIRECTORIES = new Set([\"node_modules\", \".git\", \".astro\", \"dist\", \"reports\", \".patch-backups\"]);\n\nfunction walk(directory, extensions, output = []) {\n  if (!fs.existsSync(directory)) return output;\n  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {\n    if (entry.isDirectory() && IGNORE_DIRECTORIES.has(entry.name)) continue;\n    const full = path.join(directory, entry.name);\n    if (entry.isDirectory()) walk(full, extensions, output);\n    else if (entry.isFile() && extensions.some((extension) => full.endsWith(extension))) output.push(full);\n  }\n  return output;\n}\n\nfunction lineNumber(source, offset) {\n  return source.slice(0, offset).split(\"\\n\").length;\n}\n\nfunction compactTag(tag) {\n  return tag.replace(/\\s+/g, \" \").trim().slice(0, 260);\n}\n\nfunction inspectTag(tag, file, offset, scope, source) {\n  const literalDouble = tag.match(/\\balt\\s*=\\s*\"([^\"]*)\"/i);\n  const literalSingle = tag.match(/\\balt\\s*=\\s*'([^']*)'/i);\n  const dynamic = /\\balt\\s*=\\s*\\{[\\s\\S]*?\\}/i.test(tag);\n  const bare = /\\balt\\s*=\\s*[^\\s>]+/i.test(tag);\n  const line = lineNumber(source, offset);\n  const normalizedFile = path.relative(ROOT, file).replaceAll(path.sep, \"/\");\n\n  if (!literalDouble && !literalSingle && !dynamic && !bare) {\n    return {\n      scope,\n      file: normalizedFile,\n      line,\n      code: \"IMAGE_ALT_MISSING\",\n      message: \"Bild besitzt kein Alt-Attribut.\",\n      tag: compactTag(tag)\n    };\n  }\n\n  const literalValue = literalDouble?.[1] ?? literalSingle?.[1];\n  if (literalValue !== undefined && literalValue.trim().length === 0) {\n    return {\n      scope,\n      file: normalizedFile,\n      line,\n      code: \"IMAGE_ALT_EMPTY\",\n      message: \"Bild besitzt einen leeren Alt-Text.\",\n      tag: compactTag(tag)\n    };\n  }\n\n  return null;\n}\n\nfunction scanSourceFile(file) {\n  const source = fs.readFileSync(file, \"utf8\");\n  const findings = [];\n  const pattern = /<(?:img|OptimizedImage|ProductImage)\\b[\\s\\S]*?>/g;\n  let match;\n  while ((match = pattern.exec(source))) {\n    const finding = inspectTag(match[0], file, match.index, \"source\", source);\n    if (finding) findings.push(finding);\n  }\n  return findings;\n}\n\nfunction scanHtmlFile(file) {\n  const source = fs.readFileSync(file, \"utf8\");\n  const findings = [];\n  const pattern = /<img\\b[^>]*>/gi;\n  let match;\n  while ((match = pattern.exec(source))) {\n    const finding = inspectTag(match[0], file, match.index, \"dist\", source);\n    if (finding) findings.push(finding);\n  }\n  return findings;\n}\n\nconst sourceFiles = [...new Set(SOURCE_ROOTS.flatMap((root) => walk(root, [\".astro\", \".html\"])))].sort();\nconst sourceFindings = sourceFiles.flatMap(scanSourceFile);\nconst distAvailable = fs.existsSync(DIST);\nconst distFiles = !SOURCE_ONLY && distAvailable ? walk(DIST, [\".html\"]).sort() : [];\nconst distFindings = distFiles.flatMap(scanHtmlFile);\nconst findings = [...sourceFindings, ...distFindings];\n\nconst report = {\n  version: \"24.0.0\",\n  generatedAt: new Date().toISOString(),\n  mode: SOURCE_ONLY ? \"source-only\" : \"source-and-dist\",\n  sourceFilesScanned: sourceFiles.length,\n  distAvailable,\n  distFilesScanned: distFiles.length,\n  findings,\n  summary: {\n    total: findings.length,\n    missing: findings.filter((item) => item.code === \"IMAGE_ALT_MISSING\").length,\n    empty: findings.filter((item) => item.code === \"IMAGE_ALT_EMPTY\").length,\n    source: sourceFindings.length,\n    dist: distFindings.length\n  }\n};\n\nfs.mkdirSync(REPORT_DIR, { recursive: true });\nfs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2) + \"\\n\");\nconst markdown = [\n  \"# Image Alt Audit\",\n  \"\",\n  \"- Modus: `\" + report.mode + \"`\",\n  \"- geprüfte Quelldateien: \" + report.sourceFilesScanned,\n  \"- geprüfte Build-Dateien: \" + report.distFilesScanned,\n  \"- fehlende Alt-Attribute: \" + report.summary.missing,\n  \"- leere Alt-Texte: \" + report.summary.empty,\n  \"\",\n  \"## Findings\",\n  \"\",\n  findings.length\n    ? findings.map((item) => \"- **\" + item.code + \"** `\" + item.file + \":\" + item.line + \"` – \" + item.message).join(\"\\n\")\n    : \"Keine fehlenden oder leeren Alt-Texte gefunden.\",\n  \"\"\n].join(\"\\n\");\nfs.writeFileSync(REPORT_MD, markdown);\n\nconsole.log(\"[image-alt-audit] Quelldateien: \" + report.sourceFilesScanned);\nconsole.log(\"[image-alt-audit] Build-Dateien: \" + report.distFilesScanned);\nconsole.log(\"[image-alt-audit] Findings: \" + report.summary.total);\nconsole.log(\"[image-alt-audit] Report: \" + path.relative(ROOT, REPORT_MD));\n\nif (!SOURCE_ONLY && !distAvailable) {\n  console.warn(\"[image-alt-audit] dist fehlt. Zuerst den Astro-Build ausführen oder --source-only verwenden.\");\n  if (STRICT) process.exitCode = 1;\n}\nif (STRICT && findings.length > 0) process.exitCode = 1;\n";

const testContent = "import test from \"node:test\";\nimport assert from \"node:assert/strict\";\nimport fs from \"node:fs\";\nimport path from \"node:path\";\nimport { execFileSync } from \"node:child_process\";\nimport { fileURLToPath } from \"node:url\";\n\nconst ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), \"../../..\");\nconst APP = path.join(ROOT, \"apps\", \"pfotentechnik\");\n\nconst files = {\n  home: path.join(ROOT, \"packages\", \"affiliate-core\", \"src\", \"components\", \"home\", \"HomeHero.astro\"),\n  gallery: path.join(APP, \"src\", \"components\", \"product-experience-2\", \"ProductGallery2.astro\"),\n  alternatives: path.join(APP, \"src\", \"components\", \"product-standard-2\", \"AlternativesGrid.astro\"),\n  comparisonExperience: path.join(ROOT, \"packages\", \"affiliate-core\", \"src\", \"components\", \"ComparisonExperience.astro\"),\n  comparisonExplorer: path.join(ROOT, \"packages\", \"affiliate-core\", \"src\", \"components\", \"comparison\", \"ComparisonExplorer.astro\"),\n  lightbox: path.join(ROOT, \"packages\", \"affiliate-core\", \"src\", \"components\", \"ImageLightbox.astro\"),\n  audit: path.join(APP, \"scripts\", \"seo\", \"audit-image-alt-text.mjs\")\n};\n\nconst read = (file) => fs.readFileSync(file, \"utf8\");\n\ntest(\"Bing-relevante Bildkomponenten besitzen keine leeren statischen Alt-Texte\", () => {\n  for (const [name, file] of Object.entries(files)) {\n    assert.ok(fs.existsSync(file), name + \" fehlt: \" + file);\n    if (!file.endsWith(\".astro\")) continue;\n    assert.doesNotMatch(read(file), /\\balt\\s*=\\s*[\"']\\s*[\"']/i, name + \" enthält weiterhin einen leeren Alt-Text\");\n  }\n});\n\ntest(\"Komponenten verwenden kontextbezogene Alt-Texte\", () => {\n  assert.match(read(files.home), /alt=\\{hero\\.title\\}/);\n  assert.match(read(files.gallery), /Ansicht \\$\\{index \\+ 1\\}/);\n  assert.match(read(files.alternatives), /\\$\\{item\\.title\\} – Produktansicht/);\n  assert.match(read(files.comparisonExperience), /\\$\\{product\\.name\\} im Direktvergleich/);\n  assert.match(read(files.comparisonExplorer), /\\$\\{product\\.title\\} im Direktvergleich/);\n  assert.match(read(files.lightbox), /alt=\"Vergrößerte Bildansicht\"/);\n  assert.match(read(files.lightbox), /sourceImage\\.alt\\?\\.trim\\(\\) \\|\\| \"Vergrößerte Bildansicht\"/);\n});\n\ntest(\"Source-Audit läuft im Strict-Modus ohne Finding\", () => {\n  execFileSync(process.execPath, [files.audit, \"--source-only\", \"--strict\"], {\n    cwd: ROOT,\n    stdio: \"pipe\"\n  });\n});\n\ntest(\"Package-Skripte stellen Audit und Test bereit\", () => {\n  const pkg = JSON.parse(read(path.join(APP, \"package.json\")));\n  assert.equal(pkg.scripts[\"audit:image-alt\"], \"node scripts/seo/audit-image-alt-text.mjs\");\n  assert.equal(pkg.scripts[\"audit:image-alt:strict\"], \"node scripts/seo/audit-image-alt-text.mjs --strict\");\n  assert.equal(pkg.scripts[\"test:image-alt\"], \"node --test test/image-alt-text-24.0.0.test.mjs\");\n});\n";

function ensureFile(file) {
  if (!fs.existsSync(file)) throw new Error(`Erwartete Datei fehlt: ${relative(file)}`);
}

function backup(file) {
  if (!fs.existsSync(file)) return;
  const target = path.join(BACKUP_DIR, relative(file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

function preflightReplacements() {
  for (const item of replacements) {
    const file = path.join(ROOT, item.file);
    ensureFile(file);
    const source = fs.readFileSync(file, "utf8");
    if (source.includes(item.after)) continue;
    const occurrences = source.split(item.before).length - 1;
    if (occurrences !== 1) {
      throw new Error(`${item.file}: erwartete Fundstelle nicht eindeutig (${occurrences}). Aktuellen Git-Stand prüfen.`);
    }
  }
}

function applyReplacement(item, changedFiles, operations) {
  const file = path.join(ROOT, item.file);
  ensureFile(file);
  const source = fs.readFileSync(file, "utf8");
  if (source.includes(item.after)) {
    operations.push({ file: item.file, status: "already-applied", description: item.description });
    return;
  }
  const occurrences = source.split(item.before).length - 1;
  if (occurrences !== 1) {
    throw new Error(`${item.file}: erwartete Fundstelle nicht eindeutig (${occurrences}). Aktuellen Git-Stand prüfen.`);
  }
  operations.push({ file: item.file, status: CHECK ? "required" : "changed", description: item.description });
  if (CHECK) return;
  backup(file);
  fs.writeFileSync(file, source.replace(item.before, item.after));
  changedFiles.add(item.file);
}

function writeGeneratedFile(file, content, changedFiles, operations) {
  const normalized = content.endsWith("\n") ? content : `${content}\n`;
  const existing = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : null;
  const fileName = relative(file);
  if (existing === normalized) {
    operations.push({ file: fileName, status: "already-applied", description: "Datei ist aktuell" });
    return;
  }
  operations.push({ file: fileName, status: CHECK ? "required" : "changed", description: existing === null ? "Datei wird angelegt" : "Datei wird aktualisiert" });
  if (CHECK) return;
  if (existing !== null) backup(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, normalized);
  changedFiles.add(fileName);
}

function updatePackage(changedFiles, operations) {
  ensureFile(PACKAGE_JSON);
  const source = fs.readFileSync(PACKAGE_JSON, "utf8");
  const pkg = JSON.parse(source);
  pkg.scripts ??= {};
  const expected = {
    "audit:image-alt": "node scripts/seo/audit-image-alt-text.mjs",
    "audit:image-alt:strict": "node scripts/seo/audit-image-alt-text.mjs --strict",
    "test:image-alt": "node --test test/image-alt-text-24.0.0.test.mjs"
  };
  const current = Object.fromEntries(Object.keys(expected).map((key) => [key, pkg.scripts[key]]));
  const matches = Object.entries(expected).every(([key, value]) => current[key] === value);
  if (matches) {
    operations.push({ file: relative(PACKAGE_JSON), status: "already-applied", description: "Package-Skripte sind vorhanden" });
    return;
  }
  operations.push({ file: relative(PACKAGE_JSON), status: CHECK ? "required" : "changed", description: "Audit- und Test-Skripte ergänzen" });
  if (CHECK) return;
  backup(PACKAGE_JSON);
  Object.assign(pkg.scripts, expected);
  fs.writeFileSync(PACKAGE_JSON, JSON.stringify(pkg, null, 2) + "\n");
  changedFiles.add(relative(PACKAGE_JSON));
}

function writeReport(changedFiles, operations, validation) {
  if (CHECK) return;
  fs.mkdirSync(REPORT_DIR, { recursive: true });
  const report = {
    name: NAME,
    version: VERSION,
    generatedAt: new Date().toISOString(),
    sourceFinding: {
      exportRows: 101,
      uniqueRoutesWithoutQuery: 91,
      affectedRouteTypes: {
        productRoutes: 66,
        comparisonExportRows: 34,
        uniqueComparisonRoutes: 24,
        homepageRoutes: 1
      }
    },
    changedFiles: [...changedFiles].sort(),
    operations,
    validation
  };
  fs.writeFileSync(REPORT_JSON, JSON.stringify(report, null, 2) + "\n");
  const markdown = [
    "# Bing Image Alt Cleanup 24.0.0",
    "",
    "## Ausgangslage",
    "",
    "Der Bing-Export enthielt 101 Fundstellen auf 91 eindeutigen Routen. Das Muster betraf gemeinsame Bildkomponenten statt 101 unabhängiger Inhaltsfehler.",
    "",
    "## Umsetzung",
    "",
    ...operations.map((item) => "- `" + item.file + "`: " + item.description + " (" + item.status + ")"),
    "",
    "## Validierung",
    "",
    ...validation.map((item) => `- ${item.ok ? "OK" : "FEHLER"}: ${item.label}`),
    "",
    "Nach dem Astro-Build ausführen:",
    "",
    "```bash",
    "npm --workspace apps/pfotentechnik run audit:image-alt:strict",
    "```",
    ""
  ].join("\n");
  fs.writeFileSync(REPORT_MD, markdown);
  log(`Report: ${relative(REPORT_MD)}`);
}

const changedFiles = new Set();
const operations = [];
const validation = [];

try {
  preflightReplacements();
  for (const replacement of replacements) applyReplacement(replacement, changedFiles, operations);
  writeGeneratedFile(AUDIT_FILE, auditContent, changedFiles, operations);
  writeGeneratedFile(TEST_FILE, testContent, changedFiles, operations);
  updatePackage(changedFiles, operations);

  if (CHECK) {
    const required = operations.filter((item) => item.status === "required");
    if (required.length) {
      log(`${required.length} Änderungen erforderlich.`);
      for (const item of required) log(`ERFORDERLICH: ${item.file} – ${item.description}`);
      process.exitCode = 1;
    } else {
      log("Patch ist vollständig installiert.");
    }
  } else if (!SKIP_TESTS) {
    execFileSync(process.execPath, [AUDIT_FILE, "--source-only", "--strict"], { cwd: ROOT, stdio: "inherit" });
    validation.push({ label: "Source-Audit ohne fehlende oder leere Alt-Texte", ok: true });
    execFileSync(process.execPath, ["--test", TEST_FILE], { cwd: ROOT, stdio: "inherit" });
    validation.push({ label: "Komponenten- und Integritätstests", ok: true });
  } else {
    validation.push({ label: "Tests durch --skip-tests übersprungen", ok: true });
  }

  writeReport(changedFiles, operations, validation);
  if (!CHECK) {
    log(`Geänderte Dateien: ${changedFiles.size}`);
    for (const file of [...changedFiles].sort()) log(`Geändert: ${file}`);
    log("Nächster Schritt: npm --workspace apps/pfotentechnik run build");
    log("Danach: npm --workspace apps/pfotentechnik run audit:image-alt:strict");
  }
} catch (error) {
  validation.push({ label: error instanceof Error ? error.message : String(error), ok: false });
  if (!CHECK) writeReport(changedFiles, operations, validation);
  console.error(`[${NAME}] FEHLER:`, error instanceof Error ? error.message : error);
  process.exitCode = 1;
}

import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { spawnSync } from "node:child_process";

const require = createRequire(import.meta.url);
const yaml = require("js-yaml");

const PATCH = "pfotentechnik-product-metadata-4.0.3";
const root = process.cwd();
const app = path.join(root, "apps", "pfotentechnik");
const productsDir = path.join(app, "src", "content", "products");
const manufacturersDir = path.join(app, "src", "content", "manufacturers");
const comparisonReportsDir = path.join(app, "reports", "comparison-platform");
const reportFile = path.join(comparisonReportsDir, "comparison-audit.json");
const outputReport = path.join(app, "reports", "product-metadata-4.0.3-report.json");
const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

const backups = new Map();
const changes = [];
const unresolved = [];

function fail(message) {
  throw new Error(`[${PATCH}] ${message}`);
}

function normalize(value) {
  return String(value ?? "")
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/ß/g, "ss")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

function slugify(value) {
  return normalize(value).replace(/\s+/g, "-");
}

function tokens(value) {
  return normalize(value)
    .split(/\s+/)
    .filter((token) => token.length >= 3)
    .filter((token) => ![
      "smart", "pet", "feeder", "fountain", "tracker", "automatic",
      "food", "water", "camera", "wifi", "connect", "pro", "plus"
    ].includes(token));
}

function read(file) {
  if (!fs.existsSync(file)) fail(`Datei fehlt: ${path.relative(root, file)}`);
  return fs.readFileSync(file, "utf8").replace(/\r\n/g, "\n");
}

function parseMarkdown(file) {
  const source = read(file);
  const match = source.match(/^---\n([\s\S]*?)\n---(?:\n|$)([\s\S]*)$/);
  if (!match) fail(`${path.relative(root, file)}: Frontmatter nicht erkannt.`);
  return { source, data: yaml.load(match[1]) || {}, body: match[2] || "" };
}

function dumpMarkdown(data, body) {
  return `---\n${yaml.dump(data, {
    noRefs: true,
    lineWidth: 120,
    sortKeys: false,
    quotingType: '"'
  }).trimEnd()}\n---\n${body.replace(/^\n+/, "")}`;
}

function markdownFiles(dir) {
  return fs.readdirSync(dir)
    .filter((name) => /\.(md|mdx)$/i.test(name))
    .map((name) => path.join(dir, name));
}

function backup(file, content) {
  if (backups.has(file)) return;
  const target = path.join(backupRoot, path.relative(root, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content, "utf8");
  backups.set(file, target);
}

function write(file, content) {
  const previous = read(file);
  if (previous === content) return false;
  backup(file, previous);
  fs.writeFileSync(file, content, "utf8");
  return true;
}

function rollback() {
  for (const [file, backupFile] of backups) fs.copyFileSync(backupFile, file);
}

function run(command, args, blocking = true) {
  const result = spawnSync(command, args, {
    cwd: root,
    encoding: "utf8",
    shell: process.platform === "win32"
  });
  process.stdout.write(result.stdout || "");
  process.stderr.write(result.stderr || "");
  if (blocking && result.status !== 0) {
    fail(`${command} ${args.join(" ")} ist fehlgeschlagen.`);
  }
  return result.status === 0;
}

function buildManufacturerCatalog() {
  return markdownFiles(manufacturersDir).map((file) => {
    const { data } = parseMarkdown(file);
    const fileSlug = path.basename(file).replace(/\.(md|mdx)$/i, "");
    const slug = String(data.slug || fileSlug);
    const key = String(data.key || slug);
    const name = String(data.name || data.title || slug);
    const aliases = new Set([
      normalize(slug), normalize(key), normalize(name), normalize(fileSlug),
      slugify(slug), slugify(key), slugify(name)
    ].filter(Boolean));

    for (const alias of data.aliases || []) {
      aliases.add(normalize(alias));
      aliases.add(slugify(alias));
    }

    return {
      file,
      slug,
      key,
      name,
      aliases,
      tokenSet: new Set(tokens([slug, key, name, fileSlug].join(" ")))
    };
  });
}

function scoreCandidate(product, manufacturer) {
  const current = product.data.manufacturer;
  const currentValues = typeof current === "string"
    ? [current]
    : [current?.slug, current?.key, current?.name];

  const productValues = [
    ...currentValues,
    product.data.title,
    product.data.slug,
    path.basename(product.file).replace(/\.(md|mdx)$/i, "")
  ].filter(Boolean);

  let score = 0;
  const reasons = [];

  for (const value of currentValues.filter(Boolean)) {
    const n = normalize(value);
    const s = slugify(value);

    if (manufacturer.aliases.has(n) || manufacturer.aliases.has(s)) {
      score += 100;
      reasons.push(`exakte Alias-Übereinstimmung: ${value}`);
    }

    for (const alias of manufacturer.aliases) {
      if (n && alias && (n.includes(alias) || alias.includes(n))) {
        if (Math.min(n.length, alias.length) >= 4) {
          score += 45;
          reasons.push(`Herstellerwert enthält Alias: ${value}`);
          break;
        }
      }
    }
  }

  const productTokenSet = new Set(tokens(productValues.join(" ")));
  const overlap = [...manufacturer.tokenSet].filter((token) => productTokenSet.has(token));
  if (overlap.length) {
    score += overlap.length * 25;
    reasons.push(`Markentoken: ${overlap.join(", ")}`);
  }

  const titleNormalized = normalize(product.data.title);
  for (const alias of manufacturer.aliases) {
    if (alias.length >= 4 && titleNormalized.startsWith(alias + " ")) {
      score += 55;
      reasons.push("Produkttitel beginnt mit Herstelleralias");
      break;
    }
  }

  return { manufacturer, score, reasons };
}

function resolveManufacturer(product, catalog) {
  const ranked = catalog
    .map((manufacturer) => scoreCandidate(product, manufacturer))
    .sort((a, b) => b.score - a.score || a.manufacturer.slug.localeCompare(b.manufacturer.slug));

  const best = ranked[0];
  const second = ranked[1];

  if (!best || best.score < 50) {
    return { match: null, ranked: ranked.slice(0, 5), reason: "kein Kandidat mit ausreichender Evidenz" };
  }

  if (second && best.score - second.score < 20 && best.score < 100) {
    return { match: null, ranked: ranked.slice(0, 5), reason: "mehrdeutige Herstellerzuordnung" };
  }

  return { match: best, ranked: ranked.slice(0, 5) };
}

function locateIssueFile(issueFile) {
  const normalized = String(issueFile || "").replace(/\\/g, "/");
  const candidates = [
    path.resolve(root, normalized),
    path.resolve(app, normalized),
    path.resolve(productsDir, path.basename(normalized))
  ];
  return candidates.find((candidate) => fs.existsSync(candidate)) || null;
}

try {
  if (!fs.existsSync(path.join(app, "package.json"))) {
    fail("Bitte im Root des Repositorys affiliate-template ausführen.");
  }

  run("npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:audit"], false);

  if (!fs.existsSync(reportFile)) {
    fail(`Audit-Bericht fehlt: ${path.relative(root, reportFile)}`);
  }

  const audit = JSON.parse(read(reportFile));
  const broken = audit.issues.filter((issue) => issue.code === "MANUFACTURER_REFERENCE_BROKEN");
  console.log(`\n[${PATCH}] Defekte Herstellerreferenzen: ${broken.length}`);

  if (!broken.length) {
    console.log("Keine Reparatur erforderlich.");
    process.exit(0);
  }

  const catalog = buildManufacturerCatalog();
  const files = [...new Set(broken.map((issue) => locateIssueFile(issue.file)).filter(Boolean))];

  if (files.length !== new Set(broken.map((issue) => issue.file)).size) {
    console.log("Audit-Dateien:");
    for (const issue of broken) console.log(`- ${issue.file}: ${issue.message}`);
  }

  if (!files.length) {
    fail("Keine betroffene Produktdatei konnte lokal aufgelöst werden.");
  }

  for (const file of files) {
    const product = parseMarkdown(file);
    product.file = file;
    const slug = String(product.data.slug || path.basename(file).replace(/\.(md|mdx)$/i, ""));
    const resolution = resolveManufacturer(product, catalog);

    if (!resolution.match) {
      unresolved.push({
        file: path.relative(root, file),
        slug,
        currentManufacturer: product.data.manufacturer,
        reason: resolution.reason,
        candidates: resolution.ranked.map((candidate) => ({
          slug: candidate.manufacturer.slug,
          name: candidate.manufacturer.name,
          score: candidate.score,
          reasons: candidate.reasons
        }))
      });
      continue;
    }

    const selected = resolution.match;
    const nextManufacturer = {
      key: selected.manufacturer.key,
      name: selected.manufacturer.name,
      slug: selected.manufacturer.slug
    };

    if (JSON.stringify(product.data.manufacturer) !== JSON.stringify(nextManufacturer)) {
      const previous = product.data.manufacturer;
      product.data.manufacturer = nextManufacturer;
      product.data.metadata = {
        ...(product.data.metadata || {}),
        version: "4.0.3",
        normalizedAt: new Date().toISOString().slice(0, 10),
        manufacturerReferenceSource: path.relative(app, selected.manufacturer.file).replace(/\\/g, "/")
      };

      write(file, dumpMarkdown(product.data, product.body));
      changes.push({
        file: path.relative(root, file),
        slug,
        previous,
        next: nextManufacturer,
        score: selected.score,
        reasons: selected.reasons
      });
      console.log(`Repariert: ${slug} -> ${selected.manufacturer.slug}`);
    }
  }

  fs.mkdirSync(path.dirname(outputReport), { recursive: true });
  fs.writeFileSync(outputReport, JSON.stringify({
    patch: PATCH,
    generatedAt: new Date().toISOString(),
    auditIssuesBefore: broken,
    changes,
    unresolved
  }, null, 2), "utf8");

  if (unresolved.length) {
    fail(`${unresolved.length} Referenz(en) blieben mehrdeutig. Details: ${path.relative(root, outputReport)}`);
  }

  console.log("\nValidierung:");
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "audit:products:strict"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "comparison:audit"]);
  run("npm", ["run", "build:pfotentechnik"]);

  const finalAudit = JSON.parse(read(reportFile));
  const remaining = finalAudit.issues.filter((issue) => issue.code === "MANUFACTURER_REFERENCE_BROKEN");
  if (remaining.length) {
    fail(`Es bestehen noch ${remaining.length} defekte Herstellerreferenzen.`);
  }

  console.log(`\n[${PATCH}] Fertig.`);
  console.log(`Repariert: ${changes.length}`);
  console.log(`Comparison Audit: ${finalAudit.summary.errors} Fehler, ${finalAudit.summary.warnings} Warnungen`);
  console.log(`Bericht: ${path.relative(root, outputReport)}`);
} catch (error) {
  rollback();
  console.error(`\n[${PATCH}] Fehlgeschlagen. Änderungen wurden zurückgesetzt.`);
  console.error(error?.stack || error);
  process.exit(1);
}

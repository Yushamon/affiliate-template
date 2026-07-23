import fs from "node:fs";
import path from "node:path";
import { deflateRawSync } from "node:zlib";
import { APP_ROOT, SEARCH_DIR, atomicWriteJson, readJson } from "./config.mjs";
import { SearchError } from "./errors.mjs";

const STATE_FILE = path.join(SEARCH_DIR, "copilot-state.json");
const DRAFT_DIR = path.join(SEARCH_DIR, "drafts", "products");
const PROMPT_DIR = path.join(SEARCH_DIR, "image-prompts");
const IMPORT_DIR = path.join(SEARCH_DIR, "image-imports");
const PACK_DIR = path.join(SEARCH_DIR, "image-packs");
const PRODUCT_DIR = path.join(APP_ROOT, "src", "content", "products");
const MANUFACTURER_DIR = path.join(APP_ROOT, "src", "content", "manufacturers");
const COMPARISON_DIR = path.join(APP_ROOT, "src", "content", "comparisons");
const ROLES = ["hero", "thumbnail", "comparison", "gallery-1", "gallery-2", "gallery-3"];

const assertSlug = (value) => {
  if (typeof value !== "string" || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value)) {
    throw new SearchError("SEARCH_INVALID_DATA", { message: "Ungültiger Produkt-Slug." });
  }
  return value;
};

const cleanText = (value, max = 500) => String(value || "").replace(/[\u0000-\u001f]/g, " ").trim().slice(0, max);
const yamlString = (value) => JSON.stringify(cleanText(value, 1000));

function manufacturerCandidate(slug) {
  for (const name of fs.readdirSync(MANUFACTURER_DIR).filter((file) => file.endsWith(".md"))) {
    const file = path.join(MANUFACTURER_DIR, name);
    const source = fs.readFileSync(file, "utf8");
    if (!new RegExp(`["']?${slug.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}["']?`).test(source)) continue;
    const frontmatter = source.split(/^---\s*$/m)[1] || "";
    const manufacturerName = frontmatter.match(/^name:\s*["']?(.+?)["']?\s*$/m)?.[1] || path.basename(name, ".md");
    const manufacturerKey = frontmatter.match(/^key:\s*["']?(.+?)["']?\s*$/m)?.[1] || path.basename(name, ".md");
    const urls = [...source.matchAll(/https?:\/\/[^\s)"']+/g)].map((match) => match[0].replace(/[.,]$/, "")).slice(0, 12);
    return { slug, manufacturerName, manufacturerKey, urls };
  }
  throw new SearchError("SEARCH_INVALID_DATA", { message: "Der Produkt-Slug ist in keiner vorhandenen Herstellerdatei belegt." });
}

function assertNewProduct(slug) {
  assertSlug(slug);
  if (fs.existsSync(path.join(PRODUCT_DIR, `${slug}.md`))) {
    throw new SearchError("SEARCH_ACTION_NOT_ALLOWED", { message: "Die Produktdatei existiert bereits und wird nicht überschrieben." });
  }
  return manufacturerCandidate(slug);
}

export function readCopilotState() {
  const stored = readJson(STATE_FILE, false);
  return {
    schemaVersion: 1,
    completions: Array.isArray(stored?.completions) ? stored.completions.slice(-200) : [],
  };
}

export function completeCopilotTask(payload) {
  const task = payload?.task;
  if (!task || typeof task.id !== "string" || task.id.length > 300) throw new SearchError("SEARCH_INVALID_DATA", { message: "Aufgabe oder Aufgaben-ID fehlt." });
  const state = readCopilotState();
  const completion = {
    id: cleanText(task.id, 300),
    title: cleanText(task.title, 200),
    url: cleanText(task.url, 300),
    query: cleanText(task.query, 200),
    completedAt: new Date().toISOString(),
    sourceRange: cleanText(task.rangeKey, 30),
    baselineConfidence: Math.max(0, Math.min(1, Number(task.confidence) || 0)),
    baseline: {
      impressions: Number(task.dataBasis?.impressions) || 0,
      clicks: Number(task.dataBasis?.clicks) || 0,
      ctr: Number(task.dataBasis?.ctr) || 0,
      position: Number(task.dataBasis?.position) || 0,
    },
    reviewAfter: new Date(Date.now() + 14 * 86_400_000).toISOString(),
    result: null,
    causality: "Nur zeitliche Assoziation; keine Kausalitätsaussage.",
  };
  state.completions = [...state.completions.filter((item) => item.id !== completion.id), completion].slice(-200);
  atomicWriteJson(STATE_FILE, state);
  return completion;
}

export function generateCopilotPrompt(payload) {
  const task = payload?.task;
  const kind = payload?.kind;
  const allowed = new Set(["codex", "optimization", "faq", "internal-links", "meta", "schema"]);
  if (!task || !allowed.has(kind)) throw new SearchError("SEARCH_INVALID_DATA", { message: "Prompt-Typ oder Aufgabe ist ungültig." });
  const context = [
    "Arbeite im Repository Yushamon/affiliate-template, Projekt apps/pfotentechnik.",
    `Ziel: ${cleanText(task.url || task.query || task.title, 300)}`,
    `Datenbasis: ${cleanText(task.forecast?.dataBasis || task.rationale, 800)}`,
    "Keine unbelegten Werte, keine neuen Slugs und keine Architekturänderung.",
  ];
  const instructions = {
    codex: cleanText(task.codexPrompt || task.prompt, 12_000),
    optimization: `${context.join("\n")}\nOptimiere Suchintention, direkte Antwort, Information Gain und interne Links. Prüfe Meta-Daten vor jeder Snippet-Änderung.`,
    faq: `${context.join("\n")}\nPrüfe vorhandene FAQs auf Dubletten. Ergänze nur belegbare Fragen mit eigenständigem Information Gain und vorhandener Suchintention.`,
    "internal-links": `${context.join("\n")}\nErzeuge kontextuelle Linkvorschläge aus dem vorhandenen Content Graph. Prüfe bestehende semantisch gleichwertige Links und nenne Quelle, Ziel, Anker und Satzkontext.`,
    meta: `${context.join("\n")}\nPrüfe vorhandenen Title und Description. Schlage nur bei nachgewiesenem Intent-Mismatch eine präzise, nicht clickbaitige Variante vor.`,
    schema: `${context.join("\n")}\nPrüfe vorhandenes Astro-Frontmatter und die gerenderten strukturierten Daten gegen die bestehenden Schemas. Liefere Befund und kleinste sichere Korrektur.`,
  };
  return { kind, prompt: instructions[kind] };
}

function imagePrompts(candidate, name) {
  const productName = cleanText(name || candidate.slug, 160);
  const base = `Premium-redaktionelle, markenneutrale Produktvisualisierung für ${productName} von ${candidate.manufacturerName}; keine Logos, keine erfundenen Bedienelemente oder technischen Details, helle ruhige Fläche, natürliche Haustierumgebung, ohne Text im Bild`;
  return ROLES.map((role) => ({
    role,
    target: `apps/pfotentechnik/src/assets/images/products/${candidate.slug}/${role}.webp`,
    prompt: `${base}; Bildrolle ${role}; ${role === "thumbnail" ? "quadratisch 800×800" : "16:9, 1600×900"}.`,
  }));
}

export function createProductDraft(payload) {
  const candidate = assertNewProduct(payload?.slug);
  fs.mkdirSync(DRAFT_DIR, { recursive: true });
  const target = path.join(DRAFT_DIR, `${candidate.slug}.md`);
  const title = cleanText(payload?.name || candidate.slug, 160);
  const comparisonSuggestions = Array.isArray(payload?.comparisonSuggestions)
    ? [...new Set(payload.comparisonSuggestions.map(assertSlug))].filter((slug) => fs.existsSync(path.join(COMPARISON_DIR, `${slug}.md`))).slice(0, 12)
    : [];
  const sourceList = candidate.urls.length ? candidate.urls.map((url) => `  - ${yamlString(url)}`).join("\n") : "  []";
  const markdown = `---
draft: true
title: ${yamlString(title)}
slug: ${yamlString(candidate.slug)}
productKey: ${yamlString(candidate.slug)}
manufacturer: { key: ${yamlString(candidate.manufacturerKey)}, name: ${yamlString(candidate.manufacturerName)}, slug: ${yamlString(candidate.manufacturerKey)} }
category: null
comparisonSuggestions: [${comparisonSuggestions.map(yamlString).join(", ")}]
imagePaths:
${ROLES.map((role) => `  ${role}: ${yamlString(`../../assets/images/products/${candidate.slug}/${role}.webp`)}`).join("\n")}
officialSourceCandidates:
${sourceList}
researchStatus: "official-product-source-required"
---

# ${title}

Dieser sichere Arbeitsentwurf liegt außerhalb der Astro-Content-Collection. Technische Daten, Kategorie, Eignung, Vergleiche und Aussagen dürfen erst nach Prüfung offizieller Herstellerquellen ergänzt werden.
`;
  try {
    fs.writeFileSync(target, markdown, { encoding: "utf8", flag: "wx", mode: 0o600 });
  } catch (cause) {
    if (cause?.code === "EEXIST") throw new SearchError("SEARCH_ACTION_NOT_ALLOWED", { message: "Der Draft existiert bereits und wird nicht überschrieben." });
    throw cause;
  }
  return { ok: true, target: path.relative(APP_ROOT, target), draft: true };
}

export function createImagePromptPack(payload) {
  const candidate = assertNewProduct(payload?.slug);
  fs.mkdirSync(PROMPT_DIR, { recursive: true });
  const target = path.join(PROMPT_DIR, `${candidate.slug}.json`);
  const pack = { schemaVersion: 1, product: candidate, generatedAt: new Date().toISOString(), prompts: imagePrompts(candidate, payload?.name) };
  try {
    fs.writeFileSync(target, `${JSON.stringify(pack, null, 2)}\n`, { encoding: "utf8", flag: "wx", mode: 0o600 });
  } catch (cause) {
    if (cause?.code === "EEXIST") throw new SearchError("SEARCH_ACTION_NOT_ALLOWED", { message: "Das Promptpaket existiert bereits und wird nicht überschrieben." });
    throw cause;
  }
  return { ok: true, target: path.relative(APP_ROOT, target), prompts: pack.prompts, providerConfigured: Boolean(process.env.IMAGE_PROVIDER) };
}

const crcTable = Array.from({ length: 256 }, (_, n) => {
  let c = n;
  for (let k = 0; k < 8; k += 1) c = (c & 1) ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
  return c >>> 0;
});
const crc32 = (buffer) => {
  let crc = 0xffffffff;
  for (const byte of buffer) crc = crcTable[(crc ^ byte) & 0xff] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
};
const dosDate = (date = new Date()) => (((date.getFullYear() - 1980) << 9) | ((date.getMonth() + 1) << 5) | date.getDate()) & 0xffff;
const dosTime = (date = new Date()) => ((date.getHours() << 11) | (date.getMinutes() << 5) | (date.getSeconds() >> 1)) & 0xffff;

function createZip(files, target) {
  const locals = [];
  const centrals = [];
  let offset = 0;
  for (const file of files) {
    const name = Buffer.from(file.name.replace(/\\/g, "/"));
    const raw = fs.readFileSync(file.path);
    const compressed = deflateRawSync(raw);
    const checksum = crc32(raw);
    const local = Buffer.alloc(30);
    local.writeUInt32LE(0x04034b50, 0); local.writeUInt16LE(20, 4); local.writeUInt16LE(8, 8); local.writeUInt16LE(dosTime(), 10); local.writeUInt16LE(dosDate(), 12);
    local.writeUInt32LE(checksum, 14); local.writeUInt32LE(compressed.length, 18); local.writeUInt32LE(raw.length, 22); local.writeUInt16LE(name.length, 26);
    locals.push(local, name, compressed);
    const central = Buffer.alloc(46);
    central.writeUInt32LE(0x02014b50, 0); central.writeUInt16LE(20, 4); central.writeUInt16LE(20, 6); central.writeUInt16LE(8, 10); central.writeUInt16LE(dosTime(), 12); central.writeUInt16LE(dosDate(), 14);
    central.writeUInt32LE(checksum, 16); central.writeUInt32LE(compressed.length, 20); central.writeUInt32LE(raw.length, 24); central.writeUInt16LE(name.length, 28); central.writeUInt32LE(offset, 42);
    centrals.push(central, name);
    offset += local.length + name.length + compressed.length;
  }
  const centralSize = centrals.reduce((sum, part) => sum + part.length, 0);
  const end = Buffer.alloc(22);
  end.writeUInt32LE(0x06054b50, 0); end.writeUInt16LE(files.length, 8); end.writeUInt16LE(files.length, 10); end.writeUInt32LE(centralSize, 12); end.writeUInt32LE(offset, 16);
  fs.writeFileSync(target, Buffer.concat([...locals, ...centrals, end]), { flag: "wx", mode: 0o600 });
}

export async function buildImagePack(payload) {
  const candidate = assertNewProduct(payload?.slug);
  const sourceDir = path.join(IMPORT_DIR, candidate.slug);
  if (!fs.existsSync(sourceDir)) throw new SearchError("SEARCH_CONFIG_MISSING", { message: `Importordner fehlt: .search/image-imports/${candidate.slug}` });
  const inputs = ROLES.map((role) => {
    const file = fs.readdirSync(sourceDir).find((name) => new RegExp(`^${role}\\.(png|jpe?g|webp)$`, "i").test(name));
    if (!file) throw new SearchError("SEARCH_INVALID_DATA", { message: `Importbild fehlt: ${role}.{png,jpg,webp}` });
    return { role, path: path.join(sourceDir, file) };
  });
  let sharp;
  try { sharp = (await import("sharp")).default; }
  catch (cause) { throw new SearchError("SEARCH_CONFIG_MISSING", { message: "Die vorhandene Astro-Installation stellt Sharp nicht bereit; Bildpaket kann nicht konvertiert werden.", cause }); }
  const targetDir = path.join(PACK_DIR, candidate.slug);
  const zipTarget = path.join(PACK_DIR, `${candidate.slug}.zip`);
  if (fs.existsSync(targetDir) || fs.existsSync(zipTarget)) throw new SearchError("SEARCH_ACTION_NOT_ALLOWED", { message: "Das Bildpaket existiert bereits und wird nicht überschrieben." });
  fs.mkdirSync(PACK_DIR, { recursive: true });
  fs.mkdirSync(targetDir, { recursive: false });
  const outputs = [];
  try {
    for (const input of inputs) {
      const square = input.role === "thumbnail";
      const target = path.join(targetDir, `${input.role}.webp`);
      await sharp(input.path).rotate().resize(square ? 800 : 1600, square ? 800 : 900, { fit: "cover", position: "attention" }).webp({ quality: 84 }).toFile(target);
      outputs.push({ name: `${input.role}.webp`, path: target });
    }
    createZip(outputs, zipTarget);
  } catch (cause) {
    try { fs.rmSync(targetDir, { recursive: true, force: true }); } catch {}
    try { if (fs.existsSync(zipTarget)) fs.unlinkSync(zipTarget); } catch {}
    throw cause;
  }
  return { ok: true, folder: path.relative(APP_ROOT, targetDir), zip: path.relative(APP_ROOT, zipTarget), files: outputs.map((item) => item.name) };
}

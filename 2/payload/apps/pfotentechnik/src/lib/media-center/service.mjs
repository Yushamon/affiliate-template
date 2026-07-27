import fs from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import { fileURLToPath } from "node:url";
import { fetchHtml, fetchImage } from "./network.mjs";
import { blockedReasonLabel, extractImageCandidates } from "./filter.mjs";
import {
  assertImage,
  duplicateHash,
  evaluateImage,
  normalizeWebp,
  similarity
} from "./image-evaluator.mjs";
import { updateProductImages } from "./markdown-images.mjs";
import { atomicWriteFile } from "../admin/atomic-file.mjs";
import { matchProductDocument } from "./product-identity.mjs";
import {
  readProductDocument,
  readProductFiles
} from "../price-intelligence/frontmatter-price.mjs";

const appRoot = path.resolve(fileURLToPath(new URL("../../..", import.meta.url)));
const repoRoot = path.resolve(appRoot, "../..");
const jobsRoot = path.join(appRoot, ".media-center", "jobs");
const productsDir = path.join(appRoot, "src", "content", "products");
const assetsRoot = path.join(appRoot, "src", "assets", "images", "products");
const reviewRoot = path.join(appRoot, "media-review");

export const MEDIA_VARIANTS = {
  hero: {
    width: 1600,
    height: 1000,
    label: "Hero",
    fileName: "hero.webp",
    scene: "Premium bright studio hero, three-quarter front view, soft commercial lighting, clean light background, subtle shadow."
  },
  thumbnail: {
    width: 720,
    height: 720,
    label: "Thumbnail",
    fileName: "thumbnail.webp",
    scene: "Compact isolated catalog thumbnail, centered product, very light background, maximum shape recognition."
  },
  comparison: {
    width: 900,
    height: 720,
    label: "Vergleich",
    fileName: "comparison.webp",
    scene: "Neutral comparison-card image, centered product, consistent scale, no props."
  },
  "gallery-1": {
    width: 1400,
    height: 1000,
    label: "Galerie 1",
    fileName: "gallery-1.webp",
    scene: "Close product view emphasizing body, controls, materials and construction."
  },
  "gallery-2": {
    width: 1400,
    height: 1000,
    label: "Galerie 2",
    fileName: "gallery-2.webp",
    scene: "Realistic premium home-use context, device fully visible and correctly scaled."
  },
  "gallery-3": {
    width: 1400,
    height: 1000,
    label: "Galerie 3",
    fileName: "gallery-3.webp",
    scene: "Functional detail view showing the most important differentiating hardware feature."
  }
};

const variantNames = Object.keys(MEDIA_VARIANTS);
const safeSlug = (value) => String(value || "")
  .normalize("NFKD")
  .replace(/[\u0300-\u036f]/g, "")
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, "-")
  .replace(/^-+|-+$/g, "")
  .slice(0, 90);

const ensure = (directory) => fs.mkdir(directory, { recursive: true });
const readJson = async (file) => JSON.parse(await fs.readFile(file, "utf8"));
const writeJson = async (file, value) => {
  await ensure(path.dirname(file));
  await atomicWriteFile(file, `${JSON.stringify(value, null, 2)}\n`, "utf8");
};

const meta = (html, key) => {
  const escaped = key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const patterns = [
    new RegExp(`<meta[^>]+(?:property|name)=["']${escaped}["'][^>]+content=["']([^"']+)["']`, "i"),
    new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]+(?:property|name)=["']${escaped}["']`, "i")
  ];
  for (const pattern of patterns) {
    const match = html.match(pattern);
    if (match) return match[1].replaceAll("&amp;", "&");
  }
  return "";
};

function productIdentity(html) {
  let product = {};
  for (const match of html.matchAll(/<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi)) {
    try {
      const parsed = JSON.parse(match[1]);
      const queue = Array.isArray(parsed) ? [...parsed] : [parsed];
      while (queue.length) {
        const item = queue.shift();
        if (!item || typeof item !== "object") continue;
        if (Array.isArray(item)) {
          queue.push(...item);
          continue;
        }
        const types = Array.isArray(item["@type"]) ? item["@type"] : [item["@type"]];
        if (types.includes("Product")) {
          product = item;
          break;
        }
        queue.push(...Object.values(item).filter((value) => value && typeof value === "object"));
      }
    } catch {
      // Händlerdaten sind häufig nicht vollständig valides JSON-LD.
    }
    if (product.name) break;
  }

  const title = String(
    product.name ||
    meta(html, "og:title") ||
    html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ||
    ""
  ).trim();
  const brand = product.brand;
  const manufacturer = String(
    typeof brand === "string"
      ? brand
      : brand?.name || product.manufacturer?.name || title.split(/\s+/)[0] || "Unbekannt"
  ).trim();
  return { title, manufacturer };
}

const promptPackage = (title, manufacturer) => Object.fromEntries(
  Object.entries(MEDIA_VARIANTS).map(([name, spec]) => [
    name,
    `Create a highly realistic product photograph of ${title}. ${spec.scene}\n` +
    "Use the supplied reference images as strict product identity references. " +
    `Preserve exact model, proportions, materials, controls and color. Match ${manufacturer} manufacturer photography without inventing features. ` +
    "No unrelated advertising, banners or promotional services."
  ])
);

const candidateId = (candidate, index) => candidate.candidateId || `candidate-${String(index + 1).padStart(2, "0")}`;

function upgradeJob(job) {
  job.schemaVersion = Math.max(Number(job.schemaVersion) || 0, 3);
  job.uploads ||= {};
  job.outputs ||= {};
  job.variantSources ||= {};
  job.candidates = (job.candidates || []).map((candidate, index) => ({
    ...candidate,
    candidateId: candidateId(candidate, index),
    automaticStatus: candidate.automaticStatus || candidate.status || "rejected",
    manualDecision: candidate.manualDecision || null,
    manualReason: candidate.manualReason || null
  }));
  return job;
}

export function candidateCanBeUsed(candidate) {
  return Boolean(
    candidate?.localFile &&
    (candidate.automaticStatus === "accepted" || candidate.status === "accepted" || candidate.manualDecision === "approved")
  );
}

function summarizeJob(job) {
  const candidates = job.candidates || [];
  return {
    found: candidates.length,
    downloaded: candidates.filter((item) => item.localFile).length,
    accepted: candidates.filter((item) => item.automaticStatus === "accepted").length,
    manuallyApproved: candidates.filter((item) => item.manualDecision === "approved").length,
    rejected: candidates.filter((item) => item.automaticStatus === "rejected").length,
    selected: Object.keys(job.variantSources || {}).length,
    outputs: Object.keys(job.outputs || {}).length
  };
}

async function listExistingAssets(slug) {
  const target = path.join(assetsRoot, slug);
  try {
    const entries = await fs.readdir(target, { withFileTypes: true });
    return entries
      .filter((entry) => entry.isFile() && entry.name.toLowerCase().endsWith(".webp"))
      .map((entry) => entry.name)
      .sort();
  } catch (error) {
    if (error?.code === "ENOENT") return [];
    throw error;
  }
}

export function buildTargetPlan({ existingAssets = [], outputs = {} } = {}) {
  const existing = new Set(existingAssets);
  return variantNames.map((variant) => {
    const specification = MEDIA_VARIANTS[variant];
    const output = outputs[variant];
    return {
      variant,
      label: specification.label,
      fileName: specification.fileName,
      exists: existing.has(specification.fileName),
      selected: Boolean(output),
      action: output ? (existing.has(specification.fileName) ? "overwrite" : "create") : "unchanged"
    };
  });
}

async function publicJob(job) {
  upgradeJob(job);
  const existingAssets = await listExistingAssets(job.product.slug);
  const selectedByCandidate = new Map();
  for (const [variant, source] of Object.entries(job.variantSources || {})) {
    if (source?.type !== "candidate" || !source.candidateId) continue;
    const list = selectedByCandidate.get(source.candidateId) || [];
    list.push(variant);
    selectedByCandidate.set(source.candidateId, list);
  }

  return {
    ...job,
    summary: summarizeJob(job),
    existingAssets,
    targetPlan: buildTargetPlan({ existingAssets, outputs: job.outputs }),
    variants: Object.fromEntries(Object.entries(MEDIA_VARIANTS).map(([name, spec]) => [name, {
      label: spec.label,
      fileName: spec.fileName,
      width: spec.width,
      height: spec.height
    }])),
    candidates: job.candidates.map((candidate, index) => ({
      candidateId: candidateId(candidate, index),
      url: candidate.url,
      status: candidate.status,
      automaticStatus: candidate.automaticStatus,
      manualDecision: candidate.manualDecision,
      manualReason: candidate.manualReason,
      canUse: candidateCanBeUsed(candidate),
      selectedFor: selectedByCandidate.get(candidateId(candidate, index)) || [],
      score: candidate.score,
      reasons: candidate.reasons,
      kind: candidate.kind,
      file: candidate.localFile ? path.basename(candidate.localFile) : null
    }))
  };
}

export async function createMediaJob({ url, slug }) {
  await ensure(jobsRoot);
  const fetched = await fetchHtml(url);
  const identity = productIdentity(fetched.html);
  const productFiles = await readProductFiles(productsDir);
  const documents = await Promise.all(productFiles.map(readProductDocument));
  const requestedSlug = safeSlug(slug);
  const matched = matchProductDocument(identity, documents, requestedSlug);
  if (requestedSlug && !matched) throw new Error(`Produkt-Slug "${requestedSlug}" wurde im Content-Bestand nicht gefunden.`);
  if (!matched) throw new Error("Produkt konnte nicht eindeutig dem Content-Bestand zugeordnet werden. Bitte den Produkt-Slug angeben.");
  const finalSlug = matched.document.slug;
  const id = randomUUID();
  const directory = path.join(jobsRoot, id);
  const referenceDir = path.join(directory, "references");
  await ensure(referenceDir);

  const candidates = extractImageCandidates(fetched.html, fetched.resolvedUrl).slice(0, 40);
  const results = [];
  const hashes = [];
  let downloadIndex = 0;

  for (const [index, candidate] of candidates.entries()) {
    const idForCandidate = `candidate-${String(index + 1).padStart(2, "0")}`;
    if (!candidate.accepted) {
      results.push({
        ...candidate,
        candidateId: idForCandidate,
        status: "rejected",
        automaticStatus: "rejected",
        manualDecision: null,
        reasons: [blockedReasonLabel(candidate.reason)]
      });
      continue;
    }

    downloadIndex += 1;
    try {
      const response = await fetchImage(candidate.url);
      const extension = /png/i.test(response.contentType)
        ? "png"
        : /webp/i.test(response.contentType)
          ? "webp"
          : "jpg";
      const file = path.join(referenceDir, `reference-${String(downloadIndex).padStart(2, "0")}.${extension}`);
      await fs.writeFile(file, response.buffer);
      const evaluation = await evaluateImage(file, candidate);
      const hash = await duplicateHash(file);
      const duplicate = hashes.find((item) => similarity(hash, item.hash) >= 96);

      if (duplicate) {
        results.push({
          ...candidate,
          candidateId: idForCandidate,
          status: "rejected",
          automaticStatus: "rejected",
          manualDecision: null,
          localFile: path.relative(directory, file).replaceAll("\\", "/"),
          score: evaluation.score,
          reasons: [`Duplikat von ${duplicate.file}`],
          metrics: evaluation
        });
        continue;
      }

      hashes.push({ hash, file: path.basename(file) });
      const automaticStatus = evaluation.accepted ? "accepted" : "rejected";
      results.push({
        ...candidate,
        candidateId: idForCandidate,
        status: automaticStatus,
        automaticStatus,
        manualDecision: null,
        localFile: path.relative(directory, file).replaceAll("\\", "/"),
        score: evaluation.score,
        reasons: evaluation.reasons,
        metrics: evaluation
      });
    } catch (error) {
      results.push({
        ...candidate,
        candidateId: idForCandidate,
        status: "rejected",
        automaticStatus: "rejected",
        manualDecision: null,
        reasons: [error instanceof Error ? error.message : String(error)]
      });
    }
  }

  const job = upgradeJob({
    schemaVersion: 3,
    id,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    status: "evaluated",
    source: {
      inputUrl: url,
      resolvedUrl: fetched.resolvedUrl,
      isAmazon: /amazon\./i.test(new URL(fetched.resolvedUrl).hostname),
      detectedTitle: identity.title,
      detectedManufacturer: identity.manufacturer
    },
    product: {
      slug: finalSlug,
      title: matched.document.data?.title || identity.title || finalSlug,
      manufacturer: matched.document.data?.manufacturer?.name || identity.manufacturer,
      match: {
        method: matched.method,
        confidence: matched.confidence,
        reasons: matched.reasons
      }
    },
    candidates: results,
    prompts: promptPackage(
      matched.document.data?.title || identity.title || finalSlug,
      matched.document.data?.manufacturer?.name || identity.manufacturer
    ),
    uploads: {},
    variantSources: {},
    outputs: {},
    audit: {
      manualReviewRequired: true,
      limits: [
        "Automatische Bildbewertungen bleiben Hinweise und können bei heruntergeladenen Bildern redaktionell überstimmt werden.",
        "Nicht heruntergeladene oder technisch unlesbare Kandidaten können nicht manuell veröffentlicht werden.",
        "Beim Veröffentlichen werden nur ausgewählte Zieldateien erstellt oder überschrieben; andere Bestandsbilder bleiben erhalten."
      ]
    }
  });
  job.summary = summarizeJob(job);
  await writeJson(path.join(directory, "job.json"), job);
  return publicJob(job);
}

export async function getMediaJob(id) {
  return publicJob(await readJson(path.join(jobsRoot, id, "job.json")));
}

async function mutate(id, callback) {
  const file = path.join(jobsRoot, id, "job.json");
  const job = upgradeJob(await readJson(file));
  await callback(job, path.dirname(file));
  job.summary = summarizeJob(job);
  job.updatedAt = new Date().toISOString();
  await writeJson(file, job);
  return publicJob(job);
}

function invalidateBuild(job) {
  job.outputs = {};
  if (job.status === "approved") delete job.approvedAt;
  job.status = Object.keys(job.variantSources || {}).length ? "selected" : "evaluated";
}

export async function reviewMediaCandidate(id, { candidateId: requestedId, approved, reason }) {
  return mutate(id, async (job) => {
    const candidate = job.candidates.find((item) => item.candidateId === requestedId);
    if (!candidate) throw new Error("Bildkandidat wurde nicht gefunden.");
    if (approved && !candidate.localFile) {
      throw new Error("Dieses Bild wurde nicht heruntergeladen und kann deshalb nicht manuell freigegeben werden.");
    }
    candidate.manualDecision = approved ? "approved" : null;
    candidate.manualReason = approved ? String(reason || "Manuell redaktionell geprüft").trim().slice(0, 240) : null;
    if (!approved && candidate.automaticStatus !== "accepted") {
      for (const [variant, source] of Object.entries(job.variantSources)) {
        if (source?.type === "candidate" && source.candidateId === requestedId) delete job.variantSources[variant];
      }
      invalidateBuild(job);
    }
  });
}

const assertVariant = (variant) => {
  if (!MEDIA_VARIANTS[variant]) throw new Error("Unbekannte Bildvariante.");
  return variant;
};

function safeJobFile(directory, relativeFile) {
  const resolved = path.resolve(directory, String(relativeFile || ""));
  const root = `${path.resolve(directory)}${path.sep}`;
  if (!resolved.startsWith(root)) throw new Error("Ungültiger Bildpfad im Media-Job.");
  return resolved;
}

export async function selectMediaVariant(id, { variant: requestedVariant, sourceType, candidateId: requestedCandidateId }) {
  const variant = assertVariant(requestedVariant);
  return mutate(id, async (job, directory) => {
    if (sourceType === "none") {
      delete job.variantSources[variant];
      invalidateBuild(job);
      return;
    }

    if (sourceType === "upload") {
      if (!job.uploads[variant]?.file) throw new Error("Für diese Variante wurde noch kein eigenes Bild hochgeladen.");
      job.variantSources[variant] = { type: "upload", selectedAt: new Date().toISOString() };
      invalidateBuild(job);
      return;
    }

    if (sourceType === "derived-hero") {
      if (!["thumbnail", "comparison"].includes(variant)) {
        throw new Error("Nur Thumbnail und Vergleichsbild können aus dem Hero abgeleitet werden.");
      }
      job.variantSources[variant] = { type: "derived-hero", selectedAt: new Date().toISOString() };
      invalidateBuild(job);
      return;
    }

    if (sourceType !== "candidate") throw new Error("Unbekannte Bildquelle.");
    const candidate = job.candidates.find((item) => item.candidateId === requestedCandidateId);
    if (!candidate) throw new Error("Bildkandidat wurde nicht gefunden.");
    if (!candidateCanBeUsed(candidate)) {
      throw new Error("Das Bild muss vor der Auswahl automatisch oder manuell freigegeben sein.");
    }
    await fs.access(safeJobFile(directory, candidate.localFile));
    job.variantSources[variant] = {
      type: "candidate",
      candidateId: candidate.candidateId,
      file: candidate.localFile,
      manualOverride: candidate.automaticStatus !== "accepted",
      selectedAt: new Date().toISOString()
    };
    invalidateBuild(job);
  });
}

export async function uploadMediaVariant(id, { variant: requestedVariant, fileName, mimeType, dataBase64 }) {
  const variant = assertVariant(requestedVariant);
  if (!/^image\/(png|jpeg|webp|avif)$/i.test(String(mimeType))) {
    throw new Error("Nur PNG, JPEG, WebP oder AVIF sind erlaubt.");
  }
  const buffer = Buffer.from(String(dataBase64 || ""), "base64");
  if (!buffer.length || buffer.length > 15_000_000) {
    throw new Error("Upload ist leer oder größer als 15 MB.");
  }
  const metadata = await assertImage(buffer);
  const extensionByFormat = { png: "png", jpeg: "jpg", webp: "webp", avif: "avif" };
  const extension = extensionByFormat[metadata.format];
  if (!extension) throw new Error("Das tatsächliche Bildformat ist nicht erlaubt.");

  return mutate(id, async (job, directory) => {
    const uploadDir = path.join(directory, "uploads");
    await ensure(uploadDir);
    const file = path.join(uploadDir, `${variant}.${extension}`);
    for (const entry of await fs.readdir(uploadDir)) {
      if (entry.startsWith(`${variant}.`) && entry !== path.basename(file)) {
        await fs.rm(path.join(uploadDir, entry), { force: true });
      }
    }
    await atomicWriteFile(file, buffer);
    job.uploads[variant] = {
      file: path.relative(directory, file).replaceAll("\\", "/"),
      fileName: String(fileName || path.basename(file)),
      mimeType: `image/${metadata.format}`,
      bytes: buffer.length,
      width: metadata.width,
      height: metadata.height
    };
    job.variantSources[variant] = { type: "upload", selectedAt: new Date().toISOString() };
    invalidateBuild(job);
  });
}

function sourceForVariant(job, directory, variant, stack = new Set()) {
  if (stack.has(variant)) throw new Error("Zirkuläre Ableitung im Bildpaket.");
  stack.add(variant);
  const source = job.variantSources?.[variant];
  if (!source) return null;
  if (source.type === "upload") {
    const upload = job.uploads?.[variant]?.file;
    if (!upload) throw new Error(`${MEDIA_VARIANTS[variant].label}: ausgewählter Upload fehlt.`);
    return { file: safeJobFile(directory, upload), source: "upload" };
  }
  if (source.type === "candidate") {
    const candidate = job.candidates.find((item) => item.candidateId === source.candidateId);
    if (!candidateCanBeUsed(candidate)) throw new Error(`${MEDIA_VARIANTS[variant].label}: Bildkandidat ist nicht freigegeben.`);
    return {
      file: safeJobFile(directory, candidate.localFile),
      source: candidate.automaticStatus === "accepted" ? "candidate" : "candidate-manual-override"
    };
  }
  if (source.type === "derived-hero") {
    const hero = sourceForVariant(job, directory, "hero", stack);
    if (!hero) throw new Error(`${MEDIA_VARIANTS[variant].label}: Für die Ableitung fehlt eine Hero-Quelle.`);
    return { file: hero.file, source: "derived-from-hero" };
  }
  throw new Error(`${MEDIA_VARIANTS[variant].label}: unbekannte Bildquelle.`);
}

export async function buildMediaJob(id) {
  return mutate(id, async (job, directory) => {
    const selectedVariants = variantNames.filter((variant) => job.variantSources?.[variant]);
    if (!selectedVariants.length) throw new Error("Wähle mindestens eine Zieldatei oder lade ein Bild hoch.");

    const outputDir = path.join(directory, "outputs");
    await fs.rm(outputDir, { recursive: true, force: true });
    await ensure(outputDir);
    const existingAssets = new Set(await listExistingAssets(job.product.slug));
    job.outputs = {};

    for (const variant of selectedVariants) {
      const specification = MEDIA_VARIANTS[variant];
      const source = sourceForVariant(job, directory, variant);
      if (!source) continue;
      const destination = path.join(outputDir, specification.fileName);
      await normalizeWebp(source.file, destination, specification);
      job.outputs[variant] = {
        file: path.relative(directory, destination).replaceAll("\\", "/"),
        source: source.source,
        targetFile: specification.fileName,
        action: existingAssets.has(specification.fileName) ? "overwrite" : "create",
        width: specification.width,
        height: specification.height
      };
    }
    if (!Object.keys(job.outputs).length) throw new Error("Aus den ausgewählten Quellen konnte keine Bilddatei gebaut werden.");
    job.status = "built";
  });
}

async function copyDirectoryIfPresent(source, destination) {
  try {
    await fs.cp(source, destination, { recursive: true, force: true });
    return true;
  } catch (error) {
    if (error?.code === "ENOENT") return false;
    throw error;
  }
}

export async function approveMediaJob(id) {
  return mutate(id, async (job, directory) => {
    if (job.status !== "built") throw new Error("Das Bildpaket muss vor der Freigabe gebaut werden.");
    if (!Object.keys(job.outputs || {}).length) throw new Error("Das Bildpaket enthält keine zu veröffentlichenden Dateien.");
    const productFiles = await readProductFiles(productsDir);
    const documents = await Promise.all(productFiles.map(readProductDocument));
    const document = documents.find((item) => item.slug === job.product.slug);
    if (!document) throw new Error(`Produktdatei für "${job.product.slug}" fehlt.`);

    const target = path.join(assetsRoot, job.product.slug);
    const staging = path.join(assetsRoot, `.${job.product.slug}-${job.id}.staging`);
    const previous = path.join(directory, "approval-backup-assets");
    const originalMarkdown = await fs.readFile(document.file, "utf8");
    await fs.rm(staging, { recursive: true, force: true });
    await fs.rm(previous, { recursive: true, force: true });
    await ensure(staging);

    await copyDirectoryIfPresent(target, staging);
    for (const [variant, output] of Object.entries(job.outputs)) {
      const targetFile = MEDIA_VARIANTS[variant]?.fileName;
      if (!targetFile) throw new Error(`Unbekanntes Ausgabeziel: ${variant}`);
      await fs.copyFile(safeJobFile(directory, output.file), path.join(staging, targetFile));
    }

    const finalFiles = (await fs.readdir(staging, { withFileTypes: true }))
      .filter((entry) => entry.isFile())
      .map((entry) => entry.name);
    if (!finalFiles.includes("hero.webp")) {
      throw new Error("Im Produktordner fehlt hero.webp. Veröffentliche zuerst ein Hero-Bild.");
    }

    let movedPrevious = false;
    try {
      try {
        await fs.rename(target, previous);
        movedPrevious = true;
      } catch (error) {
        if (error?.code !== "ENOENT") throw error;
      }
      await fs.rename(staging, target);
      await updateProductImages(document.file, {
        slug: job.product.slug,
        title: document.data.title || job.product.title,
        availableFiles: finalFiles
      });

      const approvedAt = new Date().toISOString();
      const audit = {
        ...job,
        approvedAt,
        status: "approved",
        publishedFiles: Object.values(job.outputs).map((output) => output.targetFile),
        preservedFiles: finalFiles.filter((file) => !Object.values(job.outputs).some((output) => output.targetFile === file)),
        repositoryPath: path.relative(repoRoot, target).replaceAll("\\", "/")
      };
      await ensure(path.join(reviewRoot, job.product.slug));
      await writeJson(path.join(reviewRoot, job.product.slug, "audit.json"), audit);
      await fs.rm(previous, { recursive: true, force: true });
      job.status = "approved";
      job.approvedAt = approvedAt;
      job.publishedFiles = audit.publishedFiles;
      job.preservedFiles = audit.preservedFiles;
      job.repositoryPath = audit.repositoryPath;
    } catch (error) {
      await fs.writeFile(document.file, originalMarkdown, "utf8");
      await fs.rm(target, { recursive: true, force: true });
      if (movedPrevious) await fs.rename(previous, target);
      await fs.rm(staging, { recursive: true, force: true });
      throw error;
    }
  });
}

export async function mediaAudit() {
  await ensure(jobsRoot);
  const entries = await fs.readdir(jobsRoot, { withFileTypes: true });
  const jobs = [];
  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    try {
      jobs.push(upgradeJob(await readJson(path.join(jobsRoot, entry.name, "job.json"))));
    } catch {
      // Ein unvollständiger Job wird nicht als gültiger Audit gewertet.
    }
  }
  jobs.sort((left, right) => String(right.updatedAt).localeCompare(String(left.updatedAt)));
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      jobs: jobs.length,
      evaluated: jobs.filter((job) => job.status === "evaluated").length,
      selected: jobs.filter((job) => job.status === "selected").length,
      built: jobs.filter((job) => job.status === "built").length,
      approved: jobs.filter((job) => job.status === "approved").length,
      manuallyApprovedImages: jobs.reduce((sum, job) => sum + summarizeJob(job).manuallyApproved, 0),
      rejectedImages: jobs.reduce((sum, job) => sum + summarizeJob(job).rejected, 0)
    },
    jobs: jobs.slice(0, 30).map((job) => ({
      id: job.id,
      status: job.status,
      product: job.product,
      summary: summarizeJob(job),
      updatedAt: job.updatedAt,
      approvedAt: job.approvedAt || null
    }))
  };
}

export async function readJobFile(id, name) {
  const job = upgradeJob(await readJson(path.join(jobsRoot, id, "job.json")));
  const allowed = [
    ...job.candidates.map((item) => item.localFile),
    ...Object.values(job.uploads).map((item) => item.file),
    ...Object.values(job.outputs).map((item) => item.file)
  ].filter(Boolean);
  const requested = String(name || "").replaceAll("\\", "/").replace(/^\/+/, "");
  const match = allowed.find((file) => file === requested) ||
    allowed.find((file) => path.basename(file) === path.basename(requested));
  if (!match) throw new Error("Bilddatei gehört nicht zu diesem Job.");
  const file = path.join(jobsRoot, id, match);
  const extension = path.extname(file).toLowerCase();
  return {
    buffer: await fs.readFile(file),
    contentType: extension === ".png"
      ? "image/png"
      : extension === ".webp"
        ? "image/webp"
        : extension === ".avif"
          ? "image/avif"
          : "image/jpeg"
  };
}

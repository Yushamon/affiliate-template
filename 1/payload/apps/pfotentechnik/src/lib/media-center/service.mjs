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

const variants = {
  hero: {
    width: 1600,
    height: 1000,
    scene: "Premium bright studio hero, three-quarter front view, soft commercial lighting, clean light background, subtle shadow."
  },
  thumbnail: {
    width: 720,
    height: 720,
    scene: "Compact isolated catalog thumbnail, centered product, very light background, maximum shape recognition."
  },
  comparison: {
    width: 900,
    height: 720,
    scene: "Neutral comparison-card image, centered product, consistent scale, no props."
  },
  "gallery-1": {
    width: 1400,
    height: 1000,
    scene: "Close product view emphasizing body, controls, materials and construction."
  },
  "gallery-2": {
    width: 1400,
    height: 1000,
    scene: "Realistic premium home-use context, device fully visible and correctly scaled."
  },
  "gallery-3": {
    width: 1400,
    height: 1000,
    scene: "Functional detail view showing the most important differentiating hardware feature."
  }
};

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
  Object.entries(variants).map(([name, spec]) => [
    name,
    `Create a highly realistic product photograph of ${title}. ${spec.scene}\n` +
    "Use the supplied reference images as strict product identity references. " +
    `Preserve exact model, proportions, materials, controls and color. Match ${manufacturer} manufacturer photography without inventing features. ` +
    "No unrelated advertising, banners or promotional services."
  ])
);

const publicJob = (job) => ({
  ...job,
  candidates: job.candidates.map(({ url, status, score, reasons, kind, localFile }) => ({
    url,
    status,
    score,
    reasons,
    kind,
    file: localFile ? path.basename(localFile) : null
  }))
});

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

  for (const candidate of candidates) {
    if (!candidate.accepted) {
      results.push({
        ...candidate,
        status: "rejected",
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
          status: "rejected",
          localFile: path.relative(directory, file).replaceAll("\\", "/"),
          score: evaluation.score,
          reasons: [`Duplikat von ${duplicate.file}`],
          metrics: evaluation
        });
        continue;
      }

      hashes.push({ hash, file: path.basename(file) });
      results.push({
        ...candidate,
        status: evaluation.accepted ? "accepted" : "rejected",
        localFile: path.relative(directory, file).replaceAll("\\", "/"),
        score: evaluation.score,
        reasons: evaluation.reasons,
        metrics: evaluation
      });
    } catch (error) {
      results.push({
        ...candidate,
        status: "rejected",
        reasons: [error instanceof Error ? error.message : String(error)]
      });
    }
  }

  const job = {
    schemaVersion: 2,
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
    summary: {
      found: candidates.length,
      downloaded: results.filter((item) => item.localFile).length,
      accepted: results.filter((item) => item.status === "accepted").length,
      rejected: results.filter((item) => item.status === "rejected").length
    },
    candidates: results,
    prompts: promptPackage(
      matched.document.data?.title || identity.title || finalSlug,
      matched.document.data?.manufacturer?.name || identity.manufacturer
    ),
    uploads: {},
    outputs: {},
    audit: {
      manualReviewRequired: true,
      limits: [
        "Werbung und Logos werden anhand von Kontext, URL, Format und Bildmerkmalen gefiltert. Eine semantische Texterkennung findet bewusst nicht statt.",
        "Hersteller- und Händlerseiten können automatisierte Abrufe blockieren.",
        "Referenzbilder werden nicht in öffentliche Assets übernommen. Veröffentlichte Dateien entstehen ausschließlich aus hochgeladenen Bildern."
      ]
    }
  };
  await writeJson(path.join(directory, "job.json"), job);
  return publicJob(job);
}

export async function getMediaJob(id) {
  return publicJob(await readJson(path.join(jobsRoot, id, "job.json")));
}

async function mutate(id, callback) {
  const file = path.join(jobsRoot, id, "job.json");
  const job = await readJson(file);
  await callback(job, path.dirname(file));
  job.updatedAt = new Date().toISOString();
  await writeJson(file, job);
  return publicJob(job);
}

export async function uploadMediaVariant(id, { variant, fileName, mimeType, dataBase64 }) {
  if (!variants[variant]) throw new Error("Unbekannte Bildvariante.");
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
    job.status = "uploaded";
  });
}

export async function buildMediaJob(id) {
  return mutate(id, async (job, directory) => {
    const outputDir = path.join(directory, "outputs");
    await fs.rm(outputDir, { recursive: true, force: true });
    await ensure(outputDir);
    const heroUpload = job.uploads.hero?.file
      ? path.join(directory, job.uploads.hero.file)
      : null;
    if (!heroUpload) {
      throw new Error("Vor dem Build muss ein eigenes oder generiertes Hero-Bild hochgeladen werden.");
    }
    job.outputs = {};

    for (const [name, specification] of Object.entries(variants)) {
      const uploaded = job.uploads[name]?.file
        ? path.join(directory, job.uploads[name].file)
        : null;
      const derivedFromHero = !uploaded && ["thumbnail", "comparison"].includes(name);
      const source = uploaded || (derivedFromHero ? heroUpload : null);
      if (!source) continue;
      const destination = path.join(outputDir, `${name}.webp`);
      await normalizeWebp(source, destination, specification);
      job.outputs[name] = {
        file: path.relative(directory, destination).replaceAll("\\", "/"),
        source: uploaded ? "upload" : "derived-from-hero",
        width: specification.width,
        height: specification.height
      };
    }
    job.status = "built";
  });
}

export async function approveMediaJob(id) {
  return mutate(id, async (job, directory) => {
    if (job.status !== "built") throw new Error("Das Bildpaket muss vor der Freigabe gebaut werden.");
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
    for (const [name, output] of Object.entries(job.outputs)) {
      await fs.copyFile(path.join(directory, output.file), path.join(staging, `${name}.webp`));
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
        variants: job.outputs
      });

      const approvedAt = new Date().toISOString();
      const audit = {
        ...job,
        approvedAt,
        status: "approved",
        repositoryPath: path.relative(repoRoot, target).replaceAll("\\", "/")
      };
      await ensure(path.join(reviewRoot, job.product.slug));
      await writeJson(path.join(reviewRoot, job.product.slug, "audit.json"), audit);
      await fs.rm(previous, { recursive: true, force: true });
      job.status = "approved";
      job.approvedAt = approvedAt;
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
      jobs.push(await readJson(path.join(jobsRoot, entry.name, "job.json")));
    } catch {
      // Ein unvollständiger Job wird nicht als gültiger Audit gewertet.
    }
  }
  return {
    generatedAt: new Date().toISOString(),
    summary: {
      jobs: jobs.length,
      evaluated: jobs.filter((job) => job.status === "evaluated").length,
      built: jobs.filter((job) => job.status === "built").length,
      approved: jobs.filter((job) => job.status === "approved").length,
      rejectedImages: jobs.reduce((sum, job) => sum + (job.summary?.rejected || 0), 0)
    },
    jobs: jobs.map((job) => ({
      id: job.id,
      status: job.status,
      product: job.product,
      summary: job.summary,
      updatedAt: job.updatedAt
    }))
  };
}

export async function readJobFile(id, name) {
  const job = await readJson(path.join(jobsRoot, id, "job.json"));
  const allowed = [
    ...job.candidates.map((item) => item.localFile),
    ...Object.values(job.uploads).map((item) => item.file),
    ...Object.values(job.outputs).map((item) => item.file)
  ].filter(Boolean);
  const match = allowed.find((file) => path.basename(file) === path.basename(name));
  if (!match) throw new Error("Bilddatei gehört nicht zu diesem Job.");
  const file = path.join(jobsRoot, id, match);
  const extension = path.extname(file).toLowerCase();
  return {
    buffer: await fs.readFile(file),
    contentType: extension === ".png"
      ? "image/png"
      : extension === ".webp"
        ? "image/webp"
        : "image/jpeg"
  };
}

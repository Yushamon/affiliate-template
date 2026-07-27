import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { classifyCandidate, extractImageCandidates } from "../src/lib/media-center/filter.mjs";
import { atomicWriteFile } from "../src/lib/admin/atomic-file.mjs";
import { matchProductDocument } from "../src/lib/media-center/product-identity.mjs";
import {
  buildTargetPlan,
  candidateCanBeUsed
} from "../src/lib/media-center/service.mjs";
import { buildProductImagesBlock } from "../src/lib/media-center/markdown-images.mjs";

test("verwirft Amazon-Dienste und Werbebanner", () => {
  assert.equal(classifyCandidate({ url: "https://images.example/prime-video-banner.jpg", alt: "Prime Video Werbung" }).accepted, false);
  assert.equal(classifyCandidate({ url: "https://images.example/product-main.jpg", alt: "PETLIBRO feeder front" }).accepted, true);
});

test("extrahiert Produktbilder und behält Ablehnungsgründe im Audit", () => {
  const html = '<img src="/product-main.jpg" alt="product front"><img src="/amazon-fresh-banner.jpg" alt="Amazon Fresh Werbung">';
  const rows = extractImageCandidates(html, "https://shop.example/item");
  assert.equal(rows.length, 2);
  assert.equal(rows.filter((row) => row.accepted).length, 1);
  assert.equal(rows.find((row) => !row.accepted)?.reason, "amazon-fresh");
});

test("ersetzt Freigabedateien atomar", async () => {
  const directory = await fs.mkdtemp(path.join(os.tmpdir(), "pt-media-"));
  const file = path.join(directory, "audit.json");
  try {
    await fs.writeFile(file, "alt", "utf8");
    await atomicWriteFile(file, "neu", "utf8");
    assert.equal(await fs.readFile(file, "utf8"), "neu");
  } finally {
    await fs.rm(directory, { recursive: true, force: true });
  }
});

test("ordnet Händlerbezeichnungen einem bestehenden Produkt eindeutig zu", () => {
  const documents = [
    { slug: "petlibro-granary-2-vision", data: { title: "PETLIBRO Granary 2 Vision", manufacturer: { name: "PETLIBRO" } } },
    { slug: "petlibro-air-wifi-feeder", data: { title: "PETLIBRO Air WiFi Feeder", manufacturer: { name: "PETLIBRO" } } }
  ];
  const match = matchProductDocument({ title: "PETLIBRO Granary 2 Vision Smart Futterautomat mit Kamera", manufacturer: "PETLIBRO" }, documents);
  assert.equal(match?.document.slug, "petlibro-granary-2-vision");
});

test("eine automatische Ablehnung kann nach lokaler Prüfung manuell freigegeben werden", () => {
  assert.equal(candidateCanBeUsed({ localFile: "references/a.jpg", automaticStatus: "rejected", manualDecision: null }), false);
  assert.equal(candidateCanBeUsed({ localFile: "references/a.jpg", automaticStatus: "rejected", manualDecision: "approved" }), true);
  assert.equal(candidateCanBeUsed({ automaticStatus: "rejected", manualDecision: "approved" }), false);
});

test("Zielplan unterscheidet Anlegen, Überschreiben und unveränderte Dateien", () => {
  const plan = buildTargetPlan({
    existingAssets: ["hero.webp", "gallery-1.webp"],
    outputs: {
      hero: { file: "outputs/hero.webp" },
      thumbnail: { file: "outputs/thumbnail.webp" }
    }
  });
  assert.equal(plan.find((entry) => entry.variant === "hero")?.action, "overwrite");
  assert.equal(plan.find((entry) => entry.variant === "thumbnail")?.action, "create");
  assert.equal(plan.find((entry) => entry.variant === "gallery-1")?.action, "unchanged");
});

test("Markdown verweist nur auf tatsächlich vorhandene optionale Varianten", () => {
  const block = buildProductImagesBlock({
    slug: "test-produkt",
    title: "Test Produkt",
    availableFiles: ["hero.webp", "gallery-2.webp"]
  });
  assert.match(block, /hero\.webp/);
  assert.match(block, /gallery-2\.webp/);
  assert.doesNotMatch(block, /thumbnail\.webp/);
  assert.doesNotMatch(block, /comparison\.webp/);
});

test("Media-Center-Routen enthalten manuelle Prüfung und Zielauswahl", async () => {
  const source = await fs.readFile(new URL("../src/lib/admin/operations-router.mjs", import.meta.url), "utf8");
  assert.match(source, /reviewMediaCandidate/);
  assert.match(source, /selectMediaVariant/);
  assert.match(source, /upload\|review\|select\|build\|approve\|file/);
});

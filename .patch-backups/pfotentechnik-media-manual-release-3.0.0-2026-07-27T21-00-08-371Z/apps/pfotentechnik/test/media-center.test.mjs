import test from "node:test";import assert from "node:assert/strict";import {classifyCandidate,extractImageCandidates} from "../src/lib/media-center/filter.mjs";
test("verwirft Amazon-Dienste und Werbebanner",()=>{assert.equal(classifyCandidate({url:"https://images.example/prime-video-banner.jpg",alt:"Prime Video Werbung"}).accepted,false);assert.equal(classifyCandidate({url:"https://images.example/product-main.jpg",alt:"PETLIBRO feeder front"}).accepted,true)});
test("extrahiert Produktbilder und behält Ablehnungsgründe im Audit",()=>{const html='<img src="/product-main.jpg" alt="product front"><img src="/amazon-fresh-banner.jpg" alt="Amazon Fresh Werbung">';const rows=extractImageCandidates(html,"https://shop.example/item");assert.equal(rows.length,2);assert.equal(rows.filter((row)=>row.accepted).length,1);assert.equal(rows.find((row)=>!row.accepted)?.reason,"amazon-fresh")});

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { atomicWriteFile } from "../src/lib/admin/atomic-file.mjs";

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

import { matchProductDocument } from "../src/lib/media-center/product-identity.mjs";

test("ordnet Händlerbezeichnungen einem bestehenden Produkt eindeutig zu", () => {
  const documents = [
    { slug: "petlibro-granary-2-vision", data: { title: "PETLIBRO Granary 2 Vision", manufacturer: { name: "PETLIBRO" } } },
    { slug: "petlibro-air-wifi-feeder", data: { title: "PETLIBRO Air WiFi Feeder", manufacturer: { name: "PETLIBRO" } } }
  ];
  const match = matchProductDocument({ title: "PETLIBRO Granary 2 Vision Smart Futterautomat mit Kamera", manufacturer: "PETLIBRO" }, documents);
  assert.equal(match?.document.slug, "petlibro-granary-2-vision");
});

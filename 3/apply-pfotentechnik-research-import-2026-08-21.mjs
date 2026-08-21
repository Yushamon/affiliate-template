#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const TAG = "[pfotentechnik-research-import-2026-08-21]";
const root = process.cwd();
const requirements = new Map([
  ["apps/pfotentechnik/src/content/products/petkit-purobot-crystal-duo.md", ["slug: \"petkit-purobot-crystal-duo\"", "P9905", "PETKIT Crystal Litter Set", "Care+", "keine medizinische Diagnose"]],
  ["apps/pfotentechnik/src/content/products/furbo-360-katzenkamera.md", ["slug: \"furbo-360-katzenkamera\"", "Feder-Spielzeug", "Meowing Alert", "Kitty Diary", "keine individuelle Mehrkatzenerkennung"]],
  ["apps/pfotentechnik/src/content/comparisons/beste-automatische-katzentoiletten.md", ["petkit-purobot-crystal-duo", "verbrauchssystem", "video_cloud", "mindestalter"]],
  ["apps/pfotentechnik/src/content/comparisons/beste-haustierkameras.md", ["furbo-360-katzenkamera", "katzeninteraktion", "Kitty Diary"]],
  ["apps/pfotentechnik/src/content/manufacturers/petkit.md", ["Angekündigt: YUMSHARE DAILY FEAST", "keine kaufbare Produktseite", "petkit-purobot-crystal-duo"]],
  ["apps/pfotentechnik/src/content/manufacturers/furbo.md", ["furbo-360-katzenkamera"]],
  ["apps/pfotentechnik/src/content/manufacturers/tractive.md", ["DOG 6 und DOG 6 XL", "Bluetooth-Nähe", "keine Hautdiagnose"]],
  ["apps/pfotentechnik/src/content/pages/automatische-katzentoiletten.md", ["petkit-purobot-crystal-duo"]],
  ["apps/pfotentechnik/src/content/pages/haustierkameras.md", ["furbo-360-katzenkamera"]],
  ["apps/pfotentechnik/src/content/products/tractive-dog-6.md", ["Überwachung des Kratzverhaltens", "Fremdes Kratzen", "Bluetooth-Nähe"]],
  ["apps/pfotentechnik/src/content/products/tractive-dog-6-xl.md", ["Überwachung des Kratzverhaltens", "Fremdes Kratzen", "Bluetooth-Nähe"]]
]);

let failed = false;
for (const [relative, tokens] of requirements) {
  const file = path.join(root, relative);
  if (!fs.existsSync(file)) {
    console.error(`${TAG} FEHLER: gebündelte Patch-Datei fehlt: ${relative}`);
    failed = true;
    continue;
  }
  const source = fs.readFileSync(file, "utf8");
  for (const token of tokens) {
    if (!source.includes(token)) {
      console.error(`${TAG} FEHLER: ${relative} enthält den erwarteten Stand nicht: ${token}`);
      failed = true;
    }
  }
}

if (failed) process.exit(1);
console.log(`${TAG} Alle vier Research-Findings sind bereits vollständig installiert.`);
console.log(`${TAG} Keine Änderungen nötig.`);
console.log(`${TAG} Der Installer ist idempotent und erzeugt keine Backups oder Parallel-Patches.`);

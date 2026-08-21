#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const TAG = "[pfotentechnik-research-import-2026-08-21]";
const root = process.cwd();
const app = path.join(root, "apps/pfotentechnik");
const changed = new Map();
const backupRoot = path.join(root, ".patch-backups", `pfotentechnik-research-import-2026-08-21-${new Date().toISOString().replaceAll(":", "-")}`);
const fallback = path.join(app, "src/assets/images/project/pfotentechnik/comparison/default-editorial-hero.webp");

const products = [
  {
    slug: "petkit-purobot-crystal-duo",
    file: "src/content/products/petkit-purobot-crystal-duo.md",
    imageBlock: `images:
  hero: { src: "../../assets/images/products/petkit-purobot-crystal-duo/hero.webp", alt: "Temporärer Editorial-Platzhalter für PETKIT PUROBOT CRYSTAL DUO; noch kein Produktbild" }
  thumbnail: { src: "../../assets/images/products/petkit-purobot-crystal-duo/thumbnail.webp", alt: "Temporärer Platzhalter für die kompakte Ansicht des PETKIT PUROBOT CRYSTAL DUO" }
  comparison: { src: "../../assets/images/products/petkit-purobot-crystal-duo/comparison.webp", alt: "Temporärer Platzhalter für PETKIT PUROBOT CRYSTAL DUO im Vergleich" }
  gallery:
    - { src: "../../assets/images/products/petkit-purobot-crystal-duo/gallery-1.webp", alt: "Geplanter Bildslot: offene Bauweise und niedriger Einstieg des PETKIT PUROBOT CRYSTAL DUO; aktuell Platzhalter" }
    - { src: "../../assets/images/products/petkit-purobot-crystal-duo/gallery-2.webp", alt: "Geplanter Bildslot: Rechen, Crystal Litter und Tray des PETKIT PUROBOT CRYSTAL DUO; aktuell Platzhalter" }
    - { src: "../../assets/images/products/petkit-purobot-crystal-duo/gallery-3.webp", alt: "Geplanter Bildslot: PETKIT PUROBOT CRYSTAL DUO in einer Nutzungssituation mit Katze; aktuell Platzhalter" }`
  },
  {
    slug: "furbo-360-katzenkamera",
    file: "src/content/products/furbo-360-katzenkamera.md",
    imageBlock: `images:
  hero: { src: "../../assets/images/products/furbo-360-katzenkamera/hero.webp", alt: "Temporärer Editorial-Platzhalter für die Furbo 360° Katzenkamera; noch kein Produktbild" }
  thumbnail: { src: "../../assets/images/products/furbo-360-katzenkamera/thumbnail.webp", alt: "Temporärer Platzhalter für die kompakte Ansicht der Furbo 360° Katzenkamera" }
  comparison: { src: "../../assets/images/products/furbo-360-katzenkamera/comparison.webp", alt: "Temporärer Platzhalter für die Furbo 360° Katzenkamera im Vergleich" }
  gallery:
    - { src: "../../assets/images/products/furbo-360-katzenkamera/gallery-1.webp", alt: "Geplanter Bildslot: Furbo 360° Katzenkamera mit klar erkennbarem Kamerakopf; aktuell Platzhalter" }
    - { src: "../../assets/images/products/furbo-360-katzenkamera/gallery-2.webp", alt: "Geplanter Bildslot: Feder-Spielzeug und Katzeninteraktion der Furbo 360° Katzenkamera; aktuell Platzhalter" }
    - { src: "../../assets/images/products/furbo-360-katzenkamera/gallery-3.webp", alt: "Geplanter Bildslot: Furbo 360° Katzenkamera in einer Nutzungssituation mit Katze; aktuell Platzhalter" }`
  }
];

const fail = (message) => { console.error(`${TAG} FEHLER: ${message}`); process.exit(1); };
const rel = (file) => path.relative(root, file);
const remember = (file) => { if (!changed.has(file) && fs.existsSync(file)) changed.set(file, fs.readFileSync(file)); };
const atomicWrite = (file, source) => {
  remember(file);
  const temporary = `${file}.tmp-${process.pid}-${Date.now()}`;
  fs.writeFileSync(temporary, source, "utf8");
  fs.renameSync(temporary, file);
};
const replaceBlock = (source, key, nextKey, replacement, label) => {
  const lines = source.split("\n");
  const start = lines.findIndex((line) => line === `${key}:`);
  const end = lines.findIndex((line, index) => index > start && line.startsWith(`${nextKey}:`));
  if (start < 0 || end < 0) fail(`${label}: ${key}/${nextKey}-Block nicht eindeutig gefunden.`);
  const current = lines.slice(start, end).join("\n").trimEnd();
  if (current === replacement) return source;
  lines.splice(start, end - start, ...replacement.split("\n"), "");
  return lines.join("\n");
};

if (!fs.existsSync(fallback)) fail(`Editorial-Fallback fehlt: ${rel(fallback)}`);

const dockstream = path.join(app, "src/content/products/petlibro-dockstream-rfid-smart.md");
let dockSource = fs.readFileSync(dockstream, "utf8");
for (const [plain, quoted] of [
  ["  title: PETLIBRO Dockstream RFID Smart: RFID-Trinktracking im Check", "  title: \"PETLIBRO Dockstream RFID Smart: RFID-Trinktracking im Check\""],
  ["  description: PETLIBRO Dockstream RFID Smart PLWF305: Trinktracking pro Katze, 3-Liter-Tank und App. Was RFID kann und wo Halsbandpflicht und Zuverlässigkeit stören.", "  description: \"PETLIBRO Dockstream RFID Smart PLWF305: Trinktracking pro Katze, 3-Liter-Tank und App. Was RFID kann und wo Halsbandpflicht und Zuverlässigkeit stören.\""]
]) {
  if (dockSource.includes(plain)) dockSource = dockSource.replace(plain, quoted);
  else if (!dockSource.includes(quoted)) fail(`Dockstream-SEO-Feld hat einen unerwarteten Stand: ${plain.trim()}`);
}
if (dockSource !== fs.readFileSync(dockstream, "utf8")) atomicWrite(dockstream, dockSource);

for (const product of products) {
  const productFile = path.join(app, product.file);
  if (!fs.existsSync(productFile)) fail(`Research-Produktdatei fehlt: ${product.file}`);
  const original = fs.readFileSync(productFile, "utf8");
  let updated = replaceBlock(original, "images", "price", product.imageBlock, product.slug);
  updated = updated.replace('type: "manufacturer"', 'type: "manual"');
  if (updated !== original) atomicWrite(productFile, updated);

  const directory = path.join(app, "src/assets/images/products", product.slug);
  fs.mkdirSync(directory, { recursive: true });
  for (const role of ["hero", "thumbnail", "comparison", "gallery-1", "gallery-2", "gallery-3"]) {
    const target = path.join(directory, `${role}.webp`);
    if (!fs.existsSync(target)) fs.copyFileSync(fallback, target);
  }
}

if (changed.size) {
  for (const [file, content] of changed) {
    const backup = path.join(backupRoot, rel(file));
    fs.mkdirSync(path.dirname(backup), { recursive: true });
    fs.writeFileSync(backup, content);
  }
  console.log(`${TAG} Backup: ${rel(backupRoot)}`);
}

for (const product of products) {
  const source = fs.readFileSync(path.join(app, product.file), "utf8");
  for (const role of ["hero", "thumbnail", "comparison", "gallery-1", "gallery-2", "gallery-3"]) {
    const expected = `products/${product.slug}/${role}.webp`;
    if (!source.includes(expected)) fail(`${product.slug}: Bildpfad fehlt: ${expected}`);
    if (!fs.existsSync(path.join(app, "src/assets/images/products", product.slug, `${role}.webp`))) fail(`${product.slug}: Asset fehlt: ${role}.webp`);
  }
}

const requirements = [
  ["src/content/products/petkit-purobot-crystal-duo.md", ["P9905", "PETKIT Crystal Litter Set", "Care+", "keine medizinische Diagnose"]],
  ["src/content/products/furbo-360-katzenkamera.md", ["Feder-Spielzeug", "Meowing Alert", "Kitty Diary", "keine individuelle Mehrkatzenerkennung"]],
  ["src/content/manufacturers/petkit.md", ["Angekündigt: YUMSHARE DAILY FEAST", "keine kaufbare Produktseite"]],
  ["src/content/products/tractive-dog-6.md", ["Fremdes Kratzen", "Bluetooth-Nähe"]],
  ["src/content/products/tractive-dog-6-xl.md", ["Fremdes Kratzen", "Bluetooth-Nähe"]]
];
for (const [relative, tokens] of requirements) {
  const source = fs.readFileSync(path.join(app, relative), "utf8");
  for (const token of tokens) if (!source.includes(token)) fail(`${relative}: Research-Token fehlt: ${token}`);
}

console.log(`${TAG} ${changed.size ? `${changed.size} Datei(en) aktualisiert.` : "Keine Textänderungen nötig."}`);
console.log(`${TAG} Research-Stand, YAML-Reparatur und zwölf Bildslots sind vollständig validiert.`);

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const assets = path.join(root, "src", "assets", "images");
const products = [
  ["sureflap-mikrochip-katzenklappe", "SureFlap Mikrochip", "Lokaler Mikrochip-Zugang"],
  ["sureflap-dualscan-mikrochip-katzenklappe", "SureFlap DualScan", "Rechte je Katze und Richtung"],
  ["petsafe-mikrochip-katzenklappe", "PetSafe Mikrochip", "Selektiver Eingang"],
  ["onlycat-mikrochip-katzenklappe", "OnlyCat", "App und Beuteerkennung"],
  ["petwalk-medium-tiertuer", "petWALK Medium", "Gedämmte automatische Tiertür"],
];
const variants = [
  ["thumbnail", "Produktrolle", "Was das System im Cluster leistet"],
  ["comparison", "Vergleich", "Zugang · Strom · Einbau · Vernetzung"],
  ["use-case", "Einsatz", "Passung zur konkreten Nutzeraufgabe"],
  ["detail", "Technik", "Sensorik und Verriegelung getrennt prüfen"],
  ["setup", "Einbau", "Tür · Glas · Wand · Zubehör"],
  ["scale", "Passform", "Durchgang und Ausschnitt nicht verwechseln"],
  ["limitation", "Grenze", "Abhängigkeiten vor dem Kauf klären"],
];

const esc = (value) => value.replace(/[&<>"']/g, (char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&apos;"})[char]);
const svg = (model, role, title, subtitle) => `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1200 675" role="img" aria-labelledby="title desc">
  <title id="title">${esc(model)} – ${esc(title)}</title><desc id="desc">${esc(subtitle)}</desc>
  <rect width="1200" height="675" rx="36" fill="#f4f7f6"/><rect x="54" y="54" width="1092" height="567" rx="28" fill="#fff" stroke="#c9d8d2" stroke-width="4"/>
  <rect x="112" y="142" width="360" height="390" rx="30" fill="#e6efeb" stroke="#58786b" stroke-width="8"/>
  <rect x="184" y="236" width="216" height="224" rx="22" fill="#fff" stroke="#274d3f" stroke-width="12"/>
  <path d="M210 420 Q292 360 374 420" fill="none" stroke="#78a493" stroke-width="12" stroke-linecap="round"/>
  <circle cx="252" cy="306" r="18" fill="#e08b5b"/><circle cx="332" cy="306" r="18" fill="#e08b5b"/>
  <text x="540" y="188" font-family="system-ui,sans-serif" font-size="28" font-weight="700" fill="#58786b">${esc(role.toUpperCase())}</text>
  <text x="540" y="260" font-family="system-ui,sans-serif" font-size="48" font-weight="750" fill="#173b30">${esc(title)}</text>
  <text x="540" y="330" font-family="system-ui,sans-serif" font-size="30" fill="#35584c">${esc(model)}</text>
  <line x1="540" y1="376" x2="1050" y2="376" stroke="#c9d8d2" stroke-width="4"/>
  <text x="540" y="432" font-family="system-ui,sans-serif" font-size="25" fill="#4c615a">${esc(subtitle)}</text>
  <text x="540" y="500" font-family="system-ui,sans-serif" font-size="21" fill="#6b7d76">Redaktionelle Orientierung · keine Maßzeichnung</text>
</svg>`;

for (const [slug, model, role] of products) {
  const directory = path.join(assets, "products", slug);
  fs.mkdirSync(directory, { recursive: true });
  for (const [file, title, subtitle] of variants) {
    fs.writeFileSync(path.join(directory, `${file}.svg`), svg(model, role, title, subtitle), "utf8");
  }
}

const editorial = [
  ["hub", "Katzenklappen auswählen", "Vom Problem über Einbau und Zugang zum passenden System"],
  ["microchip-comparison", "Mikrochip-Katzenklappen", "Modelle nach Zugang, Passform, Einbau und Betrieb vergleichen"],
  ["smart-comparison", "App und Beuteerkennung", "Vernetzte Komplettsysteme und Nachrüstung klar unterscheiden"],
  ["installation", "Einbau planen", "Tür, Glas und Wand brauchen unterschiedliche Vorbereitung"],
  ["training", "Katze gewöhnen", "Offene Klappe, Bewegung und Verriegelung schrittweise trainieren"],
  ["multi-cat", "Mehrere Katzen", "Rechte pro Tier und Richtung vorab festlegen"],
  ["insulation", "Zugluft und Dämmung", "Dichtung, Einbauanschluss und Türsystem gemeinsam bewerten"],
  ["journey", "Entscheidungsweg", "Orientieren · vergleichen · Produkt prüfen · sicher nutzen"],
];
const editorialDir = path.join(assets, "cat-flaps");
fs.mkdirSync(editorialDir, { recursive: true });
for (const [file, title, subtitle] of editorial) {
  fs.writeFileSync(path.join(editorialDir, `${file}.svg`), svg("PfotenTechnik Katzenklappen", "Cluster", title, subtitle), "utf8");
}
console.log(`Katzenklappen-Assets erzeugt: ${products.length * variants.length + editorial.length}`);

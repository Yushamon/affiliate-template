#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");
const checks = [];
const read = (p) => fs.readFileSync(path.join(app, p), "utf8");
const check = (name, ok, detail = "") => checks.push({ name, ok, detail });

const offline = read("src/content/pages/futterautomat-ohne-wlan.md");
check("Offline-Comparison", offline.includes("/vergleiche/beste-futterautomaten-ohne-wlan/"));
check("Offline-Snippet", offline.includes("ohne App, Cloud und Konto"));

const camera = read("src/content/pages/futterautomat-mit-kamera.md");
check("Kamera-Comparison", camera.includes("/vergleiche/beste-futterautomaten-mit-kamera/"));
check("Kamera-Intent", camera.includes("sinnvoll oder unnötig"));

const polar = read("src/content/products/petlibro-polar-wet-food-feeder.md");
check("Polar aktiv", polar.includes('productStatus: "active"'));
check("Polar 2,4 GHz", polar.includes("2,4 GHz"));
check("Polar Ausfallschutz", polar.includes("12 Stunden"));
check("Polar Maße", polar.includes("361 × 340 × 196 mm"));
check("Polar Gewicht", polar.includes("3,4 kg"));

const fountain = read("src/content/comparisons/beste-trinkbrunnen-fuer-hunde.md");
const itemCount = (fountain.match(/^  - slug:/gm) ?? []).length;
const slugs = [...fountain.matchAll(/^  - slug: "([^"]+)"/gm)].map((m) => m[1]);
check("Hunde-Brunnen 6 Modelle", itemCount === 6, String(itemCount));
check("Hunde-Brunnen eindeutig", new Set(slugs).size === slugs.length);
check("Hunde-Brunnen Snippet", fountain.includes("6 Modelle im Vergleich 2026"));

const manufacturer = read("src/content/manufacturers/petlibro.md");
check("PETLIBRO Hub", manufacturer.includes("Welche PETLIBRO-Serie passt?"));
check("PETLIBRO Comparisons", manufacturer.includes("/vergleiche/beste-futterautomaten-fuer-nassfutter/"));

const renderer = read("src/pages/produkt/[product].astro");
check("Product positiveNotes", renderer.includes("positiveNotes"));
check("Product negativeNotes", renderer.includes("negativeNotes"));
check("Product 100er Skala", renderer.includes("bestRating: 100"));
check("Review datePublished", renderer.includes("datePublished: publishedAt"));

const failed = checks.filter((entry) => !entry.ok);
for (const entry of checks) {
  console.log(`${entry.ok ? "OK" : "FEHLER"}  ${entry.name}${entry.detail ? ` (${entry.detail})` : ""}`);
}
if (failed.length) {
  console.error(`\n${failed.length} Prüfung(en) fehlgeschlagen.`);
  process.exit(1);
}
console.log("\nWoche-2-SEO-Audit erfolgreich.");

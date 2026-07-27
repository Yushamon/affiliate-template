#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "../..");
const contentRoot = path.join(app, "src", "content");
const checks = [];

const normalize = (value) => String(value).replace(/^\uFEFF/, "").replace(/\r\n?/g, "\n");
const read = (file) => normalize(fs.readFileSync(file, "utf8"));
const check = (name, ok, detail = "") => checks.push({ name, ok, detail });

function walk(directory) {
  const result = [];
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.name.startsWith(".")) continue;
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) result.push(...walk(full));
    else if (/\.(?:md|mdx)$/i.test(entry.name) && !/\.bak(?:\.|$)/i.test(entry.name)) result.push(full);
  }
  return result;
}

const productionFiles = walk(contentRoot);
const corpus = productionFiles
  .map((file) => ({ file, text: read(file) }));

function inbound(target, ownSuffix = "") {
  return corpus.filter(({ file, text }) =>
    (!ownSuffix || !file.replaceAll("\\", "/").endsWith(ownSuffix)) &&
    text.includes(target)
  );
}

const redirectsFile = path.join(app, "public", "_redirects");
const redirects = read(redirectsFile);
for (const [source, target] of [["/beste-futterautomaten-ohne-wlan","/vergleiche/beste-futterautomaten-ohne-wlan/"],["/beste-futterautomaten-ohne-wlan/","/vergleiche/beste-futterautomaten-ohne-wlan/"],["/beste-futterautomaten-mit-kamera","/vergleiche/beste-futterautomaten-mit-kamera/"],["/beste-futterautomaten-mit-kamera/","/vergleiche/beste-futterautomaten-mit-kamera/"]]) {
  check(`Redirect ${source}`, redirects.includes(`${source} ${target} 301`));
}

check(
  "Legacy Offline-Seite entfernt",
  !fs.existsSync(path.join(contentRoot, "pages", "beste-futterautomaten-ohne-wlan.md"))
);
check(
  "Legacy Kamera-Seite entfernt",
  !fs.existsSync(path.join(contentRoot, "pages", "beste-futterautomaten-mit-kamera.md"))
);

const oldOffline = corpus.filter(({ text }) =>
  /(?<!\/vergleiche)\/beste-futterautomaten-ohne-wlan\/?/.test(text)
);
const oldCamera = corpus.filter(({ text }) =>
  /(?<!\/vergleiche)\/beste-futterautomaten-mit-kamera\/?/.test(text)
);
check("Keine produktiven Offline-Altlinks", oldOffline.length === 0, String(oldOffline.length));
check("Keine produktiven Kamera-Altlinks", oldCamera.length === 0, String(oldCamera.length));

const targets = [
  ["/vergleiche/beste-futterautomaten-ohne-wlan/", 3, "Offline-Comparison"],
  ["/vergleiche/beste-futterautomaten-mit-kamera/", 3, "Kamera-Comparison"],
  ["/vergleiche/beste-futterautomaten-fuer-zwei-katzen/", 2, "Zwei-Katzen-Comparison"],
  ["/produkt/petlibro-polar-wet-food-feeder/", 2, "PETLIBRO Polar"],
  ["/produkt/petkit-yumshare-solo-2/", 2, "YumShare Solo 2"],
  ["/vergleiche/beste-trinkbrunnen-fuer-hunde/", 4, "Hunde-Trinkbrunnen"]
];

for (const [target, minimum, label] of targets) {
  const sources = inbound(target, target.includes("/produkt/")
    ? `products/${target.split("/").filter(Boolean).at(-1)}.md`
    : "");
  check(`Inbound ${label}`, sources.length >= minimum, `${sources.length}/${minimum}`);
}

const yumshareFile = path.join(contentRoot, "products", "petkit-yumshare-solo-2.md");
const yumshare = read(yumshareFile);
check("YumShare kein Test-Claim", !/seo:\n[\s\S]*?title:\s*["']?[^\n]*\bTest\b/i.test(yumshare));
check("YumShare aktiv", yumshare.includes('productStatus: "active"'));
check("YumShare Dual-Band", yumshare.includes("2,4 und 5 GHz"));
check("YumShare Maße", yumshare.includes("186 × 300 × 383 mm"));
check("YumShare Datenlücke transparent", yumshare.includes("widersprüchlich"));

const failed = checks.filter((entry) => !entry.ok);
for (const entry of checks) {
  console.log(`${entry.ok ? "OK" : "FEHLER"}  ${entry.name}${entry.detail ? ` (${entry.detail})` : ""}`);
}
if (failed.length) {
  console.error(`\n${failed.length} Prüfung(en) fehlgeschlagen.`);
  process.exit(1);
}
console.log("\nWoche-3-Authority-Audit erfolgreich.");

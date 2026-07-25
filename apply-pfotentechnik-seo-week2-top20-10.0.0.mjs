#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const PATCH = "pfotentechnik-seo-week2-top20-10.0.0";
const CHECK = process.argv.includes("--check");
const __dirname = path.dirname(fileURLToPath(import.meta.url));

function findRepoRoot(start) {
  let current = path.resolve(start);
  for (let i = 0; i < 12; i += 1) {
    if (
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "package.json"))
    ) return current;
    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }
  throw new Error("Repository-Root mit apps/pfotentechnik nicht gefunden.");
}

const root = findRepoRoot(process.cwd());
const app = path.join(root, "apps", "pfotentechnik");
const payload = path.join(__dirname, "payload");
const changed = new Map();
const deleted = new Map();

function rel(file) { return path.relative(root, file).replaceAll("\\", "/"); }
function read(file) {
  if (!fs.existsSync(file)) throw new Error(`Datei fehlt: ${rel(file)}`);
  return fs.readFileSync(file, "utf8");
}
function stage(file, content) {
  const normalized = content.replace(/\r\n/g, "\n");
  const old = read(file).replace(/\r\n/g, "\n");
  if (old !== normalized) changed.set(file, { old, next: normalized });
}
function scalar(text, key, value) {
  const rx = new RegExp(`^(\\s*)${key}:.*$`, "m");
  if (!rx.test(text)) throw new Error(`Feld ${key} nicht gefunden.`);
  return text.replace(rx, (_, indent) => `${indent}${key}: ${JSON.stringify(value)}`);
}
function replaceBetween(text, startMarker, endMarker, replacement, label) {
  const start = text.indexOf(startMarker);
  const end = text.indexOf(endMarker, start + startMarker.length);
  if (start < 0 || end < 0) throw new Error(`${label}: Blockgrenzen nicht gefunden.`);
  return text.slice(0, start) + replacement + text.slice(end);
}
function splitFrontmatter(text) {
  const match = text.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) throw new Error("Frontmatter konnte nicht getrennt werden.");
  return { fm: match[1], body: match[2] };
}
function joinFrontmatter(fm, body) {
  return `---\n${fm.trimEnd()}\n---\n\n${body.trim()}\n`;
}
function ensureAfter(text, anchor, insert, label) {
  if (text.includes(insert.trim())) return text;
  const pos = text.indexOf(anchor);
  if (pos < 0) throw new Error(`${label}: Anker nicht gefunden.`);
  return text.slice(0, pos + anchor.length) + insert + text.slice(pos + anchor.length);
}
function ensureCardCta(text, title, href, cta, label) {
  const titleNeedle = `title: "${title}"`;
  const titlePos = text.indexOf(titleNeedle);
  if (titlePos < 0) throw new Error(`${label}: Titel nicht gefunden.`);
  const blockStart = text.lastIndexOf("\n      - ", titlePos);
  const nextCard = text.indexOf("\n      - ", titlePos + titleNeedle.length);
  const nextBlock = text.indexOf("\n  - type:", titlePos + titleNeedle.length);
  const candidates = [nextCard, nextBlock, text.length].filter((value) => value >= 0);
  const blockEnd = Math.min(...candidates);
  const start = blockStart >= 0 ? blockStart : titlePos;
  const block = text.slice(start, blockEnd);
  if (block.includes(`href: "${href}"`)) return text;
  const lines = block.split("\n");
  const textIndex = lines.findIndex((line) => /^\s+text:/.test(line));
  if (textIndex < 0) throw new Error(`${label}: Textzeile im Block nicht gefunden.`);
  const indent = lines[textIndex].match(/^\s*/)?.[0] ?? "";
  lines.splice(textIndex + 1, 0, `${indent}href: "${href}"`, `${indent}cta: "${cta}"`);
  return text.slice(0, start) + lines.join("\n") + text.slice(blockEnd);
}
function replaceRegex(text, rx, replacement, label) {
  if (!rx.test(text)) throw new Error(`${label}: Muster nicht gefunden.`);
  return text.replace(rx, replacement);
}

const files = {
  offline: path.join(app, "src/content/pages/futterautomat-ohne-wlan.md"),
  camera: path.join(app, "src/content/pages/futterautomat-mit-kamera.md"),
  twoCats: path.join(app, "src/content/pages/futterautomat-fuer-zwei-katzen.md"),
  petlibro: path.join(app, "src/content/manufacturers/petlibro.md"),
  hub: path.join(app, "src/content/pages/smarte-futterautomaten.md"),
  polar: path.join(app, "src/content/products/petlibro-polar-wet-food-feeder.md"),
  fountains: path.join(app, "src/content/comparisons/beste-trinkbrunnen-fuer-hunde.md"),
  renderer: path.join(app, "src/pages/produkt/[product].astro"),
  audit: path.join(app, "scripts/seo/audit-week2-top20.mjs")
};

// 1) Vollständige, recherchierte Ersatzdateien
stage(files.polar, fs.readFileSync(path.join(payload, "petlibro-polar-wet-food-feeder.md"), "utf8"));
stage(files.fountains, fs.readFileSync(path.join(payload, "beste-trinkbrunnen-fuer-hunde.md"), "utf8"));

// 2) Offline-Ratgeber
{
  let text = read(files.offline);
  text = scalar(text, "seoTitle", "Futterautomat ohne WLAN: ohne App, Cloud und Konto");
  text = scalar(text, "seoDescription", "Futterautomat ohne WLAN auswählen: drei Offline-Konzepte, lokale Zeitpläne, Batteriebetrieb, Datenschutz und direkte Modelle im Vergleich.");
  text = scalar(text, "updatedAt", "2026-07-25");
  text = text.replace(
    /comparisonProducts:\s*\[[^\]]*\]/,
    'comparisonProducts: ["cat-mate-c500", "surefeed-microchip-pet-feeder", "imipaw-3l"]'
  );
  text = text.replace(
    /comparisonHref:\s*\/vergleiche\/beste-futterautomaten\/?/g,
    "comparisonHref: /vergleiche/beste-futterautomaten-ohne-wlan/"
  );
  text = ensureCardCta(
    text,
    "Lokale Zeitsteuerung reicht für viele Routinen",
    "/vergleiche/beste-futterautomaten-ohne-wlan/",
    "Offline-Modelle vergleichen",
    "Offline-Antwort-CTA"
  );
  const extraSection = `
## Drei Offline-Bauarten direkt vergleichen

Der spezialisierte [Vergleich der besten Futterautomaten ohne WLAN](/vergleiche/beste-futterautomaten-ohne-wlan/) trennt drei Konzepte:

- **Cat Mate C500:** vorbereitete Nass- oder Trockenfutterfächer mit lokaler Zeitsteuerung,
- **SureFeed Microchip Pet Feeder:** geschützter Zugang ohne automatische Vorratsdosierung,
- **IMIPAW 3L:** klassischer Trockenfutterautomat mit lokalem Plan.

Die Geräte sind keine direkten Funktionszwillinge. Entscheidend ist zuerst, ob du Zeitsteuerung, Zugangsschutz oder automatische Trockenfutterdosierung benötigst.

`;
  if (!text.includes("## Drei Offline-Bauarten direkt vergleichen")) {
    text = text.replace("## Methodik unserer Einordnung", extraSection + "## Methodik unserer Einordnung");
  }
  const faqBlock = `faq:
  - question: "Ist ein Futterautomat ohne WLAN ausfallsicherer?"
    answer: "Er hat weniger Netzwerkabhängigkeiten, kann aber weiterhin durch leere Batterien, falsche Uhrzeit oder mechanische Blockaden ausfallen. Ausfallsicherheit entsteht durch Tests, regelmäßige Kontrolle und eine passende Stromreserve."
  - question: "Kann ich einen App-Futterautomaten ohne WLAN verwenden?"
    answer: "Das hängt vom Modell ab. Manche Geräte benötigen WLAN nur für Einrichtung und Fernfunktionen, andere setzen ein Konto oder eine Verbindung voraus. Anleitung und Offline-Verhalten sollten vor dem Kauf geprüft werden."
  - question: "Welcher Futterautomat funktioniert vollständig ohne App?"
    answer: "Fachautomaten wie Cat Mate C500, Mikrochip-Näpfe wie SureFeed und lokal programmierbare Trockenfutterautomaten können ohne App arbeiten. Sie lösen jedoch unterschiedliche Aufgaben."
  - question: "Gibt es Futterautomaten ohne WLAN für Nassfutter?"
    answer: "Ja. Ein Fachautomat kann vorbereitete Nassfutterportionen zu festen Zeiten öffnen. Kühlung, Standzeit und Reinigung bleiben separat zu prüfen."
  - question: "Speichert ein Futterautomat ohne WLAN den Zeitplan bei Batteriewechsel?"
    answer: "Das ist modellabhängig. Nach jedem Batteriewechsel müssen Uhr, Datum und gespeicherte Mahlzeiten kontrolliert werden."
  - question: "Ist ein Offline-Futterautomat datenschutzfreundlicher?"
    answer: "Ein vollständig lokales Gerät überträgt keine App-, Kamera- oder Nutzungsdaten an eine Cloud. Kauf- und Garantiedaten können dennoch beim Händler oder Hersteller anfallen."
`;
  text = replaceRegex(text, /faq:\n[\s\S]*?\ncontentPlatform:/, `${faqBlock}\ncontentPlatform:`, "Offline-FAQ");
  stage(files.offline, text);
}

// 3) Kamera-Ratgeber klar vom Produktvergleich trennen
{
  let text = read(files.camera);
  text = scalar(text, "seoTitle", "Futterautomat mit Kamera: sinnvoll oder unnötig?");
  text = scalar(text, "seoDescription", "Futterautomat mit Kamera einordnen: Was Livebild wirklich zeigt, welche Grenzen Video hat und welche Modelle sich im direkten Vergleich unterscheiden.");
  text = scalar(text, "updatedAt", "2026-07-25");
  text = text.replace(
    /comparisonHref:\s*\/vergleiche\/beste-futterautomaten\/?/g,
    "comparisonHref: /vergleiche/beste-futterautomaten-mit-kamera/"
  );
  text = text.replace(
    /^\s*secondaryHref:.*$/m,
    '  secondaryHref: "/vergleiche/beste-futterautomaten-mit-kamera/"'
  );
  text = text.replace(
    /^\s*secondaryLabel:.*$/m,
    '  secondaryLabel: "Kamera-Modelle direkt vergleichen"'
  );
  text = ensureCardCta(
    text,
    "Eine Kamera lohnt sich nur mit klarem Kontrollbedarf",
    "/vergleiche/beste-futterautomaten-mit-kamera/",
    "Kamera-Modelle vergleichen",
    "Kamera-Antwort-CTA"
  );
  const section = `
## Ratgeber oder Produktvergleich?

Diese Seite beantwortet, **ob** eine Kamera für deinen Alltag sinnvoll ist und welche Grenzen Livebild, Audio und Ereignisclips haben. Der separate [Vergleich der besten Futterautomaten mit Kamera](/vergleiche/beste-futterautomaten-mit-kamera/) beantwortet, **welches konkrete Modell** zu deinen Anforderungen passt.

So vermeiden beide Seiten dieselbe Suchintention: erst den Nutzen klären, danach Produkte vergleichen.

`;
  if (!text.includes("## Ratgeber oder Produktvergleich?")) {
    text = text.replace("## Zwei unterschiedliche Produktkonzepte", section + "## Zwei unterschiedliche Produktkonzepte");
  }
  stage(files.camera, text);
}

// 4) PETLIBRO als Marken-Hub stärken
{
  const original = read(files.petlibro);
  const { fm } = splitFrontmatter(original);
  let nextFm = scalar(fm, "updatedAt", "2026-07-25");
  nextFm = nextFm.replace(
    /(\nseo:\n\s+title:)\s*"[^"]*"/,
    '$1 "PETLIBRO Erfahrungen 2026: Modelle, App und Unterschiede"'
  );
  nextFm = nextFm.replace(
    /(\nseo:\n[\s\S]*?\n\s+description:)\s*"[^"]*"/,
    '$1 "PETLIBRO Futterautomaten und Trinkbrunnen: Granary, Polar, One RFID, Space und Dockstream nach App, Kamera, Kühlung, Zugang und Folgekosten."'
  );
  const body = `PETLIBRO gehört zu den breitesten Marken für smarte Fütterung und Trinktechnik. Genau diese Vielfalt ist Stärke und Risiko zugleich: Granary, Air, Polar, One RFID, Space und Dockstream lösen unterschiedliche Aufgaben und sollten nicht nur nach App oder Design verglichen werden.

## Welche PETLIBRO-Serie passt?

| Serie | Hauptaufgabe | Typische Grenze |
|---|---|---|
| Granary | Trockenfutter mit App oder Kamera | keine individuelle Tiertrennung |
| Air | kompakte Trockenfutterautomaten | weniger Spezialfunktionen |
| Polar | aktiv gekühltes Nassfutter | nur drei Mahlzeiten und Netzabhängigkeit der Kühlung |
| One RFID | geschützter Futterzugang | Halsband-Tag statt implantiertem Mikrochip |
| Space | großer, geschützter Trockenfuttervorrat | groß und stärker apporientiert |
| Dockstream | Trinkbrunnen mit Kabel, Akku, App oder RFID | Varianten und Filter sind nicht beliebig kompatibel |

## Unsere wichtigsten PETLIBRO-Modelle

- [PETLIBRO Granary WiFi](/produkt/petlibro-granary-wifi-feeder/) für flexible Trockenfutter-Zeitpläne,
- [PETLIBRO Granary Camera](/produkt/petlibro-granary-camera-feeder/) für zusätzliche Sichtkontrolle,
- [PETLIBRO Polar](/produkt/petlibro-polar-wet-food-feeder/) für aktiv gekühltes Nassfutter,
- [PETLIBRO One RFID](/produkt/petlibro-one-rfid-smart-feeder/) für getrennte Rationen,
- [PETLIBRO Space](/produkt/petlibro-space-smart-feeder/) für großen Vorrat,
- [PETLIBRO Dockstream 2 Smart](/produkt/petlibro-dockstream-2-smart/) für App-gestützte Wasserüberwachung.

## App, Cloud und Abo trennen

Nicht jedes PETLIBRO-Gerät benötigt dieselben Onlinedienste. Zeitpläne, Livebild, Cloud-Aufzeichnung, AI-Auswertung und Verbrauchsmaterial-Abos sind getrennte Funktionen. Vor dem Kauf sollte deshalb nicht nur „mit App“ geprüft werden, sondern:

- welche Grundfunktion ohne Abo erhalten bleibt,
- ob gespeicherte Pläne offline weiterlaufen,
- welche Videoaufzeichnung lokal oder nur in der Cloud möglich ist,
- welche Filter oder Trockenmittel regelmäßig nachgekauft werden müssen.

## Stärken und Grenzen der Marke

PETLIBRO ist besonders stark bei Speziallösungen, die viele Wettbewerber nicht abdecken: aktive Nassfutterkühlung, Kamera-Feeder, RFID-Zugang und smarte Trinkbrunnen.

Die Grenzen liegen in der Modellvielfalt, teils ähnlichen Produktnamen und modellgebundenem Zubehör. Eine gute PETLIBRO-Kaufentscheidung beginnt deshalb bei der Aufgabe und nicht bei der Produktserie.

## Passende Vergleiche

- [Futterautomaten für Katzen vergleichen](/vergleiche/beste-futterautomaten-fuer-katzen/)
- [Futterautomaten für Hunde vergleichen](/vergleiche/beste-futterautomaten-fuer-hunde/)
- [Nassfutterautomaten vergleichen](/vergleiche/beste-futterautomaten-fuer-nassfutter/)
- [Futterautomaten mit Kamera vergleichen](/vergleiche/beste-futterautomaten-mit-kamera/)
- [Trinkbrunnen für Hunde vergleichen](/vergleiche/beste-trinkbrunnen-fuer-hunde/)
- [Trinkbrunnen für Katzen vergleichen](/vergleiche/beste-trinkbrunnen-fuer-katzen/)

## Methodik

Die Herstellerseite fasst offizielle PETLIBRO-Unterlagen und die strukturierten PfotenTechnik-Produktdaten zusammen. Sie ist kein pauschaler Langzeittest der gesamten Marke. Unterschiede zwischen Modellgenerationen, regionalen Produktseiten und Zubehörvarianten werden nicht verallgemeinert.`;
  stage(files.petlibro, joinFrontmatter(nextFm, body));
}

// 5) Hub-Ankertexte und Offline-Einstieg
{
  let text = read(files.hub);
  text = text.replace('cta: "Kamera-Modelle ansehen"', 'cta: "Kamera-Ratgeber lesen"');
  text = text.replace('cta: "Lösungen vergleichen"', 'cta: "Mehrkatzen-Ratgeber lesen"');
  text = ensureCardCta(
    text,
    "Zeitplan statt Fernfütterung",
    "/futterautomat-ohne-wlan/",
    "Offline-Lösungen einordnen",
    "Hub-Offline-Link"
  );
  text = scalar(text, "updatedAt", "2026-07-25");
  stage(files.hub, text);
}

// 6) Zwei-Katzen-Seite: nur Datums-/Hub-Verstärkung, Inhalt bleibt stabil
{
  let text = read(files.twoCats);
  if (!text.includes("/vergleiche/beste-futterautomaten-fuer-zwei-katzen/")) {
    throw new Error("Zwei-Katzen-Seite verweist nicht auf die spezialisierte Comparison.");
  }
  text = scalar(text, "updatedAt", "2026-07-25");
  stage(files.twoCats, text);
}

// 7) Product-/Review-JSON-LD mit sichtbarer 100er-Skala und Pros/Cons
{
  let text = read(files.renderer);
  const start = "const productSchema = {";
  const end = "const productSearchValues = [";
  const schema = `const toReviewItemList = (items = []) => ({
  "@type": "ItemList",
  itemListElement: items
    .filter(Boolean)
    .slice(0, 5)
    .map((name, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name
    }))
});

const structuredReviewBody =
  contentProduct.review?.verdict ??
  contentProduct.review?.summary ??
  contentProduct.recommendation;

const productSchema = {
  "@context": "https://schema.org",
  "@type": "Product",
  name: contentProduct.title,
  description: seoDescription,
  url: new URL(canonical, site.domain).toString(),
  image: [
    new URL(optimizedOgImage.src, site.domain).toString()
  ],
  sku: contentProduct.slug,
  category: contentProduct.category.label,
  brand: {
    "@type": "Brand",
    name: contentProduct.manufacturer.name
  },
  review: {
    "@type": "Review",
    name: \`\${contentProduct.title} – redaktionelle Einordnung\`,
    reviewBody: structuredReviewBody,
    datePublished: publishedAt,
    author: {
      "@type": "Organization",
      name: author.name
    },
    publisher: {
      "@type": "Organization",
      name: "PfotenTechnik"
    },
    reviewRating: {
      "@type": "Rating",
      ratingValue: productScore100,
      bestRating: 100,
      worstRating: 0
    },
    ...(contentProduct.strengths?.length
      ? { positiveNotes: toReviewItemList(contentProduct.strengths) }
      : {}),
    ...(contentProduct.weaknesses?.length
      ? { negativeNotes: toReviewItemList(contentProduct.weaknesses) }
      : {})
  }
};

`;
  text = replaceBetween(text, start, end, schema, "Product-Schema");
  stage(files.renderer, text);
}

// 8) Dauerhaftes Audit
const auditSource = `#!/usr/bin/env node
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
  console.log(\`\${entry.ok ? "OK" : "FEHLER"}  \${entry.name}\${entry.detail ? \` (\${entry.detail})\` : ""}\`);
}
if (failed.length) {
  console.error(\`\\n\${failed.length} Prüfung(en) fehlgeschlagen.\`);
  process.exit(1);
}
console.log("\\nWoche-2-SEO-Audit erfolgreich.");
`;
if (fs.existsSync(files.audit)) {
  stage(files.audit, auditSource);
} else {
  changed.set(files.audit, { old: null, next: auditSource });
}

// Vorprüfung
console.log(`[${PATCH}] Repository: ${root}`);
console.log(`[${PATCH}] Geplante Änderungen: ${changed.size}`);

if (CHECK) {
  for (const file of changed.keys()) console.log(`ÄNDERN: ${rel(file)}`);
  console.log(`[${PATCH}] Vorprüfung erfolgreich. Es wurde nichts verändert.`);
  process.exit(0);
}

const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replaceAll(":", "-")}`
);

try {
  for (const [file, state] of changed) {
    if (state.old !== null) {
      const backup = path.join(backupRoot, rel(file));
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.writeFileSync(backup, state.old, "utf8");
    }
  }

  for (const [file, state] of changed) {
    fs.mkdirSync(path.dirname(file), { recursive: true });
    fs.writeFileSync(file, state.next, "utf8");
    console.log(`GEÄNDERT: ${rel(file)}`);
  }

  const auditUrl = pathToFileURL(files.audit).href;
  await import(`${auditUrl}?t=${Date.now()}`);
  console.log(`[${PATCH}] Erfolgreich angewendet.`);
  console.log(`[${PATCH}] Backup: ${backupRoot}`);
  console.log("Nächster Schritt: npm run build:pfotentechnik");
} catch (error) {
  console.error(`[${PATCH}] Fehler: ${error.message}`);
  for (const [file, state] of changed) {
    if (state.old === null) {
      if (fs.existsSync(file)) fs.unlinkSync(file);
    } else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, state.old, "utf8");
    }
  }
  console.error(`[${PATCH}] Alle Änderungen wurden zurückgesetzt.`);
  process.exit(1);
}

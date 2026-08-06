#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const PATCH = "pfotentechnik-manufacturer-hero-layout-30.0.2";
const root = process.cwd();
const target = path.join(
  root,
  "apps",
  "pfotentechnik",
  "src",
  "pages",
  "hersteller",
  "[manufacturer].astro"
);

function fail(message) {
  throw new Error(`[${PATCH}] ${message}`);
}

function removeMarkedBlock(source, startMarker, endMarker) {
  let result = source;

  while (true) {
    const start = result.indexOf(startMarker);
    if (start === -1) return result;

    const styleStart = result.lastIndexOf("<style", start);
    const end = result.indexOf(endMarker, start);
    if (styleStart === -1 || end === -1) {
      fail(`Unvollständiger CSS-Block: ${startMarker}`);
    }

    const styleEnd = result.indexOf("</style>", end);
    if (styleEnd === -1) {
      fail(`Schließendes </style> fehlt für: ${startMarker}`);
    }

    result =
      result.slice(0, styleStart) +
      result.slice(styleEnd + "</style>".length);
  }
}

if (!fs.existsSync(target)) {
  fail(`Erwartete Datei fehlt: ${path.relative(root, target)}`);
}

const original = fs.readFileSync(target, "utf8");
let source = original;

if (
  source.includes(`/* ${PATCH} */`) &&
  source.includes('class="manufacturer-hero__intro"') &&
  source.includes('class="manufacturer-hero__details"')
) {
  console.log(`[${PATCH}] Bereits aktuell: ${path.relative(root, target)}`);
  process.exit(0);
}

const heroOpen = '<header class="manufacturer-hero">';
const heroStart = source.indexOf(heroOpen);

if (heroStart === -1) {
  fail('Hersteller-Hero wurde nicht gefunden.');
}

const heroContentStart = heroStart + heroOpen.length;
const heroEnd = source.indexOf("</header>", heroContentStart);

if (heroEnd === -1) {
  fail('Schließendes </header> des Hersteller-Heros wurde nicht gefunden.');
}

const canonicalHero = `
    <header class="manufacturer-hero">
      <div class="manufacturer-hero__intro">
        <span>Unsere Einschätzung</span>
        <h1>{manufacturer.name}</h1>
      </div>

      <div class="manufacturer-hero__media">
        <OptimizedImage
          src={manufacturer.images.hero.src}
          alt={manufacturer.images.hero.alt ?? manufacturer.name}
          layout="full-width"
          priority
        />
      </div>

      <div class="manufacturer-hero__details">
        <p class="recommendation">{manufacturer.recommendation}</p>
        <p>{manufacturer.summary}</p>

        {manufacturer.rating && (
          <div class="rating">
            <strong>{toEditorialScore(manufacturer.rating, 5)}</strong>
            <span>Redaktionelle Herstellerbewertung</span>
          </div>
        )}

        {manufacturer.website && (
          <a class="website" href={manufacturer.website} rel="noopener noreferrer" target="_blank">
            Herstellerwebsite <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>
    </header>`;

source =
  source.slice(0, heroStart) +
  canonicalHero +
  source.slice(heroEnd + "</header>".length);

const markedBlocks = [
  ["/* PT manufacturer hero media 4.2.0 */", "/* End PT manufacturer hero media 4.2.0 */"],
  ["/* PT manufacturer media and score 4.3.0 */", "/* End PT manufacturer media and score 4.3.0 */"],
  ["/* pfotentechnik-manufacturer-hero-layout-30.0.0 */", "/* End pfotentechnik-manufacturer-hero-layout-30.0.0 */"],
  ["/* pfotentechnik-manufacturer-hero-layout-30.0.1 */", "/* End pfotentechnik-manufacturer-hero-layout-30.0.1 */"]
];

for (const [start, end] of markedBlocks) {
  source = removeMarkedBlock(source, start, end);
}

const css = `
<style is:global>
/* ${PATCH} */
.manufacturer-detail {
  display: grid;
  gap: clamp(1.5rem, 4vw, 3rem);
  min-width: 0;
}

.manufacturer-hero {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(18rem, 42%);
  grid-template-areas:
    "intro media"
    "details media";
  align-items: center;
  gap: 1rem clamp(1.5rem, 4vw, 3rem);
  min-width: 0;
  padding: clamp(1.5rem, 4vw, 3rem);
  overflow: hidden;
  border: 1px solid var(--pt-color-border);
  border-radius: clamp(1.25rem, 3vw, 2rem);
  background: var(--pt-color-surface);
}

.manufacturer-hero__intro {
  grid-area: intro;
  display: grid;
  align-self: end;
  gap: .75rem;
  min-width: 0;
}

.manufacturer-hero__details {
  grid-area: details;
  display: grid;
  align-self: start;
  gap: 1rem;
  min-width: 0;
}

.manufacturer-hero__intro > span {
  color: var(--pt-color-primary);
  font-size: .875rem;
  font-weight: 800;
  letter-spacing: .09em;
  line-height: 1.3;
  text-transform: uppercase;
}

.manufacturer-hero h1 {
  margin: 0;
  max-width: 12ch;
  color: var(--pt-color-text);
  font-size: clamp(2.75rem, 7vw, 5.5rem);
  line-height: .95;
  overflow-wrap: anywhere;
}

.manufacturer-hero p {
  margin: 0;
  max-width: 58ch;
  color: var(--pt-color-text-muted);
  font-size: clamp(1rem, 1.8vw, 1.125rem);
  line-height: 1.65;
}

.manufacturer-hero .recommendation {
  color: var(--pt-color-text);
  font-weight: 700;
}

.manufacturer-hero .rating {
  display: flex;
  align-items: center;
  gap: .75rem;
  width: fit-content;
  max-width: 100%;
}

.manufacturer-hero .rating strong {
  font-size: 1.5rem;
  line-height: 1;
}

.manufacturer-hero .rating span {
  color: var(--pt-color-text-muted);
  font-size: .875rem;
}

.manufacturer-hero .website {
  width: fit-content;
  color: var(--pt-color-primary);
  font-weight: 800;
  text-decoration: none;
}

.manufacturer-hero .website:hover {
  text-decoration: underline;
  text-underline-offset: .2em;
}

.manufacturer-hero__media {
  grid-area: media;
  display: grid;
  place-items: center;
  align-self: stretch;
  width: 100%;
  min-width: 0;
  min-height: 24rem;
  overflow: hidden;
  border-radius: 1.25rem;
  background: var(--pt-color-surface-subtle, #f7f8fa);
}

.manufacturer-hero__media > *,
.manufacturer-hero__media picture {
  display: grid;
  place-items: center;
  width: 100%;
  height: 100%;
  min-width: 0;
}

.manufacturer-hero__media picture {
  padding: clamp(.75rem, 2vw, 1.5rem);
}

.manufacturer-hero__media img {
  display: block;
  width: 100%;
  height: 100%;
  max-height: 34rem;
  margin: 0;
  object-fit: contain;
  object-position: center;
  transform: none;
}

@media (max-width: 820px) {
  .manufacturer-hero {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    grid-template-areas:
      "intro"
      "media"
      "details";
    align-items: start;
    gap: 1.25rem;
    padding: clamp(1.25rem, 5vw, 1.75rem);
  }

  .manufacturer-hero__intro,
  .manufacturer-hero__details,
  .manufacturer-hero__media {
    width: 100%;
    max-width: none;
  }

  .manufacturer-hero h1 {
    max-width: none;
    font-size: clamp(2.6rem, 13vw, 4.25rem);
    line-height: .98;
    overflow-wrap: normal;
    word-break: normal;
  }

  .manufacturer-hero__media {
    min-height: 0;
    aspect-ratio: 4 / 3;
  }

  .manufacturer-hero__media picture {
    min-height: 0;
    padding: .75rem;
  }

  .manufacturer-hero__media img {
    max-height: none;
  }
}

@media (max-width: 480px) {
  .manufacturer-hero {
    border-radius: 1.5rem;
  }

  .manufacturer-hero__media {
    aspect-ratio: 1 / 1;
  }
}
/* End ${PATCH} */
</style>
`;

const projectLayoutEnd = source.lastIndexOf("</ProjectLayout>");
if (projectLayoutEnd === -1) {
  fail("Schließendes </ProjectLayout> fehlt.");
}

source =
  source.slice(0, projectLayoutEnd).trimEnd() +
  "\n\n" +
  css.trim() +
  "\n" +
  source.slice(projectLayoutEnd);

const required = [
  'class="manufacturer-hero__intro"',
  'class="manufacturer-hero__media"',
  'class="manufacturer-hero__details"',
  `/* ${PATCH} */`,
  "<script is:inline>"
];

for (const token of required) {
  if (!source.includes(token)) {
    fail(`Ergebnisvalidierung fehlgeschlagen: ${token}`);
  }
}

for (const [start] of markedBlocks) {
  if (source.includes(start)) {
    fail(`Legacy-Block blieb erhalten: ${start}`);
  }
}

const backupRoot = path.join(
  root,
  ".patch-backups",
  `${PATCH}-${new Date().toISOString().replace(/[:.]/g, "-")}`
);
const backup = path.join(backupRoot, path.relative(root, target));

fs.mkdirSync(path.dirname(backup), { recursive: true });
fs.copyFileSync(target, backup);
fs.writeFileSync(target, source, "utf8");

console.log(`[${PATCH}] Backup: ${path.relative(root, backup)}`);
console.log(`[${PATCH}] Geändert: ${path.relative(root, target)}`);
console.log(`[${PATCH}] Mobile Reihenfolge: Überschrift, Bild, Beschreibung.`);
console.log(`[${PATCH}] Bildfläche ist wieder sichtbar und nimmt die volle Kartenbreite ein.`);

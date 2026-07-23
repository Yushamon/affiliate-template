#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

const repo = process.cwd();
const app = path.join(repo, "apps", "pfotentechnik");
const renderer = path.join(
  app,
  "src",
  "components",
  "product-standard-2",
  "ProductRenderer.astro"
);
const route = path.join(
  app,
  "src",
  "pages",
  "produkt",
  "[product].astro"
);
const oldEnhancer = path.join(
  app,
  "src",
  "components",
  "ProductQuickFactsEnhancer.astro"
);
const backupRoot = path.join(
  repo,
  ".patch-backups",
  `quick-facts-framework-3.0-${Date.now()}`
);
const changed = [];

if (!fs.existsSync(path.join(app, "package.json"))) {
  console.error("Bitte im Root von Yushamon/affiliate-template ausführen.");
  process.exit(1);
}

if (!fs.existsSync(renderer)) {
  console.error("ProductRenderer.astro wurde nicht gefunden: " + renderer);
  process.exit(1);
}

function backup(target) {
  const rel = path.relative(repo, target);
  const destination = path.join(backupRoot, rel);
  if (fs.existsSync(target)) {
    fs.mkdirSync(path.dirname(destination), { recursive: true });
    fs.copyFileSync(target, destination);
    return destination;
  }
  return null;
}

function write(target, content) {
  const saved = backup(target);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, content);
  changed.push({ target, saved });
}

function remove(target) {
  if (!fs.existsSync(target)) return;
  const saved = backup(target);
  fs.rmSync(target, { force: true });
  changed.push({ target, saved });
}

function rollback() {
  for (const item of changed.reverse()) {
    if (item.saved && fs.existsSync(item.saved)) {
      fs.mkdirSync(path.dirname(item.target), { recursive: true });
      fs.copyFileSync(item.saved, item.target);
    } else if (fs.existsSync(item.target)) {
      fs.rmSync(item.target, { force: true });
    }
  }
}

function replaceOnce(text, oldValue, newValue, label) {
  if (!text.includes(oldValue)) {
    throw new Error(`Patch-Anker nicht gefunden: ${label}`);
  }
  return text.replace(oldValue, newValue);
}

try {
  let text = fs.readFileSync(renderer, "utf8");

  const quickFactsEnd = `).filter(Boolean).filter((fact: any) => fact.label && fact.value).slice(0, 8);

const review = value.review ?? source.review ?? {};`;

  const quickFactsReplacement = `).filter(Boolean).filter((fact: any) => fact.label && fact.value).slice(0, 10);

const normalizedFactLabel = (label: unknown) =>
  asText(label)
    .toLocaleLowerCase("de-DE")
    .replace(/[-_]/g, " ")
    .replace(/\\s+/g, " ")
    .trim();

const primaryFactLabels = new Set([
  "geeignet für",
  "einsatz",
  "kapazität"
]);

const factIconName = (label: unknown) => {
  const normalized = normalizedFactLabel(label);

  if (normalized.includes("geeignet")) return "users";
  if (normalized.includes("einsatz")) return "home";
  if (normalized.includes("kapazität") || normalized.includes("volumen")) return "capacity";
  if (normalized.includes("modell")) return "cube";
  if (normalized.includes("futterart")) return "bowl";
  if (normalized.includes("kroketten")) return "kibble";
  if (normalized.includes("portionseinheit")) return "portion";
  if (normalized.includes("portionszahl") || normalized.includes("mahlzeit")) return "calendar";
  if (normalized.includes("portionsgewicht") || normalized.includes("gewicht")) return "weight";
  if (normalized.includes("app") || normalized.includes("steuerung")) return "phone";
  if (normalized.includes("strom") || normalized.includes("akku")) return "power";
  if (normalized.includes("kamera")) return "camera";
  if (normalized.includes("wlan") || normalized.includes("wifi")) return "wifi";

  return "diamond";
};

const primaryQuickFacts = quickFacts.filter((fact: any) =>
  primaryFactLabels.has(normalizedFactLabel(fact.label))
);

const secondaryQuickFacts = quickFacts.filter((fact: any) =>
  !primaryFactLabels.has(normalizedFactLabel(fact.label))
);

const review = value.review ?? source.review ?? {};`;

  text = replaceOnce(
    text,
    quickFactsEnd,
    quickFactsReplacement,
    "Quick-Facts-Datenmodell"
  );

  const oldMarkup = `  {quickFacts.length > 0 && (
    <section class="native-panel native-quickfacts" aria-labelledby="native-quickfacts-title">
      <h2 id="native-quickfacts-title">Das Wichtigste in Kürze</h2>
      <div class="native-quickfacts__grid">
        {quickFacts.map((fact: any) => (
          <article>
            <span class="native-quickfacts__icon" aria-hidden="true">◆</span>
            <div>
              <small>{fact.label}</small>
              <strong>{fact.value}</strong>
              {fact.note && <span>{fact.note}</span>}
            </div>
          </article>
        ))}
      </div>
    </section>
  )}`;

  const iconMarkup = `{factIconName(fact.label) === "users" && (
                    <svg viewBox="0 0 24 24"><path d="M8.5 11.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Zm7 0a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM2.5 20c0-3.1 2.7-5.5 6-5.5s6 2.4 6 5.5m0 0c0-2.5 2.1-4.5 4.8-4.5 1 0 1.8.2 2.7.7"/></svg>
                  )}
                  {factIconName(fact.label) === "home" && (
                    <svg viewBox="0 0 24 24"><path d="M4 10.5 12 4l8 6.5V20H4v-9.5Zm5 9.5v-6h6v6"/></svg>
                  )}
                  {factIconName(fact.label) === "capacity" && (
                    <svg viewBox="0 0 24 24"><path d="M7 4h10l1 4v11H6V8l1-4Zm-1 4h12M9 4V2h6v2"/></svg>
                  )}
                  {factIconName(fact.label) === "cube" && (
                    <svg viewBox="0 0 24 24"><path d="m12 3 8 4.5v9L12 21l-8-4.5v-9L12 3Zm0 0v18m8-13.5-8 4.5-8-4.5"/></svg>
                  )}
                  {factIconName(fact.label) === "bowl" && (
                    <svg viewBox="0 0 24 24"><path d="M4 15c0 3 3.6 5 8 5s8-2 8-5H4Zm1-3h14l1 3H4l1-3Zm4-3c0-1 .8-2 1.8-2 .8 0 1.2.4 1.7 1 .5-.8 1.1-1.5 2.2-1.5 1.3 0 2.3 1 2.3 2.5"/></svg>
                  )}
                  {factIconName(fact.label) === "kibble" && (
                    <svg viewBox="0 0 24 24"><circle cx="7" cy="7" r="2"/><circle cx="15.5" cy="6.5" r="1.5"/><circle cx="11.5" cy="13" r="2.5"/><circle cx="18" cy="16.5" r="2"/><circle cx="5" cy="17" r="1.5"/></svg>
                  )}
                  {factIconName(fact.label) === "portion" && (
                    <svg viewBox="0 0 24 24"><path d="M5 4h11l2 5-2 11H7L5 4Zm11 2h3v5h-2M8 8h6M9 12h4"/></svg>
                  )}
                  {factIconName(fact.label) === "calendar" && (
                    <svg viewBox="0 0 24 24"><path d="M6 5h12v15H6V5Zm3-2v4m6-4v4M6 9h12M9 13h2m2 0h2m-6 3h2m2 0h2"/></svg>
                  )}
                  {factIconName(fact.label) === "weight" && (
                    <svg viewBox="0 0 24 24"><path d="M6 20h12L16.5 9h-9L6 20Zm3-11a3 3 0 0 1 6 0m-5 5h4"/></svg>
                  )}
                  {factIconName(fact.label) === "phone" && (
                    <svg viewBox="0 0 24 24"><path d="M7 3h10v18H7V3Zm3 3h4m-3 12h2"/></svg>
                  )}
                  {factIconName(fact.label) === "power" && (
                    <svg viewBox="0 0 24 24"><path d="M13 2 5 14h6l-1 8 9-13h-6V2Z"/></svg>
                  )}
                  {factIconName(fact.label) === "camera" && (
                    <svg viewBox="0 0 24 24"><path d="M4 7h4l1.5-2h5L16 7h4v12H4V7Zm8 9a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"/></svg>
                  )}
                  {factIconName(fact.label) === "wifi" && (
                    <svg viewBox="0 0 24 24"><path d="M4 9a12 12 0 0 1 16 0M7 12.5a7.5 7.5 0 0 1 10 0M10 16a3 3 0 0 1 4 0M12 20h.01"/></svg>
                  )}
                  {factIconName(fact.label) === "diamond" && (
                    <svg viewBox="0 0 24 24"><path d="m12 4 8 8-8 8-8-8 8-8Z"/></svg>
                  )}`;

  const newMarkup = `  {quickFacts.length > 0 && (
    <section class="native-panel native-quickfacts" aria-labelledby="native-quickfacts-title">
      <header class="native-quickfacts__header">
        <div>
          <span>Produktüberblick</span>
          <h2 id="native-quickfacts-title">Das Wichtigste in Kürze</h2>
        </div>
        <p>Die wichtigsten Angaben auf einen Blick – vollständig und ohne abgeschnittene Inhalte.</p>
      </header>

      {primaryQuickFacts.length > 0 && (
        <div class="native-quickfacts__primary">
          {primaryQuickFacts.map((fact: any) => (
            <article class="native-quickfacts__card native-quickfacts__card--primary">
              <span class="native-quickfacts__icon" aria-hidden="true">
                ${iconMarkup}
              </span>
              <div>
                <small>{fact.label}</small>
                <strong>{fact.value}</strong>
                {fact.note && <span>{fact.note}</span>}
              </div>
            </article>
          ))}
        </div>
      )}

      {secondaryQuickFacts.length > 0 && (
        <div class="native-quickfacts__secondary">
          {secondaryQuickFacts.map((fact: any) => (
            <article class="native-quickfacts__card">
              <span class="native-quickfacts__icon" aria-hidden="true">
                ${iconMarkup}
              </span>
              <div>
                <small>{fact.label}</small>
                <strong>{fact.value}</strong>
                {fact.note && <span>{fact.note}</span>}
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  )}`;

  text = replaceOnce(
    text,
    oldMarkup,
    newMarkup,
    "Quick-Facts-Markup"
  );

  const cssStart = `  .native-quickfacts__grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
    gap: 12px;
  }

  .native-quickfacts article {
    display: grid;
    grid-template-columns: 42px minmax(0, 1fr);
    gap: 12px;
    min-width: 0;
    padding: 16px;
    border: 1px solid var(--np-border);
    border-radius: 15px;
    background: var(--np-surface-soft);
  }

  .native-quickfacts__icon {
    display: grid;
    place-items: center;
    width: 42px;
    height: 42px;
    border-radius: 12px;
    background: var(--np-positive-soft);
    color: var(--np-positive);
    font-size: 0.75rem;
  }

  .native-quickfacts article div {
    min-width: 0;
  }

  .native-quickfacts small,
  .native-quickfacts span {
    display: block;
    color: var(--np-muted);
  }

  .native-quickfacts strong {
    display: block;
    margin-top: 4px;
    overflow-wrap: anywhere;
  }`;

  const cssReplacement = `  .native-quickfacts {
    overflow: hidden;
  }

  .native-quickfacts__header {
    display: flex;
    align-items: end;
    justify-content: space-between;
    gap: 24px;
    margin-bottom: 18px;
  }

  .native-quickfacts__header > div > span {
    display: block;
    margin-bottom: 5px;
    color: var(--np-positive);
    font-size: 0.76rem;
    font-weight: 800;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .native-quickfacts__header h2 {
    margin: 0;
  }

  .native-quickfacts__header p {
    max-width: 42rem;
    margin: 0;
    color: var(--np-muted);
    font-size: 0.92rem;
    line-height: 1.55;
  }

  .native-quickfacts__primary,
  .native-quickfacts__secondary {
    display: grid;
    gap: 12px;
  }

  .native-quickfacts__primary {
    grid-template-columns: repeat(3, minmax(0, 1fr));
    margin-bottom: 12px;
  }

  .native-quickfacts__secondary {
    grid-template-columns: repeat(auto-fit, minmax(210px, 1fr));
  }

  .native-quickfacts__card {
    display: grid;
    grid-template-columns: 44px minmax(0, 1fr);
    align-items: start;
    gap: 12px;
    min-width: 0;
    min-height: 118px;
    padding: 16px;
    border: 1px solid var(--np-border);
    border-radius: 15px;
    background: var(--np-surface-soft);
  }

  .native-quickfacts__card--primary {
    min-height: 142px;
    border-color: color-mix(in srgb, var(--np-positive) 24%, var(--np-border));
    background:
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--np-positive) 7%, var(--np-surface)),
        var(--np-surface)
      );
  }

  .native-quickfacts__icon {
    display: grid;
    place-items: center;
    width: 44px;
    height: 44px;
    border-radius: 13px;
    background: var(--np-positive-soft);
    color: var(--np-positive);
  }

  .native-quickfacts__icon svg {
    width: 23px;
    height: 23px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .native-quickfacts__card > div {
    min-width: 0;
  }

  .native-quickfacts__card small,
  .native-quickfacts__card span {
    display: block;
    color: var(--np-muted);
  }

  .native-quickfacts__card strong {
    display: block;
    margin-top: 5px;
    color: var(--np-text);
    line-height: 1.42;
    overflow: visible;
    overflow-wrap: anywhere;
    text-overflow: clip;
    white-space: normal;
  }

  .native-quickfacts__card > div > span {
    margin-top: 6px;
    font-size: 0.84rem;
    line-height: 1.45;
  }`;

  text = replaceOnce(
    text,
    cssStart,
    cssReplacement,
    "Quick-Facts-CSS"
  );

  // Alte responsive Quick-Facts-Regeln durch Framework-Regeln ersetzen.
  text = text.replace(
    /@media \(max-width: 980px\) \{([\s\S]*?)\n  \}/g,
    (block) => {
      if (!block.includes(".native-quickfacts__grid")) return block;
      return block
        .replace(
          /\.native-quickfacts__grid\s*\{[\s\S]*?\}/,
          `.native-quickfacts__primary {
      grid-template-columns: 1fr;
    }

    .native-quickfacts__secondary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }

    .native-quickfacts__card--primary {
      min-height: 0;
    }`
        );
    }
  );

  text = text.replace(
    /@media \(max-width: 640px\) \{([\s\S]*?)\n  \}/g,
    (block) => {
      if (!block.includes(".native-quickfacts__grid")) return block;
      return block
        .replace(
          /\.native-quickfacts__grid\s*\{[\s\S]*?\}/,
          `.native-quickfacts__header {
      display: block;
    }

    .native-quickfacts__header p {
      margin-top: 8px;
    }

    .native-quickfacts__primary,
    .native-quickfacts__secondary {
      grid-template-columns: 1fr;
    }

    .native-quickfacts__card {
      min-height: 0;
      padding: 14px;
    }`
        );
    }
  );

  // Sicherheitsnetz: Falls alte Grid-Regeln in anderen Media Queries verbleiben.
  text = text.replaceAll(".native-quickfacts__grid", ".native-quickfacts__secondary");

  write(renderer, text);
  console.log("✓ ProductRenderer.astro nativ aktualisiert");

  // Alten DOM-Manipulations-Patch vollständig entfernen.
  if (fs.existsSync(route)) {
    let routeText = fs.readFileSync(route, "utf8");
    const originalRoute = routeText;

    routeText = routeText.replace(
      /import ProductQuickFactsEnhancer from "\.\.\/\.\.\/components\/ProductQuickFactsEnhancer\.astro";\r?\n/g,
      ""
    );
    routeText = routeText.replace(
      /\s*<ProductQuickFactsEnhancer[^>]*\/>\s*/g,
      "\n"
    );

    if (routeText !== originalRoute) {
      write(route, routeText);
      console.log("✓ alter QuickFactsEnhancer aus [product].astro entfernt");
    }
  }

  remove(oldEnhancer);
  console.log("✓ alter DOM-Enhancer entfernt");

  console.log("\nPrüfe Build …");
  const result = spawnSync("npm", ["run", "build:pfotentechnik"], {
    cwd: repo,
    stdio: "inherit",
    shell: process.platform === "win32"
  });

  if (result.status !== 0) {
    throw new Error("Build fehlgeschlagen");
  }

  console.log("\nQuick Facts Framework 3.0 installiert.");
  console.log("- native Astro-Ausgabe ohne DOM-Manipulation");
  console.log("- keine abgeschnittenen Inhalte");
  console.log("- Primärfakten getrennt von technischen Fakten");
  console.log("- adaptive Kartenhöhe und responsives Raster");
  console.log("- semantische SVG-Icons");
  console.log("- alter Warning-verursachender Enhancer entfernt");
  console.log(`Backup: ${backupRoot}`);
} catch (error) {
  console.error(`\n${error.message}. Rollback wird ausgeführt …`);
  rollback();
  process.exit(1);
}

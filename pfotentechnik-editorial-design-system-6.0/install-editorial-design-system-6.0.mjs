#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";

const root = process.cwd();

const rendererPath = path.join(
  root,
  "packages/affiliate-core/src/renderer/PremiumRenderer.astro"
);
const pagePath = path.join(
  root,
  "apps/pfotentechnik/src/pages/[slug].astro"
);
const cssPath = path.join(
  root,
  "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"
);
const manifestPath = path.join(root, ".editorial-design-system-6.0-manifest.json");

for (const file of [rendererPath, pagePath, cssPath]) {
  if (!fs.existsSync(file)) {
    console.error("Datei nicht gefunden:", file);
    console.error("Installer im Root von affiliate-template ausführen.");
    process.exit(1);
  }
}

const backupRoot = path.join(
  root,
  `.editorial-design-system-6.0-backup-${new Date().toISOString().replace(/[:.]/g, "-")}`
);

function backup(file) {
  const relative = path.relative(root, file);
  const target = path.join(backupRoot, relative);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(file, target);
}

[rendererPath, pagePath, cssPath].forEach(backup);

/* -----------------------------------------------------------
 * 1. Produktdaten um Bild erweitern
 * --------------------------------------------------------- */
let page = fs.readFileSync(pagePath, "utf8");

const premiumProductNeedle = `  rating: product.data.rating,
  highlights: product.data.strengths,
  tags: product.data.tags,`;

const premiumProductReplacement = `  rating: product.data.rating,
  highlights: product.data.strengths,
  tags: product.data.tags,
  image: {
    src:
      product.data.images.thumbnail?.src ??
      product.data.images.hero.src,
    alt:
      product.data.images.thumbnail?.alt ??
      product.data.images.hero.alt,
  },`;

if (!page.includes("product.data.images.thumbnail?.src")) {
  if (!page.includes(premiumProductNeedle)) {
    console.error("premiumProducts-Einfügepunkt in [slug].astro nicht gefunden.");
    process.exit(1);
  }
  page = page.replace(premiumProductNeedle, premiumProductReplacement);
}

fs.writeFileSync(pagePath, page, "utf8");

/* -----------------------------------------------------------
 * 2. PremiumRenderer strukturell aufwerten
 * --------------------------------------------------------- */
let renderer = fs.readFileSync(rendererPath, "utf8");

/* Typ um Bild ergänzen */
const typeNeedle = `  highlights: string[];
  tags: string[];
};`;

const typeReplacement = `  highlights: string[];
  tags: string[];
  image?: {
    src: any;
    alt: string;
  };
};`;

if (!renderer.includes("image?: {")) {
  if (!renderer.includes(typeNeedle)) {
    console.error("PremiumProduct-Typ konnte nicht erweitert werden.");
    process.exit(1);
  }
  renderer = renderer.replace(typeNeedle, typeReplacement);
}

/* Produktkarte ersetzen */
const productCardRegex = /\{hasProducts && \(\s*<div class="premium-v3-grid premium-v3-grid-products">[\s\S]*?<\/div>\s*\)\}/m;

const productCardReplacement = `{hasProducts && (
            <div class="premium-v3-grid premium-v3-grid-products">
              {filteredProducts.map((product) => {
                const score = Math.max(
                  0,
                  Math.min(
                    100,
                    Math.round(
                      product.rating <= 5
                        ? product.rating * 20
                        : product.rating
                    )
                  )
                );

                return (
                  <a
                    class="premium-v3-card premium-v3-product-card premium-v3-card-link"
                    href={product.productUrl}
                  >
                    {product.image && (
                      <figure class="premium-v3-product-media">
                        <OptimizedImage
                          src={product.image.src}
                          alt={product.image.alt}
                          width={560}
                          height={420}
                          layout="constrained"
                        />
                      </figure>
                    )}

                    <div class="premium-v3-product-content">
                      <div class="premium-v3-product-meta">
                        <span class="premium-v3-label">
                          {product.badge}
                        </span>

                        <div
                          class="premium-v3-score"
                          aria-label={\`Bewertung: \${score} von 100 Punkten\`}
                        >
                          <strong>{score}</strong>
                          <span>/100</span>
                        </div>
                      </div>

                      <h3>{product.name}</h3>

                      <p class="premium-v3-product-summary">
                        {product.recommendation}
                      </p>

                      <ul class="premium-v3-product-highlights">
                        {product.highlights.slice(0, 3).map((item) => (
                          <li>
                            <span>{stripLeadingIcon(item)}</span>
                          </li>
                        ))}
                      </ul>

                      <span class="premium-v3-product-cta">
                        Produktdetails ansehen
                      </span>
                    </div>
                  </a>
                );
              })}
            </div>
          )}`;

if (!renderer.includes("premium-v3-product-media")) {
  if (!productCardRegex.test(renderer)) {
    console.error("Produktkartenblock im PremiumRenderer nicht gefunden.");
    process.exit(1);
  }
  renderer = renderer.replace(productCardRegex, productCardReplacement);
}

/* Listeninhalte wrappen: verhindert Textknoten als eigene Grid-Items */
renderer = renderer.replace(
  /<li>\{stripLeadingIcon\(item\)\}<\/li>/g,
  `<li><span>{stripLeadingIcon(item)}</span></li>`
);

renderer = renderer.replace(
  /<li>\s*\{stripLeadingIcon\(item\)\}\s*<\/li>/g,
  `<li><span>{stripLeadingIcon(item)}</span></li>`
);

/* Blockliste mit mehrzeiligem JSX */
renderer = renderer.replace(
  `<li>{stripLeadingIcon(item)}</li>`,
  `<li><span>{stripLeadingIcon(item)}</span></li>`
);

fs.writeFileSync(rendererPath, renderer, "utf8");

/* -----------------------------------------------------------
 * 3. Finaler 6.0 Style direkt im Renderer
 * --------------------------------------------------------- */
renderer = fs.readFileSync(rendererPath, "utf8");

const styleStart = renderer.indexOf("<style>");
const styleEnd = renderer.lastIndexOf("</style>");

if (styleStart < 0 || styleEnd <= styleStart) {
  console.error("Styleblock im PremiumRenderer nicht gefunden.");
  process.exit(1);
}

const newStyle = fs.readFileSync(
  path.join(path.dirname(new URL(import.meta.url).pathname), "PremiumRenderer.6.0.style.txt"),
  "utf8"
).trim();

renderer =
  renderer.slice(0, styleStart).trimEnd() +
  "\n\n" +
  newStyle +
  "\n";

fs.writeFileSync(rendererPath, renderer, "utf8");

/* -----------------------------------------------------------
 * 4. Äußere Artikel-Schachtel gezielt entfernen
 * --------------------------------------------------------- */
let css = fs.readFileSync(cssPath, "utf8");
const cssPatch = fs.readFileSync(
  path.join(path.dirname(new URL(import.meta.url).pathname), "EditorialPage.6.0.css"),
  "utf8"
).trim();

const startMarker = "/* === PfotenTechnik Editorial Design System 6.0 === */";
const endMarker = "/* === End PfotenTechnik Editorial Design System 6.0 === */";

const existingStart = css.indexOf(startMarker);
const existingEnd = css.indexOf(endMarker);

if (existingStart >= 0 && existingEnd > existingStart) {
  css =
    css.slice(0, existingStart).trimEnd() +
    "\n\n" +
    cssPatch +
    "\n" +
    css.slice(existingEnd + endMarker.length).trimStart();
} else {
  css = css.trimEnd() + "\n\n" + cssPatch + "\n";
}

fs.writeFileSync(cssPath, css, "utf8");

/* -----------------------------------------------------------
 * Verifikation
 * --------------------------------------------------------- */
const checks = [
  [pagePath, "product.data.images.thumbnail?.src"],
  [rendererPath, "premium-v3-product-media"],
  [rendererPath, "premium-v3-score"],
  [rendererPath, "product.rating * 20"],
  [rendererPath, "<li><span>{stripLeadingIcon(item)}</span></li>"],
  [rendererPath, "Editorial Design System 6.0"],
  [cssPath, "PfotenTechnik Editorial Design System 6.0"],
  [cssPath, ".article:has(.premium-v3--pfotentechnik)"]
];

for (const [file, needle] of checks) {
  if (!fs.readFileSync(file, "utf8").includes(needle)) {
    console.error("Verifikation fehlgeschlagen:", needle);
    process.exit(1);
  }
}

const auditPath = path.join(
  root,
  "apps/pfotentechnik/EDITORIAL_DESIGN_SYSTEM_6_0_AUDIT.json"
);

fs.writeFileSync(
  auditPath,
  JSON.stringify(
    {
      installedAt: new Date().toISOString(),
      version: "6.0",
      ratingScale: "0-100",
      starsRemoved: true,
      boxInBoxRemoved: true,
      decisionListTextWrapped: true,
      productImagesEnabled: true,
      mobileFirst: true,
      changedFiles: [
        path.relative(root, rendererPath),
        path.relative(root, pagePath),
        path.relative(root, cssPath)
      ]
    },
    null,
    2
  ) + "\n",
  "utf8"
);

fs.writeFileSync(
  manifestPath,
  JSON.stringify(
    {
      installedAt: new Date().toISOString(),
      backupRoot,
      files: [
        path.relative(root, rendererPath),
        path.relative(root, pagePath),
        path.relative(root, cssPath),
        path.relative(root, auditPath)
      ]
    },
    null,
    2
  ) + "\n",
  "utf8"
);

console.log("");
console.log("Editorial Design System 6.0 installiert.");
console.log("");
console.log("- äußere Artikel-Schachtel entfernt");
console.log("- Entscheidungslisten strukturell repariert");
console.log("- Produktkarten mit Bildern neu aufgebaut");
console.log("- Bewertungen auf 100-Punkte-Skala");
console.log("- keine Sterne mehr");
console.log("");
console.log("Jetzt ausführen:");
console.log("  npm run build:pfotentechnik");

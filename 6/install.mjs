import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const target = path.join(root, 'apps/pfotentechnik/src/pages/produkt/[product].astro');
const markerStart = '/* PT PRODUCT DARK + MOBILE FIX 4.2 START */';
const markerEnd = '/* PT PRODUCT DARK + MOBILE FIX 4.2 END */';

if (!fs.existsSync(target)) {
  console.error(`Zieldatei nicht gefunden: ${target}`);
  console.error('Bitte den Installer im Root des Repositories ausführen.');
  process.exit(1);
}

let source = fs.readFileSync(target, 'utf8');

const css = String.raw`
<style is:global>
  ${markerStart}

  /* Produktseite zuverlässig im verfügbaren Layout zentrieren. */
  [data-product-page].pt-product-detail {
    width: min(100%, 1280px);
    max-width: 1280px;
    min-width: 0;
    margin-inline: auto;
    padding-inline: 0;
    overflow: clip;
  }

  [data-product-page].pt-product-detail,
  [data-product-page].pt-product-detail > *,
  [data-product-page].pt-product-detail [data-product-engine],
  [data-product-page].pt-product-detail .native-product,
  [data-product-page].pt-product-detail .native-product > *,
  [data-product-page].pt-product-detail .native-product__commerce,
  [data-product-page].pt-product-detail .native-gallery,
  [data-product-page].pt-product-detail .native-buybox,
  [data-product-page].pt-product-detail .native-panel {
    min-width: 0;
    max-width: 100%;
  }

  /* Verhindert, dass lange Titel, Chips oder Metadaten die Seite verbreitern. */
  [data-product-page] h1,
  [data-product-page] h2,
  [data-product-page] h3,
  [data-product-page] p,
  [data-product-page] a,
  [data-product-page] span,
  [data-product-page] dd,
  [data-product-page] dt {
    overflow-wrap: anywhere;
  }

  [data-product-page] img,
  [data-product-page] video,
  [data-product-page] svg {
    max-width: 100%;
  }

  /* Dark Mode für Renderer und nachgelagerte Produktblöcke. */
  :is(
    html[data-theme='dark'],
    html.dark,
    body[data-theme='dark'],
    body.dark,
    [data-theme='dark']
  ) [data-product-page] {
    color-scheme: dark;
    --np-page: #07111d;
    --np-surface: #0d1a28;
    --np-surface-raised: #102131;
    --np-surface-soft: #132536;
    --np-surface-muted: #172d41;
    --np-text: #f7fafc;
    --np-text-soft: #d9e2ec;
    --np-muted: #aebdca;
    --np-border: #294054;
    --np-border-strong: #36526a;
    --np-green: #54d989;
    --np-green-strong: #75e5a3;
    --np-green-soft: rgba(84, 217, 137, .12);
    --np-red: #ff7b7b;
    --np-red-soft: rgba(255, 123, 123, .10);
  }

  :is(
    html[data-theme='dark'],
    html.dark,
    body[data-theme='dark'],
    body.dark,
    [data-theme='dark']
  ) [data-product-page] :is(
    .native-product__intro,
    .native-gallery__stage,
    .native-gallery__fallback,
    .native-buybox,
    .native-panel,
    .pt-everyday-review,
    .pt-everyday-review article,
    .pt-product-health
  ) {
    border-color: var(--np-border, #294054) !important;
    background-color: var(--np-surface, #0d1a28) !important;
    color: var(--np-text, #f7fafc) !important;
    box-shadow: 0 18px 42px rgba(0, 0, 0, .28) !important;
  }

  :is(
    html[data-theme='dark'],
    html.dark,
    body[data-theme='dark'],
    body.dark,
    [data-theme='dark']
  ) [data-product-page] .native-product__intro {
    background:
      radial-gradient(circle at 88% 10%, rgba(84, 217, 137, .12), transparent 34%),
      linear-gradient(145deg, #102131, #0d1a28) !important;
  }

  :is(
    html[data-theme='dark'],
    html.dark,
    body[data-theme='dark'],
    body.dark,
    [data-theme='dark']
  ) [data-product-page] .native-gallery__stage {
    background: linear-gradient(145deg, #102131, #132536) !important;
  }

  :is(
    html[data-theme='dark'],
    html.dark,
    body[data-theme='dark'],
    body.dark,
    [data-theme='dark']
  ) [data-product-page] :is(h1, h2, h3, strong, dt) {
    color: var(--np-text, #f7fafc) !important;
  }

  :is(
    html[data-theme='dark'],
    html.dark,
    body[data-theme='dark'],
    body.dark,
    [data-theme='dark']
  ) [data-product-page] :is(p, dd, small, .native-product__lead, .native-product__score-label, .native-product__rating-count) {
    color: var(--np-text-soft, #d9e2ec) !important;
  }

  :is(
    html[data-theme='dark'],
    html.dark,
    body[data-theme='dark'],
    body.dark,
    [data-theme='dark']
  ) [data-product-page] .native-gallery__thumb {
    border-color: var(--np-border, #294054);
    background: var(--np-surface-soft, #132536);
  }

  :is(
    html[data-theme='dark'],
    html.dark,
    body[data-theme='dark'],
    body.dark,
    [data-theme='dark']
  ) [data-product-page] .native-buybox__secondary {
    border-color: var(--np-border-strong, #36526a);
    background: var(--np-surface-soft, #132536);
    color: var(--np-text, #f7fafc);
  }

  @media (max-width: 767px) {
    /* Kompensiert äußere Container-Paddings und hält alles mittig. */
    [data-product-page].pt-product-detail {
      width: 100%;
      max-width: 100%;
      margin-inline: auto;
      padding-inline: 0;
      overflow-x: clip;
    }

    [data-product-page] .native-product {
      width: 100%;
      gap: 16px;
    }

    [data-product-page] .native-product__intro {
      width: 100%;
      padding: 20px 16px;
      border-radius: 18px;
      text-align: left;
    }

    [data-product-page] .native-product__badges,
    [data-product-page] .native-product__ratings {
      max-width: 100%;
      justify-content: flex-start;
    }

    [data-product-page] .native-product h1 {
      max-width: 100%;
      font-size: clamp(2rem, 10.5vw, 3rem);
      line-height: 1.04;
      letter-spacing: -.04em;
    }

    [data-product-page] .native-gallery__stage,
    [data-product-page] .native-gallery__fallback,
    [data-product-page] .native-buybox,
    [data-product-page] .native-panel,
    [data-product-page] .pt-everyday-review,
    [data-product-page] .pt-product-health {
      width: 100%;
      max-width: 100%;
      margin-inline: auto;
      border-radius: 18px;
    }

    [data-product-page] .native-gallery__stage,
    [data-product-page] .native-gallery__fallback {
      min-height: 0;
    }

    [data-product-page] .native-gallery__slide img {
      width: 100%;
      height: auto;
      max-height: 70vh;
      padding: 10px;
      object-fit: contain;
    }

    [data-product-page] .native-gallery__thumbs {
      width: 100%;
      max-width: 100%;
      padding-inline: 0;
      scroll-padding-inline: 0;
    }

    [data-product-page] .native-buybox,
    [data-product-page] .native-panel,
    [data-product-page] .pt-everyday-review,
    [data-product-page] .pt-product-health {
      padding-inline: 16px;
    }

    [data-product-page] .native-buybox__meta div {
      grid-template-columns: minmax(0, 1fr);
      gap: 4px;
    }
  }

  @supports not (overflow: clip) {
    [data-product-page].pt-product-detail {
      overflow-x: hidden;
    }
  }

  ${markerEnd}
</style>`;

const blockPattern = new RegExp(
  `<style is:global>\\s*${markerStart.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}[\\s\\S]*?${markerEnd.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}\\s*</style>`,
  'm'
);

if (blockPattern.test(source)) {
  source = source.replace(blockPattern, css);
} else {
  const insertionPoint = source.lastIndexOf('</ProjectLayout>');
  if (insertionPoint === -1) {
    console.error('Abbruch: </ProjectLayout> wurde nicht gefunden. Die Datei hat einen unerwarteten Aufbau.');
    process.exit(1);
  }
  source = `${source.slice(0, insertionPoint)}\n${css}\n${source.slice(insertionPoint)}`;
}

fs.writeFileSync(target, source, 'utf8');
console.log('✓ Product Dark + Mobile Fix 4.2 installiert');
console.log(`  ${path.relative(root, target)}`);
console.log('Danach ausführen: npm run build:pfotentechnik');

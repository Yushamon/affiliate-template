#!/usr/bin/env node

import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { execFileSync, spawnSync } from "node:child_process";

const PATCH_NAME = "pfotentechnik-theme-kaufberatung-8.0";
const BASELINE_COMMIT = "66f0b597e5b313273dcd1a654dd6f18477f80574";
const ROOT_MARKER = path.join(
  "apps",
  "pfotentechnik",
  "src",
  "layouts",
  "ProjectLayout.astro"
);

const args = process.argv.slice(2);
const runBuild = args.includes("--build");
const explicitRoot = args.find((arg) => !arg.startsWith("--"));

const fail = (message) => {
  console.error(`\n[${PATCH_NAME}] ${message}\n`);
  process.exit(1);
};

const findRepoRoot = (startPath) => {
  let current = path.resolve(startPath);

  while (true) {
    if (fs.existsSync(path.join(current, ROOT_MARKER))) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
};

const repoRoot = findRepoRoot(explicitRoot ?? process.cwd());

if (!repoRoot) {
  fail(
    "Repository nicht gefunden. Starte den Installer im affiliate-template-Ordner " +
      "oder übergib den Pfad als erstes Argument."
  );
}

const files = {
  header: "packages/affiliate-core/src/components/Header.astro",
  layout: "packages/affiliate-core/src/layouts/AffiliateLayout.astro",
  projectLayout: "apps/pfotentechnik/src/layouts/ProjectLayout.astro",
  projectConfig: "apps/pfotentechnik/src/project.config.ts",
  themeFixes: "apps/pfotentechnik/src/styles/pfotentechnik-theme-fixes.css",
  runtimeFixes: "apps/pfotentechnik/src/components/SiteRuntimeFixes.astro",
  purchaseAdvice: "apps/pfotentechnik/src/pages/kaufberatung.astro"
};

const payload = {
  [files.themeFixes]: String.raw`/*
 * PfotenTechnik Theme + Kaufberatung Fix 8.0
 * Final correction layer loaded after the consolidated design system.
 */

/* Product Renderer 4.1 uses local light-only variables. Map them to the
   semantic site tokens so prefers-color-scheme works without a JS theme class. */
[data-product-page] .native-product {
  --np-page: var(--pt-theme-canvas) !important;
  --np-surface: var(--pt-theme-surface) !important;
  --np-surface-raised: var(--pt-theme-surface) !important;
  --np-surface-soft: var(--pt-theme-surface-2) !important;
  --np-surface-muted: var(--pt-theme-surface-3) !important;
  --np-text: var(--pt-theme-text) !important;
  --np-text-soft: var(--pt-theme-text-soft) !important;
  --np-muted: var(--pt-theme-text-muted) !important;
  --np-border: var(--pt-theme-border) !important;
  --np-border-strong: var(--pt-theme-border-strong) !important;
  --np-green: var(--pt-theme-accent) !important;
  --np-green-strong: var(--pt-theme-accent-hover) !important;
  --np-green-soft: var(--pt-theme-accent-soft) !important;
  --np-red: var(--pt-theme-danger) !important;
  --np-red-soft: var(--pt-theme-danger-soft) !important;
  --np-amber: var(--pt-theme-warning) !important;
  --np-shadow-sm: var(--pt-theme-shadow-xs) !important;
  --np-shadow-md: var(--pt-theme-shadow-sm) !important;
  --np-shadow-lg: var(--pt-theme-shadow-md) !important;

  width: min(100%, 1180px);
  margin-inline: auto;
  color: var(--pt-theme-text-soft);
}

[data-product-page].pt-product-detail {
  width: min(100%, 1180px);
  max-width: 1180px;
  margin-inline: auto;
}

[data-product-page] :is(
  .native-product__intro,
  .native-gallery__stage,
  .native-gallery__fallback,
  .native-buybox,
  .native-panel,
  .pt-review-method,
  .pt-product-links,
  .pt-everyday-review-grid article
) {
  border-color: var(--pt-theme-border) !important;
  color: var(--pt-theme-text-soft) !important;
}

[data-product-page] :is(
  .native-buybox,
  .native-panel,
  .pt-review-method,
  .pt-product-links,
  .pt-everyday-review-grid article
) {
  background: var(--pt-theme-surface) !important;
  box-shadow: var(--pt-theme-shadow-sm) !important;
}

[data-product-page] .native-product__intro {
  background:
    radial-gradient(
      circle at 88% 10%,
      color-mix(in srgb, var(--pt-theme-accent) 12%, transparent),
      transparent 34%
    ),
    linear-gradient(
      145deg,
      var(--pt-theme-surface),
      var(--pt-theme-surface-2)
    ) !important;
}

[data-product-page] :is(
  .native-gallery__stage,
  .native-gallery__fallback
) {
  background: linear-gradient(
    145deg,
    var(--pt-theme-surface),
    var(--pt-theme-surface-2)
  ) !important;
}

[data-product-page] .pt-product-health {
  border-color: color-mix(
    in srgb,
    var(--pt-theme-accent) 24%,
    var(--pt-theme-border)
  ) !important;
  background: linear-gradient(
    145deg,
    var(--pt-theme-accent-soft),
    var(--pt-theme-surface) 62%
  ) !important;
  color: var(--pt-theme-text-soft) !important;
  box-shadow: var(--pt-theme-shadow-sm) !important;
}

[data-product-page] :is(h1, h2, h3, h4, strong, dt) {
  color: var(--pt-theme-text) !important;
}

[data-product-page] :is(p, li, dd, small, figcaption) {
  color: var(--pt-theme-text-soft);
}

[data-product-page] :is(
  .native-gallery__thumb,
  .native-buybox__secondary,
  .native-quickfacts__card
) {
  border-color: var(--pt-theme-border-strong) !important;
  background: var(--pt-theme-surface-2) !important;
}

[data-product-page] .native-quickfacts__card--primary {
  background: linear-gradient(
    145deg,
    color-mix(
      in srgb,
      var(--pt-theme-accent) 8%,
      var(--pt-theme-surface-2)
    ),
    var(--pt-theme-surface)
  ) !important;
}

[data-product-page] .native-product__badge--soft {
  border-color: color-mix(
    in srgb,
    var(--pt-theme-accent) 30%,
    var(--pt-theme-border)
  ) !important;
  background: var(--pt-theme-accent-soft) !important;
  color: var(--pt-theme-accent-text) !important;
}

/* Theme-safe header and navigation surfaces. */
.site-header-v2 {
  border-bottom-color: var(--pt-theme-divider) !important;
  background: color-mix(
    in srgb,
    var(--pt-theme-overlay) 92%,
    transparent
  ) !important;
}

.main-nav-v2,
.nav-toggle-button {
  border-color: var(--pt-theme-border-strong) !important;
  background: var(--pt-theme-surface) !important;
  color: var(--pt-theme-text) !important;
}

.header-advisor-link {
  background: var(--pt-theme-accent) !important;
  color: var(--pt-theme-text-inverse) !important;
}

.header-advisor-link:hover {
  background: var(--pt-theme-accent-hover) !important;
}

.main-nav-v2 .main-nav-v2__cta {
  display: none;
}

@media (min-width: 1180px) {
  .header-advisor-link {
    display: inline-flex;
  }
}

@media (max-width: 760px) {
  [data-product-page].pt-product-detail,
  [data-product-page] .native-product {
    width: 100%;
    max-width: 100%;
  }

  .main-nav-v2 {
    box-shadow: var(--pt-theme-shadow-menu) !important;
  }

  .main-nav-v2 .main-nav-v2__cta {
    display: flex;
    min-height: 46px;
    align-items: center;
    justify-content: center;
    margin-top: 4px;
    background: var(--pt-theme-accent) !important;
    color: var(--pt-theme-text-inverse) !important;
    font-weight: 850;
  }

  .main-nav-v2 .main-nav-v2__cta:hover,
  .main-nav-v2 .main-nav-v2__cta:focus-visible {
    background: var(--pt-theme-accent-hover) !important;
    color: var(--pt-theme-text-inverse) !important;
  }
}`,
  [files.runtimeFixes]: String.raw`<script is:inline>
  (() => {
    const editorialStatuses = new Set([
      "editorial review",
      "editorial-review",
      "redaktionelle einordnung",
      "redaktionelle bewertung",
      "redaktionell bewertet"
    ]);

    const normalize = (value) =>
      String(value ?? "")
        .trim()
        .toLocaleLowerCase("de-DE")
        .replace(/[_-]+/g, " ")
        .replace(/\s+/g, " ");

    const removeGenericEditorialStatus = () => {
      document
        .querySelectorAll(
          "[data-product-page] .native-buybox__meta > div"
        )
        .forEach((row) => {
          const label = normalize(row.querySelector("dt")?.textContent);
          const value = normalize(row.querySelector("dd")?.textContent);

          if (label === "status" && editorialStatuses.has(value)) {
            row.remove();
          }
        });
    };

    removeGenericEditorialStatus();

    if (!window.__ptSiteRuntimeFixesInstalled) {
      window.__ptSiteRuntimeFixesInstalled = true;
      document.addEventListener(
        "astro:page-load",
        removeGenericEditorialStatus
      );
    }
  })();
</script>`,
  [files.purchaseAdvice]: String.raw`---
import ProjectLayout from "../layouts/ProjectLayout.astro";

const options = [
  {
    eyebrow: "Geführter Berater verfügbar",
    title: "Futterautomaten",
    text:
      "Beantworte wenige Fragen zu Tier, Futterart, App, Kamera und Mehrtierhaushalt. Der Berater grenzt die passende Geräteklasse ein.",
    primaryLabel: "Futterautomaten-Berater starten",
    primaryHref: "/berater/futterautomat/",
    secondaryLabel: "Futterautomaten-Ratgeber öffnen",
    secondaryHref: "/smarte-futterautomaten/"
  },
  {
    eyebrow: "Vergleiche und Ratgeber",
    title: "Trinkbrunnen",
    text:
      "Ordne Material, Reinigung, Filterkosten, Lautstärke und die passende Größe für Hund oder Katze ein.",
    primaryLabel: "Trinkbrunnen auswählen",
    primaryHref: "/trinkbrunnen/",
    secondaryLabel: "Alle Vergleiche ansehen",
    secondaryHref: "/vergleiche/"
  },
  {
    eyebrow: "Vergleiche und Ratgeber",
    title: "GPS-Tracker",
    text:
      "Vergleiche Netzabdeckung, Abo-Kosten, Akkulaufzeit, Gewicht und die Eignung für Hund oder Katze.",
    primaryLabel: "GPS-Tracker vergleichen",
    primaryHref: "/gps-tracker/",
    secondaryLabel: "Alle Vergleiche ansehen",
    secondaryHref: "/vergleiche/"
  }
];
---

<ProjectLayout
  title="Kaufberatung für smarte Haustiertechnik"
  description="Wähle den passenden Beratungsweg für Futterautomaten, Trinkbrunnen und GPS-Tracker."
  seoTitle="Kaufberatung für Haustiertechnik | PfotenTechnik"
  seoDescription="Geführter Futterautomaten-Berater sowie unabhängige Vergleiche und Ratgeber für Trinkbrunnen und GPS-Tracker."
  canonical="/kaufberatung/"
  schemaType="webpage"
>
  <div class="pt-advice-hub">
    <header class="pt-advice-hero">
      <p class="pt-advice-eyebrow">Kaufberatung</p>
      <h1>Welche Haustiertechnik passt wirklich zu dir?</h1>
      <p class="pt-advice-lead">
        Starte beim Produktbereich. Wir führen dich entweder durch einen
        geführten Berater oder direkt zu den passenden Vergleichen und
        Ratgebern.
      </p>

      <div class="pt-advice-note">
        <strong>Transparent eingeordnet:</strong>
        Der geführte Schritt-für-Schritt-Berater ist derzeit für
        Futterautomaten verfügbar. Bei Trinkbrunnen und GPS-Trackern führen
        wir direkt in die passenden Vergleichs- und Ratgeberbereiche.
      </div>
    </header>

    <section
      class="pt-advice-options"
      aria-labelledby="pt-advice-options-title"
    >
      <div class="pt-advice-section-head">
        <p class="pt-advice-eyebrow">Produktbereich wählen</p>
        <h2 id="pt-advice-options-title">
          Der passende Einstieg ohne Umwege
        </h2>
      </div>

      <div class="pt-advice-grid">
        {
          options.map((option) => (
            <article class="pt-advice-card">
              <span>{option.eyebrow}</span>
              <h3>{option.title}</h3>
              <p>{option.text}</p>

              <div class="pt-advice-actions">
                <a
                  class="pt-advice-primary"
                  href={option.primaryHref}
                >
                  {option.primaryLabel}
                </a>
                <a
                  class="pt-advice-secondary"
                  href={option.secondaryHref}
                >
                  {option.secondaryLabel}
                </a>
              </div>
            </article>
          ))
        }
      </div>
    </section>

    <aside class="pt-advice-footer">
      <div>
        <p class="pt-advice-eyebrow">Noch offen?</p>
        <h2>Erst vergleichen, dann entscheiden</h2>
        <p>
          Die Vergleichsübersicht bündelt alle bereits eingeordneten
          Produktkategorien. Dort kannst du nach Tier, Einsatz und Funktion
          weiter eingrenzen.
        </p>
      </div>
      <a href="/vergleiche/">Zur Vergleichsübersicht</a>
    </aside>
  </div>
</ProjectLayout>

<style>
  .pt-advice-hub {
    width: min(100%, 1180px);
    margin-inline: auto;
    color: var(--pt-theme-text-soft);
  }

  .pt-advice-hero {
    padding: clamp(32px, 6vw, 72px);
    border: 1px solid var(--pt-theme-border);
    border-radius: clamp(24px, 4vw, 38px);
    background:
      radial-gradient(
        circle at 90% 8%,
        color-mix(
          in srgb,
          var(--pt-theme-accent) 16%,
          transparent
        ),
        transparent 34%
      ),
      linear-gradient(
        145deg,
        var(--pt-theme-surface),
        var(--pt-theme-surface-2)
      );
    box-shadow: var(--pt-theme-shadow-md);
  }

  .pt-advice-eyebrow {
    margin: 0 0 12px;
    color: var(--pt-theme-accent);
    font-size: 0.76rem;
    font-weight: 900;
    letter-spacing: 0.12em;
    text-transform: uppercase;
  }

  .pt-advice-hero h1 {
    max-width: 860px;
    margin: 0;
    color: var(--pt-theme-text);
    font-size: clamp(2.6rem, 7vw, 5.5rem);
    line-height: 0.98;
    letter-spacing: -0.06em;
  }

  .pt-advice-lead {
    max-width: 760px;
    margin: 24px 0 0;
    color: var(--pt-theme-text-soft);
    font-size: clamp(1.05rem, 2.2vw, 1.3rem);
    line-height: 1.7;
  }

  .pt-advice-note {
    max-width: 820px;
    margin-top: 28px;
    padding: 16px 18px;
    border: 1px solid color-mix(
      in srgb,
      var(--pt-theme-accent) 28%,
      var(--pt-theme-border)
    );
    border-radius: 16px;
    background: var(--pt-theme-accent-soft);
    color: var(--pt-theme-text-soft);
    line-height: 1.6;
  }

  .pt-advice-note strong {
    color: var(--pt-theme-text);
  }

  .pt-advice-options {
    margin-top: clamp(64px, 9vw, 112px);
  }

  .pt-advice-section-head {
    max-width: 760px;
    margin-bottom: 28px;
  }

  .pt-advice-section-head h2,
  .pt-advice-footer h2 {
    margin: 0;
    color: var(--pt-theme-text);
    font-size: clamp(2rem, 5vw, 3.6rem);
    line-height: 1.04;
    letter-spacing: -0.045em;
  }

  .pt-advice-grid {
    display: grid;
    grid-template-columns: repeat(3, minmax(0, 1fr));
    gap: 18px;
  }

  .pt-advice-card {
    display: flex;
    min-width: 0;
    min-height: 430px;
    flex-direction: column;
    padding: 28px;
    border: 1px solid var(--pt-theme-border);
    border-radius: 24px;
    background: var(--pt-theme-surface);
    box-shadow: var(--pt-theme-shadow-sm);
  }

  .pt-advice-card > span {
    color: var(--pt-theme-accent);
    font-size: 0.74rem;
    font-weight: 900;
    letter-spacing: 0.08em;
    text-transform: uppercase;
  }

  .pt-advice-card h3 {
    margin: 28px 0 12px;
    color: var(--pt-theme-text);
    font-size: clamp(1.7rem, 3vw, 2.35rem);
    line-height: 1.05;
    letter-spacing: -0.035em;
  }

  .pt-advice-card p {
    margin: 0;
    color: var(--pt-theme-text-muted);
    line-height: 1.68;
  }

  .pt-advice-actions {
    display: grid;
    gap: 10px;
    margin-top: auto;
    padding-top: 28px;
  }

  .pt-advice-actions a,
  .pt-advice-footer > a {
    display: flex;
    min-height: 50px;
    align-items: center;
    justify-content: center;
    padding: 12px 16px;
    border-radius: 12px;
    font-weight: 850;
    text-align: center;
    text-decoration: none;
  }

  .pt-advice-primary,
  .pt-advice-footer > a {
    background: var(--pt-theme-accent);
    color: var(--pt-theme-text-inverse);
  }

  .pt-advice-primary:hover,
  .pt-advice-footer > a:hover {
    background: var(--pt-theme-accent-hover);
    color: var(--pt-theme-text-inverse);
  }

  .pt-advice-secondary {
    border: 1px solid var(--pt-theme-border-strong);
    background: var(--pt-theme-surface-2);
    color: var(--pt-theme-text);
  }

  .pt-advice-footer {
    display: grid;
    grid-template-columns: minmax(0, 1fr) auto;
    gap: 32px;
    align-items: center;
    margin-top: clamp(64px, 9vw, 112px);
    padding: clamp(28px, 5vw, 48px);
    border: 1px solid var(--pt-theme-border);
    border-radius: 28px;
    background: var(--pt-theme-surface-2);
  }

  .pt-advice-footer p:last-child {
    max-width: 720px;
    margin: 16px 0 0;
    color: var(--pt-theme-text-muted);
    line-height: 1.7;
  }

  .pt-advice-footer > a {
    min-width: 220px;
  }

  @media (max-width: 900px) {
    .pt-advice-grid {
      grid-template-columns: 1fr;
    }

    .pt-advice-card {
      min-height: 0;
    }

    .pt-advice-footer {
      grid-template-columns: 1fr;
    }

    .pt-advice-footer > a {
      width: 100%;
    }
  }

  @media (max-width: 560px) {
    .pt-advice-hero,
    .pt-advice-card,
    .pt-advice-footer {
      padding: 22px;
      border-radius: 20px;
    }

    .pt-advice-hero h1 {
      font-size: clamp(2.4rem, 12vw, 3.5rem);
    }
  }
</style>`
};

const read = (relativePath) =>
  fs.readFileSync(path.join(repoRoot, relativePath), "utf8");

const replaceOnce = (text, search, replacement, label) => {
  if (text.includes(replacement)) return text;

  const index = text.indexOf(search);
  if (index === -1) {
    throw new Error(`Anker nicht gefunden: ${label}`);
  }

  return (
    text.slice(0, index) +
    replacement +
    text.slice(index + search.length)
  );
};

const patchHeader = (input) => {
  let text = input;

  if (!text.includes("  cta?: {")) {
    text = replaceOnce(
      text,
      `  links: Array<{
    label: string;
    href: string;
  }>;
}`,
      `  links: Array<{
    label: string;
    href: string;
  }>;
  cta?: {
    label: string;
    href: string;
    ariaLabel?: string;
  };
}`,
      "Header Props"
    );
  }

  if (!text.includes("  links,\n  cta\n")) {
    text = replaceOnce(
      text,
      `const {
  projectName,
  links
} = Astro.props as Props;`,
      `const {
  projectName,
  links,
  cta
} = Astro.props as Props;`,
      "Header Destructuring"
    );
  }

  if (!text.includes('class="main-nav-v2__cta"')) {
    text = replaceOnce(
      text,
      `      {links.map((link) => (
        <a href={link.href}>{link.label}</a>
      ))}`,
      `      {links.map((link) => (
        <a href={link.href}>{link.label}</a>
      ))}

      {
        cta && (
          <a
            class="main-nav-v2__cta"
            href={cta.href}
            aria-label={cta.ariaLabel ?? cta.label}
          >
            {cta.label}
          </a>
        )
      }`,
      "Mobile CTA"
    );
  }

  if (!text.includes("cta && (\n        <a\n          class=\"header-advisor-link\"")) {
    text = replaceOnce(
      text,
      `    <a class="header-advisor-link" href="/berater/futterautomat/">
      Berater finden
    </a>`,
      `    {
      cta && (
        <a
          class="header-advisor-link"
          href={cta.href}
          aria-label={cta.ariaLabel ?? cta.label}
        >
          {cta.label}
        </a>
      )
    }`,
      "Desktop CTA"
    );
  }

  return text;
};

const patchAffiliateLayout = (input) => {
  let text = input;

  if (!text.includes("  headerCta?: {")) {
    text = replaceOnce(
      text,
      `  headerLinks?: Array<{
    label: string;
    href: string;
  }>;
  breadcrumbs?: BreadcrumbItem[];`,
      `  headerLinks?: Array<{
    label: string;
    href: string;
  }>;
  headerCta?: {
    label: string;
    href: string;
    ariaLabel?: string;
  };
  breadcrumbs?: BreadcrumbItem[];`,
      "AffiliateLayout Props"
    );
  }

  if (!text.includes("  headerCta,\n  breadcrumbs")) {
    text = replaceOnce(
      text,
      `  headerLinks = projectConfig.headerLinks,
  breadcrumbs`,
      `  headerLinks = projectConfig.headerLinks,
  headerCta,
  breadcrumbs`,
      "AffiliateLayout Destructuring"
    );
  }

  if (!text.includes("      cta={headerCta}")) {
    text = replaceOnce(
      text,
      `      projectName={projectConfig.projectName}
      links={headerLinks}
    />`,
      `      projectName={projectConfig.projectName}
      links={headerLinks}
      cta={headerCta}
    />`,
      "AffiliateLayout Header Props"
    );
  }

  return text;
};

const patchProjectLayout = (input) => {
  let text = input;

  if (!text.includes('import "../styles/pfotentechnik-theme-fixes.css";')) {
    text = replaceOnce(
      text,
      `import "../styles/pfotentechnik-design-system.css";`,
      `import "../styles/pfotentechnik-design-system.css";
import "../styles/pfotentechnik-theme-fixes.css";`,
      "Theme Fix Import"
    );
  }

  if (!text.includes('import SiteRuntimeFixes from "../components/SiteRuntimeFixes.astro";')) {
    text = replaceOnce(
      text,
      `import ImageLightbox from "@affiliate-core/components/ImageLightbox.astro";`,
      `import ImageLightbox from "@affiliate-core/components/ImageLightbox.astro";
import SiteRuntimeFixes from "../components/SiteRuntimeFixes.astro";`,
      "Runtime Fix Import"
    );
  }

  if (!text.includes('headerCta={{')) {
    text = replaceOnce(
      text,
      `  headerLinks={headerLinks}
>`,
      `  headerLinks={headerLinks}
  headerCta={{
    label: "Kaufberatung",
    href: "/kaufberatung/",
    ariaLabel: "Kaufberatung für Haustiertechnik öffnen"
  }}
>`,
      "General Header CTA"
    );
  }

  if (!text.includes("  <SiteRuntimeFixes />")) {
    text = replaceOnce(
      text,
      `  <ImageLightbox />
</AffiliateLayout>`,
      `  <ImageLightbox />
  <SiteRuntimeFixes />
</AffiliateLayout>`,
      "Runtime Fix Component"
    );
  }

  return text;
};

const patchProjectConfig = (input) => {
  if (input.includes('{ label: "Kaufberatung", href: "/kaufberatung/" }')) {
    return input;
  }

  return replaceOnce(
    input,
    `        links: [
          { label: "Vergleiche", href: "/vergleiche/" },`,
    `        links: [
          { label: "Kaufberatung", href: "/kaufberatung/" },
          { label: "Vergleiche", href: "/vergleiche/" },`,
    "Footer Kaufberatung"
  );
};

const transforms = {
  [files.header]: patchHeader,
  [files.layout]: patchAffiliateLayout,
  [files.projectLayout]: patchProjectLayout,
  [files.projectConfig]: patchProjectConfig
};

const original = new Map();
const planned = new Map();

try {
  for (const [relativePath, transform] of Object.entries(transforms)) {
    const absolutePath = path.join(repoRoot, relativePath);

    if (!fs.existsSync(absolutePath)) {
      throw new Error(`Pflichtdatei fehlt: ${relativePath}`);
    }

    const source = read(relativePath);
    original.set(relativePath, source);
    planned.set(relativePath, transform(source));
  }

  for (const [relativePath, content] of Object.entries(payload)) {
    const absolutePath = path.join(repoRoot, relativePath);
    original.set(
      relativePath,
      fs.existsSync(absolutePath)
        ? fs.readFileSync(absolutePath, "utf8")
        : null
    );
    planned.set(relativePath, `${content.trim()}\n`);
  }
} catch (error) {
  fail(
    `Vorprüfung fehlgeschlagen. Es wurde nichts verändert.\n${error.message}`
  );
}

const timestamp = new Date()
  .toISOString()
  .replace(/[:.]/g, "-");
const backupRoot = path.join(
  repoRoot,
  ".patch-backups",
  `${PATCH_NAME}-${timestamp}`
);

const changed = [];

try {
  for (const [relativePath, nextContent] of planned) {
    const previousContent = original.get(relativePath);

    if (previousContent === nextContent) continue;

    if (previousContent !== null) {
      const backupPath = path.join(backupRoot, relativePath);
      fs.mkdirSync(path.dirname(backupPath), { recursive: true });
      fs.writeFileSync(backupPath, previousContent, "utf8");
    }

    const targetPath = path.join(repoRoot, relativePath);
    fs.mkdirSync(path.dirname(targetPath), { recursive: true });
    fs.writeFileSync(targetPath, nextContent, "utf8");
    changed.push(relativePath);
  }
} catch (error) {
  for (const [relativePath, previousContent] of original) {
    const targetPath = path.join(repoRoot, relativePath);

    if (previousContent === null) {
      if (fs.existsSync(targetPath)) fs.rmSync(targetPath);
    } else {
      fs.mkdirSync(path.dirname(targetPath), { recursive: true });
      fs.writeFileSync(targetPath, previousContent, "utf8");
    }
  }

  fail(`Schreibvorgang fehlgeschlagen und wurde zurückgerollt.\n${error.message}`);
}

let currentCommit = null;
try {
  currentCommit = execFileSync(
    "git",
    ["rev-parse", "HEAD"],
    { cwd: repoRoot, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }
  ).trim();
} catch {
  // Git is optional for applying the structural patch.
}

console.log(`\n[${PATCH_NAME}] angewendet.`);
console.log(`Repository: ${repoRoot}`);

if (currentCommit && currentCommit !== BASELINE_COMMIT) {
  console.log(
    `Hinweis: Aktueller Commit ${currentCommit.slice(0, 12)} weicht von ` +
      `der geprüften Basis ${BASELINE_COMMIT.slice(0, 12)} ab. ` +
      "Die strukturellen Anker wurden trotzdem vollständig gefunden."
  );
}

if (changed.length === 0) {
  console.log("Keine Änderungen nötig. Der Patch war bereits vollständig aktiv.");
} else {
  console.log("Geänderte Dateien:");
  changed.forEach((file) => console.log(`  - ${file}`));
  console.log(`Backups: ${backupRoot}`);
}

if (runBuild) {
  console.log("\nStarte npm run build:pfotentechnik ...");
  const result = spawnSync(
    "npm",
    ["run", "build:pfotentechnik"],
    { cwd: repoRoot, stdio: "inherit", shell: process.platform === "win32" }
  );

  if (result.status !== 0) {
    fail(
      "Patch wurde angewendet, aber der Build ist fehlgeschlagen. " +
        `Die Backups liegen unter ${backupRoot}.`
    );
  }

  console.log("Build erfolgreich.");
} else {
  console.log(
    "\nValidierung: npm run build:pfotentechnik\n" +
      "Optional automatisch: node apply-pfotentechnik-theme-kaufberatung-8.0.mjs --build"
  );
}

#!/usr/bin/env node
import { access, cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { constants } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { spawnSync } from "node:child_process";
import process from "node:process";

const VERSION = "15.4.3";
const LABEL = `pfotentechnik-comparison-rendered-ui-fix-${VERSION}`;
const rootArg = process.argv.find((value) => value.startsWith("--root="));
const root = resolve(rootArg ? rootArg.slice("--root=".length) : process.cwd());
const skipChecks = process.argv.includes("--skip-checks");
const backupRoot = join(
  root,
  ".patch-backups",
  `${LABEL}-${new Date().toISOString().replaceAll(":", "-")}`
);

const PATHS = {
  header: "packages/affiliate-core/src/components/Header.astro",
  sticky: "packages/affiliate-core/src/components/comparison/ComparisonStickyBar.astro",
  editorialCss: "packages/affiliate-core/src/components/comparison/comparison-editorial-cover.css",
  shell: "packages/affiliate-core/src/components/comparison/ComparisonShell.astro"
};

const exists = async (relativePath) => {
  try {
    await access(join(root, relativePath), constants.F_OK);
    return true;
  } catch {
    return false;
  }
};

const read = (relativePath) => readFile(join(root, relativePath), "utf8");

const backup = async (relativePath) => {
  if (!(await exists(relativePath))) return;
  const source = join(root, relativePath);
  const target = join(backupRoot, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target);
};

const write = async (relativePath, content) => {
  const target = join(root, relativePath);
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, content, "utf8");
  console.log(`Geändert: ${relativePath}`);
};

const runWorkspaceScript = async (script, required = true) => {
  const packageJson = JSON.parse(
    await readFile(join(root, "apps/pfotentechnik/package.json"), "utf8")
  );

  if (!packageJson.scripts?.[script]) {
    const message = `Workspace-Script fehlt: ${script}`;
    if (required) throw new Error(message);
    console.warn(`[${LABEL}] ${message}`);
    return false;
  }

  console.log(`\n> npm --workspace apps/pfotentechnik run ${script}`);
  const result = spawnSync(
    "npm",
    ["--workspace", "apps/pfotentechnik", "run", script],
    {
      cwd: root,
      encoding: "utf8",
      shell: process.platform === "win32",
      stdio: "inherit"
    }
  );

  if (required && result.status !== 0) {
    throw new Error(`Check fehlgeschlagen: ${script}`);
  }

  return result.status === 0;
};

const header = `---
interface HeaderLink {
  label: string;
  href: string;
  mobileGroup?: "Orientierung" | "Produktwelten" | "Mehr entdecken";
  mobileEmphasis?: boolean;
}

interface Props {
  projectName: string;
  links: HeaderLink[];
}

const { projectName, links } = Astro.props as Props;

const normalizePath = (value: string) => {
  const pathname = String(value || "/").split(/[?#]/, 1)[0] || "/";
  const withLeadingSlash = pathname.startsWith("/") ? pathname : \`/\${pathname}\`;
  return withLeadingSlash === "/" || withLeadingSlash.endsWith("/")
    ? withLeadingSlash
    : \`\${withLeadingSlash}/\`;
};

const currentPath = normalizePath(Astro.url.pathname);
const isCurrent = (href: string) => {
  const normalizedHref = normalizePath(href);
  return normalizedHref === "/"
    ? currentPath === "/"
    : currentPath === normalizedHref || currentPath.startsWith(normalizedHref);
};

const mobileGroupOrder = ["Orientierung", "Produktwelten", "Mehr entdecken"] as const;
const hasExplicitMobileGroups = links.some((link) => Boolean(link.mobileGroup));
const mobileGroups = hasExplicitMobileGroups
  ? mobileGroupOrder
      .map((label) => ({
        label,
        links: links.filter((link) => link.mobileGroup === label)
      }))
      .filter((group) => group.links.length > 0)
  : [{ label: "", links }];
---

<header class="site-header-v2" data-site-header data-header-version="15.4.3">
  <div class="header-container-v2">
    <a href="/" class="brand-lockup" aria-label={\`\${projectName} – Startseite\`}>
      <span class="brand-mark" aria-hidden="true">
        <span class="brand-mark__cut"></span>
        <span class="brand-mark__dot"></span>
      </span>
      <span class="brand-name">{projectName}</span>
    </a>

    <button
      class="pt-button nav-toggle-button"
      type="button"
      aria-label="Navigation öffnen"
      aria-expanded="false"
      aria-controls="main-navigation"
      data-nav-toggle
    >
      <span class="nav-toggle__bars" aria-hidden="true">
        <span></span>
        <span></span>
        <span></span>
      </span>
      <span class="nav-toggle__sr">Menü</span>
    </button>

    <nav
      id="main-navigation"
      class="main-nav-v2"
      aria-label="Hauptnavigation"
      data-main-navigation
    >
      <div class="main-nav-v2__desktop">
        {links.map((link) => (
          <a
            href={link.href}
            class:list={[isCurrent(link.href) && "is-current"]}
            aria-current={isCurrent(link.href) ? "page" : undefined}
          >
            {link.label}
          </a>
        ))}
      </div>

      <div class="main-nav-v2__mobile">
        {mobileGroups.map((group) => (
          <section class="main-nav-v2__group">
            {group.label && <span class="main-nav-v2__group-title">{group.label}</span>}
            <div class="main-nav-v2__group-links">
              {group.links.map((link) => (
                <a
                  href={link.href}
                  class:list={[
                    "main-nav-v2__mobile-link",
                    link.mobileEmphasis && "main-nav-v2__mobile-link--emphasis",
                    isCurrent(link.href) && "is-current"
                  ]}
                  aria-current={isCurrent(link.href) ? "page" : undefined}
                >
                  <span>{link.label}</span>
                  <span class="main-nav-v2__chevron" aria-hidden="true">›</span>
                </a>
              ))}
            </div>
          </section>
        ))}
      </div>
    </nav>
  </div>
</header>

<script>
  const setupHeaderNavigation = () => {
    document.querySelectorAll<HTMLElement>("[data-site-header]").forEach((header) => {
      if (header.dataset.navigationReady === "true") return;

      const button = header.querySelector<HTMLButtonElement>("[data-nav-toggle]");
      const navigation = header.querySelector<HTMLElement>("[data-main-navigation]");
      if (!button || !navigation) return;

      const desktop = window.matchMedia("(min-width: 64rem)");

      const setOpen = (open: boolean) => {
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute("aria-label", open ? "Navigation schließen" : "Navigation öffnen");
        navigation.toggleAttribute("data-open", open);
        navigation.setAttribute("aria-hidden", String(!open && !desktop.matches));
        header.toggleAttribute("data-navigation-open", open);
        document.documentElement.classList.toggle("pt-navigation-open", open);
      };

      header.dataset.navigationReady = "true";
      navigation.setAttribute("aria-hidden", String(!desktop.matches));
      setOpen(false);

      button.addEventListener("click", (event) => {
        event.stopPropagation();
        setOpen(button.getAttribute("aria-expanded") !== "true");
      });

      navigation.addEventListener("click", (event) => {
        if ((event.target as HTMLElement).closest("a")) setOpen(false);
      });

      document.addEventListener("click", (event) => {
        if (!header.contains(event.target as Node)) setOpen(false);
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
          setOpen(false);
          button.focus();
        }
      });

      desktop.addEventListener("change", (event) => {
        navigation.setAttribute("aria-hidden", String(!event.matches));
        setOpen(false);
      });
    });
  };

  setupHeaderNavigation();
  document.addEventListener("astro:page-load", setupHeaderNavigation);
  document.addEventListener("astro:before-swap", () => {
    document.documentElement.classList.remove("pt-navigation-open");
  });
</script>

<style is:global>
  .site-header-v2 .header-container-v2 {
    position: relative;
    display: grid;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
  }

  .site-header-v2 .main-nav-v2 {
    min-width: 0;
    margin-left: auto;
  }

  @media (min-width: 64rem) {
    .site-header-v2 .main-nav-v2 {
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
      transform: none;
    }
  }

  .site-header-v2 .main-nav-v2__desktop {
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: var(--pt-space-1);
  }

  .site-header-v2 .main-nav-v2__desktop a {
    white-space: nowrap;
  }

  .site-header-v2 .main-nav-v2__mobile,
  .site-header-v2 .nav-toggle-button {
    display: none;
  }

  .site-header-v2 .nav-toggle__sr {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  @media (max-width: 63.99rem) {
    html.pt-navigation-open {
      overflow: hidden;
    }

    .site-header-v2 .header-container-v2 {
      grid-template-columns: minmax(0, 1fr) auto;
      gap: var(--pt-space-3);
    }

    .site-header-v2 .nav-toggle-button {
      position: relative;
      display: grid;
      inline-size: 3.5rem;
      block-size: 3.5rem;
      min-inline-size: 3.5rem;
      min-block-size: 3.5rem;
      place-items: center;
      padding: 0;
      border: 1px solid var(--pt-color-border);
      border-radius: var(--pt-radius-lg);
      color: var(--pt-color-text);
      background: var(--pt-color-surface);
      box-shadow: var(--pt-shadow-xs);
      cursor: pointer;
      overflow: visible;
      touch-action: manipulation;
      appearance: none;
      transition:
        border-color var(--pt-transition-fast),
        background-color var(--pt-transition-fast);
    }

    .site-header-v2 .nav-toggle-button::before,
    .site-header-v2 .nav-toggle-button::after {
      display: none;
      content: none;
    }

    .site-header-v2 .nav-toggle-button:focus-visible {
      outline: var(--pt-focus-ring);
      outline-offset: var(--pt-focus-offset);
    }

    .site-header-v2 .nav-toggle__bars {
      position: relative;
      display: grid;
      width: 1.6rem;
      min-width: 1.6rem;
      gap: .34rem;
      overflow: visible;
    }

    .site-header-v2 .nav-toggle__bars > span {
      display: block;
      width: 100%;
      height: 3px;
      border-radius: var(--pt-radius-pill);
      background: currentColor;
      transform-origin: center;
      transition:
        transform var(--pt-transition-fast),
        opacity var(--pt-transition-fast);
    }

    .site-header-v2 .nav-toggle-button[aria-expanded="true"] .nav-toggle__bars > span:first-child {
      transform: translateY(.43rem) rotate(45deg) scaleX(1.08);
    }

    .site-header-v2 .nav-toggle-button[aria-expanded="true"] .nav-toggle__bars > span:nth-child(2) {
      opacity: 0;
    }

    .site-header-v2 .nav-toggle-button[aria-expanded="true"] .nav-toggle__bars > span:last-child {
      transform: translateY(-.43rem) rotate(-45deg) scaleX(1.08);
    }

    .site-header-v2 .main-nav-v2 {
      position: absolute;
      z-index: 110;
      top: calc(100% + var(--pt-space-2));
      right: 0;
      left: 0;
      max-height: calc(100dvh - 6rem);
      overflow-y: auto;
      margin: 0;
      padding: var(--pt-space-2);
      border: 1px solid var(--pt-color-border);
      border-radius: var(--pt-radius-xl);
      color: var(--pt-color-text);
      background: var(--pt-color-surface);
      box-shadow: var(--pt-shadow-lg);
      visibility: hidden;
      opacity: 0;
      pointer-events: none;
      transform: translateY(-.35rem);
      transform-origin: top center;
      contain: layout paint;
      will-change: transform, opacity;
      overscroll-behavior: contain;
      transition:
        opacity 120ms ease-out,
        transform 120ms ease-out,
        visibility 0s linear 120ms;
    }

    .site-header-v2 .main-nav-v2[data-open] {
      visibility: visible;
      opacity: 1;
      pointer-events: auto;
      transform: translateY(0);
      transition-delay: 0s;
    }

    .site-header-v2 .main-nav-v2__desktop {
      display: none;
    }

    .site-header-v2 .main-nav-v2__mobile {
      display: grid;
      gap: var(--pt-space-2);
    }

    .site-header-v2 .main-nav-v2__group {
      display: grid;
      gap: var(--pt-space-1);
      padding: var(--pt-space-2);
      border-radius: var(--pt-radius-lg);
      background: var(--pt-color-surface-subtle);
    }

    .site-header-v2 .main-nav-v2__group-title {
      padding: var(--pt-space-1) var(--pt-space-2);
      color: var(--pt-color-text-muted);
      font-size: var(--pt-font-size-xs);
      font-weight: var(--pt-font-weight-black);
      letter-spacing: var(--pt-letter-spacing-label);
      text-transform: uppercase;
    }

    .site-header-v2 .main-nav-v2__group-links {
      display: grid;
      gap: var(--pt-space-1);
    }

    .site-header-v2 .main-nav-v2__mobile-link {
      display: grid;
      grid-template-columns: minmax(0, 1fr) auto;
      min-height: 3rem;
      align-items: center;
      gap: var(--pt-space-3);
      padding: var(--pt-space-3);
      border: 1px solid transparent;
      border-radius: var(--pt-radius-md);
      color: var(--pt-color-text);
      background: transparent;
      font-weight: var(--pt-font-weight-bold);
      text-decoration: none;
    }

    .site-header-v2 .main-nav-v2__mobile-link:hover,
    .site-header-v2 .main-nav-v2__mobile-link:focus-visible {
      border-color: var(--pt-color-border);
      background: var(--pt-color-surface);
    }

    .site-header-v2 .main-nav-v2__mobile-link.is-current {
      color: var(--pt-color-brand-700);
      background: var(--pt-color-brand-050);
    }

    .site-header-v2 .main-nav-v2__chevron {
      color: var(--pt-color-text-muted);
      font-size: 1.3rem;
      line-height: 1;
    }
  }


  @media (min-width: 64rem) {
    .site-header-v2,
    .site-header-v2 .header-container-v2,
    .site-header-v2 .main-nav-v2,
    .site-header-v2 .main-nav-v2__desktop,
    .site-header-v2 .main-nav-v2__desktop a {
      backdrop-filter: none;
      -webkit-backdrop-filter: none;
    }

    .site-header-v2 .main-nav-v2 {
      contain: layout style;
      will-change: auto;
    }

    html[data-theme="dark"] .site-header-v2,
    html.dark .site-header-v2,
    body[data-theme="dark"] .site-header-v2,
    body.dark .site-header-v2 {
      background: var(--pt-color-surface);
    }

    html[data-theme="dark"] .site-header-v2 .main-nav-v2,
    html.dark .site-header-v2 .main-nav-v2,
    body[data-theme="dark"] .site-header-v2 .main-nav-v2,
    body.dark .site-header-v2 .main-nav-v2 {
      background: var(--pt-color-surface);
      box-shadow: none;
    }

    .site-header-v2 .main-nav-v2__desktop a {
      transition:
        color var(--pt-transition-fast),
        background-color var(--pt-transition-fast);
    }
  }

  @media (prefers-reduced-motion: reduce) {
    .site-header-v2 .main-nav-v2,
    .site-header-v2 .nav-toggle__bars > span {
      transition-duration: .01ms;
    }
  }
</style>
`;

const sticky = `---
import type { ComparisonProduct } from "../../comparison/model";
import { getPriceDisplay } from "../../comparison/price";

type Props = {
  product?: ComparisonProduct;
};

const { product } = Astro.props as Props;
const price = product ? getPriceDisplay(product.price) : null;
---

{product && (
  <aside
    class="comparison-sticky-bar"
    aria-label="Top-Empfehlung"
    data-comparison-sticky
    hidden
  >
    <div class="comparison-sticky-bar__identity">
      <span>Top-Empfehlung</span>
      <strong title={product.title}>{product.title}</strong>
    </div>

    <div class="comparison-sticky-bar__actions">
      <a
        href={product.href}
        class="pt-button comparison-button comparison-button--secondary"
      >
        Test lesen
      </a>

      {price?.url && (
        <a
          href={price.url}
          class="pt-button comparison-button"
          rel={price.rel}
          target={price.target}
          data-affiliate-link
        >
          Preis prüfen
        </a>
      )}
    </div>
  </aside>
)}

<script>
  const setupComparisonSticky = () => {
    document.querySelectorAll<HTMLElement>("[data-comparison-sticky]").forEach((sticky) => {
      if (sticky.dataset.ready === "true") return;
      sticky.dataset.ready = "true";

      const recommendation = document.getElementById("vergleichssieger");
      if (!recommendation) return;

      const update = () => {
        const rect = recommendation.getBoundingClientRect();
        const shouldShow = rect.bottom < window.innerHeight * .18;
        sticky.hidden = !shouldShow;
        sticky.toggleAttribute("data-visible", shouldShow);
      };

      update();
      window.addEventListener("scroll", update, { passive: true });
      window.addEventListener("resize", update, { passive: true });
    });
  };

  setupComparisonSticky();
  document.addEventListener("astro:page-load", setupComparisonSticky);
</script>

<style is:global>
  .comparison-sticky-bar {
    position: fixed;
    z-index: 90;
    right: max(var(--pt-space-3), env(safe-area-inset-right));
    bottom: max(var(--pt-space-3), env(safe-area-inset-bottom));
    left: max(var(--pt-space-3), env(safe-area-inset-left));
    display: grid;
    grid-template-columns: minmax(0, 1fr);
    gap: var(--pt-space-2);
    width: auto;
    max-width: 47.5rem;
    margin-inline: auto;
    padding: var(--pt-space-3);
    border: 1px solid var(--comparison-line);
    border-radius: var(--pt-radius-xl);
    color: var(--comparison-text);
    background: color-mix(in srgb, var(--comparison-surface-raised) 96%, transparent);
    box-shadow: var(--pt-shadow-lg);
    backdrop-filter: blur(18px) saturate(135%);
  }

  .comparison-sticky-bar[hidden] {
    display: none;
  }

  .comparison-sticky-bar__identity {
    display: grid;
    min-width: 0;
    gap: var(--pt-space-1);
  }

  .comparison-sticky-bar__identity span {
    color: var(--comparison-accent);
    font-size: var(--pt-font-size-xs);
    font-weight: var(--pt-font-weight-bold);
  }

  .comparison-sticky-bar__identity strong {
    overflow: hidden;
    display: -webkit-box;
    color: var(--comparison-text);
    font-size: var(--pt-font-size-sm);
    line-height: 1.2;
    overflow-wrap: anywhere;
    -webkit-box-orient: vertical;
    -webkit-line-clamp: 2;
  }

  .comparison-sticky-bar__actions {
    display: grid;
    grid-template-columns: minmax(0, .9fr) minmax(0, 1.1fr);
    gap: var(--pt-space-2);
  }

  .comparison-sticky-bar .comparison-button {
    width: 100%;
    min-width: 0;
    min-height: 3rem;
    padding: var(--pt-space-2) var(--pt-space-3);
    font-size: var(--pt-font-size-sm);
  }

  @media (min-width: 48rem) {
    .comparison-sticky-bar {
      grid-template-columns: minmax(0, 1fr) auto;
      align-items: center;
    }

    .comparison-sticky-bar__actions {
      grid-template-columns: repeat(2, minmax(10rem, auto));
    }
  }

  @media print {
    .comparison-sticky-bar {
      display: none;
    }
  }
</style>
`;

const cssPatch = `
/* PT_RENDERED_COMPARISON_UI_15_4_0_START */
.comparison-cover,
.comparison-cover h1,
.comparison-cover__copy,
.comparison-cover__copy > p,
.comparison-cover__fact dt,
.comparison-cover__fact dd {
  color: var(--comparison-text);
}

.comparison-cover__copy > p,
.comparison-cover__fact dd {
  color: var(--comparison-muted);
}

.comparison-cover__fact,
.comparison-cover-filter,
.comparison-editorial-recommendation {
  border-color: var(--comparison-line);
  background: var(--comparison-surface);
}

.comparison-cover-filter {
  min-height: 0;
  padding: var(--pt-space-3);
  border-radius: var(--pt-radius-lg);
}

.comparison-cover-filter__label {
  margin-bottom: var(--pt-space-2);
  color: var(--comparison-muted);
}

.comparison-cover-filter__control {
  min-height: 3rem;
  padding: 0;
  border: 1px solid var(--comparison-line);
  border-radius: var(--pt-radius-md);
  background: var(--comparison-surface-soft);
}

.comparison-cover-filter select,
.comparison-cover-filter__select {
  min-height: 3rem;
  padding: 0 2.5rem 0 var(--pt-space-3);
  color: var(--comparison-text);
}

.comparison-cover-filter__chevron {
  right: var(--pt-space-3);
}

.comparison-cover-filters__reset {
  color: var(--comparison-accent);
  opacity: 1;
}

.comparison-editorial-recommendation {
  padding: var(--pt-space-4);
  background:
    linear-gradient(
      145deg,
      color-mix(in srgb, var(--comparison-accent) 8%, var(--comparison-surface)),
      var(--comparison-surface) 48%
    );
}

.comparison-editorial-recommendation__heading,
.comparison-editorial-recommendation h2,
.comparison-editorial-recommendation h2 a,
.comparison-editorial-recommendation li,
.comparison-editorial-recommendation__details {
  color: var(--comparison-text);
}

.comparison-editorial-recommendation__copy p,
.comparison-editorial-recommendation__manufacturer {
  color: var(--comparison-muted);
}

.comparison-editorial-recommendation__body {
  gap: var(--pt-space-4);
}

.comparison-editorial-recommendation__media {
  min-height: 0;
  aspect-ratio: 4 / 3;
  background: var(--comparison-surface-soft);
}

.comparison-editorial-recommendation__media img {
  max-height: none;
  object-fit: contain;
}

.comparison-editorial-recommendation__decision {
  padding-top: var(--pt-space-3);
  border-top: 1px solid var(--comparison-line);
}

@media (max-width: 47.99rem) {
  .comparison-cover-filters__grid {
    gap: var(--pt-space-2);
  }

  .comparison-cover-filters__actions {
    margin-top: var(--pt-space-2);
  }

  .comparison-editorial-recommendation__heading {
    margin-bottom: var(--pt-space-3);
  }

  .comparison-editorial-recommendation__body {
    grid-template-columns: minmax(0, 1fr);
  }

  .comparison-editorial-recommendation__copy {
    order: 1;
  }

  .comparison-editorial-recommendation__media {
    order: 2;
  }

  .comparison-editorial-recommendation__decision {
    order: 3;
  }
}

@media (min-width: 48rem) {
  .comparison-editorial-recommendation__body {
    grid-template-columns: minmax(220px, .8fr) minmax(0, 1.25fr) minmax(210px, .7fr);
  }
}
/* PT_RENDERED_COMPARISON_UI_15_4_0_END */

/* PT_DESKTOP_DARK_PERFORMANCE_15_4_3_START */
@media (min-width: 64rem) {
  html[data-theme="dark"] .comparison-cover__fact,
  html[data-theme="dark"] .comparison-cover-filter,
  html[data-theme="dark"] .comparison-editorial-recommendation,
  html.dark .comparison-cover__fact,
  html.dark .comparison-cover-filter,
  html.dark .comparison-editorial-recommendation {
    background: var(--comparison-surface);
    box-shadow: none;
    backdrop-filter: none;
    -webkit-backdrop-filter: none;
  }

  html[data-theme="dark"] .comparison-cover-filters,
  html.dark .comparison-cover-filters {
    background: var(--comparison-page-bg);
    box-shadow: none;
  }

  html[data-theme="dark"] .comparison-cover__media,
  html.dark .comparison-cover__media {
    contain: layout paint;
  }

  html[data-theme="dark"] .comparison-editorial-recommendation,
  html.dark .comparison-editorial-recommendation {
    background:
      linear-gradient(
        145deg,
        color-mix(in srgb, var(--comparison-accent) 5%, var(--comparison-surface)),
        var(--comparison-surface) 40%
      );
  }
}
/* PT_DESKTOP_DARK_PERFORMANCE_15_4_3_END */

`;

for (const path of Object.values(PATHS)) await backup(path);

await write(PATHS.header, header);
await write(PATHS.sticky, sticky);

let editorialCss = await read(PATHS.editorialCss);
editorialCss = editorialCss
  .replace(
    /\/\* PT_RENDERED_COMPARISON_UI_15_4_0_START \*\/[\s\S]*?\/\* PT_RENDERED_COMPARISON_UI_15_4_0_END \*\//g,
    ""
  )
  .replace(
    /\/\* PT_DESKTOP_DARK_PERFORMANCE_15_4_3_START \*\/[\s\S]*?\/\* PT_DESKTOP_DARK_PERFORMANCE_15_4_3_END \*\//g,
    ""
  )
  .trimEnd();
editorialCss = `${editorialCss}\n${cssPatch}`;
await write(PATHS.editorialCss, editorialCss);

let shell = await read(PATHS.shell);
shell = shell.replace(
  /data-comparison-cover-version="[^"]+"/,
  'data-comparison-cover-version="15.4.3"'
);
await write(PATHS.shell, shell);

const writtenHeader = await read(PATHS.header);
const writtenSticky = await read(PATHS.sticky);
const writtenCss = await read(PATHS.editorialCss);

if (!writtenHeader.includes('class="pt-button nav-toggle-button"')) {
  throw new Error("Header-Toggle ist nicht als pt-button adoptiert.");
}
if (!writtenHeader.includes("nav-toggle__bars")) {
  throw new Error("Stabiler Hamburger wurde nicht geschrieben.");
}
if (!writtenHeader.includes(".nav-toggle-button::before") || !writtenHeader.includes("content: none")) {
  throw new Error("pt-button-Dekorationen wurden am Header-Toggle nicht neutralisiert.");
}
if (writtenHeader.includes("navigation.hidden")) {
  throw new Error("Navigation verwendet weiterhin langsames hidden-Layout-Toggling.");
}
if (!writtenHeader.includes("contain: layout paint") || !writtenHeader.includes("touch-action: manipulation")) {
  throw new Error("Menü-Performance-Regeln wurden nicht geschrieben.");
}
if (!writtenHeader.includes("width: 1.6rem") || !writtenHeader.includes("height: 3px")) {
  throw new Error("Kräftigere Burger-Icon-Geometrie fehlt.");
}
if (!writtenHeader.includes("overflow: visible")) {
  throw new Error("X-Clipping-Schutz fehlt.");
}
if (!writtenCss.includes("PT_DESKTOP_DARK_PERFORMANCE_15_4_3_START")) {
  throw new Error("Desktop-Dark-Mode-Performance-Block fehlt.");
}
if ((writtenSticky.match(/!important/g) ?? []).length > 0) {
  throw new Error("Sticky-Bar enthält weiterhin !important-Regeln.");
}
if (!writtenSticky.includes("rect.bottom < window.innerHeight * .18")) {
  throw new Error("Sticky-Sichtbarkeitslogik fehlt.");
}
if (!writtenCss.includes("PT_RENDERED_COMPARISON_UI_15_4_0_START")) {
  throw new Error("Comparison-CSS-Patch fehlt.");
}

if (!skipChecks) {
  await runWorkspaceScript("comparison:hero:audit");
  await runWorkspaceScript("comparison:audit:strict");
  await runWorkspaceScript("design-system:tokens:audit");
  await runWorkspaceScript("design-system:components:audit");
  await runWorkspaceScript("design-system:responsive:audit");
  await runWorkspaceScript("design-system:visual-qa:strict");
  await runWorkspaceScript("build");
  await runWorkspaceScript("design-system:budget:audit", false);
}

console.log(`\n[${LABEL}] ABGESCHLOSSEN.`);
console.log(`Backups: ${backupRoot.replace(`${root}/`, "")}`);
console.log("Direkt auf den gerenderten Komponenten behoben:");
console.log("- stabiler Hamburger-/Close-State mit auditkonformer pt-button-Adoption");
console.log("- Menü bleibt vorgerendert und öffnet compositor-basiert ohne Layout-Neuaufbau");
console.log("- Touch-Delay und globale pt-button-Transition am Toggle begrenzt");
console.log("- kräftigeres 24–26px Burger-Icon und größeres, nicht abgeschnittenes X");
console.log("- Desktop-Dark-Mode ohne großflächige Blur-/Transparenzkosten");
console.log("- kompaktes mobiles Navigationspanel");
console.log("- Dark-Mode-Farben für Hero, Filter und Recommendation");
console.log("- kompakte Filter-Control-Flächen");
console.log("- redaktionelle Recommendation-Hierarchie");
console.log("- Sticky CTA erst nach Verlassen der Top-Empfehlung");
console.log("- Sticky-CSS von mehreren Override-Blöcken auf einen Block reduziert");
console.log("- sämtliche !important-Regeln aus der Sticky-Komponente entfernt");

#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const NAME = "pfotentechnik-header-navigation-13.1.0";
const args = new Set(process.argv.slice(2));
const CHECK_ONLY = args.has("--check") || args.has("--dry-run");
const NO_BUILD = args.has("--no-build");
const COMMIT = args.has("--commit");

const log = (message) => console.log(`[${NAME}] ${message}`);
const fail = (message) => {
  console.error(`[${NAME}] FEHLER: ${message}`);
  process.exit(1);
};

function findRoot(start) {
  let current = path.resolve(start);

  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik", "package.json")) &&
      fs.existsSync(path.join(current, "packages", "affiliate-core"))
    ) {
      return current;
    }

    const parent = path.dirname(current);
    if (parent === current) return null;
    current = parent;
  }
}

const root =
  findRoot(process.cwd()) ||
  findRoot(path.dirname(fileURLToPath(import.meta.url)));

if (!root) {
  fail("Repository-Root nicht gefunden. Starte den Installer im affiliate-template-Repository.");
}

const files = {
  header: path.join(root, "packages/affiliate-core/src/components/Header.astro"),
  affiliateLayout: path.join(root, "packages/affiliate-core/src/layouts/AffiliateLayout.astro"),
  projectLayout: path.join(root, "apps/pfotentechnik/src/layouts/ProjectLayout.astro"),
  projectConfig: path.join(root, "apps/pfotentechnik/src/project.config.ts"),
  test: path.join(root, "apps/pfotentechnik/test/header-navigation-13.1.0.test.mjs"),
  report: path.join(
    root,
    "apps/pfotentechnik/reports/design-system/header-navigation-13.1.0.md"
  )
};

for (const [key, file] of Object.entries(files)) {
  if (key === "test" || key === "report") continue;
  if (!fs.existsSync(file)) {
    fail(`Pflichtdatei fehlt: ${path.relative(root, file)}`);
  }
}

const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupRoot = path.join(root, ".patch-backups", `${NAME}-${timestamp}`);
const relative = (file) => path.relative(root, file).split(path.sep).join("/");
const read = (file) => fs.readFileSync(file, "utf8");
const ensureDir = (dir) => fs.mkdirSync(dir, { recursive: true });

function backup(file) {
  if (CHECK_ONLY || !fs.existsSync(file)) return;
  const target = path.join(backupRoot, relative(file));
  ensureDir(path.dirname(target));
  fs.copyFileSync(file, target);
}

function write(file, content) {
  const before = fs.existsSync(file) ? read(file) : "";
  if (before === content) return false;

  if (!CHECK_ONLY) {
    backup(file);
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, content);
  }

  return true;
}

function replaceArrayProperty(content, propertyName, replacement) {
  const marker = `${propertyName}:`;
  const propertyIndex = content.indexOf(marker);

  if (propertyIndex === -1) {
    fail(`Eigenschaft nicht gefunden: ${propertyName}`);
  }

  const lineStart = content.lastIndexOf("\n", propertyIndex) + 1;
  const arrayStart = content.indexOf("[", propertyIndex);

  if (arrayStart === -1) {
    fail(`Array-Start nicht gefunden: ${propertyName}`);
  }

  let depth = 0;
  let quote = null;
  let escaped = false;
  let lineComment = false;
  let blockComment = false;
  let arrayEnd = -1;

  for (let index = arrayStart; index < content.length; index += 1) {
    const char = content[index];
    const next = content[index + 1];

    if (lineComment) {
      if (char === "\n") lineComment = false;
      continue;
    }

    if (blockComment) {
      if (char === "*" && next === "/") {
        blockComment = false;
        index += 1;
      }
      continue;
    }

    if (quote) {
      if (escaped) {
        escaped = false;
        continue;
      }

      if (char === "\\") {
        escaped = true;
        continue;
      }

      if (char === quote) quote = null;
      continue;
    }

    if (char === "/" && next === "/") {
      lineComment = true;
      index += 1;
      continue;
    }

    if (char === "/" && next === "*") {
      blockComment = true;
      index += 1;
      continue;
    }

    if (char === '"' || char === "'" || char === "`") {
      quote = char;
      continue;
    }

    if (char === "[") depth += 1;
    if (char === "]") {
      depth -= 1;
      if (depth === 0) {
        arrayEnd = index;
        break;
      }
    }
  }

  if (arrayEnd === -1) {
    fail(`Array-Ende nicht gefunden: ${propertyName}`);
  }

  return content.slice(0, lineStart) + replacement + content.slice(arrayEnd + 1);
}

function run(command, commandArgs) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: false
  });
  return result.status === 0;
}

const canonicalHeader = `---
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

const {
  projectName,
  links
} = Astro.props as Props;

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

const mobileGroupOrder = [
  "Orientierung",
  "Produktwelten",
  "Mehr entdecken"
] as const;

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

<header class="site-header-v2" data-site-header>
  <div class="header-container-v2">
    <a href="/" class="brand-lockup" aria-label={\`\${projectName} – Startseite\`}>
      <span class="brand-mark" aria-hidden="true">
        <span class="brand-mark__cut"></span>
        <span class="brand-mark__dot"></span>
      </span>
      <span class="brand-name">{projectName}</span>
    </a>

    <button
      class="nav-toggle-button"
      type="button"
      aria-label="Navigation öffnen"
      aria-expanded="false"
      aria-controls="main-navigation"
      data-nav-toggle
    >
      <svg
        class="nav-toggle__glyph"
        viewBox="0 0 24 24"
        width="24"
        height="24"
        aria-hidden="true"
        focusable="false"
      >
        <path
          class="nav-toggle__icon nav-toggle__icon--menu"
          d="M5 8h14M5 16h14"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
        <path
          class="nav-toggle__icon nav-toggle__icon--close"
          d="m7 7 10 10M17 7 7 17"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
          stroke-linecap="round"
        />
      </svg>
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
            {group.label && (
              <span class="main-nav-v2__group-title">{group.label}</span>
            )}
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
  const initializeNavigation = () => {
    document.querySelectorAll<HTMLButtonElement>("[data-nav-toggle]").forEach((button) => {
      if (button.dataset.initialized === "true") return;

      const navigationId = button.getAttribute("aria-controls");
      const navigation = navigationId ? document.getElementById(navigationId) : null;
      const header = button.closest<HTMLElement>("[data-site-header]");
      if (!navigation || !header) return;

      const desktopQuery = window.matchMedia("(min-width: 64rem)");

      const setOpen = (open: boolean) => {
        button.setAttribute("aria-expanded", String(open));
        button.setAttribute("aria-label", open ? "Navigation schließen" : "Navigation öffnen");
        navigation.toggleAttribute("data-open", open);
        document.documentElement.classList.toggle("pt-navigation-open", open);
      };

      button.dataset.initialized = "true";

      button.addEventListener("click", () => {
        setOpen(button.getAttribute("aria-expanded") !== "true");
      });

      navigation.addEventListener("click", (event) => {
        if ((event.target as HTMLElement).closest("a")) setOpen(false);
      });

      document.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && button.getAttribute("aria-expanded") === "true") {
          setOpen(false);
          button.focus();
        }
      });

      document.addEventListener("click", (event) => {
        const target = event.target as Node;
        if (!header.contains(target)) setOpen(false);
      });

      desktopQuery.addEventListener("change", (event) => {
        if (event.matches) setOpen(false);
      });
    });
  };

  initializeNavigation();
  document.addEventListener("astro:page-load", initializeNavigation);
  document.addEventListener("astro:before-swap", () => {
    document.documentElement.classList.remove("pt-navigation-open");
  });
</script>

<style is:global>
  .site-header-v2 .header-container-v2 {
    position: relative;
    display: grid !important;
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
  }

  .site-header-v2 .main-nav-v2 {
    min-width: 0;
    margin-left: auto;
  }

  .site-header-v2 .main-nav-v2__desktop {
    display: flex;
    min-width: 0;
    align-items: center;
    justify-content: flex-end;
    gap: .25rem;
  }

  .site-header-v2 .main-nav-v2__desktop a {
    white-space: nowrap;
  }

  .site-header-v2 .main-nav-v2__desktop a.is-current {
    color: var(--pt-color-text, var(--text));
    background: var(--pt-color-surface-subtle, #f1f5f9);
  }

  .site-header-v2 .main-nav-v2__mobile {
    display: none;
  }

  .site-header-v2 .nav-toggle-button {
    display: none;
  }

  .site-header-v2 .nav-toggle-button::before,
  .site-header-v2 .nav-toggle-button::after {
    display: none !important;
    content: none !important;
  }

  .site-header-v2 .nav-toggle__sr {
    position: absolute;
    inline-size: 1px;
    block-size: 1px;
    overflow: hidden;
    clip-path: inset(50%);
    white-space: nowrap;
  }

  .site-header-v2 .nav-toggle__icon--close {
    display: none;
  }

  .site-header-v2 .nav-toggle-button[aria-expanded="true"] .nav-toggle__icon--menu {
    display: none;
  }

  .site-header-v2 .nav-toggle-button[aria-expanded="true"] .nav-toggle__icon--close {
    display: block;
  }

  @media (max-width: 63.99rem) {
    html.pt-navigation-open {
      overflow: hidden;
    }

    .site-header-v2 .header-container-v2 {
      grid-template-columns: minmax(0, 1fr) auto !important;
      gap: var(--pt-space-3, .75rem);
    }

    .site-header-v2 .nav-toggle-button {
      position: relative;
      display: inline-grid !important;
      inline-size: 3rem;
      block-size: 3rem;
      min-inline-size: 3rem;
      min-block-size: 3rem;
      place-items: center;
      padding: 0 !important;
      border: 1px solid var(--pt-color-border-strong, rgba(15, 23, 42, .16));
      border-radius: var(--pt-radius-lg, 1rem);
      color: var(--pt-color-text, var(--text));
      background: var(--pt-color-surface, #fff);
      box-shadow: var(--pt-shadow-xs, 0 1px 2px rgba(15, 23, 42, .06));
      cursor: pointer;
      appearance: none;
    }

    .site-header-v2 .nav-toggle-button:hover {
      border-color: var(--pt-color-brand-500, #22a95b);
      background: var(--pt-color-surface-subtle, #f8fafc);
    }

    .site-header-v2 .nav-toggle__glyph {
      display: block;
      inline-size: 1.35rem;
      block-size: 1.35rem;
      pointer-events: none;
    }

    .site-header-v2 .main-nav-v2 {
      position: absolute !important;
      z-index: 110;
      top: calc(100% + .55rem) !important;
      right: 0 !important;
      left: 0 !important;
      display: none !important;
      max-height: calc(100dvh - 6.5rem);
      overflow-y: auto;
      margin: 0 !important;
      padding: .55rem !important;
      border: 1px solid var(--pt-color-border, rgba(15, 23, 42, .1)) !important;
      border-radius: var(--pt-radius-xl, 1.25rem) !important;
      color: var(--pt-color-text, var(--text)) !important;
      background: color-mix(
        in srgb,
        var(--pt-color-surface, #fff) 96%,
        transparent
      ) !important;
      box-shadow: 0 24px 64px rgba(15, 23, 42, .18) !important;
      backdrop-filter: blur(20px) saturate(145%);
      overscroll-behavior: contain;
    }

    .site-header-v2 .main-nav-v2[data-open] {
      display: block !important;
    }

    .site-header-v2 .main-nav-v2__desktop {
      display: none !important;
    }

    .site-header-v2 .main-nav-v2__mobile {
      display: grid;
      gap: .25rem;
    }

    .site-header-v2 .main-nav-v2__group {
      display: grid;
      gap: .35rem;
      padding: .55rem;
    }

    .site-header-v2 .main-nav-v2__group + .main-nav-v2__group {
      border-top: 1px solid var(--pt-color-border, rgba(15, 23, 42, .1));
    }

    .site-header-v2 .main-nav-v2__group-title {
      padding: .25rem .55rem .15rem;
      color: var(--pt-color-text-muted, var(--muted));
      font-size: .7rem;
      font-weight: 850;
      letter-spacing: .08em;
      text-transform: uppercase;
    }

    .site-header-v2 .main-nav-v2__group-links {
      display: grid;
      gap: .2rem;
    }

    .site-header-v2 .main-nav-v2__mobile-link {
      display: grid !important;
      grid-template-columns: minmax(0, 1fr) auto;
      min-height: 3.15rem !important;
      align-items: center;
      gap: .75rem;
      padding: .72rem .8rem !important;
      border: 1px solid transparent;
      border-radius: var(--pt-radius-md, .85rem) !important;
      color: var(--pt-color-text, var(--text)) !important;
      background: transparent;
      font-size: .98rem !important;
      font-weight: 760 !important;
      line-height: 1.25;
      text-decoration: none;
    }

    .site-header-v2 .main-nav-v2__mobile-link:hover,
    .site-header-v2 .main-nav-v2__mobile-link:focus-visible {
      border-color: var(--pt-color-border, rgba(15, 23, 42, .1));
      background: var(--pt-color-surface-subtle, #f8fafc);
    }

    .site-header-v2 .main-nav-v2__mobile-link.is-current {
      color: var(--pt-color-brand-700, #15824d) !important;
      background: var(--pt-color-brand-050, #eefbf3);
    }

    .site-header-v2 .main-nav-v2__mobile-link--emphasis {
      border-color: color-mix(
        in srgb,
        var(--pt-color-brand-500, #22a95b) 28%,
        var(--pt-color-border, rgba(15, 23, 42, .1))
      );
      background: color-mix(
        in srgb,
        var(--pt-color-brand-050, #eefbf3) 74%,
        var(--pt-color-surface, #fff)
      );
    }

    .site-header-v2 .main-nav-v2__chevron {
      color: var(--pt-color-text-muted, var(--muted));
      font-size: 1.35rem;
      font-weight: 500;
      line-height: 1;
    }
  }

  @media (prefers-color-scheme: dark) {
    :root:not([data-theme="light"]):not(.light) .site-header-v2 .main-nav-v2 {
      background: color-mix(
        in srgb,
        var(--pt-color-surface, #111c2e) 96%,
        transparent
      ) !important;
      box-shadow: 0 24px 64px rgba(0, 0, 0, .38) !important;
    }
  }

  html[data-theme="dark"] .site-header-v2 .main-nav-v2,
  html.dark .site-header-v2 .main-nav-v2,
  body[data-theme="dark"] .site-header-v2 .main-nav-v2,
  body.dark .site-header-v2 .main-nav-v2 {
    background: color-mix(
      in srgb,
      var(--pt-color-surface, #111c2e) 96%,
      transparent
    ) !important;
    box-shadow: 0 24px 64px rgba(0, 0, 0, .38) !important;
  }
</style>
`;

let affiliateLayout = read(files.affiliateLayout);
affiliateLayout = affiliateLayout.replace(
  /headerLinks\?: Array<\{\s*label: string;\s*href: string;\s*\}>;/m,
  `headerLinks?: Array<{
    label: string;
    href: string;
    mobileGroup?: "Orientierung" | "Produktwelten" | "Mehr entdecken";
    mobileEmphasis?: boolean;
  }>;`
);

let projectLayout = read(files.projectLayout);
projectLayout = projectLayout
  .replace(
    /import\s+\{\s*getNavigationItems\s*\}\s+from\s+["']@app\/domain\/content["'];?\s*\n/,
    ""
  )
  .replace(/\nconst headerLinks = await getNavigationItems\(\);\s*/, "\n")
  .replace(/\n\s*headerLinks=\{headerLinks\}\s*/, "\n");

if (/getNavigationItems|headerLinks=\{headerLinks\}/.test(projectLayout)) {
  fail("ProjectLayout überschreibt die konfigurierte Hauptnavigation weiterhin.");
}

const canonicalHeaderLinks = `  headerLinks: [
    {
      label: "Vergleiche",
      href: "/vergleiche/",
      mobileGroup: "Orientierung"
    },
    {
      label: "Futterautomaten",
      href: "/smarte-futterautomaten/",
      mobileGroup: "Produktwelten"
    },
    {
      label: "Trinkbrunnen",
      href: "/trinkbrunnen/",
      mobileGroup: "Produktwelten"
    },
    {
      label: "GPS-Tracker",
      href: "/gps-tracker/",
      mobileGroup: "Produktwelten"
    },
    {
      label: "Wissen & Ratgeber",
      href: "/wissen/",
      mobileGroup: "Mehr entdecken"
    },
    {
      label: "Hersteller",
      href: "/hersteller/",
      mobileGroup: "Mehr entdecken"
    },
    {
      label: "Kaufberatung",
      href: "/kaufberatung/",
      mobileGroup: "Orientierung",
      mobileEmphasis: true
    }
  ]`;

let projectConfig = read(files.projectConfig);
projectConfig = replaceArrayProperty(
  projectConfig,
  "headerLinks",
  canonicalHeaderLinks
);

const testSource = `import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const repoRoot = path.resolve(appRoot, "..", "..");
const read = (relative) => fs.readFile(path.join(repoRoot, relative), "utf8");

test("PfotenTechnik uses the curated project navigation", async () => {
  const projectLayout = await read("apps/pfotentechnik/src/layouts/ProjectLayout.astro");
  const projectConfig = await read("apps/pfotentechnik/src/project.config.ts");

  assert.doesNotMatch(projectLayout, /getNavigationItems|headerLinks=\\{headerLinks\\}/);
  assert.match(projectConfig, /label: "Vergleiche"[\\s\\S]*href: "\\/vergleiche\\/"/);
  assert.match(projectConfig, /label: "Kaufberatung"[\\s\\S]*href: "\\/kaufberatung\\/"/);
  assert.match(projectConfig, /mobileGroup: "Orientierung"/);
  assert.match(projectConfig, /mobileGroup: "Produktwelten"/);
  assert.match(projectConfig, /mobileGroup: "Mehr entdecken"/);
});

test("burger button renders exactly one icon system", async () => {
  const header = await read("packages/affiliate-core/src/components/Header.astro");

  assert.doesNotMatch(header, /class="pt-button nav-toggle-button"/);
  assert.match(header, /nav-toggle__icon--menu/);
  assert.match(header, /nav-toggle__icon--close/);
  assert.match(header, /\\.nav-toggle-button::before,[\\s\\S]*content: none !important/);
});

test("mobile menu is grouped and accessible", async () => {
  const header = await read("packages/affiliate-core/src/components/Header.astro");

  assert.match(header, /main-nav-v2__group-title/);
  assert.match(header, /aria-current=/);
  assert.match(header, /Navigation schließen/);
  assert.match(header, /event\\.key === "Escape"/);
  assert.match(header, /max-height: calc\\(100dvh/);
});
`;

const changed = {
  header: write(files.header, canonicalHeader),
  affiliateLayout: write(files.affiliateLayout, affiliateLayout),
  projectLayout: write(files.projectLayout, projectLayout),
  projectConfig: write(files.projectConfig, projectConfig),
  test: write(files.test, testSource)
};

const changedFiles = Object.entries(changed)
  .filter(([, didChange]) => didChange)
  .map(([key]) => relative(files[key]));

const publicChecks = [
  ["Vergleiche-Link", /href:\s*"\/vergleiche\/"/, projectConfig],
  ["Kaufberatung-Link", /href:\s*"\/kaufberatung\/"/, projectConfig],
  ["Gruppiertes Mobilmenü", /main-nav-v2__group-title/, canonicalHeader],
  ["Pseudo-Icon deaktiviert", /content: none !important/, canonicalHeader],
  ["Einzelnes SVG-System", /nav-toggle__icon--menu[\s\S]*nav-toggle__icon--close/, canonicalHeader]
];

for (const [label, pattern, content] of publicChecks) {
  if (!pattern.test(content)) fail(`Validierung fehlgeschlagen: ${label}`);
}

const report = `# Header Navigation 13.1.0

## Behoben

- doppeltes Burger-Icon entfernt
- SVG-Menü- und Schließen-Zustand sauber getrennt
- dynamische Navigation aus Content-Frontmatter im ProjectLayout beendet
- projectConfig ist wieder die verlässliche Quelle der Hauptnavigation
- Vergleiche und Kaufberatung ergänzt
- mobile Navigation in Orientierung, Produktwelten und Mehr entdecken gegliedert
- aktiver Menüpunkt, Escape, Outside-Click und Viewport-Wechsel berücksichtigt
- mobile Menüfläche scrollbar und Dark-Mode-fähig
- Kaufberatung im Mobilmenü dezent hervorgehoben, ohne Header-CTA

## Desktop-Reihenfolge

1. Vergleiche
2. Futterautomaten
3. Trinkbrunnen
4. GPS-Tracker
5. Wissen & Ratgeber
6. Hersteller
7. Kaufberatung

## Geänderte Dateien

${changedFiles.length > 0 ? changedFiles.map((file) => `- ${file}`).join("\n") : "- keine, Stand bereits aktuell"}
`;

if (CHECK_ONLY) {
  log("Check erfolgreich. Es wurde nichts verändert.");
  if (changedFiles.length > 0) {
    log("Würde ändern:");
    for (const file of changedFiles) log(`- ${file}`);
  } else {
    log("Der Stand ist bereits aktuell.");
  }
  process.exit(0);
}

ensureDir(path.dirname(files.report));
fs.writeFileSync(files.report, report);

log(`Backups: ${relative(backupRoot)}`);
log(`Report: ${relative(files.report)}`);

if (!run("node", ["--test", relative(files.test)])) {
  fail("Header-Navigationstest fehlgeschlagen.");
}

if (!NO_BUILD && !run("npm", ["run", "build:pfotentechnik"])) {
  fail("PfotenTechnik-Build fehlgeschlagen. Änderungen und Backups bleiben zur Prüfung erhalten.");
}

if (COMMIT) {
  const status = spawnSync("git", ["status", "--porcelain"], {
    cwd: root,
    encoding: "utf8"
  });

  if (status.status !== 0) fail("git status fehlgeschlagen.");

  if (status.stdout.trim()) {
    const filesToAdd = [...changedFiles, relative(files.report)];
    if (!run("git", ["add", ...filesToAdd])) fail("git add fehlgeschlagen.");
    if (
      !run("git", [
        "commit",
        "-m",
        "fix(pfotentechnik): clarify mobile navigation"
      ])
    ) {
      fail("Commit fehlgeschlagen.");
    }
    log("Lokal committed.");
  } else {
    log("Keine offenen Änderungen.");
  }
}

log("Header Navigation 13.1.0 erfolgreich abgeschlossen.");

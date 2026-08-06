#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import process from "node:process";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const PATCH = "pfotentechnik-comparison-experience-32.0.2";
const scriptFile = fileURLToPath(import.meta.url);

function findRoot(start) {
  let current = path.resolve(start);
  while (true) {
    if (
      fs.existsSync(path.join(current, "package.json")) &&
      fs.existsSync(path.join(current, "apps", "pfotentechnik")) &&
      fs.existsSync(path.join(current, "packages", "affiliate-core"))
    ) return current;
    const parent = path.dirname(current);
    if (parent === current) throw new Error(`[${PATCH}] Repository-Root nicht gefunden.`);
    current = parent;
  }
}

const root = findRoot(process.cwd());
const stamp = new Date().toISOString().replace(/[:.]/g, "-");
const backupDir = path.join(root, ".patch-backups", `${PATCH}-${stamp}`);

const files = {
  shell: path.join(root, "packages/affiliate-core/src/components/comparison/ComparisonShell.astro"),
  explorer: path.join(root, "packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro"),
  hero: path.join(root, "packages/affiliate-core/src/components/comparison/ComparisonHero.astro"),
  experience: path.join(root, "packages/affiliate-core/src/components/comparison/comparison-experience.css"),
  system: path.join(root, "packages/affiliate-core/src/components/comparison/comparison-system.css"),
  explorerCss: path.join(root, "packages/affiliate-core/src/components/comparison/comparison-explorer-v2.css"),
  tokens: path.join(root, "packages/affiliate-core/src/components/comparison/comparison-tokens.css"),
  test: path.join(root, "apps/pfotentechnik/test/pfotentechnik-comparison-experience-32.0.2.test.mjs")
};

for (const key of ["shell", "explorer", "hero", "system", "explorerCss", "tokens"]) {
  if (!fs.existsSync(files[key])) {
    throw new Error(`[${PATCH}] Erwartete Datei fehlt: ${path.relative(root, files[key])}`);
  }
}

const originals = new Map();
const changed = [];

function read(file) {
  return fs.readFileSync(file, "utf8");
}

function backup(file) {
  if (originals.has(file)) return;
  const value = fs.existsSync(file) ? fs.readFileSync(file) : null;
  originals.set(file, value);
  if (value === null) return;
  const target = path.join(backupDir, path.relative(root, file));
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.writeFileSync(target, value);
}

function write(file, content) {
  const previous = fs.existsSync(file) ? read(file) : "";
  const next = previous.includes("\r\n")
    ? content.replace(/\r?\n/g, "\r\n")
    : content.replace(/\r\n/g, "\n");
  if (previous === next) return;
  backup(file);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, next, "utf8");
  changed.push(path.relative(root, file));
}

function rollback() {
  for (const [file, value] of [...originals.entries()].reverse()) {
    if (value === null) fs.rmSync(file, { force: true });
    else {
      fs.mkdirSync(path.dirname(file), { recursive: true });
      fs.writeFileSync(file, value);
    }
  }
}

function run(command, args) {
  console.log(`[${PATCH}] ${command} ${args.join(" ")}`);
  const result = spawnSync(command, args, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: process.env
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`[${PATCH}] Befehl fehlgeschlagen: ${command} ${args.join(" ")}`);
  }
}

function replaceImport(source, from, to) {
  const pattern = new RegExp(`import\\s+["']\\./${from.replace(/[.*+?^${}()|[\\]\\]/g, "\\$&")}["'];?`);
  if (pattern.test(source)) return source.replace(pattern, `import "./${to}";`);
  if (source.includes(`import "./${to}";`)) return source;
  const frontmatterEnd = source.indexOf("---", 3);
  if (frontmatterEnd < 0) throw new Error(`[${PATCH}] Astro-Frontmatter nicht erkannt.`);
  return source.slice(0, frontmatterEnd) + `import "./${to}";\n` + source.slice(frontmatterEnd);
}

const EXPERIENCE_CSS = '/*\n * PfotenTechnik Comparison Experience 32.0.2\n * Mobile first. One visual owner. Global theme tokens only.\n */\n\n.comparison-shell {\n  display: grid;\n  min-width: 0;\n  gap: clamp(2.5rem, 8vw, 5rem);\n  color: var(--pt-color-text);\n}\n\n.comparison-shell *,\n.comparison-shell *::before,\n.comparison-shell *::after {\n  box-sizing: border-box;\n}\n\n.comparison-shell :where(h1, h2, h3, h4, p, dl, dd, ul) {\n  color: inherit;\n}\n\n.comparison-eyebrow,\n.comparison-cover__eyebrow {\n  display: inline-flex;\n  margin: 0 0 .625rem;\n  color: var(--pt-color-text-muted);\n  font-size: .75rem;\n  font-weight: 800;\n  letter-spacing: .08em;\n  text-transform: uppercase;\n}\n\n/* Cover */\n\n.comparison-cover {\n  display: grid;\n  gap: 1rem;\n  padding: 1rem;\n  overflow: hidden;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-xl, 1.5rem);\n  background: var(--pt-color-surface);\n  box-shadow: var(--pt-shadow-card, 0 14px 38px rgb(0 0 0 / .08));\n}\n\n.comparison-cover__copy {\n  min-width: 0;\n}\n\n.comparison-cover__copy h1 {\n  max-width: 17ch;\n  margin: 0;\n  color: var(--pt-color-text);\n  font-size: clamp(2.15rem, 11vw, 3.6rem);\n  line-height: 1;\n  letter-spacing: -.045em;\n  text-wrap: balance;\n}\n\n.comparison-cover__copy > p {\n  max-width: 62ch;\n  margin: 1rem 0 0;\n  color: var(--pt-color-text-muted);\n  font-size: 1rem;\n  line-height: 1.6;\n}\n\n.comparison-cover__media {\n  min-height: 220px;\n  overflow: hidden;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-lg, 1rem);\n  background: var(--pt-color-surface-soft);\n}\n\n.comparison-cover__media picture,\n.comparison-cover__media .comparison-cover__image,\n.comparison-cover__media img {\n  display: block;\n  width: 100%;\n  height: 100%;\n}\n\n.comparison-cover__media img {\n  object-fit: cover;\n  object-position: center;\n}\n\n.comparison-cover__facts {\n  display: grid;\n  gap: .625rem;\n  margin: 0;\n}\n\n.comparison-cover__fact {\n  display: flex;\n  min-width: 0;\n  align-items: center;\n  gap: .75rem;\n  padding: .875rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-md, .75rem);\n  background: var(--pt-color-surface-raised);\n}\n\n.comparison-cover__fact-icon {\n  display: grid;\n  flex: 0 0 2rem;\n  width: 2rem;\n  height: 2rem;\n  place-items: center;\n  border-radius: 999px;\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface-soft);\n}\n\n.comparison-cover__fact span:last-child {\n  display: grid;\n  gap: .1rem;\n}\n\n.comparison-cover__fact dt {\n  color: var(--pt-color-text);\n  font-size: .85rem;\n  font-weight: 800;\n}\n\n.comparison-cover__fact dd {\n  margin: 0;\n  color: var(--pt-color-text-muted);\n  font-size: .78rem;\n}\n\n.comparison-hero-filters {\n  display: flex;\n  gap: .5rem;\n  margin-inline: -1rem;\n  padding: .125rem 1rem .25rem;\n  overflow-x: auto;\n  scrollbar-width: none;\n}\n\n.comparison-hero-filters::-webkit-scrollbar {\n  display: none;\n}\n\n.comparison-cover-filter {\n  flex: 0 0 auto;\n  min-height: 44px;\n  padding: .65rem .9rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: 999px;\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface);\n  font: inherit;\n  font-size: .85rem;\n  font-weight: 750;\n}\n\n/* Winner */\n\n.comparison-editorial-recommendation {\n  display: grid;\n  gap: 1rem;\n  padding: 1rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-xl, 1.5rem);\n  background: var(--pt-color-surface);\n  box-shadow: var(--pt-shadow-card, 0 14px 38px rgb(0 0 0 / .08));\n}\n\n.comparison-editorial-recommendation__heading {\n  display: flex;\n  align-items: center;\n  gap: .75rem;\n}\n\n.comparison-editorial-recommendation__star {\n  display: grid;\n  flex: 0 0 2.5rem;\n  width: 2.5rem;\n  height: 2.5rem;\n  place-items: center;\n  border-radius: 999px;\n  color: var(--pt-color-action-text);\n  background: var(--pt-color-action-bg);\n}\n\n.comparison-editorial-recommendation__heading > div {\n  display: grid;\n}\n\n.comparison-editorial-recommendation__heading strong {\n  color: var(--pt-color-text);\n}\n\n.comparison-editorial-recommendation__body {\n  display: grid;\n  gap: 1rem;\n  min-width: 0;\n}\n\n.comparison-editorial-recommendation__media {\n  display: grid;\n  min-height: 220px;\n  place-items: center;\n  overflow: hidden;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-lg, 1rem);\n  background: var(--pt-color-surface-soft);\n}\n\n.comparison-editorial-recommendation__media picture,\n.comparison-editorial-recommendation__media img {\n  display: block;\n  width: 100%;\n  height: 100%;\n}\n\n.comparison-editorial-recommendation__media img {\n  object-fit: contain;\n}\n\n.comparison-editorial-recommendation__copy {\n  min-width: 0;\n}\n\n.comparison-editorial-recommendation__manufacturer {\n  color: var(--pt-color-text-muted);\n  font-size: .8rem;\n  font-weight: 750;\n}\n\n.comparison-editorial-recommendation__copy h2 {\n  margin: .3rem 0 .75rem;\n  color: var(--pt-color-text);\n  font-size: clamp(1.65rem, 7vw, 2.5rem);\n  line-height: 1.08;\n}\n\n.comparison-editorial-recommendation__copy h2 a {\n  color: inherit;\n  text-decoration: none;\n}\n\n.comparison-editorial-recommendation__copy p,\n.comparison-editorial-recommendation__statement {\n  color: var(--pt-color-text-muted);\n  line-height: 1.6;\n}\n\n.comparison-editorial-recommendation__copy ul {\n  display: grid;\n  gap: .45rem;\n  margin: 1rem 0 0;\n  padding: 0;\n  list-style: none;\n}\n\n.comparison-editorial-recommendation__copy li {\n  position: relative;\n  padding-left: 1.3rem;\n  color: var(--pt-color-text);\n}\n\n.comparison-editorial-recommendation__copy li::before {\n  position: absolute;\n  left: 0;\n  content: "✓";\n  color: var(--pt-color-action-bg);\n  font-weight: 900;\n}\n\n.comparison-editorial-recommendation__decision {\n  display: grid;\n  align-content: start;\n  gap: .875rem;\n  padding: 1rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-lg, 1rem);\n  background: var(--pt-color-surface-raised);\n}\n\n.comparison-editorial-recommendation__actions {\n  display: grid;\n  gap: .625rem;\n}\n\n.comparison-editorial-recommendation__statement {\n  margin: 0;\n  padding-top: 1rem;\n  border-top: 1px solid var(--pt-color-border);\n}\n\n/* Buttons */\n\n.comparison-button {\n  display: inline-flex;\n  min-height: 48px;\n  align-items: center;\n  justify-content: center;\n  padding: .75rem 1rem;\n  border: 1px solid var(--pt-color-action-bg);\n  border-radius: var(--pt-radius-md, .75rem);\n  color: var(--pt-color-action-text);\n  background: var(--pt-color-action-bg);\n  font-weight: 800;\n  text-align: center;\n  text-decoration: none;\n}\n\n.comparison-button:hover {\n  background: var(--pt-color-action-bg-hover);\n}\n\n.comparison-button--secondary {\n  border-color: var(--pt-color-border);\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface);\n}\n\n.comparison-decision-flow {\n  display: grid;\n  gap: clamp(2.5rem, 8vw, 5rem);\n  min-width: 0;\n}\n\n.comparison-premium-section {\n  min-width: 0;\n}\n\n/* Alternatives */\n\n.comparison-alternatives {\n  display: grid;\n  gap: 1rem;\n}\n\n.comparison-alternatives__heading {\n  max-width: 48rem;\n}\n\n.comparison-alternatives__heading h2 {\n  margin: 0;\n  color: var(--pt-color-text);\n  font-size: clamp(1.75rem, 8vw, 2.75rem);\n  line-height: 1.08;\n  letter-spacing: -.035em;\n}\n\n.comparison-alternatives__heading p {\n  margin: .75rem 0 0;\n  color: var(--pt-color-text-muted);\n  line-height: 1.55;\n}\n\n.comparison-alternatives__list {\n  display: grid;\n  gap: .875rem;\n}\n\n.comparison-alternative {\n  display: grid;\n  grid-template-columns: 6.25rem minmax(0, 1fr);\n  grid-template-areas:\n    "use use"\n    "media content"\n    "meta meta";\n  gap: .75rem;\n  min-width: 0;\n  padding: .875rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-lg, 1rem);\n  background: var(--pt-color-surface);\n  box-shadow: var(--pt-shadow-card, 0 10px 28px rgb(0 0 0 / .06));\n}\n\n.comparison-alternative__use-case {\n  grid-area: use;\n  display: flex;\n  align-items: center;\n  gap: .4rem;\n  color: var(--pt-color-text);\n  font-size: .82rem;\n}\n\n.comparison-alternative__media {\n  grid-area: media;\n  display: grid;\n  min-height: 6.25rem;\n  place-items: center;\n  overflow: hidden;\n  border-radius: var(--pt-radius-md, .75rem);\n  background: var(--pt-color-surface-soft);\n}\n\n.comparison-alternative__media picture,\n.comparison-alternative__media img {\n  display: block;\n  width: 100%;\n  height: 100%;\n}\n\n.comparison-alternative__media img {\n  object-fit: contain;\n}\n\n.comparison-alternative__content {\n  grid-area: content;\n  min-width: 0;\n}\n\n.comparison-alternative__content > span {\n  color: var(--pt-color-text-muted);\n  font-size: .75rem;\n}\n\n.comparison-alternative__content h3 {\n  margin: .2rem 0 .35rem;\n  color: var(--pt-color-text);\n  font-size: 1rem;\n  line-height: 1.25;\n}\n\n.comparison-alternative__content h3 a {\n  color: inherit;\n  text-decoration: none;\n}\n\n.comparison-alternative__content p {\n  display: -webkit-box;\n  margin: 0;\n  overflow: hidden;\n  color: var(--pt-color-text-muted);\n  font-size: .86rem;\n  line-height: 1.45;\n  -webkit-box-orient: vertical;\n  -webkit-line-clamp: 2;\n}\n\n.comparison-alternative__meta {\n  grid-area: meta;\n  display: flex;\n  min-width: 0;\n  align-items: center;\n  justify-content: space-between;\n  gap: .75rem;\n  padding-top: .75rem;\n  border-top: 1px solid var(--pt-color-border);\n}\n\n.comparison-alternative__decision {\n  display: flex;\n  min-width: 0;\n  align-items: center;\n  gap: .625rem;\n}\n\n.comparison-alternative__price {\n  display: flex;\n  min-width: 0;\n  align-items: baseline;\n  gap: .3rem;\n  color: var(--pt-color-text);\n}\n\n.comparison-alternative__price small,\n.comparison-alternative__price em {\n  color: var(--pt-color-text-muted);\n  font-size: .72rem;\n  font-style: normal;\n}\n\n.comparison-alternative__chevron {\n  display: grid;\n  flex: 0 0 2.5rem;\n  width: 2.5rem;\n  height: 2.5rem;\n  place-items: center;\n  border: 1px solid var(--pt-color-border);\n  border-radius: 999px;\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface-raised);\n  font-size: 1.5rem;\n  text-decoration: none;\n}\n\n.comparison-alternatives__all {\n  justify-self: start;\n}\n\n/* Explorer */\n\n.comparison-lab {\n  --pt-comparison-selected-count: 3;\n  display: grid;\n  gap: 1rem;\n  min-width: 0;\n}\n\n.comparison-lab__intro {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) auto;\n  align-items: start;\n  gap: .75rem;\n}\n\n.comparison-lab__intro h2 {\n  margin: 0;\n  color: var(--pt-color-text);\n  font-size: clamp(1.75rem, 8vw, 2.75rem);\n  line-height: 1.08;\n}\n\n.comparison-lab__intro p {\n  margin: .65rem 0 0;\n  color: var(--pt-color-text-muted);\n  line-height: 1.55;\n}\n\n.comparison-lab__selection-count {\n  display: grid;\n  min-width: 4.75rem;\n  justify-items: center;\n  padding: .6rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-md, .75rem);\n  background: var(--pt-color-surface);\n}\n\n.comparison-lab__selection-count strong {\n  color: var(--pt-color-text);\n  font-size: 1.25rem;\n}\n\n.comparison-lab__selection-count span {\n  color: var(--pt-color-text-muted);\n  font-size: .7rem;\n}\n\n.comparison-lab__picker {\n  display: flex;\n  gap: .75rem;\n  margin-inline: calc(var(--pt-page-gutter, 1rem) * -1);\n  padding-inline: var(--pt-page-gutter, 1rem);\n  overflow-x: auto;\n  scroll-snap-type: x proximity;\n  scrollbar-width: none;\n}\n\n.comparison-lab__picker::-webkit-scrollbar {\n  display: none;\n}\n\n.comparison-pick-card {\n  position: relative;\n  display: grid;\n  flex: 0 0 min(82vw, 18rem);\n  grid-template-columns: 4.5rem minmax(0, 1fr);\n  gap: .75rem;\n  min-width: 0;\n  padding: .75rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-lg, 1rem);\n  background: var(--pt-color-surface);\n  cursor: pointer;\n  scroll-snap-align: start;\n}\n\n.comparison-pick-card.is-selected {\n  border-color: var(--pt-color-action-bg);\n  box-shadow: 0 0 0 2px color-mix(in srgb, var(--pt-color-action-bg) 16%, transparent);\n}\n\n.comparison-pick-card > input {\n  position: absolute;\n  opacity: 0;\n  pointer-events: none;\n}\n\n.comparison-pick-card__check {\n  position: absolute;\n  top: .5rem;\n  right: .5rem;\n  display: grid;\n  width: 1.5rem;\n  height: 1.5rem;\n  place-items: center;\n  border: 1px solid var(--pt-color-border);\n  border-radius: 999px;\n  color: transparent;\n  background: var(--pt-color-surface);\n  font-size: .75rem;\n}\n\n.comparison-pick-card.is-selected .comparison-pick-card__check {\n  border-color: var(--pt-color-action-bg);\n  color: var(--pt-color-action-text);\n  background: var(--pt-color-action-bg);\n}\n\n.comparison-pick-card__media {\n  display: grid;\n  min-height: 4.5rem;\n  place-items: center;\n  overflow: hidden;\n  border-radius: var(--pt-radius-md, .75rem);\n  background: var(--pt-color-surface-soft);\n}\n\n.comparison-pick-card__media img {\n  width: 100%;\n  height: 100%;\n  object-fit: contain;\n}\n\n.comparison-pick-card__body {\n  display: grid;\n  align-content: center;\n  gap: .15rem;\n  min-width: 0;\n}\n\n.comparison-pick-card__body small,\n.comparison-pick-card__body span {\n  color: var(--pt-color-text-muted);\n  font-size: .75rem;\n}\n\n.comparison-pick-card__body strong {\n  color: var(--pt-color-text);\n  line-height: 1.25;\n}\n\n.comparison-lab__toolbar {\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) auto;\n  gap: .625rem;\n  padding: .75rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-lg, 1rem);\n  background: var(--pt-color-surface);\n}\n\n.comparison-lab__filter-button {\n  justify-content: center;\n}\n\n.comparison-lab__differences {\n  display: inline-flex;\n  min-height: 44px;\n  align-items: center;\n  gap: .5rem;\n  color: var(--pt-color-text);\n  font-size: .84rem;\n  font-weight: 750;\n}\n\n.comparison-lab__reset {\n  grid-column: 1 / -1;\n  justify-self: start;\n  min-height: 40px;\n  padding: 0;\n  border: 0;\n  color: var(--pt-color-text-muted);\n  background: transparent;\n  font: inherit;\n  font-size: .82rem;\n  font-weight: 750;\n}\n\n.comparison-lab__filters {\n  position: fixed;\n  z-index: 9999;\n  inset: 0 0 0 auto;\n  width: min(92vw, 25rem);\n  overflow-y: auto;\n  padding: max(1rem, env(safe-area-inset-top)) 1rem max(1rem, env(safe-area-inset-bottom));\n  border-left: 1px solid var(--pt-color-border);\n  background: var(--pt-color-surface);\n  box-shadow: -18px 0 45px rgb(0 0 0 / .2);\n  transform: translateX(105%);\n  transition: transform .2s ease;\n}\n\n.comparison-lab__filters.is-open {\n  transform: translateX(0);\n}\n\n.comparison-lab__filter-header {\n  display: flex;\n  align-items: center;\n  justify-content: space-between;\n  gap: 1rem;\n}\n\n.comparison-lab__filter-header > div {\n  display: grid;\n  gap: .15rem;\n}\n\n.comparison-lab__filter-header small {\n  color: var(--pt-color-text-muted);\n}\n\n.comparison-lab__filter-header button {\n  display: grid;\n  width: 44px;\n  height: 44px;\n  place-items: center;\n  border: 1px solid var(--pt-color-border);\n  border-radius: 999px;\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface-soft);\n  font-size: 1.35rem;\n}\n\n.comparison-lab__clear-filters {\n  width: 100%;\n  min-height: 44px;\n  margin: .875rem 0;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-md, .75rem);\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface);\n  font: inherit;\n  font-weight: 750;\n}\n\n.comparison-lab__filter-groups {\n  display: grid;\n  gap: .875rem;\n}\n\n.comparison-lab__filter-groups fieldset {\n  display: grid;\n  gap: .5rem;\n  margin: 0;\n  padding: .875rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-lg, 1rem);\n}\n\n.comparison-lab__filter-groups legend {\n  padding-inline: .25rem;\n  color: var(--pt-color-text);\n  font-weight: 800;\n}\n\n.comparison-lab__filter-groups label {\n  display: flex;\n  min-height: 40px;\n  align-items: center;\n  gap: .5rem;\n  color: var(--pt-color-text);\n}\n\n.comparison-lab__backdrop {\n  position: fixed;\n  z-index: 9998;\n  inset: 0;\n  background: rgb(0 0 0 / .48);\n}\n\n.comparison-lab__empty {\n  padding: 1.25rem;\n  border: 1px dashed var(--pt-color-border);\n  border-radius: var(--pt-radius-lg, 1rem);\n  color: var(--pt-color-text);\n  text-align: center;\n  background: var(--pt-color-surface);\n}\n\n.comparison-lab__empty h3 {\n  margin: 0;\n}\n\n.comparison-lab__empty p {\n  margin: .4rem 0 0;\n  color: var(--pt-color-text-muted);\n}\n\n.comparison-lab__stage {\n  min-width: 0;\n}\n\n.comparison-lab__compare {\n  min-width: 0;\n  overflow-x: auto;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-lg, 1rem);\n  background: var(--pt-color-surface);\n  scrollbar-gutter: stable;\n  overscroll-behavior-inline: contain;\n}\n\n.comparison-lab__sticky-products,\n.comparison-lab__row {\n  display: grid;\n  grid-template-columns: minmax(9.5rem, 9.5rem) repeat(var(--pt-comparison-selected-count), minmax(10rem, 1fr));\n  min-width: calc(9.5rem + var(--pt-comparison-selected-count) * 10rem);\n}\n\n.comparison-lab__sticky-products {\n  position: sticky;\n  z-index: 4;\n  top: 0;\n  border-bottom: 1px solid var(--pt-color-border);\n  background: var(--pt-color-surface);\n}\n\n.comparison-lab__criterion-head,\n.comparison-lab__sticky-products article,\n.comparison-lab__criterion,\n.comparison-lab__value {\n  min-width: 0;\n  padding: .75rem;\n}\n\n.comparison-lab__criterion-head {\n  display: flex;\n  align-items: end;\n  color: var(--pt-color-text-muted);\n  font-size: .75rem;\n  font-weight: 800;\n  text-transform: uppercase;\n}\n\n.comparison-lab__sticky-products article,\n.comparison-lab__value {\n  border-left: 1px solid var(--pt-color-border);\n}\n\n.comparison-lab__sticky-products article[hidden],\n.comparison-lab__value[hidden] {\n  display: none;\n}\n\n.comparison-lab__sticky-products a {\n  display: grid;\n  gap: .35rem;\n  color: var(--pt-color-text);\n  text-decoration: none;\n}\n\n.comparison-lab__sticky-products img {\n  width: 3.25rem;\n  height: 3.25rem;\n  object-fit: contain;\n}\n\n.comparison-lab__sticky-products span {\n  display: grid;\n  gap: .1rem;\n}\n\n.comparison-lab__sticky-products strong {\n  font-size: .78rem;\n  line-height: 1.2;\n}\n\n.comparison-lab__sticky-products small {\n  color: var(--pt-color-text-muted);\n  font-size: .7rem;\n}\n\n.comparison-lab__signals,\n.comparison-lab__group,\n.comparison-lab__row {\n  border-bottom: 1px solid var(--pt-color-border);\n}\n\n.comparison-lab__criterion {\n  position: sticky;\n  z-index: 2;\n  left: 0;\n  display: grid;\n  align-content: center;\n  gap: .15rem;\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface);\n}\n\n.comparison-lab__criterion small {\n  color: var(--pt-color-text-muted);\n  font-size: .72rem;\n}\n\n.comparison-lab__value {\n  display: flex;\n  align-items: center;\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface);\n  font-size: .82rem;\n  line-height: 1.4;\n}\n\n.comparison-lab__value.is-different {\n  background: var(--pt-color-surface-soft);\n}\n\n.comparison-lab__missing {\n  color: var(--pt-color-text-muted);\n}\n\n.comparison-lab__group > summary {\n  position: sticky;\n  z-index: 3;\n  left: 0;\n  display: flex;\n  min-height: 3.5rem;\n  align-items: center;\n  justify-content: space-between;\n  gap: .75rem;\n  padding: .75rem;\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface-soft);\n  cursor: pointer;\n  list-style: none;\n}\n\n.comparison-lab__group > summary::-webkit-details-marker {\n  display: none;\n}\n\n.comparison-lab__group-title {\n  display: grid;\n  gap: .1rem;\n}\n\n.comparison-lab__group-title small {\n  color: var(--pt-color-text-muted);\n  font-size: .72rem;\n}\n\n.comparison-lab__group-toggle {\n  display: inline-flex;\n  align-items: center;\n  gap: .35rem;\n  color: var(--pt-color-text-muted);\n  font-size: .75rem;\n}\n\n.comparison-lab__group-chevron {\n  display: grid;\n  width: 2rem;\n  height: 2rem;\n  place-items: center;\n  border: 1px solid var(--pt-color-border);\n  border-radius: 999px;\n  background: var(--pt-color-surface);\n}\n\n.comparison-lab__group-state--open {\n  display: none;\n}\n\n.comparison-lab__group[open] .comparison-lab__group-state--closed {\n  display: none;\n}\n\n.comparison-lab__group[open] .comparison-lab__group-state--open {\n  display: inline;\n}\n\n.comparison-lab__group[open] .comparison-lab__group-chevron {\n  transform: rotate(180deg);\n}\n\n/* Neutral editorial blocks */\n\n.comparison-insight-summary,\n.comparison-methodology {\n  padding: 1rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-xl, 1.5rem);\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface);\n}\n\n/* Sticky CTA */\n\n.comparison-sticky-bar {\n  position: fixed;\n  z-index: 40;\n  right: max(1rem, env(safe-area-inset-right));\n  bottom: max(1rem, env(safe-area-inset-bottom));\n  left: max(1rem, env(safe-area-inset-left));\n  display: grid;\n  grid-template-columns: minmax(0, 1fr) minmax(9rem, auto);\n  align-items: center;\n  gap: .75rem;\n  max-width: 40rem;\n  margin-inline: auto;\n  padding: .75rem;\n  border: 1px solid var(--pt-color-border);\n  border-radius: var(--pt-radius-xl, 1.5rem);\n  background: var(--pt-color-surface-raised);\n  box-shadow: 0 18px 55px rgb(0 0 0 / .18);\n}\n\n.comparison-sticky-bar[hidden] {\n  display: none;\n}\n\n.comparison-sticky-bar__identity {\n  display: grid;\n  min-width: 0;\n}\n\n.comparison-sticky-bar__identity span {\n  color: var(--pt-color-text-muted);\n  font-size: .7rem;\n}\n\n.comparison-sticky-bar__identity strong {\n  overflow: hidden;\n  color: var(--pt-color-text);\n  font-size: .85rem;\n  text-overflow: ellipsis;\n  white-space: nowrap;\n}\n\n.comparison-sticky-bar__primary {\n  min-height: 48px;\n}\n\n/* Existing complex sections receive neutral containment until their markup is simplified. */\n\n.comparison-buying-guide,\n.comparison-fit-grid,\n.comparison-verdict,\n.comparison-table-wrap,\n.recommendation-grid {\n  color: var(--pt-color-text);\n  background: transparent;\n}\n\n.recommendation-card,\n.comparison-fit-card,\n.comparison-verdict,\n.comparison-table-wrap {\n  border: 1px solid var(--pt-color-border);\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface);\n  box-shadow: var(--pt-shadow-card, 0 10px 28px rgb(0 0 0 / .06));\n}\n\n.recommendation-card p,\n.comparison-fit-card p,\n.comparison-verdict p,\n.comparison-table td,\n.comparison-table small {\n  color: var(--pt-color-text-muted);\n}\n\n.comparison-table-wrap {\n  max-width: 100%;\n  overflow-x: auto;\n}\n\n.comparison-table {\n  border-collapse: collapse;\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface);\n}\n\n.comparison-table th,\n.comparison-table td {\n  border-color: var(--pt-color-border);\n  background: var(--pt-color-surface);\n}\n\n.comparison-table thead th {\n  color: var(--pt-color-text);\n  background: var(--pt-color-surface-soft);\n}\n\n/* Accessibility exception, not a visual override. */\n\n.sr-only {\n  position: absolute !important;\n  width: 1px !important;\n  height: 1px !important;\n  padding: 0 !important;\n  margin: -1px !important;\n  overflow: hidden !important;\n  clip: rect(0, 0, 0, 0) !important;\n  white-space: nowrap !important;\n  border: 0 !important;\n}\n\n@media (min-width: 48rem) {\n  .comparison-cover {\n    grid-template-columns: minmax(0, 1.05fr) minmax(18rem, .95fr);\n    grid-template-areas:\n      "copy media"\n      "facts media"\n      "filters filters";\n    gap: 1.5rem;\n    padding: clamp(1.5rem, 3vw, 2.5rem);\n  }\n\n  .comparison-cover__copy {\n    grid-area: copy;\n    align-self: end;\n  }\n\n  .comparison-cover__media {\n    grid-area: media;\n    min-height: 360px;\n  }\n\n  .comparison-cover__facts {\n    grid-area: facts;\n    grid-template-columns: repeat(3, minmax(0, 1fr));\n  }\n\n  .comparison-hero-filters {\n    grid-area: filters;\n    margin-inline: 0;\n    padding-inline: 0;\n  }\n\n  .comparison-editorial-recommendation {\n    padding: clamp(1.5rem, 3vw, 2.5rem);\n  }\n\n  .comparison-editorial-recommendation__body {\n    grid-template-columns: minmax(14rem, .8fr) minmax(0, 1.2fr) minmax(13rem, .65fr);\n    align-items: start;\n  }\n\n  .comparison-alternatives__list {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n\n  .comparison-alternative {\n    grid-template-columns: 7rem minmax(0, 1fr);\n  }\n\n  .comparison-lab__picker {\n    display: grid;\n    grid-template-columns: repeat(auto-fit, minmax(14rem, 1fr));\n    margin-inline: 0;\n    padding-inline: 0;\n    overflow: visible;\n  }\n\n  .comparison-pick-card {\n    flex-basis: auto;\n  }\n\n  .comparison-lab__toolbar {\n    display: flex;\n    align-items: center;\n  }\n\n  .comparison-lab__reset {\n    grid-column: auto;\n    margin-left: auto;\n  }\n\n  .comparison-lab__sticky-products,\n  .comparison-lab__row {\n    grid-template-columns: minmax(11rem, 1.2fr) repeat(var(--pt-comparison-selected-count), minmax(11rem, 1fr));\n    min-width: calc(11rem + var(--pt-comparison-selected-count) * 11rem);\n  }\n\n  .comparison-lab__sticky-products a {\n    grid-template-columns: 3.5rem minmax(0, 1fr);\n    align-items: center;\n  }\n\n  .comparison-insight-summary,\n  .comparison-methodology {\n    padding: clamp(1.5rem, 3vw, 2.5rem);\n  }\n}\n\n@media (min-width: 72rem) {\n  .comparison-alternatives__list {\n    grid-template-columns: repeat(3, minmax(0, 1fr));\n  }\n}\n';

const TEST_SOURCE = String.raw`import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..", "..");
const read = (file) => fs.readFileSync(path.join(root, file), "utf8");

const shell = read("packages/affiliate-core/src/components/comparison/ComparisonShell.astro");
const explorer = read("packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro");
const css = read("packages/affiliate-core/src/components/comparison/comparison-experience.css");
const system = read("packages/affiliate-core/src/components/comparison/comparison-system.css");
const explorerCss = read("packages/affiliate-core/src/components/comparison/comparison-explorer-v2.css");
const tokens = read("packages/affiliate-core/src/components/comparison/comparison-tokens.css");

test("genau ein aktiver Vergleichs-CSS-Owner", () => {
  assert.equal(shell.includes('import "./comparison-experience.css";'), true);
  assert.doesNotMatch(shell, /comparison-system\.css|comparison-tokens\.css/);
  assert.doesNotMatch(explorer, /comparison-explorer-v2\.css/);
  assert.match(system, /TOMBSTONE/);
  assert.match(explorerCss, /TOMBSTONE/);
  assert.match(tokens, /TOMBSTONE/);
});

test("mobile first und 16px Grundabstand", () => {
  assert.match(css, /\.comparison-cover\s*\{[\s\S]*padding:\s*1rem/);
  assert.match(css, /\.comparison-shell\s*\{[\s\S]*min-width:\s*0/);
  assert.match(css, /@media\s*\(min-width:\s*48rem\)/);
  assert.doesNotMatch(css, /@media\s*\(max-width:/);
});

test("Dark Mode läuft ausschließlich über globale Tokens", () => {
  assert.doesNotMatch(css, /\.theme-dark\b|\.dark\b|\[data-theme/);
  assert.doesNotMatch(css, /--comparison-/);
  assert.doesNotMatch(css, /var\(--comparison-/);
  assert.match(css, /--pt-comparison-selected-count/);
  assert.match(explorer, /--pt-comparison-selected-count/);
  assert.doesNotMatch(explorer, /--comparison-selected-count/);
  for (const token of [
    "--pt-color-surface",
    "--pt-color-surface-soft",
    "--pt-color-surface-raised",
    "--pt-color-text",
    "--pt-color-text-muted",
    "--pt-color-border",
    "--pt-color-action-bg",
    "--pt-color-action-bg-hover",
    "--pt-color-action-text"
  ]) assert.equal(css.includes(token), true, "Globales Token fehlt: " + token);
});

test("keine feste Vergleichspalette und keine grünen Vollflächen", () => {
  assert.doesNotMatch(css, /#(?:16302b|18743b|0f5d2d|e5f5e8)\b/i);
  assert.doesNotMatch(css, /linear-gradient\([^)]*(?:16,\s*48,\s*43|24,\s*116,\s*59)/i);
  assert.doesNotMatch(css, /background:\s*(?:green|#(?:0[0-9a-f]{5}|1[0-9a-f]{5}|2[0-9a-f]{5}|3[0-9a-f]{5}))\b/i);
});

test("Explorer bleibt semantische horizontale Matrix", () => {
  assert.match(css, /\.comparison-lab__compare\s*\{[\s\S]*overflow-x:\s*auto/);
  assert.match(css, /\.comparison-lab__criterion\s*\{[\s\S]*position:\s*sticky/);
  assert.match(css, /\.comparison-lab__sticky-products\s*\{[\s\S]*position:\s*sticky/);
  assert.doesNotMatch(css, /\.comparison-table[^{]*\{[^}]*display:\s*block/s);
});

test("keine neuen important-Regeln außerhalb sr-only", () => {
  const withoutSrOnly = css.replace(/\.sr-only\s*\{[\s\S]*?\}/, "");
  assert.doesNotMatch(withoutSrOnly, /!important/);
});

test("Shell ist auf Experience 32 markiert", () => {
  assert.match(shell, /data-comparison-experience="32\.0\.2"/);
});
`;

try {
  let shell = read(files.shell);
  shell = replaceImport(shell, "comparison-system.css", "comparison-experience.css");
  shell = shell.replace(/data-layout-engine="[^"]*"/, 'data-layout-engine="31.0.0" data-comparison-experience="32.0.2"');
  if (!shell.includes('data-comparison-experience="32.0.2"')) {
    shell = shell.replace(/<div class="comparison-shell"/, '<div class="comparison-shell" data-comparison-experience="32.0.2"');
  }

  let explorer = read(files.explorer)
    .replace(/^import\s+["']\.\/comparison-explorer-v2\.css["'];?\s*$/m, "")
    .replaceAll("--comparison-selected-count", "--pt-comparison-selected-count")
    .replace(/\n{3,}/g, "\n\n");

  write(files.shell, shell);
  write(files.explorer, explorer);
  write(files.experience, EXPERIENCE_CSS);
  write(files.system, "/* TOMBSTONE: Comparison Experience 32 owns all comparison styling. */\n");
  write(files.explorerCss, "/* TOMBSTONE: Explorer styling moved to comparison-experience.css. */\n");
  write(files.tokens, "/* TOMBSTONE: Comparison-specific tokens removed. Use global --pt-* tokens. */\n");
  write(files.test, TEST_SOURCE);

  run(process.execPath, ["--check", scriptFile]);
  run(process.execPath, ["--check", files.test]);
  run(process.execPath, ["--test", files.test]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "lint:content"]);
  run("npm", ["--workspace", "apps/pfotentechnik", "run", "build"]);

  const dist = path.join(root, "apps", "pfotentechnik", "dist", "vergleiche");
  if (fs.existsSync(dist)) {
    const htmlFiles = [];
    const walk = (dir) => {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else if (entry.isFile() && entry.name === "index.html") htmlFiles.push(full);
      }
    };
    walk(dist);
    const sample = htmlFiles.find((file) => read(file).includes("comparison-shell"));
    if (!sample) throw new Error(`[${PATCH}] Keine gebaute Vergleichsseite gefunden.`);
    const html = read(sample);
    if (!html.includes('data-comparison-experience="32.0.2"')) {
      throw new Error(`[${PATCH}] Build verwendet Comparison Experience 32 nicht.`);
    }
  }

  console.log(`[${PATCH}] Backup: ${path.relative(root, backupDir)}`);
  console.log(`[${PATCH}] Geändert: ${changed.length}`);
  changed.forEach((file) => console.log(`- ${file}`));
  console.log(`[${PATCH}] Erfolgreich abgeschlossen.`);
} catch (error) {
  rollback();
  console.error(`[${PATCH}] Fehler. Änderungen wurden zurückgerollt.`);
  console.error(error instanceof Error ? error.stack ?? error.message : String(error));
  process.exitCode = 1;
}

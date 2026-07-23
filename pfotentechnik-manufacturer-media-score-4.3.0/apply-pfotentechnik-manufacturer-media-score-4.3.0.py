#!/usr/bin/env python3
from __future__ import annotations

import re
import shutil
import subprocess
import sys
from datetime import datetime
from pathlib import Path

VERSION = "4.3.0"
START = "/* PT manufacturer media and score 4.3.0 */"
END = "/* End PT manufacturer media and score 4.3.0 */"

PATCH = r'''
<style is:global>
/* PT manufacturer media and score 4.3.0 */

:root {
  --pt-manufacturer-hero-max: 340px;
  --pt-manufacturer-hero-mobile-max: 230px;
}

:is(
  .manufacturer-hero,
  .manufacturer-header,
  .brand-hero,
  [data-manufacturer-hero],
  [class*="manufacturer-hero"],
  [class*="brand-hero"]
) :is(
  picture,
  figure,
  .hero-media,
  .manufacturer-hero__media,
  [class*="hero__media"],
  [class*="hero-media"]
) {
  display: grid !important;
  place-items: center !important;
  width: 100% !important;
  height: auto !important;
  min-height: 0 !important;
  max-height: var(--pt-manufacturer-hero-max) !important;
  aspect-ratio: 16 / 9 !important;
  padding: clamp(.55rem, 1.8vw, .9rem) !important;
  overflow: hidden !important;
  background: #f7f8fa !important;
}

:is(
  .manufacturer-hero,
  .manufacturer-header,
  .brand-hero,
  [data-manufacturer-hero],
  [class*="manufacturer-hero"],
  [class*="brand-hero"]
) :is(
  picture img,
  figure img,
  .hero-media img,
  .manufacturer-hero__media img,
  [class*="hero__media"] img,
  [class*="hero-media"] img,
  > img
) {
  display: block !important;
  width: auto !important;
  height: auto !important;
  max-width: 100% !important;
  max-height: calc(var(--pt-manufacturer-hero-max) - 1.2rem) !important;
  margin: auto !important;
  object-fit: contain !important;
  object-position: center center !important;
  transform: none !important;
}

:is(
  .manufacturer-hero,
  .manufacturer-header,
  .brand-hero,
  [data-manufacturer-hero],
  [class*="manufacturer-hero"],
  [class*="brand-hero"]
) {
  overflow: hidden;
}

@media (max-width: 720px) {
  :is(
    .manufacturer-hero,
    .manufacturer-header,
    .brand-hero,
    [data-manufacturer-hero],
    [class*="manufacturer-hero"],
    [class*="brand-hero"]
  ) :is(
    picture,
    figure,
    .hero-media,
    .manufacturer-hero__media,
    [class*="hero__media"],
    [class*="hero-media"]
  ) {
    max-height: var(--pt-manufacturer-hero-mobile-max) !important;
    aspect-ratio: 16 / 10 !important;
    padding: .45rem !important;
  }

  :is(
    .manufacturer-hero,
    .manufacturer-header,
    .brand-hero,
    [data-manufacturer-hero],
    [class*="manufacturer-hero"],
    [class*="brand-hero"]
  ) :is(
    picture img,
    figure img,
    .hero-media img,
    .manufacturer-hero__media img,
    [class*="hero__media"] img,
    [class*="hero-media"] img,
    > img
  ) {
    max-height: calc(var(--pt-manufacturer-hero-mobile-max) - .9rem) !important;
  }
}

.pt-normalized-score {
  display: inline-flex !important;
  align-items: baseline;
  gap: .18em;
  font-weight: 800 !important;
  color: #198a46 !important;
  white-space: nowrap;
}

.pt-normalized-score__value {
  font-size: 1.15em;
  line-height: 1;
}

.pt-normalized-score__scale {
  font-size: .68em;
  line-height: 1;
  opacity: .9;
}

:is(
  .manufacturer-rating,
  .brand-rating,
  .manufacturer-card__rating,
  [class*="manufacturer"][class*="rating"],
  [class*="brand"][class*="rating"]
) :is(
  .stars,
  .star,
  [aria-label*="Stern"],
  [aria-label*="star"]
) {
  display: none !important;
}

/* End PT manufacturer media and score 4.3.0 */
</style>

<script is:inline>
(() => {
  const normalize = (root = document) => {
    const selectors = [
      '.manufacturer-rating',
      '.brand-rating',
      '.manufacturer-card__rating',
      '[class*="manufacturer"][class*="rating"]',
      '[class*="brand"][class*="rating"]',
      '[class*="score"]',
      '[data-rating]',
      '[data-score]'
    ];

    const candidates = new Set();
    selectors.forEach((selector) => {
      root.querySelectorAll(selector).forEach((node) => candidates.add(node));
    });

    for (const node of candidates) {
      if (!(node instanceof HTMLElement)) continue;
      if (node.dataset.ptScoreNormalized === 'true') continue;

      const raw = (node.textContent || '').replace(/\s+/g, ' ').trim();
      if (!raw) continue;

      let score = null;
      let match = raw.match(/(?:⭐|★|☆)?\s*(\d(?:[.,]\d+)?)\s*(?:\/|von)\s*5\b/i);
      if (match) {
        score = Math.round(parseFloat(match[1].replace(',', '.')) * 20);
      }

      if (score === null) {
        match = raw.match(/\b(?:score\s*)?(\d{1,3})\s*(?:\/\s*100|score)\b/i)
          || raw.match(/\bscore\s*(\d{1,3})\b/i);
        if (match) score = Number(match[1]);
      }

      if (score === null && node.dataset.rating) {
        const value = Number(String(node.dataset.rating).replace(',', '.'));
        if (Number.isFinite(value)) score = value <= 5 ? Math.round(value * 20) : Math.round(value);
      }

      if (score === null && node.dataset.score) {
        const value = Number(node.dataset.score);
        if (Number.isFinite(value)) score = Math.round(value);
      }

      if (!Number.isFinite(score)) continue;
      score = Math.max(0, Math.min(100, Math.round(score)));

      node.textContent = '';
      node.classList.add('pt-normalized-score');
      node.dataset.ptScoreNormalized = 'true';

      const value = document.createElement('span');
      value.className = 'pt-normalized-score__value';
      value.textContent = String(score);

      const scale = document.createElement('span');
      scale.className = 'pt-normalized-score__scale';
      scale.textContent = '/100';

      node.append(value, scale);
      node.setAttribute('aria-label', `${score} von 100 Punkten`);
    }
  };

  normalize();
  document.addEventListener('astro:page-load', () => normalize());

  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      for (const added of mutation.addedNodes) {
        if (added instanceof HTMLElement) normalize(added);
      }
    }
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
</script>
'''

def repo_root() -> Path:
    proc = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if proc.returncode:
        raise RuntimeError("Bitte den Installer im Root des Git-Repositorys ausführen.")
    return Path(proc.stdout.strip())

def remove_old(text: str) -> str:
    pattern = re.compile(re.escape(START) + r"[\s\S]*?" + re.escape(END))
    text = pattern.sub("", text)
    return re.sub(r"<style is:global>\s*</style>", "", text)

def manufacturer_routes(root: Path) -> list[Path]:
    folder = root / "apps/pfotentechnik/src/pages/hersteller"
    if not folder.exists():
        raise RuntimeError("Hersteller-Routenordner wurde nicht gefunden.")

    files = sorted(folder.glob("*.astro"))
    dynamic = [p for p in files if "[" in p.name]
    index = [p for p in files if p.name == "index.astro"]

    selected = dynamic + index
    if not selected:
        raise RuntimeError("Keine Herstellerseite oder Herstellerübersicht gefunden.")
    return selected

def inject(path: Path) -> None:
    text = remove_old(path.read_text(encoding="utf-8"))

    if "</ProjectLayout>" in text:
        text = text.replace("</ProjectLayout>", PATCH.strip() + "\n\n</ProjectLayout>", 1)
    elif "</BaseLayout>" in text:
        text = text.replace("</BaseLayout>", PATCH.strip() + "\n\n</BaseLayout>", 1)
    elif "</Layout>" in text:
        text = text.replace("</Layout>", PATCH.strip() + "\n\n</Layout>", 1)
    else:
        text = text.rstrip() + "\n\n" + PATCH.strip() + "\n"

    path.write_text(text, encoding="utf-8")

def locate_npm() -> str | None:
    return shutil.which("npm.cmd") or shutil.which("npm.exe") or shutil.which("npm")

def main() -> int:
    root = repo_root()
    files = manufacturer_routes(root)

    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = root / ".patch-backups" / f"manufacturer-media-score-{VERSION}-{stamp}"

    for source in files:
        target = backup / source.relative_to(root)
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(source, target)

    try:
        for path in files:
            inject(path)
            print(f"Angepasst: {path.relative_to(root)}")

        npm = locate_npm()
        if npm:
            print(f"\nBuild mit {npm}")
            result = subprocess.run([npm, "run", "build:pfotentechnik"], cwd=root, shell=False)
            if result.returncode:
                raise RuntimeError("Build fehlgeschlagen.")
        else:
            print(
                "\nHinweis: npm wurde von Python nicht gefunden. "
                "Die Änderungen bleiben installiert.\n"
                "Bitte manuell ausführen:\n"
                "  npm run build:pfotentechnik\n"
            )

    except Exception as error:
        for source in files:
            saved = backup / source.relative_to(root)
            if saved.exists():
                shutil.copy2(saved, source)
        print("\nPatch fehlgeschlagen; Dateien wurden zurückgesetzt.", file=sys.stderr)
        print(f"Ursache: {error}", file=sys.stderr)
        raise

    print("\nPatch erfolgreich installiert.")
    print(f"Backup: {backup.relative_to(root)}")
    return 0

if __name__ == "__main__":
    raise SystemExit(main())

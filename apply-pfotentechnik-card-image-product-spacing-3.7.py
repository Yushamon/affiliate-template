#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

MARKER_START = "/* PT mobile card media and product hero spacing fix 3.7 */"
MARKER_END = "/* End PT mobile card media and product hero spacing fix 3.7 */"

CSS_BLOCK = r"""
/* PT mobile card media and product hero spacing fix 3.7 */

/*
 * Homepage product cards:
 * Product editorial images are treated as card covers, not as isolated
 * catalogue cut-outs. The picture and Astro image wrapper fill the media box.
 */
.home2-product-media {
  position: relative;
  display: block;
  min-height: 0;
  aspect-ratio: 4 / 3;
  padding: 0;
  overflow: hidden;
  background: var(--pt-theme-surface-2, #f8faf9);
}

.home2-product-media > picture,
.home2-product-media > img,
.home2-product-media picture,
.home2-product-media img {
  display: block;
  width: 100%;
  height: 100%;
  max-height: none;
}

.home2-product-media img {
  object-fit: cover;
  object-position: center;
  transition: transform 220ms ease;
}

.home2-product-card:hover .home2-product-media img {
  transform: scale(1.025);
}

/*
 * Product page:
 * Breadcrumbs already create visual separation. Avoid a second large top gap
 * before the actual product hero.
 */
.pt-product-detail {
  margin-top: clamp(20px, 3vw, 36px);
}

.pt-product-detail > :first-child,
.pt-product-detail .product-review-v4 {
  margin-top: 0;
}

@media (max-width: 760px) {
  .home2-product-media {
    aspect-ratio: 16 / 10;
  }

  .home2-product-media img {
    object-position: center center;
  }

  .pt-product-detail {
    margin-top: 18px;
  }

  .product-review-v4,
  .product-hero-v4 {
    margin-top: 0;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home2-product-media img {
    transition: none;
  }

  .home2-product-card:hover .home2-product-media img {
    transform: none;
  }
}
/* End PT mobile card media and product hero spacing fix 3.7 */
"""


def repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError("Bitte das Skript im Git-Repository ausführen.")
    return Path(result.stdout.strip())


def replace_or_append(text: str) -> str:
    if MARKER_START in text and MARKER_END in text:
        start = text.index(MARKER_START)
        end = text.index(MARKER_END, start) + len(MARKER_END)
        return text[:start].rstrip() + "\n\n" + CSS_BLOCK.strip() + "\n" + text[end:].lstrip()

    return text.rstrip() + "\n\n" + CSS_BLOCK.strip() + "\n"


def main() -> int:
    root = repo_root()
    css_path = root / "apps/pfotentechnik/src/styles/pfotentechnik-brand-system.css"

    if not css_path.exists():
        raise RuntimeError(
            "Die zentrale Datei apps/pfotentechnik/src/styles/"
            "pfotentechnik-brand-system.css wurde nicht gefunden."
        )

    original = css_path.read_text(encoding="utf-8")
    updated = replace_or_append(original)

    if updated == original:
        print("Der Fix ist bereits aktuell.")
    else:
        css_path.write_text(updated, encoding="utf-8")

    check = subprocess.run(
        ["git", "diff", "--check"],
        cwd=root,
        capture_output=True,
        text=True,
    )
    if check.returncode != 0:
        print(check.stdout, file=sys.stderr)
        print(check.stderr, file=sys.stderr)
        raise RuntimeError("git diff --check meldet Formatfehler.")

    patch_path = root / "pfotentechnik-card-image-product-spacing-3.7.patch"
    diff = subprocess.run(
        [
            "git",
            "diff",
            "--binary",
            "--",
            str(css_path.relative_to(root)),
        ],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    patch_path.write_text(diff, encoding="utf-8")

    print("Design-Fix 3.7 wurde angewendet.")
    print("")
    print("Geändert:")
    print("  apps/pfotentechnik/src/styles/pfotentechnik-brand-system.css")
    print("")
    print("Erzeugter Patch:")
    print("  pfotentechnik-card-image-product-spacing-3.7.patch")
    print("")
    print("Prüfen mit:")
    print("  npm run build:pfotentechnik")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        raise SystemExit(1)

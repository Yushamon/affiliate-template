#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

START = "/* PT comparison entry navigation 5.1 */"
END = "/* End PT comparison entry navigation 5.1 */"

CSS = r"""
/* PT comparison entry navigation 5.1 */

.home41-decision {
  display: grid;
  gap: clamp(1.4rem, 3vw, 2.25rem);
}

.home41-decision__header {
  display: grid;
  grid-template-columns: minmax(0, 0.9fr) minmax(280px, 0.65fr);
  gap: clamp(2rem, 6vw, 6rem);
  align-items: end;
}

.home41-decision__header h2 {
  max-width: 15ch;
  margin: 0.55rem 0 0;
  color: var(--home3-text);
  font-size: clamp(2.1rem, 4.4vw, 4rem);
  line-height: 1.02;
  letter-spacing: -0.05em;
  text-wrap: balance;
}

.home41-decision__header > p {
  max-width: 56ch;
  margin: 0;
  color: var(--home3-muted);
  line-height: 1.7;
}

.home41-decision__grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 0.85rem;
}

.home41-decision__card {
  position: relative;
  display: grid;
  min-height: 104px;
  grid-template-columns: 44px minmax(0, 1fr) 20px;
  gap: 0.85rem;
  align-items: center;
  padding: 1rem 1.05rem;
  overflow: hidden;
  border: 1px solid color-mix(
    in srgb,
    var(--home3-line) 88%,
    transparent
  );
  border-radius: 1rem;
  color: inherit;
  background: color-mix(
    in srgb,
    var(--home3-soft) 88%,
    transparent
  );
  text-decoration: none;
  box-shadow: 0 8px 24px rgba(20, 32, 26, 0.045);
  transition:
    border-color 160ms ease,
    box-shadow 160ms ease,
    transform 160ms ease;
}

.home41-decision__card:hover {
  transform: translateY(-2px);
  border-color: color-mix(
    in srgb,
    var(--home3-accent) 28%,
    var(--home3-line)
  );
  box-shadow: 0 14px 34px rgba(20, 32, 26, 0.08);
}

.home41-decision__card:focus-visible {
  outline: 3px solid color-mix(
    in srgb,
    var(--home3-accent) 32%,
    transparent
  );
  outline-offset: 3px;
}

.home41-decision__media {
  display: none;
}

.home41-decision__quick-icon {
  display: grid;
  width: 44px;
  height: 44px;
  grid-column: 1;
  place-items: center;
  border: 1px solid color-mix(
    in srgb,
    var(--home3-accent) 20%,
    transparent
  );
  border-radius: 999px;
  color: var(--home3-accent);
  background: color-mix(
    in srgb,
    var(--home3-accent) 8%,
    var(--home3-soft)
  );
}

.home41-decision__quick-icon svg {
  width: 21px;
  height: 21px;
  fill: none;
  stroke: currentColor;
  stroke-width: 1.7;
  stroke-linecap: round;
  stroke-linejoin: round;
}

.home41-decision__content {
  display: block;
  min-width: 0;
  grid-column: 2;
  padding: 0;
}

.home41-decision__content h3 {
  margin: 0;
  color: var(--home3-text);
  font-size: clamp(0.98rem, 1.35vw, 1.08rem);
  font-weight: 760;
  line-height: 1.25;
  letter-spacing: -0.016em;
  text-wrap: pretty;
}

.home41-decision__content > p,
.home41-decision__meta,
.home41-decision__cta-label {
  display: none;
}

.home41-decision__content > b {
  display: none;
}

.home41-decision__arrow {
  display: grid;
  width: 20px;
  height: 32px;
  grid-column: 3;
  place-items: center;
  color: var(--home3-accent);
  font-size: 1rem;
  font-weight: 850;
  line-height: 1;
  transition: transform 160ms ease;
}

.home41-decision__card:hover .home41-decision__arrow {
  transform: translateX(2px);
}

@media (max-width: 900px) {
  .home41-decision__header {
    grid-template-columns: 1fr;
    gap: 0.8rem;
  }

  .home41-decision__header > p {
    max-width: 48ch;
  }

  .home41-decision__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 720px) {
  .home41-decision {
    gap: 1.2rem;
  }

  .home41-decision__header h2 {
    max-width: 13ch;
    font-size: clamp(2.05rem, 9.2vw, 2.8rem);
  }

  .home41-decision__header > p {
    font-size: 0.94rem;
    line-height: 1.55;
  }

  .home41-decision__grid {
    gap: 0.68rem;
  }

  .home41-decision__card {
    min-height: 82px;
    grid-template-columns: 34px minmax(0, 1fr) 16px;
    gap: 0.62rem;
    padding: 0.78rem;
    border-radius: 0.92rem;
    box-shadow: none;
  }

  .home41-decision__quick-icon {
    width: 34px;
    height: 34px;
  }

  .home41-decision__quick-icon svg {
    width: 17px;
    height: 17px;
  }

  .home41-decision__content h3 {
    font-size: clamp(0.8rem, 3.45vw, 0.94rem);
    font-weight: 680;
    line-height: 1.22;
    letter-spacing: -0.01em;
    overflow-wrap: normal;
    word-break: normal;
    hyphens: none;
  }

  .home41-decision__arrow {
    width: 16px;
    font-size: 0.95rem;
  }
}

@media (max-width: 365px) {
  .home41-decision__grid {
    grid-template-columns: 1fr;
  }

  .home41-decision__card {
    min-height: 70px;
  }
}

@media (prefers-color-scheme: dark) {
  .home41-decision__card {
    border-color: rgba(226, 232, 240, 0.14);
    background: #111d2f;
    box-shadow: none;
  }

  .home41-decision__card:hover {
    border-color: rgba(94, 234, 212, 0.26);
    background: #142238;
  }

  .home41-decision__quick-icon {
    border-color: rgba(94, 234, 212, 0.17);
    background: rgba(20, 184, 166, 0.09);
  }
}
/* End PT comparison entry navigation 5.1 */
"""


def repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError("Bitte im Git-Repository ausführen.")
    return Path(result.stdout.strip())


def replace_block(text: str) -> str:
    if START in text and END in text:
        begin = text.index(START)
        finish = text.index(END, begin) + len(END)
        return (
            text[:begin].rstrip()
            + "\n\n"
            + CSS.strip()
            + "\n"
            + text[finish:].lstrip()
        )
    return text.rstrip() + "\n\n" + CSS.strip() + "\n"


def main() -> int:
    root = repo_root()
    css_path = (
        root
        / "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"
    )

    if not css_path.exists():
        raise RuntimeError(
            "PfotenTechnik-Designsystem wurde nicht gefunden."
        )

    text = css_path.read_text(encoding="utf-8")
    css_path.write_text(replace_block(text), encoding="utf-8")

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

    patch_path = root / "pfotentechnik-comparison-entry-navigation-5.1.patch"
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

    print("Comparison Entry Navigation 5.1 wurde angewendet.")
    print("")
    print("Mobile:")
    print("  - kompaktes 2 × 3 Raster")
    print("  - keine Produktbilder oder großen Fallback-Symbole")
    print("  - kleinere SVG-Icons und leichtere Schrift")
    print("  - Pfeil in eigener Grid-Spalte")
    print("")
    print("Desktop:")
    print("  - ruhiges 3 × 2 Raster")
    print("  - kompakte Navigationskarten statt großer Bildkarten")
    print("  - Hover- und Fokuszustände")
    print("")
    print("Erzeugt:")
    print("  pfotentechnik-comparison-entry-navigation-5.1.patch")
    print("")
    print("Jetzt prüfen:")
    print("  npm run build:pfotentechnik")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        raise SystemExit(1)

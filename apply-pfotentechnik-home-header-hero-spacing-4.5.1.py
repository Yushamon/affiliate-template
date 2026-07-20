#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

BLOCK_START = "/* PT homepage header-to-hero spacing 4.5.1 */"
BLOCK_END = "/* End PT homepage header-to-hero spacing 4.5.1 */"

CSS_BLOCK = r"""
/* PT homepage header-to-hero spacing 4.5.1 */

/*
 * The regular page container needs generous top spacing below the header.
 * The homepage hero does not: it starts directly at the header edge.
 */
.container--home {
  padding-top: 0;
}

@media (max-width: 768px) {
  .container--home {
    padding-top: 0;
  }
}

@media (max-width: 720px) {
  .container--home .home3-hero {
    margin-top: 0;
  }

  /*
   * Move the complete text group slightly upward while keeping the content
   * bottom-aligned and preserving enough room for both buttons and signals.
   */
  .container--home .home3-hero__content {
    padding-bottom: clamp(2.65rem, 7vw, 3.5rem);
  }
}
/* End PT homepage header-to-hero spacing 4.5.1 */
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


def update_layout(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    old = '<main class="container">'
    new = '<main class:list={["container", isHome && "container--home"]}>'

    if old in text:
        text = text.replace(old, new, 1)
    elif new not in text:
        raise RuntimeError(
            "AffiliateLayout.astro: erwartetes Main-Element nicht gefunden."
        )

    path.write_text(text, encoding="utf-8")


def replace_marked(text: str) -> str:
    if BLOCK_START in text and BLOCK_END in text:
        start = text.index(BLOCK_START)
        end = text.index(BLOCK_END, start) + len(BLOCK_END)
        return (
            text[:start].rstrip()
            + "\n\n"
            + CSS_BLOCK.strip()
            + "\n"
            + text[end:].lstrip()
        )

    return text.rstrip() + "\n\n" + CSS_BLOCK.strip() + "\n"


def update_layout_css(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = replace_marked(text)
    path.write_text(text, encoding="utf-8")


def main() -> int:
    root = repo_root()

    layout = root / "packages/affiliate-core/src/layouts/AffiliateLayout.astro"
    css = root / "packages/affiliate-core/src/styles/layout.css"

    for path in (layout, css):
        if not path.exists():
            raise RuntimeError(f"Datei fehlt: {path.relative_to(root)}")

    update_layout(layout)
    update_layout_css(css)

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

    patch_path = root / "pfotentechnik-home-header-hero-spacing-4.5.1.patch"
    diff = subprocess.run(
        [
            "git",
            "diff",
            "--binary",
            "--",
            str(layout.relative_to(root)),
            str(css.relative_to(root)),
        ],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    patch_path.write_text(diff, encoding="utf-8")

    print("Homepage Header–Hero Spacing 4.5.1 wurde angewendet.")
    print("")
    print("Korrigiert:")
    print("  - globales 90-px-Mobile-Padding auf der Homepage deaktiviert")
    print("  - Hero beginnt direkt unter dem Header")
    print("  - Textgruppe im mobilen Hero leicht nach oben verschoben")
    print("  - normale Unterseiten behalten ihren bisherigen Abstand")
    print("")
    print("Erzeugt:")
    print("  pfotentechnik-home-header-hero-spacing-4.5.1.patch")
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

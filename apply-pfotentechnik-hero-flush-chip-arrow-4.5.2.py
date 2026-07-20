#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

CSS_START = "/* PT hero flush + chip arrow 4.5.2 */"
CSS_END = "/* End PT hero flush + chip arrow 4.5.2 */"

CSS_BLOCK = r'''
/* PT hero flush + chip arrow 4.5.2 */

main.container.container--home {
  padding-top: 0 !important;
}

main.container.container--home > .home3 {
  margin-top: 0 !important;
  padding-top: 0 !important;
}

main.container.container--home .home3-hero {
  margin-top: 0 !important;
}

@media (max-width: 768px) {
  main.container.container--home {
    padding-top: 0 !important;
  }

  main.container.container--home > .home3 {
    margin-top: 0 !important;
    padding-top: 0 !important;
  }

  main.container.container--home .home3-hero {
    margin-top: 0 !important;
  }
}

@media (max-width: 760px) {
  .home41-decision__card {
    grid-template-columns: 34px minmax(0, 1fr) 18px;
  }

  .home41-decision__content {
    grid-column: 2;
  }

  .home41-decision__arrow {
    display: grid;
    width: 18px;
    height: 32px;
    grid-column: 3;
    place-items: center;
    align-self: center;
    color: var(--home3-accent);
    font-size: 1rem;
    font-weight: 800;
    line-height: 1;
  }
}

@media (min-width: 761px) {
  .home41-decision__arrow {
    display: none;
  }
}
/* End PT hero flush + chip arrow 4.5.2 */
'''


def repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError("Bitte im Git-Repository ausführen.")
    return Path(result.stdout.strip())


def update_navigation(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    text = re.sub(
        r'<b>\s*'
        r'<span class="home41-decision__cta-label">\s*'
        r'Vergleich ansehen\s*'
        r'</span>\s*'
        r'<span aria-hidden="true">→</span>\s*'
        r'</b>',
        '<b><span class="home41-decision__cta-label">Vergleich ansehen</span></b>',
        text,
        count=1,
        flags=re.DOTALL,
    )

    if 'class="home41-decision__arrow"' not in text:
        marker = "          </div>\n        </a>"
        replacement = (
            "          </div>\n\n"
            '          <span class="home41-decision__arrow" aria-hidden="true">\n'
            "            →\n"
            "          </span>\n"
            "        </a>"
        )
        if marker not in text:
            raise RuntimeError(
                "HomeNavigation.astro: Ende der Vergleichskarte nicht gefunden."
            )
        text = text.replace(marker, replacement, 1)

    path.write_text(text, encoding="utf-8")


def replace_marked(text: str) -> str:
    if CSS_START in text and CSS_END in text:
        start = text.index(CSS_START)
        end = text.index(CSS_END, start) + len(CSS_END)
        return (
            text[:start].rstrip()
            + "\n\n"
            + CSS_BLOCK.strip()
            + "\n"
            + text[end:].lstrip()
        )
    return text.rstrip() + "\n\n" + CSS_BLOCK.strip() + "\n"


def update_design_css(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    path.write_text(replace_marked(text), encoding="utf-8")


def main() -> int:
    root = repo_root()

    navigation = root / "packages/affiliate-core/src/components/home/HomeNavigation.astro"
    design_css = root / "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"

    for path in (navigation, design_css):
        if not path.exists():
            raise RuntimeError(f"Datei fehlt: {path.relative_to(root)}")

    update_navigation(navigation)
    update_design_css(design_css)

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

    patch_path = root / "pfotentechnik-hero-flush-chip-arrow-4.5.2.patch"
    diff = subprocess.run(
        [
            "git",
            "diff",
            "--binary",
            "--",
            str(navigation.relative_to(root)),
            str(design_css.relative_to(root)),
        ],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    patch_path.write_text(diff, encoding="utf-8")

    print("Hero Flush + Chip Arrow 4.5.2 wurde angewendet.")
    print("")
    print("Korrigiert:")
    print("  - Homepage-Main-Padding in der zuletzt geladenen Designschicht")
    print("  - Hero- und Home-Wrapper-Abstand auf exakt 0")
    print("  - Pfeil aus dem Textcontainer entfernt")
    print("  - Pfeil als eigene dritte Grid-Spalte eingefügt")
    print("")
    print("Erzeugt:")
    print("  pfotentechnik-hero-flush-chip-arrow-4.5.2.patch")
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

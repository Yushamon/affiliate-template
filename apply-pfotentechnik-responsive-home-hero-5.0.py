#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

OLD_MARKERS = (
    (
        "/* PT homepage hero + quick comparison chips 4.2 */",
        "/* End PT homepage hero + quick comparison chips 4.2 */",
    ),
    (
        "/* PT homepage mobile alignment 4.3 */",
        "/* End PT homepage mobile alignment 4.3 */",
    ),
    (
        "/* PT GPS quick chips and score audit polish 4.4 */",
        "/* End PT GPS quick chips and score audit polish 4.4 */",
    ),
    (
        "/* PT homepage navigation and score source 4.5 */",
        "/* End PT homepage navigation and score source 4.5 */",
    ),
    (
        "/* PT homepage header-to-hero spacing 4.5.1 */",
        "/* End PT homepage header-to-hero spacing 4.5.1 */",
    ),
    (
        "/* PT hero flush + chip arrow 4.5.2 */",
        "/* End PT hero flush + chip arrow 4.5.2 */",
    ),
    (
        "/* PT mobile hero text position 4.5.3 */",
        "/* End PT mobile hero text position 4.5.3 */",
    ),
)

START = "/* PT responsive homepage hero 5.0 */"
END = "/* End PT responsive homepage hero 5.0 */"

CSS = r"""
/* PT responsive homepage hero 5.0 */

/* Homepage starts directly below the sticky header. */
main.container.container--home {
  padding-top: 0 !important;
}

main.container.container--home > .home3 {
  margin-top: 0;
  padding-top: 0;
}

/* Desktop and large tablet. */
main.container.container--home .home3-hero {
  width: 100%;
  min-height: clamp(610px, 70vh, 720px);
  margin-top: 0;
  border-radius: clamp(1.4rem, 2.2vw, 2rem);
}

main.container.container--home .home3-hero__content {
  width: min(100%, 760px);
  min-height: inherit;
  justify-content: center;
  padding:
    clamp(3rem, 7vh, 5.5rem)
    clamp(2.2rem, 5vw, 5rem);
}

main.container.container--home .home3-hero h1 {
  max-width: 11.2ch;
  margin: 0.7rem 0 1rem;
  font-size: clamp(3.35rem, 6.1vw, 5.7rem);
  line-height: 0.94;
  letter-spacing: -0.058em;
  text-wrap: balance;
}

main.container.container--home .home3-hero__text {
  max-width: 39ch;
  font-size: clamp(1.05rem, 1.7vw, 1.24rem);
  line-height: 1.6;
}

main.container.container--home .home3-hero__actions {
  margin-top: 1.55rem;
}

main.container.container--home .home3-signals {
  margin-top: 1rem;
}

main.container.container--home .home3-hero__media img {
  object-position: 61% 50%;
}

main.container.container--home .home3-hero__shade {
  background:
    linear-gradient(
      90deg,
      rgba(6, 29, 25, 0.94) 0%,
      rgba(6, 29, 25, 0.78) 39%,
      rgba(6, 29, 25, 0.28) 72%,
      rgba(6, 29, 25, 0.12) 100%
    ),
    linear-gradient(
      180deg,
      rgba(6, 29, 25, 0.08),
      rgba(6, 29, 25, 0.5)
    );
}

/* Medium desktop / tablet landscape. */
@media (max-width: 980px) and (min-width: 721px) {
  main.container.container--home .home3-hero {
    min-height: 620px;
  }

  main.container.container--home .home3-hero__content {
    width: min(100%, 650px);
    padding: 3.25rem;
  }

  main.container.container--home .home3-hero h1 {
    font-size: clamp(3.1rem, 7vw, 4.7rem);
  }

  main.container.container--home .home3-hero__media img {
    object-position: 66% 50%;
  }
}

/* Mobile full-bleed hero. */
@media (max-width: 720px) {
  main.container.container--home {
    padding-top: 0 !important;
  }

  main.container.container--home .home3-hero {
    width: 100vw;
    max-width: none;
    min-height: clamp(585px, 76svh, 650px);
    margin-top: 0 !important;
    margin-right: calc(50% - 50vw);
    margin-left: calc(50% - 50vw);
    border-radius: 0;
    box-shadow: none;
  }

  main.container.container--home .home3-hero__content {
    width: min(100%, 42rem);
    min-height: inherit;
    margin-inline: auto;
    justify-content: flex-end;
    padding:
      clamp(7.5rem, 18svh, 10rem)
      max(1.35rem, env(safe-area-inset-right))
      clamp(1.6rem, 4.5vw, 2.1rem)
      max(1.35rem, env(safe-area-inset-left));
  }

  main.container.container--home .home3-hero h1 {
    max-width: 10.8ch;
    margin: 0.45rem 0 0.8rem;
    font-size: clamp(2.72rem, 11.6vw, 3.45rem);
    line-height: 0.95;
    letter-spacing: -0.056em;
  }

  main.container.container--home .home3-hero__text {
    max-width: 31ch;
    font-size: 0.98rem;
    line-height: 1.48;
  }

  main.container.container--home .home3-hero__actions {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.9fr);
    gap: 0.65rem;
    margin-top: 1.15rem;
  }

  main.container.container--home .home3-button {
    min-height: 50px;
    padding-inline: 0.9rem;
    font-size: 0.92rem;
  }

  main.container.container--home .home3-signals {
    gap: 0.45rem;
    margin-top: 0.85rem;
  }

  main.container.container--home .home3-signals li {
    min-height: 30px;
    padding: 0.3rem 0.58rem;
    font-size: 0.72rem;
  }

  main.container.container--home .home3-hero__media img {
    object-position: 61% 40%;
  }

  main.container.container--home .home3-hero__shade {
    background:
      linear-gradient(
        180deg,
        rgba(6, 29, 25, 0.12) 0%,
        rgba(6, 29, 25, 0.24) 27%,
        rgba(6, 29, 25, 0.72) 59%,
        rgba(6, 29, 25, 0.96) 100%
      ),
      linear-gradient(
        90deg,
        rgba(6, 29, 25, 0.32),
        rgba(6, 29, 25, 0.08)
      );
  }
}

/* Narrow phones: stack actions and reduce headline slightly. */
@media (max-width: 390px) {
  main.container.container--home .home3-hero {
    min-height: 620px;
  }

  main.container.container--home .home3-hero h1 {
    font-size: clamp(2.45rem, 11vw, 3.05rem);
  }

  main.container.container--home .home3-hero__actions {
    grid-template-columns: 1fr;
  }
}

/* Short mobile viewports: preserve all controls without overflow. */
@media (max-width: 720px) and (max-height: 720px) {
  main.container.container--home .home3-hero {
    min-height: 610px;
  }

  main.container.container--home .home3-hero__content {
    padding-top: 5rem;
    padding-bottom: 1.25rem;
  }

  main.container.container--home .home3-hero h1 {
    font-size: clamp(2.35rem, 10.2vw, 3rem);
  }

  main.container.container--home .home3-hero__text {
    line-height: 1.42;
  }
}
/* End PT responsive homepage hero 5.0 */
"""


def root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError("Bitte im Git-Repository ausführen.")
    return Path(result.stdout.strip())


def remove_marked(text: str, start: str, end: str) -> str:
    while start in text and end in text:
        begin = text.index(start)
        finish = text.index(end, begin) + len(end)
        text = text[:begin].rstrip() + "\n\n" + text[finish:].lstrip()
    return text


def clean_file(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    for start, end in OLD_MARKERS:
        text = remove_marked(text, start, end)

    text = remove_marked(text, START, END)
    path.write_text(text.rstrip() + "\n", encoding="utf-8")


def append_system(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = remove_marked(text, START, END)
    path.write_text(
        text.rstrip() + "\n\n" + CSS.strip() + "\n",
        encoding="utf-8",
    )


def main() -> int:
    repo = root()

    shared_css = repo / "packages/affiliate-core/src/components/home/home.css"
    design_css = repo / "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"

    for path in (shared_css, design_css):
        if not path.exists():
            raise RuntimeError(f"Datei fehlt: {path.relative_to(repo)}")

    # Remove historical hero overrides from both style layers.
    clean_file(shared_css)
    clean_file(design_css)

    # One authoritative responsive hero definition in the app-level layer.
    append_system(design_css)

    check = subprocess.run(
        ["git", "diff", "--check"],
        cwd=repo,
        capture_output=True,
        text=True,
    )
    if check.returncode != 0:
        print(check.stdout, file=sys.stderr)
        print(check.stderr, file=sys.stderr)
        raise RuntimeError("git diff --check meldet Formatfehler.")

    patch_path = repo / "pfotentechnik-responsive-home-hero-5.0.patch"
    diff = subprocess.run(
        [
            "git",
            "diff",
            "--binary",
            "--",
            str(shared_css.relative_to(repo)),
            str(design_css.relative_to(repo)),
        ],
        cwd=repo,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    patch_path.write_text(diff, encoding="utf-8")

    print("Responsive Homepage Hero 5.0 wurde angewendet.")
    print("")
    print("Aufgeräumt:")
    print("  - Hero-Overrides 4.2 bis 4.5.3 entfernt")
    print("  - nur noch ein responsives Hero-System")
    print("")
    print("Mobile:")
    print("  - kompaktere Höhe")
    print("  - Full-Bleed direkt unter dem Header")
    print("  - weniger Leerfläche unter den Trust-Chips")
    print("  - ausgewogenere Headline-Größe")
    print("")
    print("Desktop:")
    print("  - kontrollierte Höhe von 610 bis 720 px")
    print("  - definierte Textbreite und Bildbalance")
    print("  - responsive Typografie und Overlay")
    print("")
    print("Erzeugt:")
    print("  pfotentechnik-responsive-home-hero-5.0.patch")
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

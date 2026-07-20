#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

START = "/* PT mobile hero text position 4.5.3 */"
END = "/* End PT mobile hero text position 4.5.3 */"

CSS = r'''
/* PT mobile hero text position 4.5.3 */

@media (max-width: 720px) {
  /*
   * Keep the full content group intact and move it upward in relation
   * to the image by increasing the bottom breathing room.
   */
  main.container.container--home .home3-hero__content {
    justify-content: flex-end;
    padding-bottom: clamp(4.75rem, 13vw, 6.25rem);
  }

  main.container.container--home .home3-hero h1 {
    margin-top: 0.45rem;
    margin-bottom: 0.9rem;
  }
}

/* Prevent crowding on unusually short mobile viewports. */
@media (max-width: 720px) and (max-height: 740px) {
  main.container.container--home .home3-hero__content {
    padding-bottom: 2.5rem;
  }

  main.container.container--home .home3-hero h1 {
    font-size: clamp(2.35rem, 10.4vw, 3.15rem);
  }
}
/* End PT mobile hero text position 4.5.3 */
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

    patch_path = root / "pfotentechnik-mobile-hero-text-position-4.5.3.patch"
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

    print("Mobile Hero Text Position 4.5.3 wurde angewendet.")
    print("")
    print("Korrigiert:")
    print("  - gesamte Hero-Textgruppe weiter nach oben verschoben")
    print("  - Bildhöhe und Bildausschnitt bleiben unverändert")
    print("  - Abstände zwischen Text, Buttons und Trust-Chips bleiben stabil")
    print("  - Schutzregel für besonders niedrige Displays")
    print("")
    print("Erzeugt:")
    print("  pfotentechnik-mobile-hero-text-position-4.5.3.patch")
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

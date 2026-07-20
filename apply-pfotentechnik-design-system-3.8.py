#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path


HOME_MEDIA_RULE = r""".home3-product-card__media {
  position: relative;
  display: grid;
  width: 100%;
  min-height: 0;
  aspect-ratio: 4 / 3;
  place-items: center;
  padding: 0;
  overflow: hidden;
  border-bottom: 1px solid var(--home3-line);
  background: #f4f6f3;
}

.home3-product-card__media picture {
  display: block;
  width: 100%;
  height: 100%;
}

.home3-product-card__media picture,
.home3-product-card__media img {
  width: 100%;
  height: 100%;
}

.home3-product-card__media img {
  display: block;
  max-height: none;
  object-fit: contain;
  object-position: center;
  background: transparent;
  transition: transform 180ms ease;
}

.home3-product-card:hover .home3-product-card__media img {
  transform: scale(1.012);
}"""

PRODUCT_SPACING_START = "/* PT product page vertical rhythm 3.8 */"
PRODUCT_SPACING_END = "/* End PT product page vertical rhythm 3.8 */"

PRODUCT_SPACING_RULE = r"""/* PT product page vertical rhythm 3.8 */

/*
 * Breadcrumbs already provide section separation. Keep the product experience
 * visually connected to them instead of adding a second large top margin.
 */
.pt-product-detail {
  margin-top: clamp(22px, 3vw, 36px);
}

.pt-product-detail > .product-review-v4,
.pt-product-detail > :first-child .product-review-v4,
.pt-product-detail .product-review-v4:first-child {
  margin-top: 0;
}

@media (max-width: 760px) {
  .pt-product-detail {
    margin-top: 16px;
  }

  .pt-product-detail > .product-review-v4,
  .pt-product-detail .product-review-v4:first-child,
  .pt-product-detail .product-hero-v4 {
    margin-top: 0;
  }
}
/* End PT product page vertical rhythm 3.8 */"""

MOBILE_HOME_START = "/* PT home product media mobile 3.8 */"
MOBILE_HOME_END = "/* End PT home product media mobile 3.8 */"

MOBILE_HOME_RULE = r"""/* PT home product media mobile 3.8 */
@media (max-width: 760px) {
  .home3-product-card__media {
    aspect-ratio: 16 / 10;
  }
}

@media (prefers-color-scheme: dark) {
  /*
   * Product photography often contains a white studio canvas. A neutral light
   * stage prevents that canvas from looking like a second inset card.
   */
  .home3-product-card__media {
    background: #eef1ed;
  }
}

@media (prefers-reduced-motion: reduce) {
  .home3-product-card__media img {
    transition: none;
  }

  .home3-product-card:hover .home3-product-card__media img {
    transform: none;
  }
}
/* End PT home product media mobile 3.8 */"""

OLD_MARKERS = [
    (
        "/* PT mobile card media and product hero spacing fix 3.7 */",
        "/* End PT mobile card media and product hero spacing fix 3.7 */",
    ),
    (
        "/* PT homepage product media normalization 3.8 */",
        "/* End PT homepage product media normalization 3.8 */",
    ),
]

OBSOLETE_FILES = [
    "apply-pfotentechnik-card-image-product-spacing-3.7.py",
    "pfotentechnik-card-image-product-spacing-3.7.patch",
    "apply-pfotentechnik-home-product-media-3.8.py",
    "pfotentechnik-home-product-media-3.8.patch",
]


def repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError("Bitte das Skript im Git-Repository ausführen.")
    return Path(result.stdout.strip())


def remove_marked_block(text: str, start: str, end: str) -> str:
    while start in text and end in text:
        begin = text.index(start)
        finish = text.index(end, begin) + len(end)
        text = text[:begin].rstrip() + "\n\n" + text[finish:].lstrip()
    return text


def replace_css_rule(text: str, selector: str, replacement: str) -> str:
    pattern = re.compile(
        rf"{re.escape(selector)}\s*\{{.*?\n\}}",
        re.DOTALL,
    )
    match = pattern.search(text)
    if not match:
        raise RuntimeError(f"CSS-Regel nicht gefunden: {selector}")
    return text[:match.start()] + replacement + text[match.end():]


def remove_css_rule(text: str, selector: str) -> str:
    pattern = re.compile(
        rf"\n?{re.escape(selector)}\s*\{{.*?\n\}}\n?",
        re.DOTALL,
    )
    return pattern.sub("\n", text, count=1)


def update_home_css(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    text = replace_css_rule(
        text,
        ".home3-product-card__media",
        HOME_MEDIA_RULE.split("\n\n.home3-product-card__media picture", 1)[0],
    )

    # Remove the old related rules before inserting one consolidated group.
    for selector in (
        ".home3-product-card__media picture,\n.home3-product-card__media img",
        ".home3-product-card__media img",
        ".home3-product-card:hover .home3-product-card__media img",
    ):
        text = remove_css_rule(text, selector)

    # Insert the consolidated media rules directly after the base media block.
    base_pattern = re.compile(
        r"\.home3-product-card__media\s*\{.*?\n\}",
        re.DOTALL,
    )
    base_match = base_pattern.search(text)
    if not base_match:
        raise RuntimeError("Die neue Home-Media-Basisregel konnte nicht gefunden werden.")

    remaining_rules = HOME_MEDIA_RULE.split("\n\n", 1)[1]
    text = (
        text[:base_match.end()]
        + "\n\n"
        + remaining_rules
        + text[base_match.end():]
    )

    text = remove_marked_block(text, MOBILE_HOME_START, MOBILE_HOME_END)
    text = text.rstrip() + "\n\n" + MOBILE_HOME_RULE + "\n"
    path.write_text(text, encoding="utf-8")


def choose_design_system(root: Path) -> Path:
    candidates = [
        root / "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css",
        root / "apps/pfotentechnik/src/styles/pfotentechnik.css",
    ]
    for candidate in candidates:
        if candidate.exists():
            return candidate
    raise RuntimeError(
        "Keine aktive Pfotentechnik-Design-System-Datei gefunden."
    )


def update_design_system(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    for start, end in OLD_MARKERS:
        text = remove_marked_block(text, start, end)

    text = remove_marked_block(
        text,
        PRODUCT_SPACING_START,
        PRODUCT_SPACING_END,
    )

    text = text.rstrip() + "\n\n" + PRODUCT_SPACING_RULE + "\n"
    path.write_text(text, encoding="utf-8")


def clean_old_css_files(root: Path) -> list[str]:
    removed: list[str] = []

    # Remove obsolete marker blocks from legacy files if they still exist.
    style_dir = root / "apps/pfotentechnik/src/styles"
    for path in style_dir.glob("*.css"):
        if path.name == "pfotentechnik-design-system.css":
            continue
        text = path.read_text(encoding="utf-8")
        updated = text
        for start, end in OLD_MARKERS:
            updated = remove_marked_block(updated, start, end)
        if updated != text:
            path.write_text(updated, encoding="utf-8")
            removed.append(f"Alt-Override bereinigt: {path.relative_to(root)}")

    for relative in OBSOLETE_FILES:
        path = root / relative
        if path.exists():
            path.unlink()
            removed.append(f"Altdatei entfernt: {relative}")

    return removed


def main() -> int:
    root = repo_root()
    home_css = root / "packages/affiliate-core/src/components/home/home.css"
    design_css = choose_design_system(root)

    if not home_css.exists():
        raise RuntimeError(f"Aktive Home-CSS-Datei fehlt: {home_css}")

    update_home_css(home_css)
    update_design_system(design_css)
    cleanup = clean_old_css_files(root)

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

    changed = subprocess.run(
        ["git", "status", "--short"],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    ).stdout

    patch_path = root / "pfotentechnik-design-system-3.8.patch"
    diff = subprocess.run(
        ["git", "diff", "--binary"],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    patch_path.write_text(diff, encoding="utf-8")

    print("Pfotentechnik Design System 3.8 wurde angewendet.")
    print("")
    print("Direkt bereinigt:")
    print("  packages/affiliate-core/src/components/home/home.css")
    print(f"  {design_css.relative_to(root)}")
    print("")
    print("Ergebnis Homepage:")
    print("  - keine 1-rem-Innenfläche mehr")
    print("  - eine einheitliche 4:3-Produktbühne")
    print("  - vollständige Geräteansicht ohne harten Cover-Crop")
    print("  - helle Studioflächen wirken nicht mehr wie eine zweite Karte")
    print("")
    print("Ergebnis Produktseite:")
    print("  - kompakter Abstand nach den Breadcrumbs")
    print("  - mobile Produktkarte beginnt nach 16 px")
    print("")

    if cleanup:
        print("Aufgeräumt:")
        for item in cleanup:
            print(f"  - {item}")
        print("")

    print("Geänderte Dateien:")
    print(changed.rstrip() or "  keine")
    print("")
    print("Erzeugter Patch:")
    print("  pfotentechnik-design-system-3.8.patch")
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

#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

OLD_BLOCKS = (
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
)

NEW_START = "/* PT homepage navigation and score source 4.5 */"
NEW_END = "/* End PT homepage navigation and score source 4.5 */"

NEW_CSS = r'''
/* PT homepage navigation and score source 4.5 */

.home3-card-content > small {
  display: inline-flex;
  width: fit-content;
  max-width: 100%;
  margin-top: 0.9rem;
  padding: 0;
  color: var(--home3-muted);
  background: transparent;
  font-size: 0.75rem;
  font-weight: 650;
  line-height: 1.35;
}

@media (max-width: 720px) {
  .home5 > .home3-hero,
  .home3 > .home3-hero {
    width: 100vw;
    max-width: none;
    min-height: clamp(620px, 84svh, 760px);
    margin-top: 0;
    margin-right: calc(50% - 50vw);
    margin-left: calc(50% - 50vw);
    border-radius: 0;
    box-shadow: none;
  }

  .home3-hero__content {
    width: min(100%, 42rem);
    min-height: inherit;
    margin-inline: auto;
    justify-content: flex-end;
    padding:
      clamp(8rem, 24svh, 13rem)
      max(1.5rem, env(safe-area-inset-right))
      clamp(1.65rem, 5vw, 2.2rem)
      max(1.5rem, env(safe-area-inset-left));
  }

  .home3-hero h1 {
    max-width: 10.4ch;
    margin: 0.55rem 0 1rem;
    font-size: clamp(2.55rem, 11.2vw, 3.65rem);
    line-height: 0.98;
    letter-spacing: -0.055em;
  }

  .home3-hero__text {
    max-width: 31ch;
    font-size: 1rem;
    line-height: 1.55;
  }

  .home3-hero__actions {
    display: grid;
    grid-template-columns: minmax(0, 1.2fr) minmax(0, 0.9fr);
    gap: 0.65rem;
    margin-top: 1.35rem;
  }

  .home3-signals {
    gap: 0.5rem;
    margin-top: 1rem;
  }

  .home3-signals li {
    min-height: 32px;
    padding: 0.34rem 0.62rem;
    font-size: 0.75rem;
  }

  .home3-hero__media img {
    object-position: 60% 50%;
  }
}

.home41-decision__quick-icon {
  display: none;
}

@media (max-width: 760px) {
  .home41-decision {
    gap: 1.15rem;
  }

  .home41-decision__header {
    gap: 0.75rem;
  }

  .home41-decision__header > p {
    max-width: 42ch;
    font-size: 0.94rem;
    line-height: 1.55;
  }

  .home41-decision__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.7rem;
  }

  .home41-decision__card {
    position: relative;
    display: grid;
    min-height: 88px;
    grid-template-columns: 34px minmax(0, 1fr) 14px;
    gap: 0.62rem;
    align-items: center;
    padding: 0.8rem;
    overflow: visible;
    border-radius: 0.95rem;
    background: var(--home3-soft);
    box-shadow: none;
  }

  .home41-decision__card:hover {
    transform: none;
    box-shadow: 0 8px 22px rgba(20, 32, 26, 0.07);
  }

  .home41-decision__media {
    display: none;
  }

  .home41-decision__quick-icon {
    display: grid;
    width: 34px;
    height: 34px;
    place-items: center;
    border: 1px solid color-mix(
      in srgb,
      var(--home3-accent) 18%,
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
    width: 17px;
    height: 17px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.7;
    stroke-linecap: round;
    stroke-linejoin: round;
  }

  .home41-decision__content {
    display: block;
    min-width: 0;
    padding: 0;
  }

  .home41-decision__content h3 {
    margin: 0;
    color: var(--home3-text);
    font-size: clamp(0.82rem, 3.35vw, 0.94rem);
    font-weight: 720;
    line-height: 1.22;
    letter-spacing: -0.012em;
    overflow-wrap: normal;
    word-break: normal;
    hyphens: none;
    text-wrap: pretty;
  }

  .home41-decision__content > p,
  .home41-decision__meta,
  .home41-decision__cta-label {
    display: none;
  }

  .home41-decision__content > b {
    position: static;
    margin: 0;
    font-size: 0;
  }

  .home41-decision__content > b > span:last-child {
    position: absolute;
    top: 50%;
    right: 0.75rem;
    color: var(--home3-accent);
    font-size: 1rem;
    font-weight: 700;
    transform: translateY(-50%);
  }
}

@media (max-width: 390px) {
  .home3-hero__actions {
    grid-template-columns: 1fr;
  }

  .home41-decision__grid {
    grid-template-columns: 1fr;
  }

  .home41-decision__card {
    min-height: 72px;
  }
}

@media (prefers-color-scheme: dark) and (max-width: 760px) {
  .home41-decision__card {
    border-color: rgba(226, 232, 240, 0.13);
    background: #111d2f;
  }

  .home41-decision__quick-icon {
    border-color: rgba(94, 234, 212, 0.16);
    background: rgba(20, 184, 166, 0.09);
  }
}

.recommendation-card .pt-score {
  margin-top: auto;
}

.recommendation-card .pt-score--compact {
  padding-top: 0.85rem;
}

.product-rating-card-v4__top > span,
.product-metrics-v4 dd {
  font-variant-numeric: tabular-nums;
}

.product-rating-card-v4__top > span::after,
.product-metrics-v4 dd::after {
  margin-left: 0.16rem;
  color: var(--product-muted, #627471);
  content: "/100";
  font-size: 0.68rem;
  font-weight: 700;
}
/* End PT homepage navigation and score source 4.5 */
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


def remove_marked(text: str, start: str, end: str) -> str:
    while start in text and end in text:
        begin = text.index(start)
        finish = text.index(end, begin) + len(end)
        text = text[:begin].rstrip() + "\n\n" + text[finish:].lstrip()
    return text


def replace_new_block(text: str) -> str:
    text = remove_marked(text, NEW_START, NEW_END)
    return text.rstrip() + "\n\n" + NEW_CSS.strip() + "\n"


def fix_broken_small_selector(text: str) -> str:
    text = re.sub(
        r'\.home3-card-content\s*>\s*small,\s*\n(?:\s*\n)+(?=\.home3-method\s*\{)',
        "",
        text,
    )
    return text


def update_css(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    for start, end in OLD_BLOCKS:
        text = remove_marked(text, start, end)
    text = fix_broken_small_selector(text)
    text = replace_new_block(text)
    path.write_text(text, encoding="utf-8")


def update_home_model(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    replacements = {
        '"Beste Futterautomaten für Katzen"': '"Futterautomaten für Katzen"',
        '"Beste Futterautomaten für Hunde"': '"Futterautomaten für Hunde"',
        '"Beste Trinkbrunnen für Katzen"': '"Trinkbrunnen für Katzen"',
        '"Beste Trinkbrunnen für Hunde"': '"Trinkbrunnen für Hunde"',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)

    old_rating = "        rating: product.data.rating,"
    new_rating = (
        "        rating:\n"
        "          product.data.score ??\n"
        "          Math.round(product.data.rating * 20),"
    )
    if old_rating in text:
        text = text.replace(old_rating, new_rating, 1)
    elif "product.data.score ??" not in text:
        raise RuntimeError(
            "buildHomepageModel.ts: Produktbewertung konnte nicht "
            "vereinheitlicht werden."
        )

    path.write_text(text, encoding="utf-8")


def update_home_section(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = text.replace(
        "                scale={5}\n"
        '                variant="compact"',
        "                scale={100}\n"
        '                variant="compact"',
    )
    path.write_text(text, encoding="utf-8")


def update_comparison_model(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    old = "        rating: product.data.rating,"
    new = (
        "        rating:\n"
        "          product.data.score ??\n"
        "          Math.round(product.data.rating * 20),"
    )

    product_branch = text.find("const product = productBySlug.get(item.slug);")
    if product_branch < 0:
        raise RuntimeError(
            "buildComparisonViewModel.ts: Produktzweig nicht gefunden."
        )

    before = text[:product_branch]
    after = text[product_branch:]

    if old in after:
        after = after.replace(old, new, 1)
    elif "product.data.score ??" not in after:
        raise RuntimeError(
            "buildComparisonViewModel.ts: Produktbewertung konnte nicht "
            "vereinheitlicht werden."
        )

    path.write_text(before + after, encoding="utf-8")


def update_recommendation_grid(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = text.replace(
        "                scale={5}\n"
        '                variant="compact"',
        "                scale={100}\n"
        '                variant="compact"',
    )
    path.write_text(text, encoding="utf-8")


def scan_score_sources(root: Path) -> list[str]:
    findings: list[str] = []

    home_model = root / "apps/pfotentechnik/src/domain/home/buildHomepageModel.ts"
    comparison_model = root / "apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts"
    home_section = root / "packages/affiliate-core/src/components/home/HomeSection.astro"
    recommendation_grid = root / "packages/affiliate-core/src/components/comparison/RecommendationGrid.astro"

    if "rating: product.data.rating" in home_model.read_text(encoding="utf-8"):
        findings.append("Homepage verwendet noch rohe 5er-Bewertung")

    comparison_text = comparison_model.read_text(encoding="utf-8")
    product_branch = comparison_text[comparison_text.find(
        "const product = productBySlug.get(item.slug);"
    ):]
    if "rating: product.data.rating" in product_branch:
        findings.append("Vergleich verwendet noch rohe 5er-Bewertung")

    if "scale={5}" in home_section.read_text(encoding="utf-8"):
        findings.append("Homepage rendert Score noch als 5er-Skala")

    if "scale={5}" in recommendation_grid.read_text(encoding="utf-8"):
        findings.append("Vergleich rendert Score noch als 5er-Skala")

    return findings


def main() -> int:
    root = repo_root()

    files = {
        "css": root / "packages/affiliate-core/src/components/home/home.css",
        "home_model": root / "apps/pfotentechnik/src/domain/home/buildHomepageModel.ts",
        "home_section": root / "packages/affiliate-core/src/components/home/HomeSection.astro",
        "comparison_model": root / "apps/pfotentechnik/src/domain/comparison/buildComparisonViewModel.ts",
        "recommendations": root / "packages/affiliate-core/src/components/comparison/RecommendationGrid.astro",
    }

    missing = [
        str(path.relative_to(root))
        for path in files.values()
        if not path.exists()
    ]
    if missing:
        raise RuntimeError("Dateien fehlen: " + ", ".join(missing))

    update_css(files["css"])
    update_home_model(files["home_model"])
    update_home_section(files["home_section"])
    update_comparison_model(files["comparison_model"])
    update_recommendation_grid(files["recommendations"])

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

    findings = scan_score_sources(root)

    audit_path = root / "pfotentechnik-home-chips-score-source-4.5-audit.txt"
    audit_path.write_text(
        "\n".join([
            "PfotenTechnik Home Chips + Score Source 4.5",
            "===========================================",
            "",
            "Zentrale Datenquelle:",
            "- Produktseiten: product.data.score",
            "- Homepage: product.data.score mit Fallback rating × 20",
            "- Vergleiche: product.data.score mit Fallback rating × 20",
            "",
            "Verbleibende Abweichungen:",
            *(
                [f"- {item}" for item in findings]
                if findings
                else ["- Keine in den geprüften Produktdarstellungen."]
            ),
            "",
        ]),
        encoding="utf-8",
    )

    patch_path = root / "pfotentechnik-home-chips-score-source-4.5.patch"
    diff = subprocess.run(
        ["git", "diff", "--binary"],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    patch_path.write_text(diff, encoding="utf-8")

    print("Homepage Chips + Score Source 4.5 wurde angewendet.")
    print("")
    print("Quick-Chips:")
    print("  - kürzere Titel ohne 'Beste'")
    print("  - 34-px-Iconfläche, 17-px-SVG")
    print("  - kleinere, weniger fette Typografie")
    print("  - kompaktere Kartenhöhe")
    print("")
    print("Zuletzt aktualisiert:")
    print("  - defekten CSS-Selektor entfernt")
    print("  - normale Metazeile ohne große grüne Fläche")
    print("")
    print("Bewertungsquelle:")
    print("  - product.data.score ist jetzt kanonisch")
    print("  - rating × 20 nur noch als Fallback")
    print("")
    print("Erzeugt:")
    print("  pfotentechnik-home-chips-score-source-4.5.patch")
    print("  pfotentechnik-home-chips-score-source-4.5-audit.txt")
    print("")
    print("Jetzt prüfen:")
    print("  npm run build:pfotentechnik")

    if findings:
        print("")
        print("Der Audit enthält noch Abweichungen.")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        raise SystemExit(1)

#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

AUDIT_NAMES = (
    "pfotentechnik-ui-score-consolidation-4.3-audit.txt",
    "pfotentechnik-score-system-audit.txt",
)

CSS_START = "/* PT GPS quick chips and score audit polish 4.4 */"
CSS_END = "/* End PT GPS quick chips and score audit polish 4.4 */"

CSS_BLOCK = r'''
/* PT GPS quick chips and score audit polish 4.4 */

@media (max-width: 760px) {
  .home41-decision__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .home41-decision__card {
    min-height: 108px;
    grid-template-columns: 44px minmax(0, 1fr) 18px;
  }

  .home41-decision__content h3 {
    font-size: clamp(0.94rem, 3.85vw, 1.08rem);
    line-height: 1.2;
    text-wrap: pretty;
  }
}

@media (max-width: 390px) {
  .home41-decision__grid {
    grid-template-columns: 1fr;
  }
}

.recommendation-card .pt-score {
  margin-top: auto;
}

.recommendation-card .pt-score--compact {
  padding-top: 0.85rem;
}

.product-rating-card-v4__top > span {
  color: var(--product-accent, #18743b);
  font-size: 1rem;
  font-weight: 900;
}

.product-rating-card-v4__top > span::after {
  margin-left: 0.18rem;
  color: var(--product-muted, #627471);
  content: "/100";
  font-size: 0.68rem;
  font-weight: 700;
}

.product-metrics-v4 dd::after {
  margin-left: 0.16rem;
  color: var(--product-muted, #627471);
  content: "/100";
  font-size: 0.68rem;
  font-weight: 700;
}
/* End PT GPS quick chips and score audit polish 4.4 */
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


def add_import(text: str, import_line: str) -> str:
    if import_line in text:
        return text

    if not text.startswith("---"):
        raise RuntimeError("Astro-Frontmatter fehlt.")

    imports = list(re.finditer(r"(?m)^import .*?;\s*$", text))
    if imports:
        pos = imports[-1].end()
        return text[:pos] + "\n" + import_line + text[pos:]

    return text.replace("---\n", f"---\n{import_line}\n", 1)


def replace_marked(text: str, block: str) -> str:
    if CSS_START in text and CSS_END in text:
        start = text.index(CSS_START)
        end = text.index(CSS_END, start) + len(CSS_END)
        return (
            text[:start].rstrip()
            + "\n\n"
            + block.strip()
            + "\n"
            + text[end:].lstrip()
        )

    return text.rstrip() + "\n\n" + block.strip() + "\n"


def update_home_model(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    if 'slug: "beste-gps-tracker-fuer-katzen"' in text:
        return

    anchor = '''  {
    slug: "beste-trinkbrunnen-fuer-hunde",
    label: "Hunde · Trinkbrunnen",
    title: "Beste Trinkbrunnen für Hunde",
    fallbackText:
      "Kapazität, Standfestigkeit, Trinkhöhe und Reinigung für Hunde einordnen."
  }
'''

    replacement = anchor.rstrip() + ''',
  {
    slug: "beste-gps-tracker-fuer-katzen",
    label: "Katzen · GPS-Tracker",
    title: "GPS-Tracker für Katzen",
    fallbackText:
      "Gewicht, Ortungsintervall, Akkulaufzeit, Abo und Sicherheitszonen vergleichen."
  },
  {
    slug: "beste-gps-tracker-fuer-hunde",
    label: "Hunde · GPS-Tracker",
    title: "GPS-Tracker für Hunde",
    fallbackText:
      "Ortung, Robustheit, Akkulaufzeit, Größe und laufende Kosten vergleichen."
  }
'''

    if anchor not in text:
        raise RuntimeError(
            "buildHomepageModel.ts: Ende der Vergleichsdefinitionen nicht gefunden."
        )

    path.write_text(text.replace(anchor, replacement, 1), encoding="utf-8")


def update_navigation(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    if 'normalized.includes("gps")' not in text:
        marker = '  if (\n    normalized.includes("trink") ||'
        insert = '''  if (
    normalized.includes("gps") ||
    normalized.includes("tracker") ||
    normalized.includes("ortung")
  ) {
    return "location";
  }

'''
        if marker not in text:
            raise RuntimeError(
                "HomeNavigation.astro: Einfügepunkt für GPS-Icon fehlt."
            )
        text = text.replace(marker, insert + marker, 1)

    if 'type === "location"' not in text:
        marker = 'const getDecisionIconSvg = (type: string) => {\n'
        location_svg = '''const getDecisionIconSvg = (type: string) => {
  if (type === "location") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 21s6-5.4 6-11a6 6 0 1 0-12 0c0 5.6 6 11 6 11Z"/><circle cx="12" cy="10" r="2.2"/></svg>`;
  }

'''
        if marker not in text:
            raise RuntimeError(
                "HomeNavigation.astro: SVG-Funktion wurde nicht gefunden. "
                "Bitte zuerst Patch 4.3 anwenden."
            )
        text = text.replace(marker, location_svg, 1)

    path.write_text(text, encoding="utf-8")


def update_recommendation_grid(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = add_import(
        text,
        'import EditorialScore from "../EditorialScore.astro";',
    )

    text = text.replace(
        'import { toEditorialScore } from "@affiliate-core/utils/editorialScore";\n',
        "",
    )

    old = '''{typeof product.rating === "number" && (
              <strong class="recommendation-card__rating">
                {toEditorialScore(product.rating, 5)}
                <span>PfotenTechnik-Score</span>
              </strong>
            )}'''

    new = '''{typeof product.rating === "number" && (
              <EditorialScore
                value={product.rating}
                scale={5}
                variant="compact"
              />
            )}'''

    if old in text:
        text = text.replace(old, new, 1)
    elif "<EditorialScore" not in text:
        raise RuntimeError(
            "RecommendationGrid.astro: alter Ratingblock nicht gefunden."
        )

    path.write_text(text, encoding="utf-8")


def clean_product_review(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    original = text

    text = re.sub(
        r'''\{Number\(value\)
        \s*\.toFixed\(1\)
        \s*\.replace\("\.",\s*","\)\}\s*/\s*5''',
        '{Math.round(Number(value) * 20)}',
        text,
        flags=re.VERBOSE,
    )

    text = re.sub(
        r'''\{numericValue
        \s*\.toFixed\(1\)
        \s*\.replace\("\.",\s*","\)\}\s*/\s*5''',
        '{Math.round(numericValue * 20)}',
        text,
        flags=re.VERBOSE,
    )

    if "<EditorialScore" in text:
        text = re.sub(
            r'''<div
            \s+class="product-verdict-v4__stars".*?
            </div>''',
            "",
            text,
            flags=re.VERBOSE | re.DOTALL,
        )

    if text != original:
        path.write_text(text, encoding="utf-8")


def clean_alternatives(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = add_import(
        text,
        'import EditorialScore from "../EditorialScore.astro";',
    )

    text = text.replace(
        "<strong>{alternative.score} / 100</strong>",
        '<EditorialScore value={alternative.score} variant="inline" />',
    )
    text = text.replace(
        "<span>{alternative.rating} / 5</span>",
        '<EditorialScore value={alternative.rating} scale={5} variant="inline" />',
    )

    path.write_text(text, encoding="utf-8")


def scan_active_sources(root: Path) -> list[str]:
    patterns = {
        "5er-Skala": re.compile(r"(?:/|von)\s*5\b"),
        "Sterne": re.compile(r"★★★★★|von\s*5\s*Stern", re.I),
        "alter Hinweis": re.compile(
            r"Redaktionelle Bewertung|Redaktionell bewertet",
            re.I,
        ),
    }

    findings: list[str] = []
    bases = [
        root / "packages/affiliate-core/src/components",
        root / "apps/pfotentechnik/src/components",
        root / "apps/pfotentechnik/src/pages",
    ]

    for base in bases:
        if not base.exists():
            continue

        for path in base.rglob("*.astro"):
            rel = str(path.relative_to(root))
            if any(
                token in rel
                for token in (
                    ".before-",
                    ".backup",
                    "/backup",
                    "node_modules",
                    "/dist/",
                )
            ):
                continue

            text = path.read_text(encoding="utf-8")
            hits = [
                label
                for label, pattern in patterns.items()
                if pattern.search(text)
            ]
            if hits:
                findings.append(f"{rel}: {', '.join(hits)}")

    return findings


def read_previous_audit(root: Path) -> list[str]:
    lines: list[str] = []

    for name in AUDIT_NAMES:
        path = root / name
        if path.exists():
            lines.append(f"Quelle: {name}")
            lines.extend(path.read_text(encoding="utf-8").splitlines())
            lines.append("")

    return lines


def main() -> int:
    root = repo_root()

    files = {
        "model": root / "apps/pfotentechnik/src/domain/home/buildHomepageModel.ts",
        "navigation": root / "packages/affiliate-core/src/components/home/HomeNavigation.astro",
        "home_css": root / "packages/affiliate-core/src/components/home/home.css",
        "recommendations": root / "packages/affiliate-core/src/components/comparison/RecommendationGrid.astro",
        "product": root / "packages/affiliate-core/src/components/product/ProductReview.astro",
        "alternatives": root / "packages/affiliate-core/src/components/product/AlternativeRecommendationCard.astro",
    }

    missing = [
        str(path.relative_to(root))
        for path in files.values()
        if not path.exists()
    ]
    if missing:
        raise RuntimeError("Dateien fehlen: " + ", ".join(missing))

    previous_audit = read_previous_audit(root)

    update_home_model(files["model"])
    update_navigation(files["navigation"])
    update_recommendation_grid(files["recommendations"])
    clean_product_review(files["product"])
    clean_alternatives(files["alternatives"])

    css = files["home_css"].read_text(encoding="utf-8")
    files["home_css"].write_text(
        replace_marked(css, CSS_BLOCK),
        encoding="utf-8",
    )

    check = subprocess.run(
        ["git", "diff", "--check"],
        cwd=root,
        capture_output=True,
        text=True,
    )
    if check.returncode != 0:
        print(check.stdout, file=sys.stderr)
        print(check.stderr, file=sys.stderr)
        raise RuntimeError("git diff --check meldet Fehler.")

    findings = scan_active_sources(root)

    audit_path = root / "pfotentechnik-score-gps-followup-4.4-audit.txt"
    audit_content = [
        "PfotenTechnik Score + GPS Follow-up 4.4",
        "======================================",
        "",
        "Vorherige lokale Audits:",
        *(
            previous_audit
            if previous_audit
            else ["Kein vorheriger Audit im Repository-Root gefunden."]
        ),
        "",
        "Neuer Scan aktiver Komponenten:",
        *(
            [f"- {item}" for item in findings]
            if findings
            else ["- Keine alten Sterne oder 5er-Skalen gefunden."]
        ),
        "",
    ]
    audit_path.write_text("\n".join(audit_content), encoding="utf-8")

    patch_path = root / "pfotentechnik-score-gps-followup-4.4.patch"
    diff = subprocess.run(
        ["git", "diff", "--binary"],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    patch_path.write_text(diff, encoding="utf-8")

    print("Score + GPS Follow-up 4.4 wurde angewendet.")
    print("")
    print("GPS Quick-Chips:")
    print("  - GPS-Tracker für Katzen")
    print("  - GPS-Tracker für Hunde")
    print("  - eigenes Standort-SVG")
    print("")
    print("Score-Verbesserungen:")
    print("  - Vergleichsempfehlungen verwenden EditorialScore")
    print("  - Alternativen verwenden EditorialScore")
    print("  - verbleibende Produktkriterien auf 0–100")
    print("")
    print("Erzeugt:")
    print("  pfotentechnik-score-gps-followup-4.4.patch")
    print("  pfotentechnik-score-gps-followup-4.4-audit.txt")
    print("")
    print("Jetzt prüfen:")
    print("  npm run build:pfotentechnik")

    if findings:
        print("")
        print("Der neue Audit enthält noch Sonderfälle.")
        print("Diese wurden nicht automatisch blind ersetzt.")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        raise SystemExit(1)

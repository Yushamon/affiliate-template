#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

SCORE_COMPONENT = r'''---
interface Props {
  value: number;
  scale?: 5 | 10 | 100;
  variant?: "inline" | "compact" | "standard" | "detailed";
  methodologyHref?: string;
  showMethodology?: boolean;
  class?: string;
}

const {
  value,
  scale = 100,
  variant = "compact",
  methodologyHref = "/so-bewerten-wir/",
  showMethodology = variant === "detailed",
  class: className
} = Astro.props;

const normalized =
  scale === 5 ? value * 20 : scale === 10 ? value * 10 : value;
const score = Math.max(0, Math.min(100, Math.round(normalized)));

const verdict =
  score >= 90 ? "Hervorragend"
  : score >= 80 ? "Sehr gut"
  : score >= 70 ? "Gut"
  : score >= 60 ? "Solide"
  : score >= 50 ? "Mit Einschränkungen"
  : "Nicht empfohlen";

const tone =
  score >= 80 ? "excellent"
  : score >= 70 ? "good"
  : score >= 60 ? "solid"
  : score >= 50 ? "limited"
  : "poor";
---

<div
  class:list={[
    "pt-score",
    `pt-score--${variant}`,
    `pt-score--${tone}`,
    className
  ]}
  aria-label={`PfotenTechnik-Score ${score} von 100: ${verdict}`}
>
  <div class="pt-score__summary">
    <strong class="pt-score__value">{score}</strong>
    <div class="pt-score__copy">
      <span class="pt-score__verdict">{verdict}</span>
      <small class="pt-score__label">PfotenTechnik-Score</small>
    </div>
  </div>

  <div
    class="pt-score__track"
    role="meter"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow={score}
  >
    <span style={`--pt-score-value:${score}%`}></span>
  </div>

  {
    showMethodology && (
      <div class="pt-score__method">
        <span>Nach einheitlichen Kriterien eingeordnet</span>
        <a href={methodologyHref}>So entsteht der Score</a>
      </div>
    )
  }
</div>

<style>
  .pt-score {
    --score-accent: #22a95b;
    --score-soft: rgba(34, 169, 91, 0.1);
    display: grid;
    min-width: 0;
    gap: 0.55rem;
  }

  .pt-score--good { --score-accent: #75b817; }
  .pt-score--solid { --score-accent: #e2a400; }
  .pt-score--limited { --score-accent: #ea7d25; }
  .pt-score--poor { --score-accent: #df4d4d; }

  .pt-score__summary {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.7rem;
  }

  .pt-score__value {
    flex: 0 0 auto;
    color: var(--score-accent);
    font-size: clamp(1.65rem, 4vw, 2.25rem);
    font-weight: 950;
    line-height: 0.95;
    letter-spacing: -0.05em;
  }

  .pt-score__copy {
    display: grid;
    min-width: 0;
    gap: 0.05rem;
  }

  .pt-score__verdict {
    color: var(--text, #10231f);
    font-size: 0.88rem;
    font-weight: 900;
    line-height: 1.2;
  }

  .pt-score__label {
    color: var(--muted, #687670);
    font-size: 0.68rem;
    line-height: 1.2;
  }

  .pt-score__track {
    width: 100%;
    height: 5px;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(in srgb, var(--muted, #687670) 16%, transparent);
  }

  .pt-score__track > span {
    display: block;
    width: var(--pt-score-value);
    height: 100%;
    border-radius: inherit;
    background: var(--score-accent);
  }

  .pt-score__method {
    display: flex;
    flex-wrap: wrap;
    gap: 0.25rem 0.8rem;
    color: var(--muted, #687670);
    font-size: 0.72rem;
    line-height: 1.4;
  }

  .pt-score__method a {
    color: var(--score-accent);
    font-weight: 850;
    text-underline-offset: 3px;
  }

  .pt-score--inline {
    display: inline-flex;
    width: auto;
    align-items: center;
    gap: 0.55rem;
  }

  .pt-score--inline .pt-score__summary { gap: 0.45rem; }
  .pt-score--inline .pt-score__value { font-size: 1.3rem; }
  .pt-score--inline .pt-score__verdict { font-size: 0.78rem; }

  .pt-score--inline .pt-score__label,
  .pt-score--inline .pt-score__track {
    display: none;
  }

  .pt-score--compact {
    width: 100%;
    margin-top: auto;
    padding-top: 0.9rem;
    border-top: 1px solid color-mix(in srgb, var(--muted, #687670) 17%, transparent);
  }

  .pt-score--standard,
  .pt-score--detailed {
    padding: 1rem;
    border: 1px solid color-mix(in srgb, var(--score-accent) 20%, transparent);
    border-radius: 1rem;
    background: color-mix(in srgb, var(--score-soft) 52%, transparent);
  }

  .pt-score--detailed {
    padding: clamp(1.1rem, 3vw, 1.45rem);
  }

  .pt-score--detailed .pt-score__value {
    font-size: clamp(2.7rem, 8vw, 4.7rem);
  }

  @media (prefers-color-scheme: dark) {
    .pt-score__verdict { color: #f7faf9; }

    .pt-score__label,
    .pt-score__method {
      color: rgba(226, 232, 240, 0.7);
    }

    .pt-score--standard,
    .pt-score--detailed {
      background: rgba(255, 255, 255, 0.035);
    }
  }
</style>
'''

HOME_CSS_START = "/* PT homepage mobile alignment 4.3 */"
HOME_CSS_END = "/* End PT homepage mobile alignment 4.3 */"

HOME_CSS = r'''
/* PT homepage mobile alignment 4.3 */
@media (max-width: 720px) {
  .home5 > .home3-hero,
  .home3 > .home3-hero {
    width: 100vw;
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

  .home41-decision__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem;
  }

  .home41-decision__card {
    position: relative;
    display: grid;
    min-height: 104px;
    grid-template-columns: 44px minmax(0, 1fr) 18px;
    gap: 0.72rem;
    align-items: center;
    padding: 0.95rem;
    border-radius: 1rem;
    background: var(--home3-soft);
    box-shadow: none;
  }

  .home41-decision__media {
    display: none;
  }

  .home41-decision__quick-icon {
    display: grid;
    width: 44px;
    height: 44px;
    place-items: center;
    border: 1px solid color-mix(in srgb, var(--home3-accent) 20%, transparent);
    border-radius: 999px;
    color: var(--home3-accent);
    background: color-mix(in srgb, var(--home3-accent) 10%, var(--home3-soft));
  }

  .home41-decision__quick-icon svg {
    width: 22px;
    height: 22px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
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
    font-size: clamp(0.98rem, 4vw, 1.12rem);
    line-height: 1.22;
    overflow-wrap: normal;
    word-break: normal;
    hyphens: none;
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
    right: 0.95rem;
    color: var(--home3-accent);
    font-size: 1.3rem;
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
    min-height: 88px;
  }
}
/* End PT homepage mobile alignment 4.3 */
'''


def root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        text=True,
        capture_output=True,
    )
    if result.returncode != 0:
        raise RuntimeError("Bitte im Git-Repository ausführen.")
    return Path(result.stdout.strip())


def add_import(text: str, line: str) -> str:
    if line in text:
        return text
    imports = list(re.finditer(r"(?m)^import .*?;\s*$", text))
    if not imports:
        return text.replace("---\n", f"---\n{line}\n", 1)
    pos = imports[-1].end()
    return text[:pos] + "\n" + line + text[pos:]


def replace_marked(text: str, start: str, end: str, block: str) -> str:
    if start in text and end in text:
        begin = text.index(start)
        finish = text.index(end, begin) + len(end)
        return text[:begin].rstrip() + "\n\n" + block.strip() + "\n" + text[finish:].lstrip()
    return text.rstrip() + "\n\n" + block.strip() + "\n"


def update_home_navigation(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    svg_fn = r'''
const getDecisionIconSvg = (type: string) => {
  if (type === "drop") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3s6 6.2 6 11a6 6 0 0 1-12 0c0-4.8 6-11 6-11Z"/><path d="M9.5 15.2c.7 1.1 1.6 1.6 2.8 1.6"/></svg>`;
  }

  if (type === "bowl") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 10h16l-1.6 8H5.6L4 10Z"/><path d="M7 10c.3-2.5 2.1-4 5-4s4.7 1.5 5 4"/><path d="M9 14h6"/></svg>`;
  }

  if (type === "guide") {
    return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 4h6a3 3 0 0 1 3 3v13a3 3 0 0 0-3-3H5V4Z"/><path d="M19 4h-3a3 3 0 0 0-3 3v13a3 3 0 0 1 3-3h3V4Z"/></svg>`;
  }

  return `<svg viewBox="0 0 24 24" aria-hidden="true"><path d="m12 3 2.2 5.2 5.6.5-4.3 3.7 1.3 5.5L12 15l-4.8 2.9 1.3-5.5-4.3-3.7 5.6-.5L12 3Z"/></svg>`;
};
'''

    if "const getDecisionIconSvg" not in text:
        marker = "const getDecisionIcon = (label: string) => {"
        index = text.find(marker)
        if index < 0:
            raise RuntimeError("HomeNavigation: Icon-Funktion nicht gefunden.")
        end = text.find("\n};", index)
        if end < 0:
            raise RuntimeError("HomeNavigation: Ende der Icon-Funktion nicht gefunden.")
        end += 3
        text = text[:end] + "\n" + svg_fn + text[end:]

    pattern = re.compile(
        r'''<span\s+
            class:list=\{\[\s*
            "home41-decision__quick-icon",.*?
            aria-hidden="true".*?
            ></span>''',
        re.VERBOSE | re.DOTALL,
    )

    replacement = '''<span
            class:list={[
              "home41-decision__quick-icon",
              `home41-decision__quick-icon--${getDecisionIcon(
                `${card.label} ${card.title}`
              )}`
            ]}
            aria-hidden="true"
            set:html={getDecisionIconSvg(
              getDecisionIcon(`${card.label} ${card.title}`)
            )}
          ></span>'''

    if pattern.search(text):
        text = pattern.sub(replacement, text, count=1)
    elif "set:html={getDecisionIconSvg" not in text:
        anchor = '<a class="home41-decision__card" href={card.href}>'
        if anchor not in text:
            raise RuntimeError("HomeNavigation: Kartenanker fehlt.")
        text = text.replace(anchor, anchor + "\n          " + replacement, 1)

    path.write_text(text, encoding="utf-8")


def update_home_section(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = add_import(
        text,
        'import EditorialScore from "@affiliate-core/components/EditorialScore.astro";',
    )
    for class_name in ("home3-rating", "home2-rating"):
        text = re.sub(
            rf'''<div class="{class_name}">\s*
                <strong>\{{toEditorialScore\(item\.rating,\s*5\)\}}</strong>\s*
                <small>PfotenTechnik-Score</small>\s*
                </div>''',
            '<EditorialScore value={item.rating} scale={5} variant="compact" />',
            text,
            flags=re.VERBOSE | re.DOTALL,
        )
    text = text.replace(
        'import { toEditorialScore } from "@affiliate-core/utils/editorialScore";\n',
        "",
    )
    path.write_text(text, encoding="utf-8")


def update_product_review(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = add_import(
        text,
        'import EditorialScore from "../EditorialScore.astro";',
    )

    verdict_pattern = re.compile(
        r'''<section\s+
            class="product-verdict-v4".*?
            </section>''',
        re.VERBOSE | re.DOTALL,
    )
    verdict_replacement = '''<section class="product-verdict-v4" aria-label="Gesamtbewertung">
            <EditorialScore
              value={product.score}
              variant="detailed"
              showMethodology
            />
            <p>{product.review.verdict}</p>
          </section>'''
    text = verdict_pattern.sub(verdict_replacement, text, count=1)

    text = re.sub(
        r'''\{Number\(value\)\s*
            \.toFixed\(1\)\s*
            \.replace\("\.",\s*","\)\}\s*/\s*5''',
        '{Math.round(Number(value) * 20)}',
        text,
        flags=re.VERBOSE | re.DOTALL,
    )

    text = re.sub(
        r'''\{numericValue\s*
            \.toFixed\(1\)\s*
            \.replace\("\.",\s*","\)\}\s*/\s*5''',
        '{Math.round(numericValue * 20)}',
        text,
        flags=re.VERBOSE | re.DOTALL,
    )

    text = re.sub(
        r'''const scoreLabel =.*?;\n\n''',
        "",
        text,
        flags=re.DOTALL,
    )

    text = text.replace(
        "const getRatingDescriptor = (rating: number) => {\n"
        '  if (rating >= 4.7) return "Stark";\n'
        '  if (rating >= 4.4) return "Überzeugend";\n'
        '  if (rating >= 4.1) return "Gut";\n'
        '  if (rating >= 3.7) return "Solide";\n'
        '  return "Mit Abstrichen";\n'
        "};",
        "const getRatingDescriptor = (rating: number) => {\n"
        "  const score = Math.round(rating * 20);\n"
        '  if (score >= 90) return "Hervorragend";\n'
        '  if (score >= 80) return "Sehr gut";\n'
        '  if (score >= 70) return "Gut";\n'
        '  if (score >= 60) return "Solide";\n'
        '  return "Mit Einschränkungen";\n'
        "};",
    )

    path.write_text(text, encoding="utf-8")


def update_alternatives(path: Path) -> None:
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


def audit(repo: Path) -> list[str]:
    findings = []
    patterns = [
        re.compile(r"/\s*5\b"),
        re.compile(r"von\s*5\s*Stern", re.I),
        re.compile(r"★★★★★"),
        re.compile(r"Redaktionelle Bewertung", re.I),
    ]
    roots = [
        repo / "packages/affiliate-core/src/components",
        repo / "apps/pfotentechnik/src/components",
        repo / "apps/pfotentechnik/src/pages",
    ]
    for base in roots:
        if not base.exists():
            continue
        for path in base.rglob("*.astro"):
            text = path.read_text(encoding="utf-8")
            hits = [p.pattern for p in patterns if p.search(text)]
            if hits:
                findings.append(f"{path.relative_to(repo)}: {', '.join(hits)}")
    return findings


def main() -> int:
    repo = root()

    score = repo / "packages/affiliate-core/src/components/EditorialScore.astro"
    score.write_text(SCORE_COMPONENT, encoding="utf-8")

    navigation = repo / "packages/affiliate-core/src/components/home/HomeNavigation.astro"
    home_css = repo / "packages/affiliate-core/src/components/home/home.css"
    home_section = repo / "packages/affiliate-core/src/components/home/HomeSection.astro"
    home_sections = repo / "packages/affiliate-core/src/components/home/HomeSections.astro"
    product_review = repo / "packages/affiliate-core/src/components/product/ProductReview.astro"
    alternatives = repo / "packages/affiliate-core/src/components/product/AlternativeRecommendationCard.astro"

    for path in (navigation, home_css, home_section, product_review, alternatives):
        if not path.exists():
            raise RuntimeError(f"Datei fehlt: {path.relative_to(repo)}")

    update_home_navigation(navigation)

    css_text = home_css.read_text(encoding="utf-8")
    css_text = replace_marked(css_text, HOME_CSS_START, HOME_CSS_END, HOME_CSS)
    home_css.write_text(css_text, encoding="utf-8")

    update_home_section(home_section)
    if home_sections.exists():
        update_home_section(home_sections)

    update_product_review(product_review)
    update_alternatives(alternatives)

    check = subprocess.run(
        ["git", "diff", "--check"],
        cwd=repo,
        text=True,
        capture_output=True,
    )
    if check.returncode != 0:
        print(check.stdout, file=sys.stderr)
        print(check.stderr, file=sys.stderr)
        raise RuntimeError("git diff --check fehlgeschlagen.")

    findings = audit(repo)

    patch_path = repo / "pfotentechnik-ui-score-consolidation-4.3.patch"
    diff = subprocess.run(
        ["git", "diff", "--binary"],
        cwd=repo,
        text=True,
        capture_output=True,
        check=True,
    ).stdout
    patch_path.write_text(diff, encoding="utf-8")

    audit_path = repo / "pfotentechnik-ui-score-consolidation-4.3-audit.txt"
    audit_path.write_text(
        "\n".join([
            "PfotenTechnik UI + Score Consolidation 4.3",
            "==========================================",
            "",
            "Verbleibende alte Rating-Muster:",
            *(
                [f"- {item}" for item in findings]
                if findings
                else ["- Keine in aktiven Astro-Komponenten gefunden."]
            ),
            "",
        ]),
        encoding="utf-8",
    )

    print("UI + Score Consolidation 4.3 angewendet.")
    print("")
    print("Erzeugter Patch:")
    print("  pfotentechnik-ui-score-consolidation-4.3.patch")
    print("")
    print("Audit:")
    print("  pfotentechnik-ui-score-consolidation-4.3-audit.txt")
    print("")
    print("Jetzt ausführen:")
    print("  npm run build:pfotentechnik")

    if findings:
        print("")
        print("Achtung: Der Audit enthält weitere alte Rating-Sonderfälle.")

    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        raise SystemExit(1)

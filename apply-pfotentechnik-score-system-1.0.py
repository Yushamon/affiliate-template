#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

COMPONENT = r'''---
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

const normalizedValue = Number.isFinite(value)
  ? scale === 5
    ? value * 20
    : scale === 10
      ? value * 10
      : value
  : 0;

const score = Math.max(0, Math.min(100, Math.round(normalizedValue)));

const verdict =
  score >= 90
    ? "Hervorragend"
    : score >= 80
      ? "Sehr gut"
      : score >= 70
        ? "Gut"
        : score >= 60
          ? "Solide"
          : score >= 50
            ? "Mit Einschränkungen"
            : "Nicht empfohlen";

const tone =
  score >= 80
    ? "excellent"
    : score >= 70
      ? "good"
      : score >= 60
        ? "solid"
        : score >= 50
          ? "limited"
          : "poor";
---

<div
  class:list={[
    "pt-score",
    `pt-score--${variant}`,
    `pt-score--${tone}`,
    className
  ]}
  aria-label={`PfotenTechnik-Score ${score} von 100, ${verdict}`}
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
    <span style={`--pt-score-value: ${score}%`}></span>
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
    --score-accent: #1f9d55;
    --score-soft: rgba(31, 157, 85, 0.12);
    display: grid;
    min-width: 0;
    gap: 0.65rem;
    color: var(--text, #10231f);
  }

  .pt-score--excellent {
    --score-accent: #169447;
    --score-soft: rgba(22, 148, 71, 0.12);
  }

  .pt-score--good {
    --score-accent: #65a30d;
    --score-soft: rgba(101, 163, 13, 0.13);
  }

  .pt-score--solid {
    --score-accent: #d39a00;
    --score-soft: rgba(211, 154, 0, 0.14);
  }

  .pt-score--limited {
    --score-accent: #ea7b22;
    --score-soft: rgba(234, 123, 34, 0.13);
  }

  .pt-score--poor {
    --score-accent: #dc4545;
    --score-soft: rgba(220, 69, 69, 0.13);
  }

  .pt-score__summary {
    display: flex;
    min-width: 0;
    align-items: center;
    gap: 0.8rem;
  }

  .pt-score__value {
    flex: 0 0 auto;
    color: var(--score-accent);
    font-size: clamp(1.65rem, 4vw, 2.25rem);
    font-weight: 950;
    line-height: 0.95;
    letter-spacing: -0.055em;
  }

  .pt-score__copy {
    display: grid;
    min-width: 0;
    gap: 0.08rem;
  }

  .pt-score__verdict {
    color: var(--text, #10231f);
    font-size: 0.9rem;
    font-weight: 900;
    line-height: 1.2;
  }

  .pt-score__label {
    color: var(--muted, #66736f);
    font-size: 0.69rem;
    line-height: 1.25;
  }

  .pt-score__track {
    width: 100%;
    height: 5px;
    overflow: hidden;
    border-radius: 999px;
    background: color-mix(
      in srgb,
      var(--muted, #66736f) 16%,
      transparent
    );
  }

  .pt-score__track span {
    display: block;
    width: var(--pt-score-value);
    height: 100%;
    border-radius: inherit;
    background: var(--score-accent);
  }

  .pt-score__method {
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem 0.85rem;
    align-items: baseline;
    color: var(--muted, #66736f);
    font-size: 0.72rem;
    line-height: 1.45;
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

  .pt-score--inline .pt-score__summary {
    gap: 0.45rem;
  }

  .pt-score--inline .pt-score__value {
    font-size: 1.2rem;
  }

  .pt-score--inline .pt-score__verdict {
    font-size: 0.78rem;
  }

  .pt-score--inline .pt-score__label,
  .pt-score--inline .pt-score__track {
    display: none;
  }

  .pt-score--compact {
    width: 100%;
    padding-top: 0.9rem;
    border-top: 1px solid color-mix(
      in srgb,
      var(--muted, #66736f) 18%,
      transparent
    );
  }

  .pt-score--standard {
    padding: 1rem;
    border: 1px solid color-mix(
      in srgb,
      var(--score-accent) 18%,
      transparent
    );
    border-radius: 1rem;
    background: color-mix(
      in srgb,
      var(--score-soft) 46%,
      transparent
    );
  }

  .pt-score--detailed {
    padding: clamp(1rem, 3vw, 1.4rem);
    border: 1px solid color-mix(
      in srgb,
      var(--score-accent) 20%,
      transparent
    );
    border-radius: 1.15rem;
    background: color-mix(
      in srgb,
      var(--score-soft) 44%,
      transparent
    );
  }

  .pt-score--detailed .pt-score__value {
    font-size: clamp(2.6rem, 7vw, 4.5rem);
  }

  .pt-score--detailed .pt-score__verdict {
    font-size: 1rem;
  }

  @media (prefers-color-scheme: dark) {
    .pt-score {
      color: #f3f7f5;
    }

    .pt-score__verdict {
      color: #f3f7f5;
    }

    .pt-score__label,
    .pt-score__method {
      color: rgba(226, 232, 240, 0.72);
    }

    .pt-score--standard,
    .pt-score--detailed {
      background: rgba(255, 255, 255, 0.035);
    }
  }
</style>
'''

UTILITY = r'''export type EditorialScoreScale = 5 | 10 | 100;

export const toEditorialScore = (
  value: number,
  scale: EditorialScoreScale = 100,
): number => {
  if (!Number.isFinite(value)) {
    return 0;
  }

  const normalized =
    scale === 5 ? value * 20 : scale === 10 ? value * 10 : value;

  return Math.max(0, Math.min(100, Math.round(normalized)));
};

export const getEditorialScoreLabel = (scoreValue: number): string => {
  const score = toEditorialScore(scoreValue);

  if (score >= 90) return "Hervorragend";
  if (score >= 80) return "Sehr gut";
  if (score >= 70) return "Gut";
  if (score >= 60) return "Solide";
  if (score >= 50) return "Mit Einschränkungen";
  return "Nicht empfohlen";
};
'''

ACTIVE_ROOTS = [
    "packages/affiliate-core/src/components",
    "apps/pfotentechnik/src/components",
    "apps/pfotentechnik/src/pages",
]

LEGACY_TERMS = (
    "Redaktionelle Bewertung",
    "redaktionelle Bewertung",
    "Redaktionell bewertet",
    "redaktionell bewertet",
)

STAR_CHARS = ("★★★★★", "★★★★", "★★★", "★★", "★")


def repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError("Bitte das Skript im Git-Repository ausführen.")
    return Path(result.stdout.strip())


def add_import(text: str, line: str) -> str:
    if line in text:
        return text

    if not text.startswith("---"):
        raise RuntimeError("Astro-Frontmatter wurde nicht gefunden.")

    import_matches = list(re.finditer(r"(?m)^import .*?;\s*$", text))
    if import_matches:
        position = import_matches[-1].end()
        return text[:position] + "\n" + line + text[position:]

    return text.replace("---\n", "---\n" + line + "\n", 1)


def replace_known_rating_blocks(text: str) -> tuple[str, int]:
    count = 0

    patterns = [
        re.compile(
            r'''<div\s+class="[^"]*rating[^"]*">\s*
                <strong>\{(?P<expr>[^{}]+)\.toFixed\(1\)\}\s*/\s*5</strong>\s*
                <(?:small|span)>Redaktionelle Bewertung</(?:small|span)>\s*
                </div>''',
            re.VERBOSE | re.DOTALL,
        ),
        re.compile(
            r'''<div\s+class="[^"]*rating[^"]*">\s*
                <strong>\{(?P<expr>[^{}]+)\.toFixed\(1\)\}</strong>\s*
                <(?:small|span)>von 5</(?:small|span)>\s*
                </div>''',
            re.VERBOSE | re.DOTALL,
        ),
    ]

    for pattern in patterns:
        def replacement(match: re.Match[str]) -> str:
            nonlocal count
            count += 1
            expr = match.group("expr").strip()
            return (
                '<EditorialScore '
                f'value={{{expr}}} scale={{5}} variant="compact" />'
            )

        text = pattern.sub(replacement, text)

    return text, count


def replace_product_score_blocks(text: str) -> tuple[str, int]:
    count = 0

    patterns = [
        re.compile(
            r'''<div\s+class="product-verdict-v4__score"[^>]*>.*?
                \{product\.score\}.*?</div>''',
            re.VERBOSE | re.DOTALL,
        ),
        re.compile(
            r'''<div\s+class="product-score[^"]*"[^>]*>.*?
                \{product\.score\}.*?</div>''',
            re.VERBOSE | re.DOTALL,
        ),
    ]

    for pattern in patterns:
        def replacement(_: re.Match[str]) -> str:
            nonlocal count
            count += 1
            return (
                '<EditorialScore value={product.score} '
                'variant="detailed" showMethodology />'
            )

        text = pattern.sub(replacement, text, count=1)

    return text, count


def modernize_legacy_text(text: str) -> tuple[str, int]:
    count = 0
    replacements = {
        "Redaktionelle Bewertung": "PfotenTechnik-Score",
        "redaktionelle Bewertung": "PfotenTechnik-Score",
        "Redaktionell bewertet": "Nach einheitlichen Kriterien eingeordnet",
        "redaktionell bewertet": "nach einheitlichen Kriterien eingeordnet",
    }

    for old, new in replacements.items():
        occurrences = text.count(old)
        if occurrences:
            text = text.replace(old, new)
            count += occurrences

    return text, count


def convert_remaining_five_scale(text: str) -> tuple[str, int]:
    pattern = re.compile(
        r"\{(?P<expr>[A-Za-z0-9_.$?\[\]()]+)\.toFixed\(1\)\}\s*(?:/|von)\s*5"
    )
    count = 0

    def replacement(match: re.Match[str]) -> str:
        nonlocal count
        count += 1
        expr = match.group("expr")
        return f"{{toEditorialScore({expr}, 5)}}"

    return pattern.sub(replacement, text), count


def active_astro_files(root: Path) -> list[Path]:
    files: list[Path] = []

    for relative_root in ACTIVE_ROOTS:
        base = root / relative_root
        if not base.exists():
            continue

        for path in base.rglob("*.astro"):
            normalized = "/" + str(path.relative_to(root)).replace("\\", "/")
            if any(
                marker in normalized
                for marker in (
                    "/node_modules/",
                    "/dist/",
                    "/.astro/",
                    "/.git/",
                    "/.backup",
                    "/backup",
                    ".before-",
                )
            ):
                continue
            files.append(path)

    return sorted(set(files))


def audit(root: Path) -> list[str]:
    findings: list[str] = []

    for path in active_astro_files(root):
        text = path.read_text(encoding="utf-8")
        hits: list[str] = []

        if re.search(r"\.toFixed\(1\)\}\s*(?:/|von)\s*5", text):
            hits.append("5er-Skala")
        if any(term in text for term in LEGACY_TERMS):
            hits.append("alter Bewertungshinweis")
        if any(stars in text for stars in STAR_CHARS):
            hits.append("Sternsymbol")
        if re.search(r"aria-label=[\"'][^\"']*(?:Stern|star)", text, re.I):
            hits.append("Sterne-ARIA")

        if hits:
            findings.append(
                f"{path.relative_to(root)}: {', '.join(sorted(set(hits)))}"
            )

    return findings


def main() -> int:
    root = repo_root()

    component_path = (
        root / "packages/affiliate-core/src/components/EditorialScore.astro"
    )
    utility_path = (
        root / "packages/affiliate-core/src/utils/editorialScore.ts"
    )

    component_path.parent.mkdir(parents=True, exist_ok=True)
    utility_path.parent.mkdir(parents=True, exist_ok=True)
    component_path.write_text(COMPONENT, encoding="utf-8")
    utility_path.write_text(UTILITY, encoding="utf-8")

    changed_files: list[str] = []
    component_replacements = 0
    numeric_conversions = 0
    text_replacements = 0

    for path in active_astro_files(root):
        original = path.read_text(encoding="utf-8")
        text = original

        text, known_count = replace_known_rating_blocks(text)
        text, product_count = replace_product_score_blocks(text)

        if known_count or product_count:
            text = add_import(
                text,
                'import EditorialScore from "@affiliate-core/components/EditorialScore.astro";',
            )
            component_replacements += known_count + product_count

        text, numeric_count = convert_remaining_five_scale(text)
        if numeric_count:
            text = add_import(
                text,
                'import { toEditorialScore } from "@affiliate-core/utils/editorialScore";',
            )
            numeric_conversions += numeric_count

        text, legacy_count = modernize_legacy_text(text)
        text_replacements += legacy_count

        if text != original:
            path.write_text(text, encoding="utf-8")
            changed_files.append(str(path.relative_to(root)))

    css_files = [
        root / "packages/affiliate-core/src/components/home/home.css",
        root / "packages/affiliate-core/src/components/comparison/comparison.css",
    ]
    for css_path in css_files:
        if not css_path.exists():
            continue

        original = css_path.read_text(encoding="utf-8")
        text = original

        for selector in (
            ".home3-rating",
            ".home3-rating strong",
            ".home3-rating small",
            ".recommendation-card__rating",
            ".recommendation-card__rating strong",
            ".recommendation-card__rating span",
        ):
            text = re.sub(
                rf"\n?{re.escape(selector)}\s*\{{.*?\n\}}\n?",
                "\n",
                text,
                flags=re.DOTALL,
            )

        if text != original:
            css_path.write_text(text, encoding="utf-8")
            changed_files.append(str(css_path.relative_to(root)))

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

    findings = audit(root)

    patch_path = root / "pfotentechnik-score-system-1.0.patch"
    diff = subprocess.run(
        ["git", "diff", "--binary"],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    patch_path.write_text(diff, encoding="utf-8")

    audit_path = root / "pfotentechnik-score-system-audit.txt"
    audit_lines = [
        "PfotenTechnik Score System Audit",
        "================================",
        "",
        f"Gemeinsame Score-Komponenten eingesetzt: {component_replacements}",
        f"Übrige 5er-Werte auf 100er-Skala umgestellt: {numeric_conversions}",
        f"Alte Bewertungshinweise ersetzt: {text_replacements}",
        "",
        "Geänderte Dateien:",
        *[f"- {item}" for item in sorted(set(changed_files))],
        "",
        "Verbleibende Prüfpunkte:",
        *(
            [f"- {item}" for item in findings]
            if findings
            else ["- Keine alten Bewertungsdarstellungen im aktiven Astro-Code gefunden."]
        ),
        "",
    ]
    audit_path.write_text("\n".join(audit_lines), encoding="utf-8")

    print("PfotenTechnik Score System 1.0 wurde angewendet.")
    print("")
    print("Neu:")
    print("  packages/affiliate-core/src/components/EditorialScore.astro")
    print("  packages/affiliate-core/src/utils/editorialScore.ts")
    print("")
    print(f"Gemeinsame Score-Blöcke: {component_replacements}")
    print(f"Konvertierte 5er-Werte: {numeric_conversions}")
    print(f"Ersetzte alte Hinweise: {text_replacements}")
    print("")
    print("Erzeugter Patch:")
    print("  pfotentechnik-score-system-1.0.patch")
    print("")
    print("Audit:")
    print("  pfotentechnik-score-system-audit.txt")

    if findings:
        print("")
        print("Hinweis: Der Audit enthält verbleibende Sonderfälle.")
        print("Diese wurden nicht blind verändert, um Buildfehler zu vermeiden.")

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

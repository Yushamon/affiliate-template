#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

START = "/* PT source theme + advisor fix 7.3 */"
END = "/* End PT source theme + advisor fix 7.3 */"

OLD_BLOCKS = (
    (
        "/* PT editorial theme + advisor UX 2.2 / 7.2 */",
        "/* End PT editorial theme + advisor UX 2.2 / 7.2 */",
    ),
    (
        "/* PT theme contrast and product data 6.5 */",
        "/* End PT theme contrast and product data 6.5 */",
    ),
)

OLD_RUNTIME_RE = re.compile(
    r'\s*<script is:inline data-pt-editorial-theme-advisor-7-2>.*?</script>\s*',
    re.DOTALL,
)

CSS = r"""
/* PT source theme + advisor fix 7.3 */

/* ------------------------------------------------------------
   Stable editorial tokens
   ------------------------------------------------------------ */

:root {
  --pt-editorial-dark-bg: #07372f;
  --pt-editorial-dark-bg-deep: #062d27;
  --pt-editorial-dark-border: rgba(154, 229, 188, 0.22);
  --pt-editorial-dark-heading: #f4fbf7;
  --pt-editorial-dark-copy: #c6d8d0;
  --pt-editorial-dark-muted: #9fb9ae;
  --pt-editorial-dark-accent: #8ce9b2;

  --pt-faq-bg: #ffffff;
  --pt-faq-soft: #f7f9f9;
  --pt-faq-line: #dfe7e4;
  --pt-faq-heading: #101827;
  --pt-faq-copy: #566477;
}

/* ------------------------------------------------------------
   Direct source selectors: no runtime classification required
   ------------------------------------------------------------ */

:is(
  .home3-method,
  #methodik .home3-method,
  .home3-proof,
  .home3-stats,
  .home3-positioning,
  .home3-trust,
  .home3-independence,
  [data-pt-panel="method"],
  [data-pt-panel="proof"],
  [data-pt-panel="positioning"]
) {
  color: var(--pt-editorial-dark-copy) !important;
  border-color: var(--pt-editorial-dark-border) !important;
}

:is(
  .home3-method,
  #methodik .home3-method,
  .home3-proof,
  .home3-stats,
  .home3-positioning,
  .home3-trust,
  .home3-independence,
  [data-pt-panel="method"],
  [data-pt-panel="proof"],
  [data-pt-panel="positioning"]
) :is(h1, h2, h3, h4, h5, h6, strong, b) {
  color: var(--pt-editorial-dark-heading) !important;
  -webkit-text-fill-color: var(--pt-editorial-dark-heading) !important;
}

:is(
  .home3-method,
  #methodik .home3-method,
  .home3-proof,
  .home3-stats,
  .home3-positioning,
  .home3-trust,
  .home3-independence,
  [data-pt-panel="method"],
  [data-pt-panel="proof"],
  [data-pt-panel="positioning"]
) :is(p, li, dd, small, figcaption) {
  color: var(--pt-editorial-dark-copy) !important;
  -webkit-text-fill-color: var(--pt-editorial-dark-copy) !important;
}

:is(
  .home3-method,
  #methodik .home3-method,
  .home3-proof,
  .home3-stats,
  .home3-positioning,
  .home3-trust,
  .home3-independence,
  [data-pt-panel="method"],
  [data-pt-panel="proof"],
  [data-pt-panel="positioning"]
) :is(
  .home3-eyebrow,
  [class*="eyebrow"],
  [class*="kicker"],
  [class*="label"],
  [class*="number"],
  [class*="index"]
) {
  color: var(--pt-editorial-dark-accent) !important;
  -webkit-text-fill-color: var(--pt-editorial-dark-accent) !important;
}

:is(
  .home3-method,
  #methodik .home3-method,
  .home3-proof,
  .home3-stats,
  .home3-positioning,
  .home3-trust,
  .home3-independence,
  [data-pt-panel="method"],
  [data-pt-panel="proof"],
  [data-pt-panel="positioning"]
) a {
  color: var(--pt-editorial-dark-accent) !important;
  -webkit-text-fill-color: var(--pt-editorial-dark-accent) !important;
  text-decoration-color: color-mix(
    in srgb,
    var(--pt-editorial-dark-accent) 55%,
    transparent
  );
  text-underline-offset: 0.18em;
}

/* Method block: step headings were still inheriting dark text. */
.home3-method :is(ol, ul) > li {
  border-color: rgba(218, 238, 228, 0.16) !important;
}

.home3-method :is(ol, ul) > li > :first-child {
  color: var(--pt-editorial-dark-accent) !important;
  -webkit-text-fill-color: var(--pt-editorial-dark-accent) !important;
}

.home3-method :is(ol, ul) > li :is(h3, h4, strong, b) {
  color: var(--pt-editorial-dark-heading) !important;
  -webkit-text-fill-color: var(--pt-editorial-dark-heading) !important;
}

.home3-method :is(ol, ul) > li :is(p, li, small) {
  color: var(--pt-editorial-dark-copy) !important;
  -webkit-text-fill-color: var(--pt-editorial-dark-copy) !important;
}

/* Proof/statistics panel. */
:is(.home3-proof, .home3-stats, [data-pt-panel="proof"])
:is([class*="stat"], [class*="metric"]) {
  border-color: rgba(211, 238, 225, 0.18) !important;
  background: rgba(255, 255, 255, 0.045) !important;
}

:is(.home3-proof, .home3-stats, [data-pt-panel="proof"])
:is([class*="stat"], [class*="metric"])
:is(strong, b, [class*="value"], [class*="number"]) {
  color: var(--pt-editorial-dark-accent) !important;
  -webkit-text-fill-color: var(--pt-editorial-dark-accent) !important;
  font-variant-numeric: tabular-nums;
}

/* ------------------------------------------------------------
   FAQ system: remove white outer slab, keep individual cards
   ------------------------------------------------------------ */

:is(
  .premium-faq,
  .premium-block--faq,
  .content-faq,
  .faq-section,
  [data-pt-panel="transparency-faq"]
) {
  padding-inline: 0 !important;
  border: 0 !important;
  color: var(--pt-faq-heading) !important;
  background: transparent !important;
  box-shadow: none !important;
}

:is(
  .premium-faq,
  .premium-block--faq,
  .content-faq,
  .faq-section,
  [data-pt-panel="transparency-faq"]
) > :is(header, div):first-child {
  padding-inline: 0 !important;
  background: transparent !important;
}

:is(
  .premium-faq,
  .premium-block--faq,
  .content-faq,
  .faq-section,
  [data-pt-panel="transparency-faq"]
) :is(h1, h2, h3, h4, strong) {
  color: var(--pt-faq-heading) !important;
  -webkit-text-fill-color: var(--pt-faq-heading) !important;
}

:is(
  .premium-faq,
  .premium-block--faq,
  .content-faq,
  .faq-section,
  [data-pt-panel="transparency-faq"]
) :is(p, small) {
  color: var(--pt-faq-copy) !important;
  -webkit-text-fill-color: var(--pt-faq-copy) !important;
}

:is(
  .premium-faq,
  .premium-block--faq,
  .content-faq,
  .faq-section,
  [data-pt-panel="transparency-faq"]
) :is(
  details,
  [class*="faq-item"],
  [class*="accordion-item"]
) {
  overflow: hidden;
  border: 1px solid var(--pt-faq-line) !important;
  border-radius: 1rem !important;
  color: var(--pt-faq-heading) !important;
  background: var(--pt-faq-bg) !important;
  box-shadow: 0 8px 24px rgba(20, 33, 28, 0.045);
}

:is(
  .premium-faq,
  .premium-block--faq,
  .content-faq,
  .faq-section,
  [data-pt-panel="transparency-faq"]
) :is(
  summary,
  [class*="question"],
  [class*="trigger"]
) {
  min-height: 58px;
  color: var(--pt-faq-heading) !important;
  -webkit-text-fill-color: var(--pt-faq-heading) !important;
  background: transparent !important;
}

:is(
  .premium-faq,
  .premium-block--faq,
  .content-faq,
  .faq-section,
  [data-pt-panel="transparency-faq"]
) :is(
  details p,
  [class*="answer"],
  [class*="content"]
) {
  color: var(--pt-faq-copy) !important;
  -webkit-text-fill-color: var(--pt-faq-copy) !important;
}

/* ------------------------------------------------------------
   Generic Kaufberatung desktop CTA
   ------------------------------------------------------------ */

#kaufberatung {
  scroll-margin-top: 7rem;
}

a[href="/#kaufberatung"],
a[href="#kaufberatung"],
.pt-nav-advisor-cta {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
}

@media (min-width: 900px) {
  header a[href="/#kaufberatung"],
  header a[href="#kaufberatung"],
  nav a[href="/#kaufberatung"],
  nav a[href="#kaufberatung"],
  .pt-nav-advisor-cta {
    padding: 0.68rem 0.95rem !important;
    border: 1px solid rgba(32, 139, 80, 0.35) !important;
    border-radius: 999px !important;
    color: #071811 !important;
    -webkit-text-fill-color: #071811 !important;
    background: #5cdf91 !important;
    font-weight: 850 !important;
    text-decoration: none !important;
    box-shadow: 0 8px 20px rgba(28, 151, 80, 0.15);
    transition:
      transform 150ms ease,
      background 150ms ease,
      box-shadow 150ms ease;
  }

  header a[href="/#kaufberatung"]::after,
  header a[href="#kaufberatung"]::after,
  nav a[href="/#kaufberatung"]::after,
  nav a[href="#kaufberatung"]::after,
  .pt-nav-advisor-cta::after {
    content: "→";
    font-size: 0.95em;
  }

  header a[href="/#kaufberatung"]:hover,
  header a[href="#kaufberatung"]:hover,
  nav a[href="/#kaufberatung"]:hover,
  nav a[href="#kaufberatung"]:hover,
  .pt-nav-advisor-cta:hover {
    transform: translateY(-1px);
    background: #72e7a2 !important;
    box-shadow: 0 12px 26px rgba(28, 151, 80, 0.2);
  }
}

/* ------------------------------------------------------------
   Mobile editorial polish
   ------------------------------------------------------------ */

@media (max-width: 720px) {
  :is(
    .home3-method,
    .home3-proof,
    .home3-stats,
    .home3-positioning,
    .home3-trust,
    .home3-independence,
    [data-pt-panel="method"],
    [data-pt-panel="proof"],
    [data-pt-panel="positioning"]
  ) {
    width: min(100%, calc(100vw - 2rem));
    margin-inline: auto !important;
    padding: clamp(1.35rem, 5vw, 1.8rem) !important;
    border-radius: 1.35rem !important;
  }

  :is(
    .premium-faq,
    .premium-block--faq,
    .content-faq,
    .faq-section,
    [data-pt-panel="transparency-faq"]
  ) {
    width: min(100%, calc(100vw - 2rem));
    margin-inline: auto !important;
  }
}

/* ------------------------------------------------------------
   Dark mode
   ------------------------------------------------------------ */

@media (prefers-color-scheme: dark) {
  :root {
    --pt-faq-bg: #101d2f;
    --pt-faq-soft: #142238;
    --pt-faq-line: rgba(203, 218, 232, 0.14);
    --pt-faq-heading: #f4f8fb;
    --pt-faq-copy: #b8c6d4;
  }

  :is(
    .premium-faq,
    .premium-block--faq,
    .content-faq,
    .faq-section,
    [data-pt-panel="transparency-faq"]
  ) :is(
    details,
    [class*="faq-item"],
    [class*="accordion-item"]
  ) {
    box-shadow: none;
  }
}

:is(
  html.dark,
  html[data-theme="dark"],
  html[data-color-scheme="dark"],
  body.dark,
  [data-theme="dark"]
) {
  --pt-faq-bg: #101d2f;
  --pt-faq-soft: #142238;
  --pt-faq-line: rgba(203, 218, 232, 0.14);
  --pt-faq-heading: #f4f8fb;
  --pt-faq-copy: #b8c6d4;
}
/* End PT source theme + advisor fix 7.3 */
"""

PHRASES = {
    "Empfehlungen brauchen eine überprüfbare Grundlage": "method",
    "Orientierung statt Produktwerbung": "proof",
    "Kein Shop. Keine Herstellerplattform.": "positioning",
    "Transparenz vor der Produktauswahl": "transparency-faq",
}


def repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError("Bitte im Git-Repository ausführen.")
    return Path(result.stdout.strip())


def remove_block(text: str, start: str, end: str) -> str:
    while start in text and end in text:
        begin = text.index(start)
        finish = text.index(end, begin) + len(end)
        text = text[:begin].rstrip() + "\n\n" + text[finish:].lstrip()
    return text


def find_css(root: Path) -> Path:
    candidates = (
        root / "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css",
        root / "apps/pfotentechnik/src/styles/pfotentechnik-design-system-v3.5.css",
        root / "apps/pfotentechnik/src/styles/global.css",
    )
    for path in candidates:
        if path.exists():
            return path
    raise RuntimeError("Keine aktive PfotenTechnik-Design-CSS-Datei gefunden.")


def add_class_to_root(path: Path, class_name: str) -> bool:
    text = path.read_text(encoding="utf-8")
    template_start = 0

    if text.startswith("---"):
        second = text.find("---", 3)
        if second >= 0:
            template_start = second + 3

    pattern = re.compile(
        r'<(?P<tag>section|article|aside|div|main)\b(?P<attrs>[^>]*)>',
        re.IGNORECASE,
    )
    match = pattern.search(text, template_start)
    if not match:
        return False

    attrs = match.group("attrs")
    if class_name in attrs:
        return False

    if re.search(r'\bclass\s*=\s*["\']', attrs):
        new_attrs = re.sub(
            r'(\bclass\s*=\s*["\'])([^"\']*)',
            lambda found: (
                found.group(1)
                + found.group(2).rstrip()
                + " "
                + class_name
            ),
            attrs,
            count=1,
        )
    elif "class:list=" in attrs:
        return False
    else:
        new_attrs = attrs + f' class="{class_name}"'

    replacement = f'<{match.group("tag")}{new_attrs}>'
    text = text[:match.start()] + replacement + text[match.end():]
    path.write_text(text, encoding="utf-8")
    return True


def patch_known_components(root: Path) -> list[str]:
    changed: list[str] = []
    components = root / "packages/affiliate-core/src/components/home"

    mappings = {
        "HomeStats.astro": "home3-proof",
        "HomeTrust.astro": "home3-positioning",
        "HomePositioning.astro": "home3-positioning",
        "HomeProof.astro": "home3-proof",
        "HomeIndependence.astro": "home3-independence",
    }

    for filename, class_name in mappings.items():
        path = components / filename
        if path.exists() and add_class_to_root(path, class_name):
            changed.append(str(path.relative_to(root)))

    return changed


def add_data_attribute_near_phrase(
    path: Path,
    phrase: str,
    value: str,
) -> bool:
    text = path.read_text(encoding="utf-8")
    position = text.find(phrase)
    if position < 0:
        return False

    candidates = list(
        re.finditer(
            r'<(?P<tag>section|article|aside|div)\b(?P<attrs>[^>]*)>',
            text[:position],
            re.IGNORECASE,
        )
    )
    if not candidates:
        return False

    match = candidates[-1]
    attrs = match.group("attrs")
    if "data-pt-panel=" in attrs:
        return False

    replacement = (
        f'<{match.group("tag")}{attrs} '
        f'data-pt-panel="{value}">'
    )
    text = text[:match.start()] + replacement + text[match.end():]
    path.write_text(text, encoding="utf-8")
    return True


def patch_phrase_sources(root: Path) -> list[str]:
    changed: list[str] = []
    roots = (
        root / "apps/pfotentechnik/src",
        root / "packages/affiliate-core/src",
    )

    for base in roots:
        if not base.exists():
            continue

        for path in base.rglob("*.astro"):
            original = path.read_text(encoding="utf-8")
            touched = False

            for phrase, value in PHRASES.items():
                if phrase in original:
                    if add_data_attribute_near_phrase(
                        path,
                        phrase,
                        value,
                    ):
                        touched = True
                    original = path.read_text(encoding="utf-8")

            if touched:
                changed.append(str(path.relative_to(root)))

    return changed


def patch_home_advisor_anchor(root: Path) -> list[str]:
    changed: list[str] = []
    home_page = (
        root
        / "packages/affiliate-core/src/components/home/HomePage.astro"
    )
    if not home_page.exists():
        return changed

    text = home_page.read_text(encoding="utf-8")
    if 'id="kaufberatung"' in text:
        return changed

    marker = '<HomeNavigation\n    mode="comparison-decision"'
    position = text.find(marker)
    if position < 0:
        return changed

    end = text.find("/>", position)
    if end < 0:
        return changed
    end += 2

    block = text[position:end]
    wrapped = (
        '  <div id="kaufberatung">\n'
        + block
        + "\n  </div>"
    )
    text = text[:position] + wrapped + text[end:]
    home_page.write_text(text, encoding="utf-8")
    changed.append(str(home_page.relative_to(root)))
    return changed


def patch_navigation_sources(root: Path) -> list[str]:
    changed: list[str] = []
    search_roots = (
        root / "apps/pfotentechnik/src",
        root / "packages/affiliate-core/src",
    )

    replacements = (
        ("Futterautomaten-Berater", "Kaufberatung"),
        ("Futterautomaten Berater", "Kaufberatung"),
        ("Futterautomatenberater", "Kaufberatung"),
        ('href="/futterautomaten-berater/"', 'href="/#kaufberatung"'),
        ("href='/futterautomaten-berater/'", "href='/#kaufberatung'"),
        ('href="/berater/"', 'href="/#kaufberatung"'),
        ("href='/berater/'", "href='/#kaufberatung'"),
        ('href="/advisor/"', 'href="/#kaufberatung"'),
        ("href='/advisor/'", "href='/#kaufberatung'"),
        ('"/futterautomaten-berater/"', '"/#kaufberatung"'),
        ("'/futterautomaten-berater/'", "'/#kaufberatung'"),
    )

    for base in search_roots:
        if not base.exists():
            continue

        for path in base.rglob("*"):
            if path.suffix not in {".astro", ".ts", ".tsx", ".js"}:
                continue

            text = path.read_text(encoding="utf-8")
            updated = text
            for old, new in replacements:
                updated = updated.replace(old, new)

            if updated != text:
                path.write_text(updated, encoding="utf-8")
                changed.append(str(path.relative_to(root)))

    return sorted(set(changed))


def remove_old_runtime(root: Path) -> list[str]:
    changed: list[str] = []
    layouts = (
        root / "apps/pfotentechnik/src/layouts",
        root / "apps/pfotentechnik/src/components",
    )

    for base in layouts:
        if not base.exists():
            continue

        for path in base.rglob("*.astro"):
            text = path.read_text(encoding="utf-8")
            updated = OLD_RUNTIME_RE.sub("\n", text)
            if updated != text:
                path.write_text(updated, encoding="utf-8")
                changed.append(str(path.relative_to(root)))

    return changed


def update_css(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    for start, end in OLD_BLOCKS:
        text = remove_block(text, start, end)
    text = remove_block(text, START, END)
    path.write_text(
        text.rstrip() + "\n\n" + CSS.strip() + "\n",
        encoding="utf-8",
    )


def main() -> int:
    root = repo_root()
    css = find_css(root)

    touched = []
    touched.extend(remove_old_runtime(root))
    touched.extend(patch_known_components(root))
    touched.extend(patch_phrase_sources(root))
    touched.extend(patch_home_advisor_anchor(root))
    touched.extend(patch_navigation_sources(root))

    update_css(css)
    touched.append(str(css.relative_to(root)))
    touched = sorted(set(touched))

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

    diff = subprocess.run(
        ["git", "diff", "--binary", "--", *touched],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    ).stdout

    patch_path = root / "pfotentechnik-source-theme-advisor-fix-7.3.patch"
    patch_path.write_text(diff, encoding="utf-8")

    audit_path = root / "pfotentechnik-source-theme-advisor-fix-7.3-audit.txt"
    audit_path.write_text(
        "\n".join(
            [
                "PfotenTechnik Source Theme + Advisor Fix 7.3",
                "============================================",
                "",
                "Grund:",
                "- Der alte 7.2-Fix war von Browser-Laufzeitklassen abhängig.",
                "- 7.3 setzt Klassen und Selektoren direkt im Quellcode.",
                "",
                "Geänderte Dateien:",
                *[f"- {item}" for item in touched],
                "",
                "Erwartete Ergebnisse:",
                "- helle Überschriften auf dunkelgrünen Panels",
                "- lesbare Methodik-Schritte",
                "- lesbare Statistik- und Positionierungsblöcke",
                "- FAQ ohne große weiße Außenfläche",
                "- allgemeine Kaufberatung statt Futterautomaten-Berater",
                "- Ziel /#kaufberatung",
                "- Light und Dark Mode",
                "",
            ]
        ),
        encoding="utf-8",
    )

    print("Source Theme + Advisor Fix 7.3 wurde angewendet.")
    print("")
    print("Wichtig:")
    print("  - alter Runtime-Fix 7.2 wurde entfernt")
    print("  - konkrete Komponenten wurden statisch markiert")
    print("  - direkte .home3-* Selektoren greifen ohne JavaScript")
    print("")
    print("Erzeugt:")
    print("  pfotentechnik-source-theme-advisor-fix-7.3.patch")
    print("  pfotentechnik-source-theme-advisor-fix-7.3-audit.txt")
    print("")
    print("Prüfen:")
    print("  git diff --check")
    print("  npm run build:pfotentechnik")
    print("  npm run dev:pfotentechnik")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        raise SystemExit(1)

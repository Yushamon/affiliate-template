#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

START = "/* PT premium comparison entry cards 6.0 */"
END = "/* End PT premium comparison entry cards 6.0 */"
OLD_START = "/* PT comparison entry navigation 5.1 */"
OLD_END = "/* End PT comparison entry navigation 5.1 */"

CSS = '/* PT premium comparison entry cards 6.0 */\n.home41-decision {\n  display: grid;\n  gap: clamp(1.3rem, 3vw, 2rem);\n}\n\n.home41-decision__header {\n  display: grid;\n  grid-template-columns: minmax(0, 0.92fr) minmax(280px, 0.62fr);\n  gap: clamp(2rem, 6vw, 5.5rem);\n  align-items: end;\n}\n\n.home41-decision__header h2 {\n  max-width: 15ch;\n  margin: 0.5rem 0 0;\n  color: var(--home3-text);\n  font-size: clamp(2.1rem, 4.2vw, 3.8rem);\n  line-height: 1.02;\n  letter-spacing: -0.05em;\n  text-wrap: balance;\n}\n\n.home41-decision__header > p {\n  max-width: 54ch;\n  margin: 0;\n  color: var(--home3-muted);\n  font-size: 0.98rem;\n  line-height: 1.65;\n}\n\n.home41-decision__grid {\n  display: grid;\n  grid-template-columns: repeat(3, minmax(0, 1fr));\n  gap: 0.9rem;\n}\n\n.home41-decision__card {\n  --decision-accent: #36c878;\n  --decision-accent-soft: rgba(54, 200, 120, 0.15);\n  position: relative;\n  display: grid;\n  min-height: 186px;\n  grid-template-columns: minmax(112px, 0.82fr) minmax(0, 1.4fr);\n  overflow: hidden;\n  border: 1px solid color-mix(in srgb, var(--decision-accent) 16%, var(--home3-line));\n  border-radius: 1.15rem;\n  color: inherit;\n  background:\n    linear-gradient(135deg, color-mix(in srgb, var(--decision-accent-soft) 58%, transparent), transparent 58%),\n    var(--home3-card);\n  text-decoration: none;\n  box-shadow: 0 12px 34px rgba(7, 26, 22, 0.07);\n  isolation: isolate;\n  transition: transform 180ms ease, border-color 180ms ease, box-shadow 180ms ease;\n}\n\n.home41-decision__card--drinking {\n  --decision-accent: #5ca9ff;\n  --decision-accent-soft: rgba(63, 134, 238, 0.16);\n}\n\n.home41-decision__card--safety {\n  --decision-accent: #9b7cff;\n  --decision-accent-soft: rgba(124, 92, 225, 0.17);\n}\n\n.home41-decision__card:hover {\n  transform: translateY(-3px);\n  border-color: color-mix(in srgb, var(--decision-accent) 40%, var(--home3-line));\n  box-shadow: 0 20px 48px rgba(7, 26, 22, 0.12);\n}\n\n.home41-decision__card:focus-visible {\n  outline: 3px solid color-mix(in srgb, var(--decision-accent) 38%, transparent);\n  outline-offset: 3px;\n}\n\n.home41-decision__media {\n  position: relative;\n  display: block;\n  min-width: 0;\n  min-height: 186px;\n  overflow: hidden;\n  background: color-mix(in srgb, var(--decision-accent) 9%, var(--home3-soft));\n}\n\n.home41-decision__media::after {\n  position: absolute;\n  inset: 0;\n  background:\n    linear-gradient(90deg, transparent 56%, color-mix(in srgb, var(--home3-card) 68%, transparent)),\n    linear-gradient(180deg, transparent 58%, rgba(5, 19, 17, 0.28));\n  content: "";\n  pointer-events: none;\n}\n\n.home41-decision__media picture,\n.home41-decision__media img {\n  width: 100%;\n  height: 100%;\n}\n\n.home41-decision__media img {\n  display: block;\n  object-fit: cover;\n  transition: transform 240ms ease;\n}\n\n.home41-decision__card:hover .home41-decision__media img {\n  transform: scale(1.035);\n}\n\n.home41-decision__media > span {\n  display: none;\n}\n\n.home41-decision__quick-icon {\n  position: absolute;\n  top: 0.95rem;\n  left: calc(41% - 1.15rem);\n  z-index: 3;\n  display: grid;\n  width: 42px;\n  height: 42px;\n  place-items: center;\n  border: 1px solid color-mix(in srgb, var(--decision-accent) 34%, transparent);\n  border-radius: 999px;\n  color: #fff;\n  background: color-mix(in srgb, var(--decision-accent) 84%, #092018);\n  box-shadow: 0 8px 20px rgba(4, 17, 15, 0.22);\n}\n\n.home41-decision__quick-icon svg {\n  width: 20px;\n  height: 20px;\n  fill: none;\n  stroke: currentColor;\n  stroke-width: 1.8;\n  stroke-linecap: round;\n  stroke-linejoin: round;\n}\n\n.home41-decision__content {\n  display: flex;\n  min-width: 0;\n  flex-direction: column;\n  align-items: flex-start;\n  padding: 1.15rem 1.05rem 1rem;\n}\n\n.home41-decision__animal {\n  margin: 0 0 0.35rem;\n  color: var(--decision-accent);\n  font-size: 0.65rem;\n  font-weight: 900;\n  letter-spacing: 0.085em;\n  text-transform: uppercase;\n}\n\n.home41-decision__content h3 {\n  max-width: 16ch;\n  margin: 0;\n  color: var(--home3-text);\n  font-size: clamp(1.05rem, 1.5vw, 1.25rem);\n  font-weight: 850;\n  line-height: 1.12;\n  letter-spacing: -0.025em;\n  text-wrap: pretty;\n}\n\n.home41-decision__content > p,\n.home41-decision__meta small,\n.home41-decision__content > b {\n  display: none;\n}\n\n.home41-decision__meta {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.4rem;\n  margin-top: 0.7rem;\n}\n\n.home41-decision__meta strong {\n  display: inline-flex;\n  min-height: 27px;\n  align-items: center;\n  padding: 0.25rem 0.55rem;\n  border-radius: 999px;\n  color: color-mix(in srgb, var(--decision-accent) 78%, white);\n  background: color-mix(in srgb, var(--decision-accent) 17%, transparent);\n  font-size: 0.68rem;\n  font-weight: 850;\n  line-height: 1;\n}\n\n.home41-decision__highlights {\n  display: flex;\n  flex-wrap: wrap;\n  gap: 0.24rem 0.4rem;\n  margin: 0.75rem 0 0;\n  padding: 0;\n  color: var(--home3-muted);\n  list-style: none;\n}\n\n.home41-decision__highlights li {\n  font-size: 0.65rem;\n  line-height: 1.25;\n  white-space: nowrap;\n}\n\n.home41-decision__highlights li:not(:last-child)::after {\n  margin-left: 0.4rem;\n  color: color-mix(in srgb, var(--decision-accent) 72%, transparent);\n  content: "·";\n}\n\n.home41-decision__arrow {\n  position: absolute;\n  right: 0.95rem;\n  bottom: 0.9rem;\n  z-index: 3;\n  display: grid;\n  width: 30px;\n  height: 30px;\n  place-items: center;\n  border-radius: 999px;\n  color: var(--decision-accent);\n  background: color-mix(in srgb, var(--decision-accent) 10%, transparent);\n  font-size: 1rem;\n  font-weight: 900;\n  line-height: 1;\n}\n\n@media (max-width: 1050px) {\n  .home41-decision__grid {\n    grid-template-columns: repeat(2, minmax(0, 1fr));\n  }\n  .home41-decision__quick-icon {\n    left: calc(40% - 1.15rem);\n  }\n}\n\n@media (max-width: 720px) {\n  .home41-decision {\n    gap: 1.15rem;\n  }\n\n  .home41-decision__header {\n    grid-template-columns: 1fr;\n    gap: 0.75rem;\n  }\n\n  .home41-decision__header h2 {\n    max-width: 13ch;\n    font-size: clamp(2rem, 9vw, 2.7rem);\n  }\n\n  .home41-decision__header > p {\n    max-width: 39ch;\n    font-size: 0.92rem;\n    line-height: 1.55;\n  }\n\n  .home41-decision__grid {\n    grid-template-columns: 1fr;\n    gap: 0.65rem;\n  }\n\n  .home41-decision__card {\n    min-height: 104px;\n    grid-template-columns: 92px minmax(0, 1fr);\n    border-radius: 0.95rem;\n    box-shadow: none;\n  }\n\n  .home41-decision__media {\n    min-height: 104px;\n  }\n\n  .home41-decision__media::after {\n    background: linear-gradient(90deg, transparent 54%, color-mix(in srgb, var(--home3-card) 48%, transparent));\n  }\n\n  .home41-decision__quick-icon {\n    top: 50%;\n    left: 75px;\n    width: 34px;\n    height: 34px;\n    transform: translateY(-50%);\n  }\n\n  .home41-decision__quick-icon svg {\n    width: 17px;\n    height: 17px;\n  }\n\n  .home41-decision__content {\n    justify-content: center;\n    padding: 0.78rem 2.8rem 0.78rem 1.05rem;\n  }\n\n  .home41-decision__animal {\n    margin-bottom: 0.22rem;\n    font-size: 0.57rem;\n  }\n\n  .home41-decision__content h3 {\n    max-width: 18ch;\n    font-size: clamp(0.98rem, 4.4vw, 1.12rem);\n    line-height: 1.15;\n  }\n\n  .home41-decision__meta {\n    margin-top: 0.45rem;\n  }\n\n  .home41-decision__meta strong {\n    min-height: 23px;\n    padding: 0.2rem 0.48rem;\n    font-size: 0.61rem;\n  }\n\n  .home41-decision__highlights {\n    display: none;\n  }\n\n  .home41-decision__arrow {\n    top: 50%;\n    right: 0.75rem;\n    bottom: auto;\n    width: 28px;\n    height: 28px;\n    transform: translateY(-50%);\n  }\n}\n\n@media (max-width: 380px) {\n  .home41-decision__card {\n    grid-template-columns: 82px minmax(0, 1fr);\n  }\n  .home41-decision__quick-icon {\n    left: 67px;\n  }\n}\n\n@media (prefers-color-scheme: dark) {\n  .home41-decision__card {\n    background:\n      linear-gradient(135deg, color-mix(in srgb, var(--decision-accent-soft) 58%, transparent), transparent 60%),\n      #101d2f;\n    box-shadow: none;\n  }\n\n  .home41-decision__media::after {\n    background:\n      linear-gradient(90deg, transparent 56%, rgba(16, 29, 47, 0.72)),\n      linear-gradient(180deg, transparent 58%, rgba(5, 14, 25, 0.38));\n  }\n}\n/* End PT premium comparison entry cards 6.0 */\n'


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


def update_component(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    helpers = """
const getDecisionTheme = (label: string) => {
  const normalized = label.toLocaleLowerCase("de");
  if (normalized.includes("trink") || normalized.includes("wasser")) return "drinking";
  if (normalized.includes("gps") || normalized.includes("tracker") || normalized.includes("ortung")) return "safety";
  return "feeding";
};

const getDecisionAnimal = (label: string) => {
  const normalized = label.toLocaleLowerCase("de");
  if (normalized.includes("katze")) return "Für Katzen";
  if (normalized.includes("hund")) return "Für Hunde";
  return "Vergleich";
};

const getDecisionHighlights = (label: string) => {
  const theme = getDecisionTheme(label);
  if (theme === "drinking") return ["Leise", "Filter", "Reinigung"];
  if (theme === "safety") return ["Live-Ortung", "Akku", "Abo"];
  return ["App", "Portionen", "Futterart"];
};

"""

    if "const getDecisionTheme" not in text:
        marker = "const getDecisionIconSvg = (type: string) => {"
        if marker not in text:
            raise RuntimeError("HomeNavigation: Icon-Helfer nicht gefunden.")
        text = text.replace(marker, helpers + marker, 1)

    old_anchor = '<a class="home41-decision__card" href={card.href}>'
    new_anchor = """<a
          class:list={[
            "home41-decision__card",
            `home41-decision__card--${getDecisionTheme(
              `${card.label} ${card.title}`
            )}`
          ]}
          href={card.href}
        >"""
    if old_anchor in text:
        text = text.replace(old_anchor, new_anchor, 1)

    old_content = """          <div class="home41-decision__content">
            <h3>{card.title}</h3>"""
    new_content = """          <div class="home41-decision__content">
            <span class="home41-decision__animal">
              {getDecisionAnimal(`${card.label} ${card.title}`)}
            </span>
            <h3>{card.title}</h3>"""
    if old_content in text:
        text = text.replace(old_content, new_content, 1)

    old_cta = '            <b><span class="home41-decision__cta-label">Vergleich ansehen</span></b>'
    new_cta = """            <ul class="home41-decision__highlights" aria-label="Schwerpunkte">
              {getDecisionHighlights(
                `${card.label} ${card.title}`
              ).map((item) => (
                <li>{item}</li>
              ))}
            </ul>

            <b><span class="home41-decision__cta-label">Vergleich ansehen</span></b>"""
    if old_cta in text:
        text = text.replace(old_cta, new_cta, 1)

    path.write_text(text, encoding="utf-8")


def main() -> int:
    root = repo_root()
    component = root / "packages/affiliate-core/src/components/home/HomeNavigation.astro"
    css_path = root / "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"

    if not component.exists() or not css_path.exists():
        raise RuntimeError("Erforderliche Dateien wurden nicht gefunden.")

    update_component(component)

    text = css_path.read_text(encoding="utf-8")
    text = remove_block(text, OLD_START, OLD_END)
    text = remove_block(text, START, END)
    css_path.write_text(text.rstrip() + "\n\n" + CSS.strip() + "\n", encoding="utf-8")

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

    patch_path = root / "pfotentechnik-premium-comparison-entry-cards-6.0.patch"
    diff = subprocess.run(
        ["git", "diff", "--binary", "--", str(component.relative_to(root)), str(css_path.relative_to(root))],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    patch_path.write_text(diff, encoding="utf-8")

    print("Premium Comparison Entry Cards 6.0 wurde angewendet.")
    print("Erzeugt: pfotentechnik-premium-comparison-entry-cards-6.0.patch")
    print("Jetzt prüfen: npm run build:pfotentechnik")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        raise SystemExit(1)

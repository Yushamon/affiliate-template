#!/usr/bin/env python3
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

CSS_START = "/* PT homepage hero + quick comparison chips 4.2 */"
CSS_END = "/* End PT homepage hero + quick comparison chips 4.2 */"

CSS_BLOCK = r'''
/* PT homepage hero + quick comparison chips 4.2 */

@media (max-width: 720px) {
  .home5 > .home3-hero,
  .home3 > .home3-hero {
    width: 100vw;
    max-width: none;
    margin-top: -0.75rem;
    margin-right: calc(50% - 50vw);
    margin-left: calc(50% - 50vw);
    border-radius: 0;
    box-shadow: none;
  }

  .home3-hero__content {
    width: min(100%, 42rem);
    margin-inline: auto;
    padding-right: max(1.15rem, env(safe-area-inset-right));
    padding-left: max(1.15rem, env(safe-area-inset-left));
  }

  .home3-hero__media img {
    object-position: 58% 58%;
  }
}

.home41-decision__quick-icon {
  display: none;
}

.home41-decision__quick-icon::before {
  display: block;
  line-height: 1;
}

.home41-decision__quick-icon--bowl::before {
  content: "◒";
}

.home41-decision__quick-icon--drop::before {
  content: "◉";
}

.home41-decision__quick-icon--guide::before {
  content: "▤";
}

.home41-decision__quick-icon--star::before {
  content: "✦";
}

@media (max-width: 760px) {
  .home41-decision {
    gap: 1.25rem;
  }

  .home41-decision__header {
    gap: 0.75rem;
  }

  .home41-decision__header > p {
    max-width: 42ch;
    font-size: 0.95rem;
    line-height: 1.55;
  }

  .home41-decision__grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }

  .home41-decision__card {
    position: relative;
    display: grid;
    min-height: 116px;
    grid-template-columns: 48px minmax(0, 1fr) 20px;
    gap: 0.75rem;
    align-items: center;
    padding: 1rem;
    overflow: visible;
    border-radius: 1rem;
    background: var(--home3-soft);
    box-shadow: none;
  }

  .home41-decision__card:hover {
    transform: none;
    box-shadow: 0 10px 26px rgba(20, 32, 26, 0.08);
  }

  .home41-decision__media {
    display: none;
  }

  .home41-decision__quick-icon {
    display: grid;
    width: 48px;
    height: 48px;
    grid-column: 1;
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
      var(--home3-accent) 11%,
      var(--home3-soft)
    );
    font-size: 1.35rem;
  }

  .home41-decision__content {
    display: block;
    grid-column: 2;
    min-width: 0;
    padding: 0;
  }

  .home41-decision__content h3 {
    margin: 0;
    font-size: clamp(1rem, 4.1vw, 1.14rem);
    line-height: 1.25;
    overflow-wrap: anywhere;
  }

  .home41-decision__content > p,
  .home41-decision__meta {
    display: none;
  }

  .home41-decision__content > b {
    position: static;
    display: block;
    margin: 0;
    color: var(--home3-muted);
    font-size: 0;
  }

  .home41-decision__content > b > span:last-child {
    position: absolute;
    top: 50%;
    right: 1rem;
    font-size: 1.35rem;
    line-height: 1;
    transform: translateY(-50%);
  }

  .home41-decision__cta-label {
    display: none;
  }
}

@media (max-width: 390px) {
  .home41-decision__grid {
    grid-template-columns: 1fr;
  }

  .home41-decision__card {
    min-height: 92px;
  }
}

@media (prefers-color-scheme: dark) and (max-width: 760px) {
  .home41-decision__card {
    border-color: rgba(226, 232, 240, 0.13);
    background: #111d2f;
  }

  .home41-decision__quick-icon {
    border-color: rgba(94, 234, 212, 0.18);
    background: rgba(20, 184, 166, 0.12);
  }
}
/* End PT homepage hero + quick comparison chips 4.2 */
'''


def repo_root() -> Path:
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        raise RuntimeError("Bitte das Skript im Git-Repository ausführen.")
    return Path(result.stdout.strip())


def replace_marked(text: str, start: str, end: str, block: str) -> str:
    if start in text and end in text:
        begin = text.index(start)
        finish = text.index(end, begin) + len(end)
        return (
            text[:begin].rstrip()
            + "\n\n"
            + block.strip()
            + "\n"
            + text[finish:].lstrip()
        )
    return text.rstrip() + "\n\n" + block.strip() + "\n"


def update_navigation(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    icon_markup = '''          <span
            class:list={[
              "home41-decision__quick-icon",
              `home41-decision__quick-icon--${getDecisionIcon(
                `${card.label} ${card.title}`
              )}`
            ]}
            aria-hidden="true"
          ></span>

'''

    card_anchor = '        <a class="home41-decision__card" href={card.href}>\n'
    if "home41-decision__quick-icon" not in text:
        if card_anchor not in text:
            raise RuntimeError(
                "HomeNavigation.astro: Karten-Anker wurde nicht gefunden."
            )
        text = text.replace(card_anchor, card_anchor + icon_markup, 1)

    old_cta = '<b>Vergleich ansehen <span aria-hidden="true">→</span></b>'
    new_cta = '''<b>
                <span class="home41-decision__cta-label">
                  Vergleich ansehen
                </span>
                <span aria-hidden="true">→</span>
              </b>'''

    if old_cta in text:
        text = text.replace(old_cta, new_cta, 1)
    elif "home41-decision__cta-label" not in text:
        raise RuntimeError(
            "HomeNavigation.astro: CTA-Markup wurde nicht gefunden."
        )

    path.write_text(text, encoding="utf-8")


def update_css(path: Path) -> None:
    text = path.read_text(encoding="utf-8")
    text = replace_marked(text, CSS_START, CSS_END, CSS_BLOCK)
    path.write_text(text, encoding="utf-8")


def main() -> int:
    root = repo_root()
    navigation = (
        root
        / "packages/affiliate-core/src/components/home/HomeNavigation.astro"
    )
    css = root / "packages/affiliate-core/src/components/home/home.css"

    missing = [
        str(path.relative_to(root))
        for path in (navigation, css)
        if not path.exists()
    ]
    if missing:
        raise RuntimeError(
            "Erforderliche Dateien fehlen: " + ", ".join(missing)
        )

    update_navigation(navigation)
    update_css(css)

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

    patch_path = root / "pfotentechnik-home-hero-quick-chips-4.2.patch"
    diff = subprocess.run(
        [
            "git",
            "diff",
            "--binary",
            "--",
            str(navigation.relative_to(root)),
            str(css.relative_to(root)),
        ],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    patch_path.write_text(diff, encoding="utf-8")

    print("Homepage Hero + Quick Chips 4.2 wurde angewendet.")
    print("")
    print("Geändert:")
    print("  packages/affiliate-core/src/components/home/HomeNavigation.astro")
    print("  packages/affiliate-core/src/components/home/home.css")
    print("")
    print("Erzeugter Patch:")
    print("  pfotentechnik-home-hero-quick-chips-4.2.patch")
    print("")
    print("Prüfen:")
    print("  npm run build:pfotentechnik")
    return 0


if __name__ == "__main__":
    try:
        raise SystemExit(main())
    except Exception as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        raise SystemExit(1)

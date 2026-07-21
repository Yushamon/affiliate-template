#!/usr/bin/env python3
from __future__ import annotations

import re
import subprocess
import sys
from pathlib import Path

START = "/* PT comparison filter UI 2.0 / 6.2 */"
END = "/* End PT comparison filter UI 2.0 / 6.2 */"

OLD_DARK_START = "/* PT comparison controls dark mode 6.1 */"
OLD_DARK_END = "/* End PT comparison controls dark mode 6.1 */"

CSS = r"""
/* PT comparison filter UI 2.0 / 6.2 */

.comparison-filter-panel {
  --filter-surface: #ffffff;
  --filter-surface-raised: #f5f8f7;
  --filter-surface-active: #eaf7ee;
  --filter-line: #d9e4e1;
  --filter-text: #102a25;
  --filter-muted: #687b77;
  --filter-accent: #25a95b;
  --filter-accent-strong: #177c40;
  display: grid;
  gap: 1.25rem;
  padding: clamp(1.15rem, 3vw, 1.6rem);
  border: 1px solid var(--filter-line);
  border-radius: 1.35rem 1.35rem 0 0;
  color: var(--filter-text);
  background: var(--filter-surface);
  box-shadow: 0 14px 38px rgba(15, 38, 31, 0.065);
}

.comparison-filter-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
}

.comparison-filter-panel__head > div {
  min-width: 0;
}

.comparison-filter-panel__head h2 {
  max-width: 18ch;
  margin: 0.45rem 0 0;
  color: var(--filter-text);
  font-size: clamp(1.65rem, 3.5vw, 2.4rem);
  line-height: 1.06;
  letter-spacing: -0.04em;
  text-wrap: balance;
}

.comparison-filter-panel__head p {
  max-width: 58ch;
  margin: 0.75rem 0 0;
  color: var(--filter-muted);
  line-height: 1.6;
}

.comparison-filter-reset {
  display: inline-flex;
  min-height: 42px;
  flex: 0 0 auto;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.68rem 0.9rem;
  border: 1px solid color-mix(in srgb, var(--filter-accent) 25%, var(--filter-line));
  border-radius: 0.78rem;
  color: var(--filter-accent-strong);
  background: var(--filter-surface-active);
  font: inherit;
  font-size: 0.78rem;
  font-weight: 850;
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease, transform 150ms ease;
}

.comparison-filter-reset::before {
  content: "↺";
  font-size: 1rem;
  line-height: 1;
}

.comparison-filter-reset:hover {
  transform: translateY(-1px);
  border-color: var(--filter-accent);
  background: color-mix(in srgb, var(--filter-accent) 14%, var(--filter-surface));
}

.comparison-filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(225px, 1fr));
  gap: 0.75rem;
}

.comparison-filter-group {
  min-width: 0;
  margin: 0;
  padding: 1rem;
  border: 1px solid var(--filter-line);
  border-radius: 1rem;
  background: var(--filter-surface-raised);
}

.comparison-filter-group legend {
  padding: 0 0.4rem;
  color: var(--filter-text);
  font-size: 0.75rem;
  font-weight: 900;
  letter-spacing: 0.025em;
}

.comparison-filter-options {
  display: grid;
  gap: 0.5rem;
}

.comparison-filter-options label {
  position: relative;
  display: flex;
  min-width: 0;
  min-height: 44px;
  align-items: center;
  gap: 0.7rem;
  padding: 0.62rem 0.7rem;
  border: 1px solid transparent;
  border-radius: 0.75rem;
  color: var(--filter-muted);
  cursor: pointer;
  transition: border-color 140ms ease, color 140ms ease, background 140ms ease;
}

.comparison-filter-options label:hover {
  color: var(--filter-text);
  background: color-mix(in srgb, var(--filter-accent) 6%, transparent);
}

.comparison-filter-options input,
.comparison-toggle input {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
  white-space: nowrap;
}

.comparison-control-box {
  position: relative;
  display: grid;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  place-items: center;
  border: 1.5px solid color-mix(in srgb, var(--filter-muted) 55%, var(--filter-line));
  border-radius: 0.38rem;
  background: var(--filter-surface);
  box-shadow: inset 0 1px 1px rgba(12, 32, 27, 0.04);
  transition: border-color 140ms ease, background 140ms ease, box-shadow 140ms ease;
}

.comparison-control-box::after {
  width: 9px;
  height: 5px;
  border-bottom: 2px solid #fff;
  border-left: 2px solid #fff;
  content: "";
  opacity: 0;
  transform: translateY(-1px) rotate(-45deg) scale(0.75);
  transition: opacity 120ms ease, transform 120ms ease;
}

.comparison-filter-options input:checked + .comparison-control-box,
.comparison-toggle input:checked + .comparison-control-box {
  border-color: var(--filter-accent);
  background: var(--filter-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb, var(--filter-accent) 13%, transparent);
}

.comparison-filter-options input:checked + .comparison-control-box::after,
.comparison-toggle input:checked + .comparison-control-box::after {
  opacity: 1;
  transform: translateY(-1px) rotate(-45deg) scale(1);
}

.comparison-filter-options input:focus-visible + .comparison-control-box,
.comparison-toggle input:focus-visible + .comparison-control-box {
  outline: 3px solid color-mix(in srgb, var(--filter-accent) 28%, transparent);
  outline-offset: 3px;
}

.comparison-filter-options label:has(input:checked) {
  border-color: color-mix(in srgb, var(--filter-accent) 22%, var(--filter-line));
  color: var(--filter-text);
  background: var(--filter-surface-active);
}

.comparison-filter-option__text {
  min-width: 0;
  line-height: 1.35;
}

.comparison-filter-count {
  display: flex;
  width: fit-content;
  align-items: baseline;
  gap: 0.3rem;
  margin: 0;
  color: var(--filter-muted);
  font-size: 0.88rem;
}

.comparison-filter-count strong {
  color: var(--filter-text);
  font-size: 1.12rem;
  font-variant-numeric: tabular-nums;
}

.comparison-explorer__toolbar {
  --filter-surface: #ffffff;
  --filter-surface-raised: #f5f8f7;
  --filter-line: #d9e4e1;
  --filter-text: #102a25;
  --filter-muted: #687b77;
  --filter-accent: #25a95b;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 0.8rem;
  align-items: center;
  padding: 0.9rem clamp(1.15rem, 3vw, 1.6rem);
  border: 1px solid var(--filter-line);
  border-top: 0;
  border-radius: 0 0 1.35rem 1.35rem;
  background: var(--filter-surface);
  box-shadow: 0 14px 38px rgba(15, 38, 31, 0.065);
}

.comparison-toggle {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: 0.7rem;
  color: var(--filter-text);
  font-size: 0.84rem;
  font-weight: 750;
  cursor: pointer;
}

.comparison-toggle__copy {
  display: grid;
  min-width: 0;
  gap: 0.08rem;
}

.comparison-toggle__copy strong {
  color: var(--filter-text);
  font-size: 0.84rem;
  line-height: 1.25;
}

.comparison-toggle__copy small {
  color: var(--filter-muted);
  font-size: 0.68rem;
  font-weight: 500;
  line-height: 1.3;
}

.comparison-show-all {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: 0.45rem;
  padding: 0.72rem 1rem;
  border: 1px solid var(--filter-accent);
  border-radius: 0.8rem;
  color: #071811;
  background: #5cdf91;
  font: inherit;
  font-size: 0.8rem;
  font-weight: 900;
  text-align: center;
  cursor: pointer;
  box-shadow: 0 8px 20px rgba(37, 169, 91, 0.15);
  transition: transform 150ms ease, background 150ms ease, box-shadow 150ms ease;
}

.comparison-show-all::after {
  content: "↓";
  font-size: 0.9rem;
}

.comparison-show-all:hover {
  transform: translateY(-1px);
  background: #70e49f;
  box-shadow: 0 12px 26px rgba(37, 169, 91, 0.2);
}

.comparison-show-all[aria-pressed="true"]::after {
  content: "↑";
}

.comparison-show-all:focus-visible,
.comparison-filter-reset:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--filter-accent) 30%, transparent);
  outline-offset: 3px;
}

@media (max-width: 760px) {
  .comparison-filter-panel {
    gap: 1.1rem;
    padding: 1rem;
  }

  .comparison-filter-panel__head {
    align-items: stretch;
    flex-direction: column;
  }

  .comparison-filter-panel__head h2 {
    font-size: clamp(1.55rem, 7.2vw, 2rem);
  }

  .comparison-filter-reset {
    width: fit-content;
  }

  .comparison-filter-grid {
    grid-template-columns: 1fr;
  }

  .comparison-filter-group {
    padding: 0.85rem;
  }

  .comparison-filter-options {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.35rem;
  }

  .comparison-filter-options label {
    min-height: 48px;
    padding: 0.55rem;
    font-size: 0.82rem;
  }

  .comparison-explorer__toolbar {
    grid-template-columns: 1fr;
    padding: 0.85rem 1rem 1rem;
  }

  .comparison-toggle {
    min-height: 48px;
    padding: 0.35rem 0;
  }

  .comparison-show-all {
    width: 100%;
  }
}

@media (max-width: 390px) {
  .comparison-filter-options {
    grid-template-columns: 1fr;
  }
}

@media (prefers-color-scheme: dark) {
  .comparison-filter-panel,
  .comparison-explorer__toolbar {
    --filter-surface: #101d2f;
    --filter-surface-raised: #142238;
    --filter-surface-active: rgba(61, 205, 123, 0.105);
    --filter-line: rgba(203, 218, 232, 0.15);
    --filter-text: #f5f8fb;
    --filter-muted: #a9b7c7;
    --filter-accent: #5cdf91;
    --filter-accent-strong: #84e9ad;
    background: var(--filter-surface);
    box-shadow: none;
  }

  .comparison-filter-group {
    border-color: var(--filter-line);
    background: var(--filter-surface-raised);
  }

  .comparison-control-box {
    border-color: rgba(203, 218, 232, 0.34);
    background: #0b1626;
    box-shadow: inset 0 1px 1px rgba(0, 0, 0, 0.24);
  }

  .comparison-filter-options label:hover {
    background: rgba(92, 223, 145, 0.065);
  }

  .comparison-filter-options label:has(input:checked) {
    border-color: rgba(92, 223, 145, 0.25);
    background: rgba(92, 223, 145, 0.09);
  }

  .comparison-filter-reset {
    border-color: rgba(92, 223, 145, 0.28);
    color: #87ebb0;
    background: rgba(92, 223, 145, 0.08);
  }

  .comparison-filter-reset:hover {
    border-color: rgba(92, 223, 145, 0.5);
    background: rgba(92, 223, 145, 0.13);
  }

  .comparison-show-all {
    border-color: #5cdf91;
    color: #071811;
    background: #5cdf91;
    box-shadow: 0 8px 22px rgba(30, 170, 88, 0.18);
  }

  .comparison-show-all:hover {
    background: #72e7a2;
  }
}
/* End PT comparison filter UI 2.0 / 6.2 */
"""


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


def update_filter_bar(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    old = """              <label>
                <input
                  type="checkbox"
                  value={option.value}
                  data-filter-key={filter.key}
                />
                <span>{option.label}</span>
              </label>"""

    new = """              <label>
                <input
                  type="checkbox"
                  value={option.value}
                  data-filter-key={filter.key}
                />
                <span class="comparison-control-box" aria-hidden="true"></span>
                <span class="comparison-filter-option__text">
                  {option.label}
                </span>
              </label>"""

    if old in text:
        text = text.replace(old, new, 1)
    elif "comparison-control-box" not in text:
        raise RuntimeError(
            "ComparisonFilterBar: Checkbox-Markup wurde nicht gefunden."
        )

    path.write_text(text, encoding="utf-8")


def update_explorer(path: Path) -> None:
    text = path.read_text(encoding="utf-8")

    old_toggle = """    <label class="comparison-toggle">
      <input
        type="checkbox"
        data-differences-only
      />
      <span>Nur Unterschiede anzeigen</span>
    </label>"""

    new_toggle = """    <label class="comparison-toggle">
      <input
        type="checkbox"
        data-differences-only
      />
      <span class="comparison-control-box" aria-hidden="true"></span>
      <span class="comparison-toggle__copy">
        <strong>Nur Unterschiede anzeigen</strong>
        <small>Identische Merkmale vorübergehend ausblenden</small>
      </span>
    </label>"""

    if old_toggle in text:
        text = text.replace(old_toggle, new_toggle, 1)
    elif "comparison-toggle__copy" not in text:
        raise RuntimeError(
            "ComparisonExplorer: Unterschiede-Toggle wurde nicht gefunden."
        )

    path.write_text(text, encoding="utf-8")


def main() -> int:
    root = repo_root()

    filter_bar = (
        root
        / "packages/affiliate-core/src/components/comparison/ComparisonFilterBar.astro"
    )
    explorer = (
        root
        / "packages/affiliate-core/src/components/comparison/ComparisonExplorer.astro"
    )
    css_path = (
        root
        / "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"
    )

    for path in (filter_bar, explorer, css_path):
        if not path.exists():
            raise RuntimeError(f"Datei fehlt: {path.relative_to(root)}")

    update_filter_bar(filter_bar)
    update_explorer(explorer)

    css = css_path.read_text(encoding="utf-8")
    css = remove_block(css, OLD_DARK_START, OLD_DARK_END)
    css = remove_block(css, START, END)
    css_path.write_text(
        css.rstrip() + "\n\n" + CSS.strip() + "\n",
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
        raise RuntimeError("git diff --check meldet Formatfehler.")

    patch_path = root / "pfotentechnik-comparison-filter-ui-2.0-6.2.patch"
    diff = subprocess.run(
        [
            "git",
            "diff",
            "--binary",
            "--",
            str(filter_bar.relative_to(root)),
            str(explorer.relative_to(root)),
            str(css_path.relative_to(root)),
        ],
        cwd=root,
        capture_output=True,
        text=True,
        check=True,
    ).stdout
    patch_path.write_text(diff, encoding="utf-8")

    print("Comparison Filter UI 2.0 / 6.2 wurde angewendet.")
    print("")
    print("Neu:")
    print("  - vollständig eigene Checkbox-Darstellung")
    print("  - Filter und Toolbar als ein zusammengehöriges Panel")
    print("  - Dark-Mode-Oberflächen ohne weiße Browserflächen")
    print("  - bessere mobile Anordnung")
    print("  - klare aktive, Hover- und Fokuszustände")
    print("")
    print("Filterlogik:")
    print("  - unverändert")
    print("  - alle bestehenden data-Attribute bleiben erhalten")
    print("")
    print("Erzeugt:")
    print("  pfotentechnik-comparison-filter-ui-2.0-6.2.patch")
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

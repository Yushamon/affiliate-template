#!/usr/bin/env python3
from __future__ import annotations
import subprocess, sys
from pathlib import Path

START = "/* PT comparison controls dark mode 6.1 */"
END = "/* End PT comparison controls dark mode 6.1 */"

CSS = r"""
/* PT comparison controls dark mode 6.1 */
.comparison-explorer__toolbar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: .85rem;
  padding: .9rem;
  border: 1px solid var(--comparison-line);
  border-radius: 1rem;
  background: var(--comparison-surface);
  box-shadow: 0 8px 24px rgba(20,32,26,.05);
}

.comparison-toggle {
  display: inline-flex;
  min-width: 0;
  align-items: center;
  gap: .65rem;
  color: var(--comparison-text);
  font-size: .88rem;
  font-weight: 750;
  cursor: pointer;
}

.comparison-toggle input,
.comparison-filter-options input {
  width: 1.15rem;
  height: 1.15rem;
  flex: 0 0 auto;
  margin: 0;
  accent-color: var(--comparison-accent);
  cursor: pointer;
}

.comparison-show-all,
.comparison-filter-reset {
  min-height: 42px;
  padding: .68rem .95rem;
  border: 1px solid color-mix(in srgb,var(--comparison-accent) 28%,var(--comparison-line));
  border-radius: .78rem;
  color: var(--comparison-accent);
  background: color-mix(in srgb,var(--comparison-accent) 8%,var(--comparison-surface));
  font: inherit;
  font-size: .82rem;
  font-weight: 850;
  cursor: pointer;
  transition: border-color 150ms ease, background 150ms ease, color 150ms ease, transform 150ms ease;
}

.comparison-show-all:hover,
.comparison-filter-reset:hover {
  transform: translateY(-1px);
  border-color: var(--comparison-accent);
  background: color-mix(in srgb,var(--comparison-accent) 14%,var(--comparison-surface));
}

.comparison-show-all:focus-visible,
.comparison-filter-reset:focus-visible,
.comparison-toggle input:focus-visible,
.comparison-filter-options input:focus-visible {
  outline: 3px solid color-mix(in srgb,var(--comparison-accent) 34%,transparent);
  outline-offset: 3px;
}

@media (max-width: 760px) {
  .comparison-explorer__toolbar {
    align-items: stretch;
    flex-direction: column;
    padding: .85rem;
  }

  .comparison-toggle {
    min-height: 44px;
    padding: .65rem .1rem;
  }

  .comparison-show-all {
    width: 100%;
  }
}

@media (prefers-color-scheme: dark) {
  .comparison-explorer__toolbar {
    border-color: rgba(226,232,240,.13);
    background: #111d2f;
    box-shadow: none;
  }

  .comparison-toggle,
  .comparison-toggle span {
    color: #eef5f2;
  }

  .comparison-toggle input,
  .comparison-filter-options input {
    border-color: rgba(226,232,240,.28);
    background-color: #0b1627;
    accent-color: #58d391;
    color-scheme: dark;
  }

  .comparison-show-all,
  .comparison-filter-reset {
    border-color: rgba(88,211,145,.3);
    color: #82e6ad;
    background: rgba(88,211,145,.09);
  }

  .comparison-show-all:hover,
  .comparison-filter-reset:hover {
    border-color: rgba(88,211,145,.55);
    color: #a3f0c2;
    background: rgba(88,211,145,.15);
  }

  .comparison-show-all[aria-pressed="true"] {
    border-color: #58d391;
    color: #07151a;
    background: #58d391;
  }

  .comparison-filter-panel,
  .comparison-filter-group {
    border-color: rgba(226,232,240,.13);
    background: #111d2f;
  }

  .comparison-filter-panel__head h2,
  .comparison-filter-group legend,
  .comparison-filter-count strong {
    color: #f7fafc;
  }

  .comparison-filter-panel__head p,
  .comparison-filter-options label,
  .comparison-filter-count {
    color: #aebccc;
  }
}
/* End PT comparison controls dark mode 6.1 */
"""

def root():
    r = subprocess.run(["git","rev-parse","--show-toplevel"],capture_output=True,text=True)
    if r.returncode != 0:
        raise RuntimeError("Bitte im Git-Repository ausführen.")
    return Path(r.stdout.strip())

def replace(text):
    if START in text and END in text:
        a=text.index(START); b=text.index(END,a)+len(END)
        return text[:a].rstrip()+"\n\n"+CSS.strip()+"\n"+text[b:].lstrip()
    return text.rstrip()+"\n\n"+CSS.strip()+"\n"

def main():
    repo=root()
    css=repo/"apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"
    if not css.exists():
        raise RuntimeError("Designsystem nicht gefunden.")
    css.write_text(replace(css.read_text(encoding="utf-8")),encoding="utf-8")

    chk=subprocess.run(["git","diff","--check"],cwd=repo,capture_output=True,text=True)
    if chk.returncode:
        print(chk.stdout,chk.stderr,file=sys.stderr)
        raise RuntimeError("git diff --check fehlgeschlagen.")

    patch=repo/"pfotentechnik-comparison-controls-dark-mode-6.1.patch"
    diff=subprocess.run(["git","diff","--binary","--",str(css.relative_to(repo))],cwd=repo,capture_output=True,text=True,check=True).stdout
    patch.write_text(diff,encoding="utf-8")
    print("Comparison Controls Dark Mode 6.1 angewendet.")
    print("Erzeugt: pfotentechnik-comparison-controls-dark-mode-6.1.patch")
    print("Jetzt prüfen: npm run build:pfotentechnik")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Fehler: {exc}",file=sys.stderr)
        raise SystemExit(1)

#!/usr/bin/env python3
from __future__ import annotations
import re, subprocess, sys
from pathlib import Path

CORE_START = "/* PT core comparison filter UI 2.1 / 6.3 */"
CORE_END = "/* End PT core comparison filter UI 2.1 / 6.3 */"
APP_BLOCKS = [
    ("/* PT comparison controls dark mode 6.1 */", "/* End PT comparison controls dark mode 6.1 */"),
    ("/* PT comparison filter UI 2.0 / 6.2 */", "/* End PT comparison filter UI 2.0 / 6.2 */"),
]

CORE_CSS = r"""
/* PT core comparison filter UI 2.1 / 6.3 */
.comparison-filter-panel,
.comparison-explorer__toolbar {
  --filter-surface: #fff;
  --filter-surface-raised: #f5f8f7;
  --filter-surface-active: #eaf7ee;
  --filter-line: #d9e4e1;
  --filter-text: #102a25;
  --filter-muted: #687b77;
  --filter-accent: #25a95b;
  --filter-accent-strong: #177c40;
}

.comparison-filter-panel {
  display: grid;
  gap: 1.25rem;
  padding: clamp(1.15rem, 3vw, 1.6rem);
  border: 1px solid var(--filter-line);
  border-radius: 1.35rem 1.35rem 0 0;
  color: var(--filter-text);
  background: var(--filter-surface);
  box-shadow: 0 14px 38px rgba(15,38,31,.065);
}

.comparison-filter-panel__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin: 0;
}

.comparison-filter-panel__head h2 {
  max-width: 18ch;
  margin: .45rem 0 0;
  color: var(--filter-text);
  font-size: clamp(1.65rem,3.5vw,2.4rem);
  line-height: 1.06;
  letter-spacing: -.04em;
}

.comparison-filter-panel__head p {
  max-width: 58ch;
  margin: .75rem 0 0;
  color: var(--filter-muted);
  line-height: 1.6;
}

.comparison-filter-reset {
  display: inline-flex;
  min-height: 42px;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  padding: .68rem .9rem;
  border: 1px solid color-mix(in srgb,var(--filter-accent) 25%,var(--filter-line));
  border-radius: .78rem;
  color: var(--filter-accent-strong);
  background: var(--filter-surface-active);
  font: inherit;
  font-size: .78rem;
  font-weight: 850;
  cursor: pointer;
}

.comparison-filter-reset::before { content: "↺"; font-size: 1rem; }

.comparison-filter-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit,minmax(225px,1fr));
  gap: .75rem;
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
  padding: 0 .4rem;
  color: var(--filter-text);
  font-size: .75rem;
  font-weight: 900;
}

.comparison-filter-options {
  display: grid;
  gap: .5rem;
  margin-top: .45rem;
}

.comparison-filter-options label {
  position: relative;
  display: flex;
  min-height: 44px;
  align-items: center;
  gap: .7rem;
  padding: .62rem .7rem;
  border: 1px solid transparent;
  border-radius: .75rem;
  color: var(--filter-muted);
  font-size: .88rem;
  cursor: pointer;
}

.comparison-filter-options label:hover {
  color: var(--filter-text);
  background: color-mix(in srgb,var(--filter-accent) 6%,transparent);
}

.comparison-filter-options input,
.comparison-toggle input {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: -1px;
  overflow: hidden;
  clip: rect(0 0 0 0);
  clip-path: inset(50%);
}

.comparison-control-box {
  display: grid;
  width: 22px;
  height: 22px;
  flex: 0 0 22px;
  place-items: center;
  border: 1.5px solid color-mix(in srgb,var(--filter-muted) 55%,var(--filter-line));
  border-radius: .38rem;
  background: var(--filter-surface);
}

.comparison-control-box::after {
  width: 9px;
  height: 5px;
  border-bottom: 2px solid #fff;
  border-left: 2px solid #fff;
  content: "";
  opacity: 0;
  transform: translateY(-1px) rotate(-45deg);
}

.comparison-filter-options input:checked + .comparison-control-box,
.comparison-toggle input:checked + .comparison-control-box {
  border-color: var(--filter-accent);
  background: var(--filter-accent);
  box-shadow: 0 0 0 4px color-mix(in srgb,var(--filter-accent) 13%,transparent);
}

.comparison-filter-options input:checked + .comparison-control-box::after,
.comparison-toggle input:checked + .comparison-control-box::after { opacity: 1; }

.comparison-filter-options input:focus-visible + .comparison-control-box,
.comparison-toggle input:focus-visible + .comparison-control-box {
  outline: 3px solid color-mix(in srgb,var(--filter-accent) 28%,transparent);
  outline-offset: 3px;
}

.comparison-filter-options label:has(input:checked) {
  border-color: color-mix(in srgb,var(--filter-accent) 22%,var(--filter-line));
  color: var(--filter-text);
  background: var(--filter-surface-active);
}

.comparison-filter-option__text { min-width: 0; line-height: 1.35; }

.comparison-filter-count {
  display: flex;
  width: fit-content;
  align-items: baseline;
  gap: .3rem;
  margin: 0;
  color: var(--filter-muted);
  font-size: .88rem;
}

.comparison-filter-count strong {
  color: var(--filter-text);
  font-size: 1.12rem;
  font-variant-numeric: tabular-nums;
}

.comparison-explorer {
  display: grid;
  gap: 1rem;
  min-width: 0;
}

.comparison-filter-panel + .comparison-explorer__toolbar { margin-top: -1rem; }

.comparison-explorer__toolbar {
  display: grid;
  grid-template-columns: minmax(0,1fr) auto;
  gap: .8rem;
  align-items: center;
  padding: .9rem clamp(1.15rem,3vw,1.6rem);
  border: 1px solid var(--filter-line);
  border-radius: 1.35rem;
  background: var(--filter-surface);
  box-shadow: 0 14px 38px rgba(15,38,31,.065);
}

.comparison-filter-panel + .comparison-explorer__toolbar {
  border-top: 0;
  border-radius: 0 0 1.35rem 1.35rem;
}

.comparison-toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: .7rem;
  color: var(--filter-text);
  font-size: .84rem;
  font-weight: 750;
  cursor: pointer;
}

.comparison-toggle__copy { display: grid; min-width: 0; gap: .08rem; }
.comparison-toggle__copy strong { color: var(--filter-text); font-size: .84rem; }
.comparison-toggle__copy small { color: var(--filter-muted); font-size: .68rem; font-weight: 500; }

.comparison-show-all {
  display: inline-flex;
  min-height: 44px;
  align-items: center;
  justify-content: center;
  gap: .45rem;
  padding: .72rem 1rem;
  border: 1px solid var(--filter-accent);
  border-radius: .8rem;
  color: #071811;
  background: #5cdf91;
  font: inherit;
  font-size: .8rem;
  font-weight: 900;
  cursor: pointer;
}

.comparison-show-all::after { content: "↓"; }
.comparison-show-all[aria-pressed="true"]::after { content: "↑"; }

@media (max-width:760px) {
  .comparison-filter-panel { gap: 1.1rem; padding: 1rem; }
  .comparison-filter-panel__head { align-items: stretch; flex-direction: column; }
  .comparison-filter-panel__head h2 { font-size: clamp(1.55rem,7.2vw,2rem); }
  .comparison-filter-reset { width: fit-content; }
  .comparison-filter-grid { grid-template-columns: 1fr; }
  .comparison-filter-group { padding: .85rem; }
  .comparison-filter-options { grid-template-columns: repeat(2,minmax(0,1fr)); gap: .35rem; }
  .comparison-filter-options label { min-height: 48px; padding: .55rem; font-size: .82rem; }
  .comparison-explorer__toolbar { grid-template-columns: 1fr; padding: .85rem 1rem 1rem; }
  .comparison-toggle { min-height: 48px; padding: .35rem 0; }
  .comparison-show-all { width: 100%; }
}

@media (max-width:420px) {
  .comparison-filter-options { grid-template-columns: 1fr; }
}

@media (prefers-color-scheme:dark) {
  .comparison-filter-panel,
  .comparison-explorer__toolbar {
    --filter-surface: #101d2f;
    --filter-surface-raised: #142238;
    --filter-surface-active: rgba(61,205,123,.105);
    --filter-line: rgba(203,218,232,.15);
    --filter-text: #f5f8fb;
    --filter-muted: #a9b7c7;
    --filter-accent: #5cdf91;
    --filter-accent-strong: #84e9ad;
    box-shadow: none;
  }

  .comparison-control-box {
    border-color: rgba(203,218,232,.34);
    background: #0b1626;
  }

  .comparison-filter-reset {
    border-color: rgba(92,223,145,.28);
    color: #87ebb0;
    background: rgba(92,223,145,.08);
  }

  .comparison-show-all {
    border-color: #5cdf91;
    color: #071811;
    background: #5cdf91;
  }
}

:is(html.dark,html[data-theme="dark"],body.dark,[data-theme="dark"])
:is(.comparison-filter-panel,.comparison-explorer__toolbar) {
  --filter-surface: #101d2f;
  --filter-surface-raised: #142238;
  --filter-surface-active: rgba(61,205,123,.105);
  --filter-line: rgba(203,218,232,.15);
  --filter-text: #f5f8fb;
  --filter-muted: #a9b7c7;
  --filter-accent: #5cdf91;
  --filter-accent-strong: #84e9ad;
  box-shadow: none;
}

:is(html.dark,html[data-theme="dark"],body.dark,[data-theme="dark"]) .comparison-control-box {
  border-color: rgba(203,218,232,.34);
  background: #0b1626;
}

:is(html.dark,html[data-theme="dark"],body.dark,[data-theme="dark"]) .comparison-filter-reset {
  border-color: rgba(92,223,145,.28);
  color: #87ebb0;
  background: rgba(92,223,145,.08);
}

:is(html.dark,html[data-theme="dark"],body.dark,[data-theme="dark"]) .comparison-show-all {
  border-color: #5cdf91;
  color: #071811;
  background: #5cdf91;
}
/* End PT core comparison filter UI 2.1 / 6.3 */
"""

def root():
    r = subprocess.run(["git","rev-parse","--show-toplevel"],capture_output=True,text=True)
    if r.returncode:
        raise RuntimeError("Bitte im Git-Repository ausführen.")
    return Path(r.stdout.strip())

def remove_marked(text, start, end):
    while start in text and end in text:
        a = text.index(start); b = text.index(end,a)+len(end)
        text = text[:a].rstrip()+"\n\n"+text[b:].lstrip()
    return text

def replace_range(text,start_token,end_token,replacement=""):
    a=text.find(start_token)
    b=text.find(end_token,a)
    if a<0 or b<0:
        raise RuntimeError(f"CSS-Anker fehlt: {start_token} / {end_token}")
    return text[:a].rstrip()+"\n\n"+replacement.strip()+"\n\n"+text[b:].lstrip()

def update_core(path):
    text=path.read_text(encoding="utf-8")
    text=remove_marked(text,CORE_START,CORE_END)
    text=replace_range(text,".comparison-filter-panel {",".comparison-empty-state {")
    text=replace_range(text,".comparison-explorer {",".comparison-mobile-list {")
    text=re.sub(r'@media\s*\(max-width:\s*420px\)\s*\{\s*\.comparison-filter-options\s*\{[^{}]*\}\s*\}',"",text,count=1)
    anchor=text.find(".comparison-empty-state {")
    if anchor<0: raise RuntimeError("Einfügeanker fehlt.")
    text=text[:anchor].rstrip()+"\n\n"+CORE_CSS.strip()+"\n\n"+text[anchor:].lstrip()
    path.write_text(text,encoding="utf-8")

def update_app(path):
    text=path.read_text(encoding="utf-8")
    for a,b in APP_BLOCKS:
        text=remove_marked(text,a,b)
    path.write_text(text.rstrip()+"\n",encoding="utf-8")

def main():
    repo=root()
    core=repo/"packages/affiliate-core/src/components/comparison/comparison.css"
    app=repo/"apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"
    if not core.exists() or not app.exists():
        raise RuntimeError("CSS-Dateien nicht gefunden.")

    update_core(core)
    update_app(app)

    check=subprocess.run(["git","diff","--check"],cwd=repo,capture_output=True,text=True)
    if check.returncode:
        print(check.stdout,check.stderr,file=sys.stderr)
        raise RuntimeError("git diff --check fehlgeschlagen.")

    audit=[]
    core_text=core.read_text(encoding="utf-8")
    app_text=app.read_text(encoding="utf-8")
    if core_text.count(CORE_START)!=1:
        audit.append("Core-Block fehlt oder ist mehrfach vorhanden.")
    for a,_ in APP_BLOCKS:
        if a in app_text:
            audit.append(f"App-Hotfix verbleibt: {a}")

    (repo/"pfotentechnik-comparison-filter-core-6.3-audit.txt").write_text(
        "\n".join(["Comparison Filter Core 6.3","",*(audit or ["Keine doppelten Filterregeln gefunden."]),""]),
        encoding="utf-8"
    )

    diff=subprocess.run(
        ["git","diff","--binary","--",str(core.relative_to(repo)),str(app.relative_to(repo))],
        cwd=repo,capture_output=True,text=True,check=True
    ).stdout
    (repo/"pfotentechnik-comparison-filter-core-6.3.patch").write_text(diff,encoding="utf-8")

    print("Comparison Filter Core 6.3 angewendet.")
    print("Erzeugt:")
    print("  pfotentechnik-comparison-filter-core-6.3.patch")
    print("  pfotentechnik-comparison-filter-core-6.3-audit.txt")
    print("Prüfen:")
    print("  git diff --check")
    print("  npm run build:pfotentechnik")

if __name__=="__main__":
    try:
        main()
    except Exception as exc:
        print(f"Fehler: {exc}",file=sys.stderr)
        raise SystemExit(1)

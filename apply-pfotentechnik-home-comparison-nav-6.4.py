#!/usr/bin/env python3
from __future__ import annotations
import subprocess
import sys
from pathlib import Path

START = "/* PT home comparison cards + primary nav 6.4 */"
END = "/* End PT home comparison cards + primary nav 6.4 */"

CSS = r'''
/* PT home comparison cards + primary nav 6.4 */
@media (max-width:720px){
  main.container.container--home .home41-decision .home41-decision__grid{
    display:grid;grid-template-columns:1fr;gap:.7rem;
  }
  main.container.container--home .home41-decision .home41-decision__card{
    position:relative;display:grid!important;width:100%;min-height:112px;
    grid-template-columns:96px minmax(0,1fr);grid-template-rows:112px;
    overflow:hidden;border-radius:1rem;box-shadow:none;
  }
  main.container.container--home .home41-decision .home41-decision__media{
    position:relative;display:block!important;width:96px;min-width:96px;
    height:112px;min-height:112px;grid-column:1;grid-row:1;overflow:hidden;
    border:0;border-radius:0;
  }
  main.container.container--home .home41-decision .home41-decision__media picture,
  main.container.container--home .home41-decision .home41-decision__media img{
    display:block;width:100%;height:100%;
  }
  main.container.container--home .home41-decision .home41-decision__media img{
    max-width:none;object-fit:cover;object-position:center;
  }
  main.container.container--home .home41-decision .home41-decision__media::after{
    position:absolute;inset:0;background:linear-gradient(90deg,transparent 48%,rgba(16,29,47,.5));
    content:"";pointer-events:none;
  }
  main.container.container--home .home41-decision .home41-decision__quick-icon{
    position:absolute;z-index:3;top:50%;left:79px;display:grid;width:34px;height:34px;
    place-items:center;transform:translateY(-50%);
  }
  main.container.container--home .home41-decision .home41-decision__quick-icon svg{
    width:17px;height:17px;
  }
  main.container.container--home .home41-decision .home41-decision__content{
    display:flex!important;min-width:0;height:112px;grid-column:2;grid-row:1;
    flex-direction:column;justify-content:center;align-items:flex-start;
    padding:.7rem 2.75rem .7rem 1.1rem;
  }
  main.container.container--home .home41-decision .home41-decision__animal{
    margin:0 0 .2rem;font-size:.56rem;line-height:1.1;
  }
  main.container.container--home .home41-decision .home41-decision__content h3{
    max-width:19ch;margin:0;font-size:clamp(.98rem,4.25vw,1.12rem);
    line-height:1.13;letter-spacing:-.018em;
  }
  main.container.container--home .home41-decision .home41-decision__meta{margin-top:.45rem}
  main.container.container--home .home41-decision .home41-decision__meta strong{
    min-height:23px;padding:.2rem .48rem;font-size:.61rem;
  }
  main.container.container--home .home41-decision .home41-decision__content>p,
  main.container.container--home .home41-decision .home41-decision__highlights,
  main.container.container--home .home41-decision .home41-decision__content>b,
  main.container.container--home .home41-decision .home41-decision__meta small{
    display:none!important;
  }
  main.container.container--home .home41-decision .home41-decision__arrow{
    position:absolute;z-index:4;top:50%;right:.72rem;bottom:auto;display:grid;
    width:28px;height:28px;place-items:center;transform:translateY(-50%);
  }
}
@media (max-width:380px){
  main.container.container--home .home41-decision .home41-decision__card{
    grid-template-columns:84px minmax(0,1fr);
  }
  main.container.container--home .home41-decision .home41-decision__media{
    width:84px;min-width:84px;
  }
  main.container.container--home .home41-decision .home41-decision__quick-icon{left:68px}
}
@media (min-width:1051px){
  main.container.container--home .home41-decision .home41-decision__grid{
    grid-template-columns:repeat(3,minmax(0,1fr));
  }
}
/* End PT home comparison cards + primary nav 6.4 */
'''

def root():
    result = subprocess.run(
        ["git", "rev-parse", "--show-toplevel"],
        capture_output=True,
        text=True,
    )
    if result.returncode:
        raise RuntimeError("Bitte im Git-Repository ausführen.")
    return Path(result.stdout.strip())

def remove_block(text, start, end):
    while start in text and end in text:
        a = text.index(start)
        b = text.index(end, a) + len(end)
        text = text[:a].rstrip() + "\n\n" + text[b:].lstrip()
    return text

def main():
    repo = root()
    css = repo / "apps/pfotentechnik/src/styles/pfotentechnik-design-system.css"
    registry = repo / "apps/pfotentechnik/src/domain/content/registry.ts"
    gps = repo / "apps/pfotentechnik/src/content/pages/gps-tracker.md"

    for path in (css, registry, gps):
        if not path.exists():
            raise RuntimeError(f"Datei fehlt: {path.relative_to(repo)}")

    css_text = remove_block(css.read_text(encoding="utf-8"), START, END)
    css.write_text(css_text.rstrip() + "\n\n" + CSS.strip() + "\n", encoding="utf-8")

    gps_text = gps.read_text(encoding="utf-8")
    gps_text = gps_text.replace(
        'navigation: { show: true, label: "GPS-Tracker", section: "wissen", order: 15 }',
        'navigation: { show: true, label: "GPS-Tracker", section: "gps-tracker", order: 35 }',
    )
    if 'section: "gps-tracker"' not in gps_text:
        raise RuntimeError("GPS-Navigation konnte nicht angepasst werden.")
    gps.write_text(gps_text, encoding="utf-8")

    registry_text = registry.read_text(encoding="utf-8")
    old = '''    return items.filter(
      (item, index) =>
        items.findIndex(
          (candidate) =>
            candidate.href === item.href
        ) === index
    );'''
    new = '''    const requiredItems: NavigationItem[] = [
      { label: "Wissen & Ratgeber", href: "/wissen/", order: 30 },
      { label: "GPS-Tracker", href: "/gps-tracker/", order: 35 }
    ];

    const mergedItems = [
      ...items.filter(
        (item) =>
          !requiredItems.some(
            (required) => required.href === item.href
          )
      ),
      ...requiredItems
    ].sort(
      (a, b) =>
        a.order - b.order ||
        a.label.localeCompare(b.label, "de")
    );

    return mergedItems.filter(
      (item, index) =>
        mergedItems.findIndex(
          (candidate) => candidate.href === item.href
        ) === index
    );'''

    if old in registry_text:
        registry_text = registry_text.replace(old, new, 1)
    elif "const requiredItems: NavigationItem[]" not in registry_text:
        raise RuntimeError("Navigation-Rückgabeblock nicht gefunden.")
    registry.write_text(registry_text, encoding="utf-8")

    check = subprocess.run(
        ["git", "diff", "--check"],
        cwd=repo,
        capture_output=True,
        text=True,
    )
    if check.returncode:
        print(check.stdout, check.stderr, file=sys.stderr)
        raise RuntimeError("git diff --check fehlgeschlagen.")

    files = [css, registry, gps]
    diff = subprocess.run(
        ["git", "diff", "--binary", "--", *[str(p.relative_to(repo)) for p in files]],
        cwd=repo,
        capture_output=True,
        text=True,
        check=True,
    ).stdout

    (repo / "pfotentechnik-home-comparison-nav-6.4.patch").write_text(diff, encoding="utf-8")
    (repo / "pfotentechnik-home-comparison-nav-6.4-audit.txt").write_text(
        "Home Comparison + Navigation 6.4\n\n"
        "- Mobile Karten horizontal und kompakt\n"
        "- Wissen & Ratgeber: /wissen/\n"
        "- GPS-Tracker: /gps-tracker/\n",
        encoding="utf-8",
    )

    print("Home Comparison + Navigation 6.4 angewendet.")
    print("Erzeugt: pfotentechnik-home-comparison-nav-6.4.patch")
    print("Prüfen: npm run build:pfotentechnik")

if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"Fehler: {exc}", file=sys.stderr)
        raise SystemExit(1)

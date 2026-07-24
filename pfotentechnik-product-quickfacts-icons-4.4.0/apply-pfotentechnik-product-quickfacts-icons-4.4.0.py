#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re, shutil, subprocess, sys

VERSION = "4.4.0"
START = "/* PT product quickfacts icons 4.4.0 */"
END = "/* End PT product quickfacts icons 4.4.0 */"

PATCH = r"""
<style is:global>
/* PT product quickfacts icons 4.4.0 */

.native-quickfacts article,
.native-quickfacts__item,
[class*="quickfact"] article,
[class*="quick-fact"] article {
  position: relative !important;
  display: grid !important;
  grid-template-columns: 3.25rem minmax(0, 1fr) !important;
  align-items: start !important;
  column-gap: 1rem !important;
  row-gap: .2rem !important;
  min-width: 0 !important;
  padding: 1.1rem 1rem !important;
  overflow: hidden !important;
}

.native-quickfacts__icon,
.native-quickfacts article > :first-child:is(.icon, [class*="icon"]),
.native-quickfacts__item > :first-child:is(.icon, [class*="icon"]),
[class*="quickfact"] article > :first-child:is(.icon, [class*="icon"]),
[class*="quick-fact"] article > :first-child:is(.icon, [class*="icon"]) {
  position: static !important;
  inset: auto !important;
  transform: none !important;
  margin: 0 !important;
  align-self: start !important;
  justify-self: start !important;
  display: grid !important;
  place-items: center !important;
  width: 3.25rem !important;
  min-width: 3.25rem !important;
  max-width: 3.25rem !important;
  height: 3.25rem !important;
  min-height: 3.25rem !important;
  max-height: 3.25rem !important;
  border-radius: .9rem !important;
  padding: .7rem !important;
  overflow: hidden !important;
  box-sizing: border-box !important;
}

.native-quickfacts__icon svg,
.native-quickfacts article > :first-child:is(.icon, [class*="icon"]) svg,
.native-quickfacts__item > :first-child:is(.icon, [class*="icon"]) svg,
[class*="quickfact"] article > :first-child:is(.icon, [class*="icon"]) svg,
[class*="quick-fact"] article > :first-child:is(.icon, [class*="icon"]) svg {
  display: block !important;
  width: 1.65rem !important;
  height: 1.65rem !important;
  min-width: 1.65rem !important;
  min-height: 1.65rem !important;
  max-width: 1.65rem !important;
  max-height: 1.65rem !important;
  margin: 0 !important;
  transform: none !important;
  stroke-width: 1.8 !important;
}

.native-quickfacts article > :not(.native-quickfacts__icon):not(:first-child),
.native-quickfacts__item > :not(.native-quickfacts__icon):not(:first-child),
[class*="quickfact"] article > :not(:first-child),
[class*="quick-fact"] article > :not(:first-child) {
  min-width: 0 !important;
  margin-left: 0 !important;
  padding-left: 0 !important;
  grid-column: 2 !important;
}

.native-quickfacts__icon::before,
.native-quickfacts__icon::after {
  content: none !important;
  display: none !important;
}

@media (max-width: 720px) {
  .native-quickfacts article,
  .native-quickfacts__item,
  [class*="quickfact"] article,
  [class*="quick-fact"] article {
    grid-template-columns: 2.9rem minmax(0, 1fr) !important;
    column-gap: .9rem !important;
    padding: 1rem .95rem !important;
  }

  .native-quickfacts__icon,
  .native-quickfacts article > :first-child:is(.icon, [class*="icon"]),
  .native-quickfacts__item > :first-child:is(.icon, [class*="icon"]),
  [class*="quickfact"] article > :first-child:is(.icon, [class*="icon"]),
  [class*="quick-fact"] article > :first-child:is(.icon, [class*="icon"]) {
    width: 2.9rem !important;
    min-width: 2.9rem !important;
    max-width: 2.9rem !important;
    height: 2.9rem !important;
    min-height: 2.9rem !important;
    max-height: 2.9rem !important;
    border-radius: .8rem !important;
    padding: .62rem !important;
  }
}

/* End PT product quickfacts icons 4.4.0 */
</style>
"""

def repo_root():
    p = subprocess.run(["git","rev-parse","--show-toplevel"], capture_output=True, text=True)
    if p.returncode:
        raise RuntimeError("Bitte im Repository-Root ausführen.")
    return Path(p.stdout.strip())

def find_route(root):
    for name in ("[product].astro","[slug].astro"):
        p = root / "apps/pfotentechnik/src/pages/produkt" / name
        if p.exists():
            return p
    raise RuntimeError("Produktseiten-Route nicht gefunden.")

def patch_file(path):
    text = path.read_text(encoding="utf-8")
    text = re.sub(re.escape(START) + r"[\s\S]*?" + re.escape(END), "", text)
    text = re.sub(r"<style is:global>\s*</style>", "", text)
    for closing in ("</ProjectLayout>","</BaseLayout>","</Layout>"):
        if closing in text:
            text = text.replace(closing, PATCH.strip() + "\n\n" + closing, 1)
            break
    else:
        text = text.rstrip() + "\n\n" + PATCH.strip() + "\n"
    path.write_text(text, encoding="utf-8")

def npm_path():
    return shutil.which("npm.cmd") or shutil.which("npm.exe") or shutil.which("npm")

def main():
    root = repo_root()
    route = find_route(root)
    stamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = root / ".patch-backups" / f"product-quickfacts-icons-{VERSION}-{stamp}"
    saved = backup / route.relative_to(root)
    saved.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(route, saved)

    try:
        patch_file(route)
        print("Angepasst:", route.relative_to(root))
        npm = npm_path()
        if npm:
            result = subprocess.run([npm,"run","build:pfotentechnik"], cwd=root, shell=False)
            if result.returncode:
                raise RuntimeError("Build fehlgeschlagen.")
        else:
            print("\nnpm nicht gefunden. Patch bleibt installiert. Danach manuell: npm run build:pfotentechnik")
    except Exception:
        shutil.copy2(saved, route)
        print("\nPatch fehlgeschlagen; Datei wurde zurückgesetzt.", file=sys.stderr)
        raise

    print("\nPatch 4.4.0 erfolgreich installiert.")

if __name__ == "__main__":
    main()

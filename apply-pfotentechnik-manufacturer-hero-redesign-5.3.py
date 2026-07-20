#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil
import sys

REL = Path("apps/pfotentechnik/src/pages/hersteller/[manufacturer].astro")
MARKER = "/* manufacturer-hero-redesign-5.3 */"

CSS = r'''
  /* manufacturer-hero-redesign-5.3 */
  .manufacturer-detail {
    gap: clamp(2.5rem, 5vw, 4rem);
  }

  .manufacturer-hero {
    grid-template-columns: minmax(0, 0.92fr) minmax(420px, 1.08fr);
    align-items: stretch;
    min-height: 560px;
  }

  .manufacturer-hero > div {
    display: grid;
    align-content: center;
    padding: clamp(2.5rem, 4.5vw, 4.25rem);
  }

  .manufacturer-hero > div > p {
    max-width: 58ch;
  }

  .manufacturer-hero h1 {
    font-size: clamp(2.9rem, 5.5vw, 5rem);
  }

  .manufacturer-hero .recommendation {
    max-width: 40ch;
    font-size: clamp(1.15rem, 1.7vw, 1.4rem);
    line-height: 1.45;
  }

  .manufacturer-hero > :global(img) {
    width: 100%;
    height: 100%;
    min-height: 560px;
    aspect-ratio: auto;
    object-fit: cover;
    object-position: center;
  }

  .rating {
    flex-wrap: wrap;
    row-gap: 0.25rem;
  }

  .manufacturer-stats {
    margin-top: -1rem;
  }

  @media (max-width: 900px) {
    .manufacturer-hero {
      min-height: 0;
    }

    .manufacturer-hero > div {
      padding: clamp(2rem, 7vw, 3rem);
    }

    .manufacturer-hero > :global(img) {
      height: auto;
      min-height: 0;
      aspect-ratio: 16 / 9;
    }

    .manufacturer-stats {
      margin-top: 0;
    }
  }

  @media (max-width: 640px) {
    .manufacturer-detail {
      gap: 2.25rem;
    }

    .manufacturer-hero {
      border-radius: 1.35rem;
    }

    .manufacturer-hero h1 {
      font-size: clamp(2.5rem, 13vw, 3.8rem);
    }

    .manufacturer-hero .recommendation {
      font-size: 1.08rem;
    }
  }
'''

def fail(message):
    print(f"Fehler: {message}", file=sys.stderr)
    raise SystemExit(1)

root = None
cwd = Path.cwd().resolve()
for candidate in [cwd, *cwd.parents]:
    if (candidate / REL).exists():
        root = candidate
        break

if root is None:
    fail("Repository-Root nicht gefunden.")

target = root / REL
source = target.read_text(encoding="utf-8")

if MARKER in source:
    print("Manufacturer Hero Redesign 5.3 ist bereits angewendet.")
    raise SystemExit(0)

if source.count("<style>") != 1 or source.count("</style>") != 1:
    fail("Die Style-Tags sind nicht eindeutig. Datei wurde nicht verändert.")

required = [
    ".manufacturer-hero {",
    ".manufacturer-hero > div {",
    ".manufacturer-hero > :global(img)"
]
missing = [item for item in required if item not in source]
if missing:
    fail("Erwartete Hero-Regeln fehlen: " + ", ".join(missing))

timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".manufacturer-hero-redesign-5.3-backup-{timestamp}" / REL
backup.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(target, backup)

style_end = source.rfind("</style>")
updated = source[:style_end].rstrip() + "\n\n" + CSS.strip() + "\n" + source[style_end:]
target.write_text(updated, encoding="utf-8")

checked = target.read_text(encoding="utf-8")
if checked.count("<style>") != 1 or checked.count("</style>") != 1 or MARKER not in checked:
    shutil.copy2(backup, target)
    fail("Nachprüfung fehlgeschlagen. Originaldatei wurde wiederhergestellt.")

print("Manufacturer Hero Redesign 5.3 erfolgreich angewendet.")
print(f"Geändert: {REL}")
print(f"Backup: {backup}")
print("Jetzt ausführen:")
print("  npm run build:pfotentechnik")

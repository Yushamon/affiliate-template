#!/usr/bin/env python3
from pathlib import Path

ARTICLE = Path("apps/pfotentechnik/src/content/pages/smarte-futterautomaten.md")

OLD = 'heroImageKey: "feederHero"\n'
NEW = '''heroImage:
  src: "../../assets/images/guides/smarte-futterautomaten/hero.webp"
  alt: "Smarte Futterautomaten für Hunde und Katzen im Vergleich."
heroImageKey: "feederHero"
'''

if not ARTICLE.exists():
    raise SystemExit(f"Datei nicht gefunden: {ARTICLE}")

text = ARTICLE.read_text(encoding="utf-8")

if NEW in text:
    print("Der Hero-Fix ist bereits installiert.")
    raise SystemExit(0)

if OLD not in text:
    raise SystemExit(
        'Erwartete Frontmatter-Zeile `heroImageKey: "feederHero"` nicht gefunden. '
        "Die Datei wurde möglicherweise bereits verändert."
    )

ARTICLE.write_text(text.replace(OLD, NEW, 1), encoding="utf-8")

print("Guide-Hero ergänzt.")
print("Der allgemeine Hero bleibt als Fallback über heroImageKey erhalten.")
print("Danach ausführen:")
print("  npm run build:pfotentechnik")

#!/usr/bin/env python3
from pathlib import Path
import sys

ARTICLE = Path("apps/pfotentechnik/src/content/pages/smarte-futterautomaten.md")
OLD = "](/images/guides/smarte-futterautomaten/"
NEW = "](../../assets/images/guides/smarte-futterautomaten/"

if not ARTICLE.exists():
    raise SystemExit(f"Datei nicht gefunden: {ARTICLE}")

text = ARTICLE.read_text(encoding="utf-8")
count = text.count(OLD)

if count == 0:
    if NEW in text:
        print("Die Bildpfade sind bereits korrigiert.")
        raise SystemExit(0)
    raise SystemExit(
        "Keine erwarteten Bildpfade gefunden. "
        "Die Datei wurde möglicherweise bereits anders geändert."
    )

updated = text.replace(OLD, NEW)
ARTICLE.write_text(updated, encoding="utf-8")

print(f"{count} Bildpfade korrigiert:")
print(f"  {OLD}")
print(f"  {NEW}")
print()
print("Danach ausführen:")
print("  npm run build:pfotentechnik")

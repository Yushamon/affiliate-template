#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil
import sys

REL = Path("apps/pfotentechnik/src/pages/hersteller/[manufacturer].astro")
MARKER = "/* manufacturer-dark-mode-5.2.1 */"

def fail(message: str) -> None:
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

if MARKER not in source:
    fail("Der erwartete Dark-Mode-Block 5.2.1 wurde nicht gefunden.")

open_count = source.count("<style>")
close_count = source.count("</style>")

if open_count != 1:
    fail(f"Unerwartete Anzahl an <style>-Tags: {open_count}")

if close_count == 1:
    print("Der Style-Block ist bereits korrekt geschlossen. Keine Änderung nötig.")
    raise SystemExit(0)

if close_count > 1:
    fail(f"Unerwartete Anzahl an </style>-Tags: {close_count}")

timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".manufacturer-style-close-5.2.2-backup-{timestamp}" / REL
backup.parent.mkdir(parents=True, exist_ok=True)
shutil.copy2(target, backup)

updated = source.rstrip() + "\n</style>\n"
target.write_text(updated, encoding="utf-8")

# Nachprüfung
checked = target.read_text(encoding="utf-8")
if checked.count("<style>") != 1 or checked.count("</style>") != 1:
    shutil.copy2(backup, target)
    fail("Nachprüfung fehlgeschlagen. Originaldatei wurde wiederhergestellt.")

print("Manufacturer Style Close Hotfix 5.2.2 erfolgreich angewendet.")
print(f"Geändert: {REL}")
print(f"Backup: {backup}")
print("Jetzt ausführen:")
print("  npm run build:pfotentechnik")

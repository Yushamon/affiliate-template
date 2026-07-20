#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import shutil
import re
import sys

APP = Path("apps/pfotentechnik")
PAGES = APP / "src/content/pages"
PRODUCTS = APP / "src/content/products"
HUB = PAGES / "smarte-futterautomaten.md"

def fail(msg: str) -> None:
    print(f"FEHLER: {msg}", file=sys.stderr)
    raise SystemExit(1)

def find_root(start: Path) -> Path:
    for root in [start, *start.parents]:
        if (root / APP).is_dir() and (root / "package.json").exists():
            return root
    fail("Repository-Root nicht gefunden. Script im affiliate-template Repository ausführen.")

root = find_root(Path.cwd().resolve())
pages_dir = root / PAGES
products_dir = root / PRODUCTS
hub_file = root / HUB

if not hub_file.exists():
    fail(f"Hub fehlt: {HUB}")

# Tatsächlich vorhandene statische Content-Routen erfassen.
routes = {f"/{p.stem}/" for p in pages_dir.glob("*.md")}
routes |= {f"/produkt/{p.stem}/" for p in products_dir.glob("*.md")}

# Sichere, im Repository bestätigte Korrekturen.
fixed_map = {
    "/futterautomaten/": "/smarte-futterautomaten/",
    "/futterautomat-reinigen/": "/futterautomat-richtig-reinigen/",
    "/produkt/petkit-eversweet-3-pro/": "/produkt/petkit-eversweet-3-pro-uvc/",
    "/produkt/petlibro-dockstream/": "/produkt/petlibro-dockstream-rfid-smart/",
    "/katze-trinkt-zu-wenig/": "/woran-erkennt-man-dass-die-katze-zu-wenig-trinkt/",
}

# Bei Varianten nur dann ersetzen, wenn das Ziel lokal wirklich existiert.
candidate_map = {
    "/trockenfutter-oder-nassfutter-hund/": [
        "/trockenfutter-oder-nassfutter-hund/",
        "/trockenfutter-oder-nassfutter-beim-hund/",
        "/trockenfutter-oder-nassfutter/",
    ],
    "/hund-trinkt-ploetzlich-viel/": [
        "/hund-trinkt-ploetzlich-viel/",
        "/hund-trinkt-viel/",
    ],
    "/trinkbrunnen-richtig-reinigen/": [
        "/trinkbrunnen-richtig-reinigen/",
        "/katzentrinkbrunnen-richtig-reinigen/",
        "/katzentrinkbrunnen-reinigen/",
        "/trinkbrunnen-reinigen/",
    ],
}

for old, candidates in candidate_map.items():
    valid = next((route for route in candidates if route in routes), None)
    if valid and valid != old:
        fixed_map[old] = valid

invalid_targets = {old: new for old, new in fixed_map.items() if new not in routes}
if invalid_targets:
    details = "\n".join(f"  {old} -> {new}" for old, new in invalid_targets.items())
    fail("Mindestens ein vorgesehenes Ziel existiert nicht:\n" + details)

targets = sorted(pages_dir.glob("*.md"))
timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".pfotentechnik-internal-linking-hotfix-5.1-backup-{timestamp}"
changes = []
replacement_counts = {}

for path in targets:
    original = path.read_text(encoding="utf-8")
    updated = original
    file_counts = {}
    for old, new in fixed_map.items():
        count = updated.count(old)
        if count:
            updated = updated.replace(old, new)
            file_counts[f"{old} -> {new}"] = count
            replacement_counts[old] = replacement_counts.get(old, 0) + count

    if updated != original:
        backup_path = backup / path.relative_to(root)
        backup_path.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, backup_path)
        path.write_text(updated, encoding="utf-8")
        changes.append((path.relative_to(root), file_counts))

# Fünf zuvor verwaiste Seiten aus dem vorhandenen Cornerstone anbinden.
orphan_links = [
    ("Futterautomaten für Seniorenkatzen", "/beste-futterautomaten-fuer-seniorenkatzen/"),
    ("Futterautomaten mit Akku", "/beste-futterautomaten-mit-akku/"),
    ("Futterautomaten mit Edelstahlnapf", "/beste-futterautomaten-mit-edelstahl-napf/"),
    ("Smarte Gadgets für Hunde und Katzen", "/smarte-gadgets-fuer-hunde-und-katzen/"),
    ("So bewerten wir Produkte und Empfehlungen", "/so-bewerten-wir/"),
]

missing_orphans = [route for _, route in orphan_links if route not in routes]
if missing_orphans:
    fail("Diese verwaisten Zielseiten existieren nicht:\n  " + "\n  ".join(missing_orphans))

hub_original = hub_file.read_text(encoding="utf-8")
hub_updated = hub_original
marker = "<!-- internal-linking-5.1 -->"

if marker not in hub_updated:
    section = "\n\n## Weiterführende Auswahlhilfen und Transparenz\n\n"
    section += (
        "Je nach Tier, Aufstellort und gewünschter Ausstattung helfen diese "
        "vertiefenden Seiten bei der weiteren Einordnung:\n\n"
    )
    section += "\n".join(f"- [{label}]({route})" for label, route in orphan_links)
    section += f"\n\n{marker}\n"

    backup_path = backup / hub_file.relative_to(root)
    backup_path.parent.mkdir(parents=True, exist_ok=True)
    if not backup_path.exists():
        shutil.copy2(hub_file, backup_path)
    hub_updated = hub_updated.rstrip() + section
    hub_file.write_text(hub_updated, encoding="utf-8")
    changes.append((hub_file.relative_to(root), {"orphan-links": len(orphan_links)}))

# Prüfen, ob die bekannten alten Links noch vorkommen.
remaining = {}
for path in targets:
    text = path.read_text(encoding="utf-8")
    for old in list(fixed_map) + list(candidate_map):
        count = text.count(old)
        if count:
            remaining.setdefault(old, []).append(str(path.relative_to(root)))

print("\nInternal Linking Hotfix 5.1 angewendet")
print(f"Backup: {backup}")
print(f"Geänderte Dateien: {len(changes)}")
for path, details in changes:
    print(f"- {path}")
    for kind, count in details.items():
        print(f"    {kind}: {count}")

if remaining:
    print("\nNoch nicht automatisch auflösbare Links:")
    for route, files in remaining.items():
        print(f"- {route}")
        for file in files:
            print(f"    {file}")
else:
    print("\nAlle bekannten fehlerhaften Links wurden aufgelöst.")

print("\nJetzt ausführen:")
print("  npm --workspace apps/pfotentechnik run audit:repository")
print("  npm run build:pfotentechnik")

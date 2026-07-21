#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import subprocess, sys
TARGET = Path('packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro')
def stop(message):
    print(f"FEHLER: {message}", file=sys.stderr)
    raise SystemExit(1)
def find_root(start):
    for candidate in (start, *start.parents):
        if (candidate / "apps/pfotentechnik/package.json").is_file(): return candidate
    stop("Repository-Root nicht gefunden.")
def run(command, cwd):
    print("$", " ".join(command))
    if subprocess.run(command, cwd=cwd).returncode != 0:
        raise RuntimeError("Befehl fehlgeschlagen: " + " ".join(command))
root = find_root(Path.cwd().resolve())
path = root / TARGET
if not path.is_file(): stop(f"Datei fehlt: {TARGET}")
original = path.read_text(encoding="utf-8")
if "comparison-score-hotfix-4.2.1" in original: stop("Score Hotfix 4.2.1 scheint bereits installiert zu sein.")
updated = original.replace('import { toEditorialScore } from "@affiliate-core/utils/editorialScore";\n', "")
updated = updated.replace("            {typeof product.rating === \"number\" && (\n              <strong>{toEditorialScore(product.rating, 5)}</strong>\n            )}", "            {typeof product.rating === \"number\" && (\n              <strong data-feature=\"comparison-score-hotfix-4.2.1\">\n                {Math.round(product.rating)} / 100\n              </strong>\n            )}")
updated = updated.replace("            {typeof product.rating === \"number\" && (\n              <strong>\n                {product.rating.toFixed(1).replace(\".\", \",\")} / 5\n              </strong>\n            )}", "            {typeof product.rating === \"number\" && (\n              <strong data-feature=\"comparison-score-hotfix-4.2.1\">\n                {Math.round(product.rating)} / 100\n              </strong>\n            )}")
if "comparison-score-hotfix-4.2.1" not in updated: stop("Bewertungsblock konnte nicht eindeutig gefunden werden.")
if "toEditorialScore(product.rating, 5)" in updated: stop("Fehlerhafte erneute Skalierung ist noch vorhanden.")
stamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".comparison-score-hotfix-4.2.1-backup-{stamp}"
backup_file = backup / TARGET
backup_file.parent.mkdir(parents=True, exist_ok=False)
backup_file.write_text(original, encoding="utf-8")
try:
    path.write_text(updated, encoding="utf-8")
    run(["npm", "run", "build:pfotentechnik"], root)
    package = (root / "apps/pfotentechnik/package.json").read_text(encoding="utf-8")
    if "\"audit:recommendations\"" in package:
        run(["npm", "--workspace", "apps/pfotentechnik", "run", "audit:recommendations"], root)
except Exception as exc:
    print(f"Validierung fehlgeschlagen: {exc}", file=sys.stderr)
    print("Automatischer Rollback wird ausgeführt.", file=sys.stderr)
    path.write_text(original, encoding="utf-8")
    raise SystemExit(1)
print("Comparison Score Hotfix 4.2.1 erfolgreich installiert.")
print(f"Backup: {backup}")

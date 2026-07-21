#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import json
import re
import subprocess
import sys

APP = Path("apps/pfotentechnik")
PAGES = APP / "src/content/pages"
REPORT_DIR = Path("reports")
REPORT_JSON = REPORT_DIR / "money-page-metadata-audit.json"
REPORT_MD = REPORT_DIR / "money-page-metadata-audit.md"

def stop(message):
    print(f"FEHLER: {message}", file=sys.stderr)
    raise SystemExit(1)

def find_root(start: Path) -> Path:
    for candidate in (start, *start.parents):
        if (candidate / APP / "package.json").is_file():
            return candidate
    stop("Repository-Root nicht gefunden.")

def run(command, cwd):
    print("$", " ".join(command))
    result = subprocess.run(command, cwd=cwd)
    if result.returncode != 0:
        raise RuntimeError("Befehl fehlgeschlagen: " + " ".join(command))

def split_frontmatter(text: str):
    if not text.startswith("---\n"):
        return None
    end = text.find("\n---\n", 4)
    if end == -1:
        return None
    return text[4:end], text[end + 5:]

def scalar(frontmatter: str, key: str):
    prefix = f"{key}:"
    for line in frontmatter.splitlines():
        if line.startswith(prefix):
            value = line[len(prefix):].strip().strip("'\"")
            return value or None
    return None

def top_level_block(frontmatter: str, key: str):
    lines = frontmatter.splitlines()
    start = None
    prefix = f"{key}:"

    for index, line in enumerate(lines):
        if line.startswith(prefix):
            start = index
            break

    if start is None:
        return None

    end = len(lines)
    for index in range(start + 1, len(lines)):
        line = lines[index]
        if line and not line[0].isspace():
            end = index
            break

    return "\n".join(lines[start:end])

def has_top_level(frontmatter: str, key: str) -> bool:
    return top_level_block(frontmatter, key) is not None

def has_nested(frontmatter: str, parent: str, child: str) -> bool:
    block = top_level_block(frontmatter, parent)
    if not block:
        return False

    child_prefix = f"{child}:"
    for line in block.splitlines()[1:]:
        stripped = line.lstrip()
        if stripped.startswith(child_prefix):
            return True
    return False

def nested_scalar(frontmatter: str, parent: str, child: str):
    block = top_level_block(frontmatter, parent)
    if not block:
        return None

    child_prefix = f"{child}:"
    for line in block.splitlines()[1:]:
        stripped = line.lstrip()
        if stripped.startswith(child_prefix):
            value = stripped[len(child_prefix):].strip().strip("'\"")
            return value or None
    return None

def normalize(value: str) -> str:
    value = value.lower()
    value = value.replace("ä", "ae").replace("ö", "oe").replace("ü", "ue").replace("ß", "ss")
    return re.sub(r"[^a-z0-9]+", " ", value).strip()

def classify(slug: str, title: str, description: str, frontmatter: str):
    haystack = normalize(" ".join([slug, title or "", description or "", frontmatter]))

    explicit_intent = nested_scalar(frontmatter, "contentPlatform", "intent")
    has_recommendation_journey = has_top_level(frontmatter, "recommendationJourney")
    has_closing_cta = has_top_level(frontmatter, "closingCta")
    has_decision_key = has_top_level(frontmatter, "decisionKey")
    has_comparison_products = has_top_level(frontmatter, "comparisonProducts")

    buying_terms = [
        "beste ", "welcher ", "welche ", "passende ", "kaufberatung",
        "fuer zwei", "fur zwei", "fuer mehrere", "fur mehrere",
        "mit kamera", "mit akku", "ohne wlan", "gegen schlingen",
        "bei uebergewicht", "nassfutter", "berufstaetige",
        "grosse hunde"
    ]

    purchase_signal = (
        explicit_intent in {"buying-guide", "comparison-support"} or
        has_recommendation_journey or
        has_closing_cta or
        has_decision_key or
        has_comparison_products or
        any(term in haystack for term in buying_terms)
    )

    if not purchase_signal:
        return {"is_candidate": False}

    cluster = None
    if any(term in haystack for term in ["futterautomat", "futterautomaten", "fuetterungsroboter"]):
        cluster = "futterautomaten"
    elif any(term in haystack for term in ["trinkbrunnen", "wasserbrunnen"]):
        cluster = "trinkbrunnen"
    elif any(term in haystack for term in ["gps tracker", "gps", "ortung"]):
        cluster = "gps"
    elif any(term in haystack for term in ["katzenklappe", "mikrochipklappe"]):
        cluster = "katzenklappen"

    animal = None
    dog = bool(re.search(r"\b(hund|hunde)\b", haystack))
    cat = bool(re.search(r"\b(katze|katzen)\b", haystack))
    if dog and not cat:
        animal = "dog"
    elif cat and not dog:
        animal = "cat"

    pet_size = None
    if animal == "dog" and re.search(r"\b(gross|grosse|grosser|large)\b", haystack):
        pet_size = "large"
    elif animal == "dog" and re.search(r"\b(klein|kleine|kleiner|small)\b", haystack):
        pet_size = "small"
    elif animal == "dog" and re.search(r"\b(mittel|mittelgross|medium)\b", haystack):
        pet_size = "medium"

    comparison_href = None
    if cluster == "futterautomaten":
        if animal == "dog":
            comparison_href = "/vergleiche/beste-futterautomaten-fuer-hunde/"
        elif animal == "cat":
            comparison_href = "/vergleiche/beste-futterautomaten-fuer-katzen/"
        else:
            comparison_href = "/vergleiche/beste-futterautomaten/"
    elif cluster == "trinkbrunnen":
        if animal == "dog":
            comparison_href = "/vergleiche/beste-trinkbrunnen-fuer-hunde/"
        elif animal == "cat":
            comparison_href = "/vergleiche/beste-trinkbrunnen-fuer-katzen/"
    elif cluster == "gps":
        if animal == "dog":
            comparison_href = "/vergleiche/beste-gps-tracker-fuer-hunde/"
        elif animal == "cat":
            comparison_href = "/vergleiche/beste-gps-tracker-fuer-katzen/"

    confidence = "high"
    warnings = []

    if not cluster:
        confidence = "manual"
        warnings.append("Cluster nicht eindeutig ableitbar.")

    if cluster in {"trinkbrunnen", "gps", "katzenklappen"} and not comparison_href:
        confidence = "manual"
        warnings.append("Vergleichs-URL nicht sicher ableitbar.")

    if animal is None and cluster in {"futterautomaten", "trinkbrunnen", "gps"}:
        confidence = "medium"
        warnings.append(
            "Tierart nicht eindeutig; generischer Vergleich oder manuelle Prüfung."
        )

    return {
        "is_candidate": True,
        "cluster": cluster,
        "animal": animal,
        "pet_size": pet_size,
        "comparison_href": comparison_href,
        "confidence": confidence,
        "warnings": warnings,
        "has_recommendation_journey": has_recommendation_journey,
        "has_content_platform": has_top_level(frontmatter, "contentPlatform"),
        "explicit_intent": explicit_intent,
    }

def append_block(frontmatter: str, addition: str) -> str:
    return frontmatter.rstrip() + "\n\n" + addition.strip() + "\n"

def insert_nested_line(frontmatter: str, parent: str, line: str) -> str:
    lines = frontmatter.splitlines()
    prefix = f"{parent}:"

    for index, current in enumerate(lines):
        if current.startswith(prefix):
            lines.insert(index + 1, f"  {line}")
            return "\n".join(lines)

    return frontmatter

def migrate(frontmatter: str, info: dict):
    changes = []
    result = frontmatter

    if not info["has_content_platform"] and info["cluster"]:
        result = append_block(
            result,
            "contentPlatform:\n"
            "  intent: buying-guide\n"
            f"  cluster: {info['cluster']}"
        )
        changes.append("contentPlatform ergänzt")
    elif info["has_content_platform"] and not has_nested(
        result, "contentPlatform", "intent"
    ):
        result = insert_nested_line(
            result, "contentPlatform", "intent: buying-guide"
        )
        changes.append("contentPlatform.intent ergänzt")

    can_add_journey = (
        not info["has_recommendation_journey"] and
        info["comparison_href"] and
        info["confidence"] in {"high", "medium"}
    )

    if can_add_journey:
        lines = [
            "recommendationJourney:",
            "  mode: filtered",
        ]
        if info["animal"]:
            lines.append(f"  animal: {info['animal']}")
        if info["pet_size"]:
            lines.append(f"  petSize: {info['pet_size']}")
        lines.extend([
            f"  comparisonHref: {info['comparison_href']}",
            "  comparisonLabel: Passende Modelle vergleichen",
        ])
        result = append_block(result, "\n".join(lines))
        changes.append("recommendationJourney ergänzt")

    return result, changes

root = find_root(Path.cwd().resolve())
pages_dir = root / PAGES

if not pages_dir.is_dir():
    stop(f"Seitenverzeichnis fehlt: {PAGES}")

files = sorted(pages_dir.glob("*.md"))
if not files:
    stop("Keine Markdown-Seiten gefunden.")

stamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".money-page-metadata-migrator-4.4.1-backup-{stamp}"

report = {
    "generatedAt": datetime.now().isoformat(timespec="seconds"),
    "scanned": len(files),
    "candidates": 0,
    "migrated": 0,
    "unchanged": 0,
    "manualReview": 0,
    "items": [],
}

originals = {}
updates = {}

for number, path in enumerate(files, start=1):
    if number % 25 == 0:
        print(f"Analysiert: {number}/{len(files)}")

    text = path.read_text(encoding="utf-8")
    parsed = split_frontmatter(text)
    if not parsed:
        continue

    frontmatter, body = parsed
    slug = scalar(frontmatter, "slug") or path.stem
    title = scalar(frontmatter, "title") or ""
    description = scalar(frontmatter, "description") or ""

    info = classify(slug, title, description, frontmatter)
    if not info.get("is_candidate"):
        continue

    report["candidates"] += 1
    new_frontmatter, changes = migrate(frontmatter, info)
    status = "unchanged"

    if info["confidence"] == "manual":
        report["manualReview"] += 1
        status = "manual-review"
    elif changes:
        status = "migrated"
        report["migrated"] += 1
        originals[path] = text
        updates[path] = "---\n" + new_frontmatter.rstrip() + "\n---\n" + body
    else:
        report["unchanged"] += 1

    report["items"].append({
        "file": str(path.relative_to(root)),
        "slug": slug,
        "title": title,
        "status": status,
        "confidence": info["confidence"],
        "cluster": info.get("cluster"),
        "animal": info.get("animal"),
        "petSize": info.get("pet_size"),
        "comparisonHref": info.get("comparison_href"),
        "changes": changes,
        "warnings": info.get("warnings", []),
    })

backup.mkdir(parents=True, exist_ok=False)

for path, content in originals.items():
    destination = backup / path.relative_to(root)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_text(content, encoding="utf-8")

report_dir = root / REPORT_DIR
report_dir.mkdir(parents=True, exist_ok=True)

report_json = root / REPORT_JSON
report_md = root / REPORT_MD

old_report_json = (
    report_json.read_text(encoding="utf-8")
    if report_json.exists()
    else None
)
old_report_md = (
    report_md.read_text(encoding="utf-8")
    if report_md.exists()
    else None
)

report_lines = [
    "# Money-Page-Metadaten-Audit",
    "",
    f"- Geprüfte Seiten: {report['scanned']}",
    f"- Kaufnahe Kandidaten: {report['candidates']}",
    f"- Automatisch migriert: {report['migrated']}",
    f"- Unverändert: {report['unchanged']}",
    f"- Manuelle Prüfung: {report['manualReview']}",
    "",
    "## Seiten",
    "",
]

for item in report["items"]:
    report_lines.extend([
        f"### `{item['slug']}`",
        f"- Status: **{item['status']}**",
        f"- Datei: `{item['file']}`",
        f"- Cluster: `{item['cluster'] or 'nicht erkannt'}`",
        f"- Tier: `{item['animal'] or 'nicht eindeutig'}`",
        f"- Tiergröße: `{item['petSize'] or 'nicht relevant/erkannt'}`",
        f"- Vergleich: `{item['comparisonHref'] or 'nicht sicher ableitbar'}`",
    ])
    if item["changes"]:
        report_lines.append("- Änderungen: " + ", ".join(item["changes"]))
    if item["warnings"]:
        report_lines.append("- Hinweise: " + " ".join(item["warnings"]))
    report_lines.append("")

try:
    for path, content in updates.items():
        path.write_text(content, encoding="utf-8")

    report_json.write_text(
        json.dumps(report, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )
    report_md.write_text(
        "\n".join(report_lines).rstrip() + "\n",
        encoding="utf-8"
    )

    run(["npm", "run", "build:pfotentechnik"], root)

    package = (root / APP / "package.json").read_text(encoding="utf-8")
    if '"audit:recommendations"' in package:
        run(
            ["npm", "--workspace", "apps/pfotentechnik", "run", "audit:recommendations"],
            root
        )
except Exception as exc:
    print(f"Validierung fehlgeschlagen: {exc}", file=sys.stderr)
    print("Automatischer Rollback wird ausgeführt.", file=sys.stderr)

    for path, content in originals.items():
        path.write_text(content, encoding="utf-8")

    if old_report_json is None and report_json.exists():
        report_json.unlink()
    elif old_report_json is not None:
        report_json.write_text(old_report_json, encoding="utf-8")

    if old_report_md is None and report_md.exists():
        report_md.unlink()
    elif old_report_md is not None:
        report_md.write_text(old_report_md, encoding="utf-8")

    raise SystemExit(1)

print("Money Page Metadata Migrator 4.4.1 erfolgreich abgeschlossen.")
print(f"Automatisch migriert: {report['migrated']}")
print(f"Manuelle Prüfung: {report['manualReview']}")
print(f"Bericht: {REPORT_MD}")
print(f"Backup: {backup}")

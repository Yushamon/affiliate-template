#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import json
import re
import shutil
import sys

APP = Path("apps/pfotentechnik")
PRODUCT_DIR = APP / "src/content/products"
PRODUCT_SCHEMA = APP / "src/content/schema/product.ts"
REPORT_MD = APP / "reports/product-animal-size-audit.md"
REPORT_JSON = APP / "reports/product-animal-size-audit.json"
AUDIT_SCRIPT = APP / "scripts/audit-product-suitability.mjs"

ANIMALS = ("dog", "cat")
SIZES = ("small", "medium", "large")

def fail(message):
    print(f"FEHLER: {message}", file=sys.stderr)
    raise SystemExit(1)

def find_root(start):
    for candidate in [start, *start.parents]:
        if (candidate / APP).is_dir() and (candidate / "package.json").exists():
            return candidate
    fail("Repository-Root nicht gefunden.")

def backup(root, backup_root, relative):
    src = root / relative
    if not src.exists():
        return
    dst = backup_root / relative
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)

def parse_frontmatter(text):
    match = re.match(r"^---\s*\n(?P<fm>.*?)\n---\s*\n", text, re.S)
    if not match:
        return None, None, None
    return match.group("fm"), match.start("fm"), match.end("fm")

def scalar(fm, key):
    match = re.search(rf'(?m)^{re.escape(key)}:\s*(?:"([^"]*)"|\'([^\']*)\'|(.+?))\s*$', fm)
    if not match:
        return ""
    return next((g for g in match.groups() if g is not None), "").strip()

def category_key(fm):
    block = re.search(r"(?ms)^category:\n(?P<body>(?:  .*\n)+)", fm)
    if not block:
        return ""
    match = re.search(r'(?m)^  key:\s*"?([^"\n]+)"?\s*$', block.group("body"))
    return match.group(1).strip() if match else ""

def gps_animals(fm):
    block = re.search(r"(?ms)^gps:\n(?P<body>(?:  .*\n)+)", fm)
    if not block:
        return []
    match = re.search(r"(?m)^  animal:\s*\[(.*?)\]\s*$", block.group("body"))
    if not match:
        return []
    return [v.strip().strip('"\'') for v in match.group(1).split(",") if v.strip().strip('"\'') in ANIMALS]

def comparison_array(fm, key):
    block = re.search(r"(?ms)^comparisonFilters:\n(?P<body>(?:  .*\n)*)", fm)
    if not block:
        return []
    match = re.search(rf"(?m)^  {re.escape(key)}:\s*\[(.*?)\]\s*$", block.group("body"))
    if not match:
        return []
    return [v.strip().strip('"\'') for v in match.group(1).split(",") if v.strip()]

def suitability_specs(fm):
    specs = []
    for label in ("Geeignet für", "Tier", "Tierart", "Zielgruppe", "Eignung"):
        pattern = rf'(?ms)-\s+label:\s*["\']?{re.escape(label)}["\']?\s*\n\s+value:\s*(?:"([^"]+)"|\'([^\']+)\'|([^\n]+))'
        for match in re.finditer(pattern, fm, re.I):
            specs.append(next(g for g in match.groups() if g is not None).strip())
    return specs

def infer_animals(text, specs, gps_values):
    scores = {"dog": 0, "cat": 0}
    evidence = []

    for value in gps_values:
        scores[value] += 10
        evidence.append(f"gps.animal={value}")

    explicit = " ".join(specs).lower()
    signals = {
        "dog": [r"\bhund(?:e|en|es)?\b", r"\bdogs?\b", r"\bwelpe(?:n)?\b"],
        "cat": [r"\bkatze(?:n)?\b", r"\bcats?\b", r"\bkätzchen\b", r"\bkitten\b"],
    }
    for animal, patterns in signals.items():
        for pattern in patterns:
            if re.search(pattern, explicit, re.I):
                scores[animal] += 8
                evidence.append(f"explizite Spezifikation:{animal}")
                break
            if re.search(pattern, text, re.I):
                scores[animal] += 3
                evidence.append(f"Textsignal:{animal}")
                break

    result = [animal for animal in ANIMALS if scores[animal] >= 3]
    confidence = "high" if any(v >= 8 for v in scores.values()) else "medium" if result else "low"
    return result, confidence, evidence

def infer_sizes(text, specs, animals):
    scores = {"small": 0, "medium": 0, "large": 0}
    evidence = []
    explicit = " ".join(specs).lower()
    source = explicit if explicit else text

    patterns = {
        "small": [r"\bklein(?:e|er|en|es)?\b", r"\bsmall\b", r"\bwelpe(?:n)?\b", r"\bkitten\b"],
        "medium": [r"\bmittelgroß(?:e|er|en|es)?\b", r"\bmittelgross", r"\bmedium\b"],
        "large": [r"\bgroß(?:e|er|en|es)?\b", r"\bgross(?:e|er|en|es)?\b", r"\blarge\b"],
    }
    for size, pats in patterns.items():
        for pattern in pats:
            if re.search(pattern, source, re.I):
                scores[size] += 8 if explicit else 3
                evidence.append(f"Größensignal:{size}")
                break

    if re.search(r"alle(?:n|r)?\s+(?:größen|groessen)|all\s+sizes", source, re.I):
        scores = {size: 10 for size in SIZES}
        evidence.append("alle Größen")

    if re.search(r"mittelgroß|mittelgross", source, re.I) and not re.search(r"große\s+hunde|large\s+dogs", source, re.I):
        scores["large"] = 0

    if re.search(r"(?:bis|max(?:imal)?)\s*(?:zu\s*)?40\s*cm", source, re.I):
        scores["small"] = max(scores["small"], 8)
        scores["medium"] = max(scores["medium"], 8)
        scores["large"] = 0
        evidence.append("Größenlimit bis 40 cm")

    result = [size for size in SIZES if scores[size] >= 3]

    if not result and "cat" in animals and re.search(r"\bkatze(?:n)?\b|\bcats?\b", explicit, re.I):
        if not re.search(r"\bklein|\bkitten|\bkätzchen", explicit, re.I):
            result = list(SIZES)
            evidence.append("generische Katzenfreigabe")

    confidence = "high" if any(v >= 8 for v in scores.values()) else "medium" if result else "low"
    return result, confidence, evidence

def ensure_filters(fm):
    if re.search(r"(?m)^comparisonFilters:", fm):
        return fm
    return fm.rstrip() + "\ncomparisonFilters:\n"

def upsert_array(fm, key, values):
    fm = ensure_filters(fm)
    block = re.search(r"(?ms)^comparisonFilters:\n(?P<body>(?:  .*\n)*)", fm)
    rendered = "[" + ", ".join(f'"{v}"' for v in values) + "]"
    line = f"  {key}: {rendered}"
    body = block.group("body")
    existing = re.search(rf"(?m)^  {re.escape(key)}:.*$", body)
    if existing:
        a = block.start("body") + existing.start()
        b = block.start("body") + existing.end()
        return fm[:a] + line + fm[b:]
    pos = block.start("body")
    return fm[:pos] + line + "\n" + fm[pos:]

def upsert_scalar(fm, key, value):
    fm = ensure_filters(fm)
    block = re.search(r"(?ms)^comparisonFilters:\n(?P<body>(?:  .*\n)*)", fm)
    line = f"  {key}: {json.dumps(value, ensure_ascii=False)}"
    body = block.group("body")
    existing = re.search(rf"(?m)^  {re.escape(key)}:.*$", body)
    if existing:
        a = block.start("body") + existing.start()
        b = block.start("body") + existing.end()
        return fm[:a] + line + fm[b:]
    pos = block.start("body")
    return fm[:pos] + line + "\n" + fm[pos:]

root = find_root(Path.cwd().resolve())
backup_root = root / (".product-animal-size-migration-3.0-backup-" + datetime.now().strftime("%Y-%m-%dT%H-%M-%S"))
changed = []
results = []

files = sorted((root / PRODUCT_DIR).glob("*.md")) + sorted((root / PRODUCT_DIR).glob("*.mdx"))
if not files:
    fail("Keine Produktdateien gefunden.")

for path in files:
    relative = path.relative_to(root)
    original = path.read_text(encoding="utf-8")
    fm, start, end = parse_frontmatter(original)
    if fm is None:
        results.append({"file": str(relative), "status": "error", "reason": "Frontmatter fehlt"})
        continue

    body = original[end + 5:] if end is not None else ""
    specs = suitability_specs(fm)
    explicit_text = " ".join([scalar(fm, "title"), scalar(fm, "recommendation"), scalar(fm, "useCase"), " ".join(specs) * 3, fm, body[:8000]]).lower()

    existing_animals = comparison_array(fm, "animal")
    existing_sizes = comparison_array(fm, "petSize")
    inferred_animals, animal_conf, animal_evidence = infer_animals(explicit_text, specs, gps_animals(fm))
    inferred_sizes, size_conf, size_evidence = infer_sizes(explicit_text, specs, inferred_animals or existing_animals)

    animals = existing_animals or inferred_animals
    sizes = existing_sizes or inferred_sizes
    new_fm = fm

    if not existing_animals and animals:
        new_fm = upsert_array(new_fm, "animal", animals)
    if not existing_sizes and sizes:
        new_fm = upsert_array(new_fm, "petSize", sizes)

    status = "complete" if animals and sizes else "needs-review"
    source = "manual-existing" if existing_animals and existing_sizes else "migration-inferred"
    confidence = "high" if animal_conf == "high" and size_conf == "high" else "medium" if animals and sizes else "low"

    new_fm = upsert_scalar(new_fm, "suitabilityStatus", status)
    new_fm = upsert_scalar(new_fm, "suitabilitySource", source)
    new_fm = upsert_scalar(new_fm, "suitabilityConfidence", confidence)

    updated = original[:start] + new_fm + original[end:]
    if updated != original:
        backup(root, backup_root, relative)
        path.write_text(updated, encoding="utf-8")
        changed.append(str(relative))

    results.append({
        "file": str(relative),
        "slug": path.stem,
        "category": category_key(fm),
        "animal": animals,
        "petSize": sizes,
        "status": status,
        "confidence": confidence,
        "evidence": sorted(set(animal_evidence + size_evidence)),
        "existingAnimalPreserved": bool(existing_animals),
        "existingPetSizePreserved": bool(existing_sizes),
    })

schema_path = root / PRODUCT_SCHEMA
schema_original = schema_path.read_text(encoding="utf-8")
schema = schema_original

if "suitabilityStatus:" not in schema:
    anchor = "    foodType: z\n      .array(\n"
    addition = (
        '    suitabilityStatus: z.enum(["complete", "needs-review"]).default("needs-review"),\n'
        '    suitabilitySource: z.enum(["manual-existing", "migration-inferred", "manufacturer", "editorial"]).default("migration-inferred"),\n'
        '    suitabilityConfidence: z.enum(["high", "medium", "low"]).default("low"),\n\n'
    )
    if anchor not in schema:
        fail("Einfügepunkt im Produktschema nicht gefunden.")
    schema = schema.replace(anchor, addition + anchor, 1)

if schema != schema_original:
    backup(root, backup_root, PRODUCT_SCHEMA)
    schema_path.write_text(schema, encoding="utf-8")
    changed.append(str(PRODUCT_SCHEMA))

summary = {
    "total": len(results),
    "complete": sum(r.get("status") == "complete" for r in results),
    "needsReview": sum(r.get("status") == "needs-review" for r in results),
    "withAnimal": sum(bool(r.get("animal")) for r in results),
    "withPetSize": sum(bool(r.get("petSize")) for r in results),
}

for rel in (REPORT_MD, REPORT_JSON):
    backup(root, backup_root, rel)

json_path = root / REPORT_JSON
json_path.parent.mkdir(parents=True, exist_ok=True)
json_path.write_text(json.dumps({"summary": summary, "products": results}, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")

md = [
    "# Produkt-Audit: Tier und Tiergröße",
    "",
    f"- Produkte insgesamt: {summary['total']}",
    f"- vollständig: {summary['complete']}",
    f"- Review erforderlich: {summary['needsReview']}",
    f"- mit Tierdaten: {summary['withAnimal']}",
    f"- mit Größendaten: {summary['withPetSize']}",
    "",
    "## Review erforderlich",
    "",
    "| Produkt | Kategorie | Tier | Größe | Evidenz |",
    "|---|---|---|---|---|",
]
for item in results:
    if item.get("status") != "needs-review":
        continue
    md.append(f"| {item.get('slug', item['file'])} | {item.get('category','')} | {', '.join(item.get('animal',[])) or 'offen'} | {', '.join(item.get('petSize',[])) or 'offen'} | {'; '.join(item.get('evidence',[])) or 'keine belastbare Angabe'} |")

(root / REPORT_MD).write_text("\n".join(md) + "\n", encoding="utf-8")
changed.extend([str(REPORT_MD), str(REPORT_JSON)])

audit_code = '''import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";

const root = process.cwd();
const dir = path.join(root, "src/content/products");
const files = fs.readdirSync(dir).filter((name) => name.endsWith(".md") || name.endsWith(".mdx"));

const incomplete = [];
for (const file of files) {
  const source = fs.readFileSync(path.join(dir, file), "utf8");
  const { data } = matter(source);
  const filters = data.comparisonFilters ?? {};
  const animal = Array.isArray(filters.animal) ? filters.animal : [];
  const petSize = Array.isArray(filters.petSize) ? filters.petSize : [];
  if (animal.length === 0 || petSize.length === 0) {
    incomplete.push({ file, animal, petSize });
  }
}

console.log(`Produkte: ${files.length}`);
console.log(`Vollständig: ${files.length - incomplete.length}`);
console.log(`Review erforderlich: ${incomplete.length}`);

for (const item of incomplete) {
  console.log(`- ${item.file}: Tier=${item.animal.join(",") || "offen"}; Größe=${item.petSize.join(",") || "offen"}`);
}

if (incomplete.length > 0) process.exitCode = 2;
'''
audit_path = root / AUDIT_SCRIPT
backup(root, backup_root, AUDIT_SCRIPT)
audit_path.parent.mkdir(parents=True, exist_ok=True)
audit_path.write_text(audit_code, encoding="utf-8")
changed.append(str(AUDIT_SCRIPT))

package_rel = APP / "package.json"
package_path = root / package_rel
package_original = package_path.read_text(encoding="utf-8")
package = json.loads(package_original)
package.setdefault("scripts", {}).setdefault("audit:suitability", "node scripts/audit-product-suitability.mjs")
package_updated = json.dumps(package, ensure_ascii=False, indent=2) + "\n"
if package_updated != package_original:
    backup(root, backup_root, package_rel)
    package_path.write_text(package_updated, encoding="utf-8")
    changed.append(str(package_rel))

print("Produktmigration Tier und Größe 3.0 abgeschlossen.")
print("Backup:", backup_root)
print("Produkte geprüft:", summary["total"])
print("Vollständig:", summary["complete"])
print("Review erforderlich:", summary["needsReview"])
print("")
print("Jetzt ausführen:")
print("  npm run build:pfotentechnik")
print("  npm --workspace apps/pfotentechnik run audit:suitability")

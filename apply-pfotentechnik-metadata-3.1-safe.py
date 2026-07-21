#!/usr/bin/env python3
from __future__ import annotations

from pathlib import Path
from datetime import datetime
import json
import re
import shutil
import subprocess
import sys

APP = Path("apps/pfotentechnik")
PRODUCTS = APP / "src/content/products"
PACKAGE = APP / "package.json"
AUDIT = APP / "scripts/audit-product-suitability.mjs"

ANIMAL_VALUES = ("dog", "cat")
SIZE_VALUES = ("small", "medium", "large")

def die(message: str) -> None:
    print(f"FEHLER: {message}", file=sys.stderr)
    raise SystemExit(1)

def find_repo_root(start: Path) -> Path:
    for candidate in (start, *start.parents):
        if (candidate / PRODUCTS).is_dir() and (candidate / PACKAGE).is_file():
            return candidate
    die("Repository-Root nicht gefunden.")

def split_frontmatter(text: str):
    match = re.match(r"^---[ \t]*\r?\n(.*?)\r?\n---[ \t]*(?:\r?\n|$)", text, re.S)
    if not match:
        return None
    return match.group(1), match.end()

def top_key(line: str):
    match = re.match(r"^([A-Za-z][A-Za-z0-9_-]*)\s*:", line)
    return match.group(1) if match else None

def child_key(line: str):
    match = re.match(r"^  ([A-Za-z][A-Za-z0-9_-]*)\s*:", line)
    return match.group(1) if match else None

def parse_inline_array(raw: str) -> list[str] | None:
    raw = raw.strip()
    if not (raw.startswith("[") and raw.endswith("]")):
        return None
    values = []
    for item in raw[1:-1].split(","):
        item = item.strip().strip("\"'")
        if item:
            values.append(item)
    return values

def inline_array(values: list[str]) -> str:
    return "[" + ", ".join(json.dumps(value, ensure_ascii=False) for value in values) + "]"

def normalized_search_text(frontmatter: str) -> str:
    text = frontmatter.lower()
    return (
        text.replace("ä", "ae")
            .replace("ö", "oe")
            .replace("ü", "ue")
            .replace("ß", "ss")
    )

def infer_animal(frontmatter: str) -> list[str]:
    text = normalized_search_text(frontmatter)
    found: list[str] = []

    cat_patterns = (
        r"\bkatze\b", r"\bkatzen\b", r"\bcat\b", r"\bcats\b",
        r'["\']cat["\']', r"\bkatzenhaushalt\b"
    )
    dog_patterns = (
        r"\bhund\b", r"\bhunde\b", r"\bdog\b", r"\bdogs\b",
        r'["\']dog["\']', r"\bhundehaushalt\b"
    )

    if any(re.search(pattern, text) for pattern in dog_patterns):
        found.append("dog")
    if any(re.search(pattern, text) for pattern in cat_patterns):
        found.append("cat")
    return found

def infer_sizes(frontmatter: str) -> list[str]:
    text = normalized_search_text(frontmatter)
    found: list[str] = []

    explicit_small = (
        r"\bkleine[rnms]? hund", r"\bkleine[rnms]? katz",
        r"\bkleintier", r"\bsmall[- ](?:dog|cat|pet)",
        r"\bkleiner-hund\b", r"\bkleine-katze\b"
    )
    explicit_medium = (
        r"\bmittelgrosse[rnms]? hund", r"\bmittelgrosse[rnms]? katz",
        r"\bmedium[- ](?:dog|cat|pet)", r"\bmittelgrosser-hund\b"
    )
    explicit_large = (
        r"\bgrosse[rnms]? hund", r"\bgrosse[rnms]? katz",
        r"\blarge[- ](?:dog|cat|pet)", r"\bgrosser-hund\b"
    )

    if any(re.search(pattern, text) for pattern in explicit_small):
        found.append("small")
    if any(re.search(pattern, text) for pattern in explicit_medium):
        found.append("medium")
    if any(re.search(pattern, text) for pattern in explicit_large):
        found.append("large")

    # Eine explizite Spanne "kleine und mittelgroße Hunde" soll beide Werte setzen.
    if re.search(r"kleine.{0,20}mittelgrosse.{0,20}hund", text):
        found = list(dict.fromkeys([*found, "small", "medium"]))

    return [size for size in SIZE_VALUES if size in found]

def locate_comparison_block(lines: list[str]):
    indexes = [i for i, line in enumerate(lines) if top_key(line) == "comparisonFilters"]
    if len(indexes) > 1:
        raise ValueError("mehrere comparisonFilters-Blöcke")
    if not indexes:
        return None

    start = indexes[0]
    end = start + 1
    while end < len(lines):
        line = lines[end]
        if line.strip() == "":
            end += 1
            continue
        if not line.startswith((" ", "\t")):
            break
        end += 1
    return start, end

def update_product(text: str):
    split = split_frontmatter(text)
    if not split:
        raise ValueError("kein gültiges Frontmatter")
    frontmatter, body_start = split
    lines = frontmatter.splitlines()

    # Frühere fehlerhafte Top-Level-Metadaten werden bewusst nicht toleriert.
    forbidden = {
        "animal", "petSize", "suitabilityConfidence",
        "suitabilityReviewRequired"
    }
    bad = [top_key(line) for line in lines if top_key(line) in forbidden]
    if bad:
        raise ValueError(f"unerwartete Top-Level-Felder: {', '.join(sorted(set(bad)))}")

    block = locate_comparison_block(lines)
    inferred_animal = infer_animal(frontmatter)
    inferred_sizes = infer_sizes(frontmatter)

    if block is None:
        # Ohne belastbare Tierzuordnung wird die Datei nicht verändert.
        if not inferred_animal:
            return text, False, "animal-unresolved"

        new_block = [
            "comparisonFilters:",
            f"  animal: {inline_array(inferred_animal)}",
            f"  petSize: {inline_array(inferred_sizes)}",
            "  foodType: []",
        ]

        # Stabiler Einfügepunkt direkt vor specs; sonst vor dem Frontmatter-Ende.
        insert_at = next(
            (i for i, line in enumerate(lines) if top_key(line) == "specs"),
            len(lines)
        )
        updated_lines = lines[:insert_at] + new_block + lines[insert_at:]
    else:
        start, end = block
        block_lines = lines[start:end]
        keys = [child_key(line) for line in block_lines[1:] if child_key(line)]
        duplicates = sorted({key for key in keys if keys.count(key) > 1})
        if duplicates:
            raise ValueError(
                "doppelte comparisonFilters-Felder: " + ", ".join(duplicates)
            )

        existing_animal = None
        existing_sizes = None
        updated_block = [block_lines[0]]

        for line in block_lines[1:]:
            key = child_key(line)
            if key == "animal":
                raw = line.split(":", 1)[1]
                existing_animal = parse_inline_array(raw)
                if existing_animal is None:
                    raise ValueError("animal ist keine Inline-Liste")
                values = existing_animal or inferred_animal
                values = [v for v in ANIMAL_VALUES if v in values]
                updated_block.append(f"  animal: {inline_array(values)}")
            elif key == "petSize":
                raw = line.split(":", 1)[1]
                existing_sizes = parse_inline_array(raw)
                if existing_sizes is None:
                    raise ValueError("petSize ist keine Inline-Liste")
                values = existing_sizes or inferred_sizes
                values = [v for v in SIZE_VALUES if v in values]
                updated_block.append(f"  petSize: {inline_array(values)}")
            else:
                updated_block.append(line)

        if existing_animal is None:
            updated_block.insert(
                1, f"  animal: {inline_array(inferred_animal)}"
            )
        if existing_sizes is None:
            animal_offset = 2
            updated_block.insert(
                animal_offset, f"  petSize: {inline_array(inferred_sizes)}"
            )

        updated_lines = lines[:start] + updated_block + lines[end:]

    new_frontmatter = "\n".join(updated_lines)
    new_text = "---\n" + new_frontmatter + "\n---\n" + text[body_start:]
    return new_text, new_text != text, None

AUDIT_SOURCE = r"""import fs from "node:fs";
import path from "node:path";

const productsDir = path.resolve("src/content/products");

function splitFrontmatter(source) {
  const match = source.match(/^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/);
  return match?.[1] ?? null;
}

function parseInlineArray(raw) {
  const value = raw.trim();
  if (!value.startsWith("[") || !value.endsWith("]")) return null;
  return value
    .slice(1, -1)
    .split(",")
    .map((item) => item.trim().replace(/^['"]|['"]$/g, ""))
    .filter(Boolean);
}

function inspect(frontmatter) {
  const lines = frontmatter.split(/\r?\n/);
  const topLevelForbidden = [];
  let comparisonStart = -1;
  let comparisonCount = 0;

  lines.forEach((line, index) => {
    const top = line.match(/^([A-Za-z][A-Za-z0-9_-]*)\s*:/)?.[1];
    if (["animal", "petSize", "suitabilityConfidence", "suitabilityReviewRequired"].includes(top)) {
      topLevelForbidden.push(top);
    }
    if (top === "comparisonFilters") {
      comparisonStart = index;
      comparisonCount += 1;
    }
  });

  const result = {
    animal: [],
    petSize: [],
    comparisonCount,
    topLevelForbidden,
    malformed: [],
  };

  if (comparisonStart < 0) return result;

  for (let i = comparisonStart + 1; i < lines.length; i += 1) {
    const line = lines[i];
    if (line.trim() && !/^[ \t]/.test(line)) break;

    const child = line.match(/^  ([A-Za-z][A-Za-z0-9_-]*)\s*:\s*(.*)$/);
    if (!child) continue;

    if (child[1] === "animal" || child[1] === "petSize") {
      const parsed = parseInlineArray(child[2]);
      if (parsed === null) result.malformed.push(child[1]);
      else result[child[1]] = parsed;
    }
  }

  return result;
}

const files = fs.readdirSync(productsDir)
  .filter((name) => name.endsWith(".md"))
  .sort();

const rows = [];
let hardErrors = 0;

for (const file of files) {
  const source = fs.readFileSync(path.join(productsDir, file), "utf8");
  const frontmatter = splitFrontmatter(source);

  if (!frontmatter) {
    rows.push({ file, error: "invalid-frontmatter" });
    hardErrors += 1;
    continue;
  }

  const result = inspect(frontmatter);
  const errors = [];

  if (result.comparisonCount > 1) errors.push("duplicate-comparisonFilters");
  if (result.topLevelForbidden.length) errors.push("forbidden-top-level-fields");
  if (result.malformed.length) errors.push("malformed-inline-arrays");
  if (!result.animal.length) errors.push("animal-missing");

  if (errors.length) hardErrors += 1;

  rows.push({
    file,
    animal: result.animal,
    petSize: result.petSize,
    errors,
    reviewRequired: result.petSize.length === 0,
  });
}

const summary = {
  generatedAt: new Date().toISOString(),
  totalProducts: rows.length,
  withAnimal: rows.filter((row) => row.animal?.length).length,
  withPetSize: rows.filter((row) => row.petSize?.length).length,
  reviewRequired: rows.filter((row) => row.reviewRequired).length,
  errors: hardErrors,
};

console.log("Product Suitability Audit");
console.log(JSON.stringify(summary, null, 2));

const reportDir = path.resolve("reports");
fs.mkdirSync(reportDir, { recursive: true });
fs.writeFileSync(
  path.join(reportDir, "product-suitability.json"),
  JSON.stringify({ summary, products: rows }, null, 2) + "\n",
  "utf8"
);

process.exitCode = hardErrors > 0 ? 1 : 0;
"""

def run(command: list[str], cwd: Path) -> None:
    print("\n$", " ".join(command))
    completed = subprocess.run(command, cwd=cwd)
    if completed.returncode != 0:
        raise RuntimeError("Befehl fehlgeschlagen: " + " ".join(command))

repo = find_repo_root(Path.cwd().resolve())
timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = repo / f".metadata-3.1-safe-backup-{timestamp}"

product_paths = sorted((repo / PRODUCTS).glob("*.md"))
if not product_paths:
    die("Keine Produktdateien gefunden.")

originals: dict[Path, bytes] = {}
changed: list[Path] = []
unresolved: list[str] = []
preflight_errors: list[str] = []

for path in product_paths:
    raw = path.read_bytes()
    originals[path] = raw
    try:
        updated, did_change, note = update_product(raw.decode("utf-8"))
    except Exception as exc:
        preflight_errors.append(f"{path.name}: {exc}")
        continue

    if note == "animal-unresolved":
        unresolved.append(path.name)
    if did_change:
        changed.append(path)

if preflight_errors:
    print("Preflight abgebrochen. Es wurde nichts verändert.", file=sys.stderr)
    for item in preflight_errors:
        print(" -", item, file=sys.stderr)
    raise SystemExit(1)

# Package und Audit ebenfalls sichern.
for path in (repo / PACKAGE, repo / AUDIT):
    if path.exists():
        originals[path] = path.read_bytes()

backup.mkdir(parents=True, exist_ok=False)
for path, data in originals.items():
    destination = backup / path.relative_to(repo)
    destination.parent.mkdir(parents=True, exist_ok=True)
    destination.write_bytes(data)

try:
    for path in changed:
        updated, _, _ = update_product(originals[path].decode("utf-8"))
        path.write_text(updated, encoding="utf-8")

    audit_path = repo / AUDIT
    audit_path.parent.mkdir(parents=True, exist_ok=True)
    audit_path.write_text(AUDIT_SOURCE, encoding="utf-8")

    package_path = repo / PACKAGE
    package = json.loads(package_path.read_text(encoding="utf-8"))
    scripts = package.setdefault("scripts", {})
    scripts["audit:suitability"] = "node scripts/audit-product-suitability.mjs"
    package_path.write_text(
        json.dumps(package, ensure_ascii=False, indent=2) + "\n",
        encoding="utf-8"
    )

    # Entscheidend: Erst Astro validiert das echte Collection-Schema.
    run(["npm", "run", "build:pfotentechnik"], repo)
    run(
        ["npm", "--workspace", "apps/pfotentechnik", "run", "audit:suitability"],
        repo
    )

except Exception as exc:
    print(f"\nValidierung fehlgeschlagen: {exc}", file=sys.stderr)
    print("Alle Änderungen werden automatisch zurückgerollt.", file=sys.stderr)

    for path, data in originals.items():
        path.parent.mkdir(parents=True, exist_ok=True)
        path.write_bytes(data)

    # Neu angelegte Auditdatei entfernen, wenn es vorher keine gab.
    audit_path = repo / AUDIT
    if audit_path not in originals and audit_path.exists():
        audit_path.unlink()

    raise SystemExit(1)

print("\nMetadata 3.1 Safe erfolgreich installiert.")
print(f"Geänderte Produktdateien: {len(changed)}")
print(f"Produkte ohne belastbare Größenangabe: {len(unresolved)}")
print(f"Backup: {backup}")
print("Build und Suitability-Audit waren erfolgreich.")

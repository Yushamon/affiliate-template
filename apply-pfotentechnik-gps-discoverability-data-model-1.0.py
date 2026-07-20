#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import json
import re
import shutil
import sys

APP = Path("apps/pfotentechnik")
CONFIG = APP / "src/project.config.ts"
SCHEMA = APP / "src/content/schema/product.ts"
VIEWMODEL = APP / "src/domain/comparison/buildComparisonViewModel.ts"
PACKAGE = APP / "package.json"
AUDIT_SCRIPT = APP / "scripts/audit-gps-cluster.mjs"
PRODUCT_DIR = APP / "src/content/products"

GPS_PRODUCTS = {
    "tractive-dog-6": {
        "animal": ["dog"], "minimumPetWeightKg": 4, "deviceWeightGrams": 39,
        "weightBasis": "device", "subscriptionRequired": True, "includedServiceMonths": 0,
        "transmission": "lte", "batteryMaxDays": 14, "batteryCondition": "mit Energiesparzonen",
        "waterproofRating": "IP68", "liveTracking": True, "virtualFence": True,
        "activityTracking": True, "attachmentType": "clip"
    },
    "tractive-dog-6-xl": {
        "animal": ["dog"], "minimumPetWeightKg": 20, "deviceWeightGrams": 90,
        "weightBasis": "device", "subscriptionRequired": True, "includedServiceMonths": 0,
        "transmission": "lte", "batteryMaxDays": 42, "batteryCondition": "mit Energiesparzonen",
        "waterproofRating": "IP68", "liveTracking": True, "virtualFence": True,
        "activityTracking": True, "attachmentType": "clip"
    },
    "tractive-cat-6-mini": {
        "animal": ["cat"], "minimumPetWeightKg": 3, "maximumPetWeightKg": 8,
        "deviceWeightGrams": 31, "weightBasis": "including-collar",
        "subscriptionRequired": True, "includedServiceMonths": 0,
        "transmission": "lte", "batteryMaxDays": 7, "batteryCondition": "je nach Nutzung und Energiesparzone",
        "waterproofRating": "IP68", "liveTracking": True, "virtualFence": True,
        "activityTracking": True, "attachmentType": "safety-collar"
    },
    "weenect-xs": {
        "animal": ["dog", "cat"], "minimumPetWeightKg": 3, "deviceWeightGrams": 27,
        "weightBasis": "device", "subscriptionRequired": True, "includedServiceMonths": 0,
        "transmission": "lte", "batteryMaxDays": 10, "batteryCondition": "Hersteller-Maximalwert",
        "waterproofRating": "IP68", "liveTracking": True, "virtualFence": True,
        "activityTracking": True, "attachmentType": "collar-attachment"
    },
    "weenect-xt": {
        "animal": ["dog"], "deviceWeightGrams": 54, "weightBasis": "device",
        "subscriptionRequired": True, "includedServiceMonths": 0,
        "transmission": "lte", "batteryMaxDays": 21, "batteryCondition": "Hersteller-Maximalwert",
        "waterproofRating": "IP68", "liveTracking": True, "virtualFence": True,
        "activityTracking": True, "attachmentType": "collar-attachment"
    },
    "paj-pet-finder-4g-mini": {
        "animal": ["dog", "cat"], "minimumPetWeightKg": 3, "deviceWeightGrams": 48,
        "weightBasis": "device", "subscriptionRequired": True, "includedServiceMonths": 27,
        "transmission": "lte", "batteryMaxDays": 10, "batteryCondition": "Hersteller-Maximalwert",
        "waterproofRating": "IP67", "liveTracking": True, "virtualFence": True,
        "activityTracking": False, "attachmentType": "collar-attachment"
    },
    "garmin-alpha-t-20": {
        "animal": ["dog"], "deviceWeightGrams": 247, "weightBasis": "device",
        "subscriptionRequired": False, "includedServiceMonths": 0,
        "transmission": "vhf", "batteryMaxDays": 3, "batteryCondition": "abhängig vom Aktualisierungsintervall",
        "waterproofRating": "1 ATM", "liveTracking": True, "virtualFence": False,
        "activityTracking": False, "attachmentType": "collar"
    },
    "garmin-alpha-tt-25": {
        "animal": ["dog"], "deviceWeightGrams": 253, "weightBasis": "device",
        "subscriptionRequired": False, "includedServiceMonths": 0,
        "transmission": "vhf", "batteryMaxDays": 3, "batteryCondition": "abhängig vom Aktualisierungsintervall",
        "waterproofRating": "1 ATM", "liveTracking": True, "virtualFence": False,
        "activityTracking": False, "attachmentType": "collar"
    }
}

def fail(message):
    print(f"FEHLER: {message}", file=sys.stderr)
    raise SystemExit(1)

def find_root(start):
    for candidate in [start, *start.parents]:
        if (candidate / APP).is_dir() and (candidate / "package.json").exists():
            return candidate
    fail("Repository-Root nicht gefunden.")

def backup_file(root, backup_root, relative):
    src = root / relative
    dst = backup_root / relative
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)

def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1:
        fail(f"{label}: erwartete Stelle {count}× gefunden.")
    return text.replace(old, new, 1)

def yaml_value(value):
    if isinstance(value, bool):
        return "true" if value else "false"
    if isinstance(value, (int, float)):
        return str(value)
    if isinstance(value, list):
        return "[" + ", ".join(f'"{v}"' for v in value) + "]"
    return json.dumps(value, ensure_ascii=False)

root = find_root(Path.cwd().resolve())
timestamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup_root = root / f".gps-discoverability-data-model-1.0-backup-{timestamp}"
changed = []

config_path = root / CONFIG
config = config_path.read_text(encoding="utf-8")
original_config = config

if '{ label: "GPS-Tracker", href: "/gps-tracker/" }' not in config:
    config = replace_once(
        config,
        '    { label: "Trinkbrunnen", href: "/trinkbrunnen/" },\n    { label: "Vergleiche", href: "/vergleiche/" },',
        '    { label: "Trinkbrunnen", href: "/trinkbrunnen/" },\n    { label: "GPS-Tracker", href: "/gps-tracker/" },\n    { label: "Vergleiche", href: "/vergleiche/" },',
        "Hauptnavigation"
    )

config = config.replace(
    '          href: "/#produkte",\n          productCategory: "gps-tracker"',
    '          href: "/gps-tracker/",\n          productCategory: "gps-tracker"'
)

if 'Hunde · GPS-Tracker' not in config:
    config = replace_once(
        config,
        '        { label: "Hunde · Trinkbrunnen", href: "/trinkbrunnen/#hunde" },\n        { label: "Nassfutter", href: "/futterautomat-nassfutter/" },',
        '        { label: "Hunde · Trinkbrunnen", href: "/trinkbrunnen/#hunde" },\n        { label: "Hunde · GPS-Tracker", href: "/vergleiche/beste-gps-tracker-fuer-hunde/" },\n        { label: "Katzen · GPS-Tracker", href: "/vergleiche/beste-gps-tracker-fuer-katzen/" },\n        { label: "Nassfutter", href: "/futterautomat-nassfutter/" },',
        "Homepage-Intents"
    )

if '          { label: "GPS-Tracker", href: "/gps-tracker/" },\n          { label: "Futterautomaten mit App"' not in config:
    config = replace_once(
        config,
        '          { label: "Trinkbrunnen", href: "/trinkbrunnen/" },\n          { label: "Futterautomaten mit App", href: "/futterautomat-mit-app/" },',
        '          { label: "Trinkbrunnen", href: "/trinkbrunnen/" },\n          { label: "GPS-Tracker", href: "/gps-tracker/" },\n          { label: "Futterautomaten mit App", href: "/futterautomat-mit-app/" },',
        "Footer"
    )

if config != original_config:
    backup_file(root, backup_root, CONFIG)
    config_path.write_text(config, encoding="utf-8")
    changed.append(str(CONFIG))

schema_path = root / SCHEMA
schema = schema_path.read_text(encoding="utf-8")
original_schema = schema

gps_schema = '''const productGpsSchema =
  z.object({
    animal: z.array(z.enum(["dog", "cat"])).min(1),
    minimumPetWeightKg: z.number().nonnegative().optional(),
    maximumPetWeightKg: z.number().positive().optional(),
    deviceWeightGrams: z.number().positive().optional(),
    totalWeightGrams: z.number().positive().optional(),
    weightBasis: z.enum(["device", "including-collar", "system"]).default("device"),
    subscriptionRequired: z.boolean(),
    includedServiceMonths: z.number().int().nonnegative().default(0),
    transmission: z.enum(["lte", "vhf", "bluetooth", "other"]),
    batteryMaxDays: z.number().positive().optional(),
    batteryCondition: z.string().optional(),
    waterproofRating: z.string().optional(),
    liveTracking: z.boolean().default(false),
    virtualFence: z.boolean().default(false),
    activityTracking: z.boolean().default(false),
    attachmentType: z.enum([
      "clip",
      "collar",
      "safety-collar",
      "collar-attachment",
      "harness",
      "other"
    ]).optional()
  })
  .optional();

'''

if "const productGpsSchema" not in schema:
    schema = replace_once(
        schema,
        "const productComparisonFiltersSchema =\n",
        gps_schema + "const productComparisonFiltersSchema =\n",
        "GPS-Schema"
    )

if "    gps: productGpsSchema," not in schema:
    schema = replace_once(
        schema,
        "    comparisonFilters:\n      productComparisonFiltersSchema\n",
        "    gps: productGpsSchema,\n\n    comparisonFilters:\n      productComparisonFiltersSchema\n",
        "GPS-Feld"
    )

if schema != original_schema:
    backup_file(root, backup_root, SCHEMA)
    schema_path.write_text(schema, encoding="utf-8")
    changed.append(str(SCHEMA))

for slug, data in GPS_PRODUCTS.items():
    rel = PRODUCT_DIR / f"{slug}.md"
    path = root / rel
    if not path.exists():
        fail(f"GPS-Produkt fehlt: {rel}")
    text = path.read_text(encoding="utf-8")
    if re.search(r"(?m)^gps:\s*$", text):
        continue

    insertion = "gps:\n" + "\n".join(
        f"  {key}: {yaml_value(value)}" for key, value in data.items()
    ) + "\n"

    marker = re.search(r"(?m)^comparisonFilters:", text)
    if marker:
        pos = marker.start()
    else:
        marker = re.search(r"(?m)^faq:", text)
        if not marker:
            fail(f"{slug}: kein Einfügepunkt gefunden.")
        pos = marker.start()

    backup_file(root, backup_root, rel)
    path.write_text(text[:pos] + insertion + text[pos:], encoding="utf-8")
    changed.append(str(rel))

vm_path = root / VIEWMODEL
vm = vm_path.read_text(encoding="utf-8")
original_vm = vm

gps_filter_code = '''  const gps = product.data.gps;

  if (gps) {
    gps.animal.forEach((animal) =>
      addValue(values, "tier", animal === "dog" ? "hund" : "katze")
    );
    addValue(
      values,
      "abo",
      gps.subscriptionRequired ? "mit-abo" : "ohne-abo"
    );
    addValue(
      values,
      "system",
      gps.transmission === "vhf" ? "vhf" : "mobilfunk"
    );

    const comparableWeight =
      gps.deviceWeightGrams ?? gps.totalWeightGrams;

    if (typeof comparableWeight === "number") {
      addValue(
        values,
        "gewicht",
        comparableWeight <= 35 ? "bis-35-g" : "ueber-35-g"
      );
    }
  }

'''

if "const gps = product.data.gps;" not in vm:
    vm = replace_once(
        vm,
        "  const foodTypes = source?.foodType ?? [];\n\n",
        "  const foodTypes = source?.foodType ?? [];\n\n" + gps_filter_code,
        "Strukturierte GPS-Filter"
    )

if vm != original_vm:
    backup_file(root, backup_root, VIEWMODEL)
    vm_path.write_text(vm, encoding="utf-8")
    changed.append(str(VIEWMODEL))

audit_path = root / AUDIT_SCRIPT
audit_content = '''import fs from "node:fs";
import path from "node:path";

const root = process.cwd();
const productDir = path.join(root, "src/content/products");
const comparisonDir = path.join(root, "src/content/comparisons");
const pageDir = path.join(root, "src/content/pages");

const requiredProducts = [
  "tractive-dog-6",
  "tractive-dog-6-xl",
  "tractive-cat-6-mini",
  "weenect-xs",
  "weenect-xt",
  "paj-pet-finder-4g-mini",
  "garmin-alpha-t-20",
  "garmin-alpha-tt-25"
];

const requiredComparisons = [
  "beste-gps-tracker-fuer-hunde",
  "beste-gps-tracker-fuer-katzen",
  "gps-tracker-ohne-abo",
  "gps-tracker-mit-langer-akkulaufzeit",
  "kleine-gps-tracker-fuer-katzen"
];

const errors = [];
const warnings = [];
const read = (file) => fs.readFileSync(file, "utf8");

for (const slug of requiredProducts) {
  const file = path.join(productDir, `${slug}.md`);
  if (!fs.existsSync(file)) {
    errors.push(`Produkt fehlt: ${slug}`);
    continue;
  }
  const text = read(file);
  for (const field of ["gps:", "animal:", "subscriptionRequired:", "transmission:", "weightBasis:"]) {
    if (!text.includes(field)) errors.push(`${slug}: GPS-Feld fehlt: ${field}`);
  }
  if (!text.includes('category: { key: "gps-tracker"')) {
    warnings.push(`${slug}: Kategorie ist nicht eindeutig gps-tracker`);
  }
}

for (const slug of requiredComparisons) {
  if (!fs.existsSync(path.join(comparisonDir, `${slug}.md`))) {
    errors.push(`Vergleich fehlt: ${slug}`);
  }
}

const hub = path.join(pageDir, "gps-tracker.md");
if (!fs.existsSync(hub)) {
  errors.push("GPS-Cornerstone fehlt");
} else {
  const text = read(hub);
  for (const slug of requiredComparisons) {
    if (!text.includes(`/vergleiche/${slug}/`)) {
      warnings.push(`Cornerstone verlinkt Vergleich nicht: ${slug}`);
    }
  }
}

console.log("# GPS-Cluster Audit");
console.log(`Produkte geprüft: ${requiredProducts.length}`);
console.log(`Vergleiche geprüft: ${requiredComparisons.length}`);
console.log(`Fehler: ${errors.length}`);
console.log(`Warnungen: ${warnings.length}`);
errors.forEach((entry) => console.log(`ERROR: ${entry}`));
warnings.forEach((entry) => console.log(`WARNING: ${entry}`));
if (errors.length > 0) process.exit(1);
'''

if not audit_path.exists() or audit_path.read_text(encoding="utf-8") != audit_content:
    if audit_path.exists():
        backup_file(root, backup_root, AUDIT_SCRIPT)
    audit_path.parent.mkdir(parents=True, exist_ok=True)
    audit_path.write_text(audit_content, encoding="utf-8")
    changed.append(str(AUDIT_SCRIPT))

package_path = root / PACKAGE
package = json.loads(package_path.read_text(encoding="utf-8"))
scripts = package.setdefault("scripts", {})
if scripts.get("audit:gps") != "node scripts/audit-gps-cluster.mjs":
    backup_file(root, backup_root, PACKAGE)
    scripts["audit:gps"] = "node scripts/audit-gps-cluster.mjs"
    package_path.write_text(json.dumps(package, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    changed.append(str(PACKAGE))

print("GPS Discoverability & Data Model 1.0 angewendet.")
print(f"Backup: {backup_root}")
print(f"Geänderte Dateien: {len(changed)}")
for file in changed:
    print(f"- {file}")
print("")
print("Jetzt ausführen:")
print("  npm --workspace apps/pfotentechnik run audit:gps")
print("  npm --workspace apps/pfotentechnik run audit:repository")
print("  npm run build:pfotentechnik")

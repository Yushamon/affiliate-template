#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import re, shutil, sys

APP = Path("apps/pfotentechnik")
PRODUCT_SCHEMA = APP / "src/content/schema/product.ts"
PAGE_ROUTE = APP / "src/pages/[slug].astro"
TARGET_PAGE = APP / "src/content/pages/futterautomat-fuer-grosse-hunde.md"
REPORT = APP / "reports/large-dog-feeder-review.md"

REVIEWED = {
    "petlibro-granary-wifi-feeder": dict(title="PETLIBRO Granary 5L", reservoirLiters=5, portionGrams=10, portionMl=20, maxPortionsPerMeal=50, maxMealGrams=500, maxMealMl=1000, kibbleMaxMm=15, manufacturerSizeClaim="small-medium"),
    "petlibro-granary-camera-feeder": dict(title="PETLIBRO Granary Camera", reservoirLiters=5, portionGrams=10, portionMl=20, maxPortionsPerMeal=50, maxMealGrams=500, maxMealMl=1000, kibbleMaxMm=15, manufacturerSizeClaim="small-medium"),
    "petkit-yumshare-solo": dict(title="PETKIT YumShare Solo", reservoirLiters=3, portionGrams=10, maxPortionsPerMeal=5, maxMealGrams=50, kibbleMaxMm=12, manufacturerSizeClaim="small"),
    "xiaomi-smart-pet-food-feeder-2": dict(title="Xiaomi Smart Pet Food Feeder 2", reservoirLiters=5, portionGrams=10, kibbleMaxMm=12, manufacturerSizeClaim="max-40cm"),
    "aqara-smart-pet-feeder-c1": dict(title="Aqara Smart Pet Feeder C1", reservoirLiters=4, portionGrams=10, kibbleMaxMm=12, manufacturerSizeClaim="small-medium"),
    "honeyguardian-smart-pet-feeder-s305d": dict(title="HoneyGuaridan", reservoirLiters=6, manufacturerSizeClaim="unknown"),
    "wopet-pioneer-f01-plus": dict(title="WOPET 7L", reservoirLiters=7, portionGrams=10, maxPortionsPerMeal=40, maxMealGrams=400, kibbleMaxMm=12, manufacturerSizeClaim="unknown"),
    "oneisall-5l-automatic-cat-feeder": dict(title="oneisall 5L", reservoirLiters=5, portionGrams=8, kibbleMaxMm=15, manufacturerSizeClaim="cats-small-pets"),
}
MISSING = ["Voluas 6L", "IMIPAW 6L", "Dogness Smart Feeder", "Arf Pets Automatic Feeder", "Balimo 7L", "Casfuy Smart Feeder"]

def fail(msg):
    print("FEHLER:", msg, file=sys.stderr)
    raise SystemExit(1)

def find_root(start):
    for c in [start, *start.parents]:
        if (c / APP).is_dir() and (c / "package.json").exists():
            return c
    fail("Repository-Root nicht gefunden.")

def backup(root, backup_root, rel):
    src, dst = root / rel, backup_root / rel
    dst.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(src, dst)

def replace_once(text, old, new, label):
    if text.count(old) != 1:
        fail(f"{label}: erwartete Stelle nicht eindeutig.")
    return text.replace(old, new, 1)

def ensure_filters(text):
    if re.search(r"(?m)^comparisonFilters:", text):
        return text
    m = re.search(r"(?m)^faq:", text)
    if not m:
        fail("Kein Einfügepunkt für comparisonFilters.")
    return text[:m.start()] + "comparisonFilters:\n" + text[m.start():]

def upsert(text, key, value, quote=False):
    text = ensure_filters(text)
    m = re.search(r"(?ms)^comparisonFilters:\n(?P<body>(?:  .*\n)*)", text)
    if not m:
        fail("comparisonFilters nicht lesbar.")
    rendered = f'"{value}"' if quote else str(value)
    line = f"  {key}: {rendered}"
    existing = re.search(rf"(?m)^  {re.escape(key)}:.*$", m.group("body"))
    if existing:
        a = m.start("body") + existing.start()
        b = m.start("body") + existing.end()
        return text[:a] + line + text[b:]
    pos = m.start("body")
    return text[:pos] + line + "\n" + text[pos:]

def classify(d):
    cap = d.get("reservoirLiters")
    grams = d.get("maxMealGrams")
    ml = d.get("maxMealMl")
    kibble = d.get("kibbleMaxMm")
    if cap and cap >= 5 and ((grams and grams >= 250) or (ml and ml >= 500)) and (not kibble or kibble >= 12):
        return "technical-fit"
    if cap and cap >= 4 and (not kibble or kibble >= 12):
        return "conditional"
    return "limited"

def explain(d, fit):
    facts = []
    if d.get("reservoirLiters") is not None: facts.append(f'{d["reservoirLiters"]} L Vorrat')
    if d.get("maxMealGrams") is not None: facts.append(f'bis ca. {d["maxMealGrams"]} g je Mahlzeit')
    if d.get("kibbleMaxMm") is not None: facts.append(f'Kroketten bis {d["kibbleMaxMm"]} mm')
    joined = ", ".join(facts) or "unvollständige technische Daten"
    if fit == "technical-fit":
        return f"Technisch stark für größere Rationen: {joined}. Napf und Standfestigkeit individuell prüfen."
    if fit == "conditional":
        return f"Technisch grundsätzlich interessant: {joined}. Maximale Mahlzeit ist noch nicht vollständig belegt."
    return f"Für große Hunde nur eingeschränkt: {joined}."

root = find_root(Path.cwd().resolve())
backup_root = root / (".large-dog-capacity-model-2.2-backup-" + datetime.now().strftime("%Y-%m-%dT%H-%M-%S"))
changed = []

# Schema
path = root / PRODUCT_SCHEMA
text = path.read_text(encoding="utf-8")
orig = text
if "largeDogFit:" not in text:
    anchor = '    priceTier: z\n      .enum([\n        "budget",\n        "midrange",\n        "premium"\n      ])\n      .optional()\n'
    addition = (
        '    reservoirLiters: z.number().positive().optional(),\n'
        '    portionGrams: z.number().positive().optional(),\n'
        '    portionMl: z.number().positive().optional(),\n'
        '    maxPortionsPerMeal: z.number().int().positive().optional(),\n'
        '    maxMealGrams: z.number().positive().optional(),\n'
        '    maxMealMl: z.number().positive().optional(),\n'
        '    kibbleMaxMm: z.number().positive().optional(),\n'
        '    manufacturerSizeClaim: z.enum(["large","all-dogs","small-medium","small","max-40cm","cats-small-pets","unknown"]).default("unknown"),\n'
        '    largeDogFit: z.enum(["technical-fit","conditional","limited","unknown"]).default("unknown"),\n'
        '    largeDogFitReason: z.string().optional(),\n\n'
    )
    text = replace_once(text, anchor, addition + anchor, "Produktschema")
if text != orig:
    backup(root, backup_root, PRODUCT_SCHEMA)
    path.write_text(text, encoding="utf-8")
    changed.append(str(PRODUCT_SCHEMA))

# Products
eligible, rows = [], []
for slug, data in REVIEWED.items():
    rel = APP / "src/content/products" / f"{slug}.md"
    path = root / rel
    if not path.exists():
        rows.append((data["title"], "nicht im Repository", "keine Änderung"))
        continue
    fit = classify(data)
    why = explain(data, fit)
    text = path.read_text(encoding="utf-8")
    orig = text
    for key in ["reservoirLiters","portionGrams","portionMl","maxPortionsPerMeal","maxMealGrams","maxMealMl","kibbleMaxMm"]:
        if key in data:
            text = upsert(text, key, data[key])
    text = upsert(text, "manufacturerSizeClaim", data.get("manufacturerSizeClaim","unknown"), True)
    text = upsert(text, "largeDogFit", fit, True)
    text = upsert(text, "largeDogFitReason", why.replace('"', "'"), True)
    if text != orig:
        backup(root, backup_root, rel)
        path.write_text(text, encoding="utf-8")
        changed.append(str(rel))
    if fit in ("technical-fit","conditional"):
        eligible.append((slug, fit, data))
    rows.append((data["title"], fit, why))

# Route logic
path = root / PAGE_ROUTE
text = path.read_text(encoding="utf-8")
orig = text
old1 = '  const largeDogStatus = filters?.largeDogSuitability ?? "unknown";\n  const largeDogMatch =\n    recommendationJourney.petSize === "large" &&\n    recommendationJourney.animal === "dog"\n      ? largeDogStatus === "confirmed" ||\n        (recommendationJourney.allowConditional &&\n          largeDogStatus === "conditional")\n      : explicitSizeMatch;'
new1 = '  const largeDogFit = filters?.largeDogFit ?? "unknown";\n  const largeDogMatch =\n    recommendationJourney.petSize === "large" &&\n    recommendationJourney.animal === "dog"\n      ? largeDogFit === "technical-fit" ||\n        (recommendationJourney.allowConditional &&\n          largeDogFit === "conditional")\n      : explicitSizeMatch;'
if old1 in text:
    text = text.replace(old1, new1, 1)
elif "const matchesRecommendationJourney" in text and "largeDogFit = filters?.largeDogFit" not in text:
    old2 = '  const sizeMatches = recommendationJourney.petSize\n    ? (filters?.petSize ?? []).includes(recommendationJourney.petSize)\n    : true;\n\n  return animalMatches && sizeMatches;\n};'
    new2 = '  const explicitSizeMatch = recommendationJourney.petSize\n    ? (filters?.petSize ?? []).includes(recommendationJourney.petSize)\n    : true;\n\n  const largeDogFit = filters?.largeDogFit ?? "unknown";\n  const largeDogMatch =\n    recommendationJourney.petSize === "large" &&\n    recommendationJourney.animal === "dog"\n      ? largeDogFit === "technical-fit" ||\n        (recommendationJourney.allowConditional && largeDogFit === "conditional")\n      : explicitSizeMatch;\n\n  return animalMatches && largeDogMatch;\n};'
    text = replace_once(text, old2, new2, "Journey-Logik")
text = text.replace("?.largeDogSuitability ===\n  \"conditional\"", "?.largeDogFit ===\n  \"conditional\"")
text = text.replace("?.largeDogSuitabilityNote", "?.largeDogFitReason")
if text != orig:
    backup(root, backup_root, PAGE_ROUTE)
    path.write_text(text, encoding="utf-8")
    changed.append(str(PAGE_ROUTE))

# Target page
path = root / TARGET_PAGE
text = path.read_text(encoding="utf-8")
orig = text
eligible.sort(key=lambda x: (0 if x[1] == "technical-fit" else 1, -(x[2].get("maxMealGrams") or 0), -(x[2].get("reservoirLiters") or 0)))
slugs = [x[0] for x in eligible]
text = re.sub(r"(?m)^comparisonProducts:.*$", 'comparisonProducts: [' + ", ".join(f'"{s}"' for s in slugs) + ']', text, count=1)
text = text.replace('title: "Geeignete Kandidaten mit individuellem Prüfbedarf"', 'title: "Nach Mahlzeitengröße und Vorrat eingeordnete Modelle"')
text = text.replace('title: "Großer Vorrat allein reicht nicht"', 'title: "Nach Mahlzeitengröße und Vorrat eingeordnete Modelle"')
text = text.replace('cardsTitle: "Bedingt geeignete Modelle im Vergleich"', 'cardsTitle: "Technisch passende und bedingt passende Modelle"')
text = text.replace('cardsTitle: "Modelle mit besonderem Prüfbedarf"', 'cardsTitle: "Technisch passende und bedingt passende Modelle"')
if text != orig:
    backup(root, backup_root, TARGET_PAGE)
    path.write_text(text, encoding="utf-8")
    changed.append(str(TARGET_PAGE))

# Report
report_path = root / REPORT
if report_path.exists():
    backup(root, backup_root, REPORT)
report_path.parent.mkdir(parents=True, exist_ok=True)
lines = ["# Review: Futterautomaten für große Hunde", "", "Bewertung nach maximaler Mahlzeit, Vorratsvolumen und Krokettengröße.", "", "| Modell | Einstufung | Begründung |", "|---|---|---|"]
for title, status, why in rows:
    lines.append(f"| {title} | {status} | {why} |")
lines += ["", "## Noch nicht als Produktdatei gefunden", ""] + [f"- {x}" for x in MISSING]
lines += ["", "Diese Modelle wurden nicht automatisch erfunden oder angelegt."]
report_path.write_text("\n".join(lines) + "\n", encoding="utf-8")
changed.append(str(REPORT))

print("Large Dog Capacity Model 2.2 erfolgreich angewendet.")
print("Backup:", backup_root)
for item in changed:
    print("-", item)
print("\nJetzt ausführen:")
print("  npm run build:pfotentechnik")
print("  npm --workspace apps/pfotentechnik run audit:repository")
print("Report:", REPORT)

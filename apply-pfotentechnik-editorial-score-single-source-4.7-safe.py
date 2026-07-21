#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import json, subprocess, sys
PATHS = {'util': 'packages/affiliate-core/src/utils/editorialScore.ts', 'types': 'packages/affiliate-core/src/components/product/alternativeRecommendation.types.ts', 'card': 'packages/affiliate-core/src/components/product/AlternativeRecommendationCard.astro', 'index': 'apps/pfotentechnik/src/domain/productAlternatives/index.ts', 'feeders': 'apps/pfotentechnik/src/domain/productAlternatives/categories/futterautomaten.ts', 'audit': 'scripts/audit-editorial-score-consistency.mjs', 'package': 'apps/pfotentechnik/package.json'}
def stop(message):
    print(f"FEHLER: {message}", file=sys.stderr)
    raise SystemExit(1)
def find_root(start):
    for candidate in (start, *start.parents):
        if (candidate / "apps/pfotentechnik/package.json").is_file(): return candidate
    stop("Repository-Root nicht gefunden.")
def replace_once(text, old, new, label):
    count = text.count(old)
    if count != 1: stop(f"{label}: genau 1 Fundstelle erwartet, gefunden: {count}")
    return text.replace(old, new, 1)
def run(command, cwd):
    print("$", " ".join(command))
    if subprocess.run(command, cwd=cwd).returncode != 0:
        raise RuntimeError("Befehl fehlgeschlagen: " + " ".join(command))
root = find_root(Path.cwd().resolve())
required_keys = ["util", "types", "card", "index", "feeders", "package"]
for key in required_keys:
    relative = Path(PATHS[key])
    if not (root / relative).is_file(): stop(f"Datei fehlt: {relative}")
originals = {key: (root / PATHS[key]).read_text(encoding="utf-8") for key in required_keys}
if "resolveEditorialScore" in originals["util"]:
    stop("Editorial Score Single Source 4.7 scheint bereits installiert zu sein.")
util = originals["util"].rstrip() + "\n\nexport type EditorialScoreInput = {\n  score?: number | null;\n  rating?: number | null;\n};\n\n/**\n * Verbindliche Produktbewertung:\n * 1. Der redaktionelle 100er-Score ist die primäre Quelle.\n * 2. Nur wenn kein valider Score existiert, wird das 5er-Rating umgerechnet.\n */\nexport const resolveEditorialScore = ({\n  score,\n  rating\n}: EditorialScoreInput): number => {\n  if (typeof score === \"number\" && Number.isFinite(score)) {\n    return toEditorialScore(score, 100);\n  }\n\n  if (typeof rating === \"number\" && Number.isFinite(rating)) {\n    return toEditorialScore(rating, 5);\n  }\n\n  return 0;\n};\n" + "\n"
types = replace_once(originals["types"], "  score: number;\n  rating: number;\n  icon: string;", "  score: number;\n  icon: string;", "zweite Rating-Quelle aus Typ entfernen")
card = replace_once(originals["card"], "              <div class=\"alternative-recommendation-footer\">\n                <EditorialScore value={alternative.rating} scale={5} variant=\"inline\" />\n\n                <a href={alternative.url}>", "              <div class=\"alternative-recommendation-footer alternative-recommendation-footer--single\">\n                <a href={alternative.url}>", "doppelte Bewertung aus Karte entfernen")
style_close = card.rfind("</style>")
if style_close == -1: stop("Style-Ende in AlternativeRecommendationCard nicht gefunden.")
card = card[:style_close] + "\n\n  /* editorial-score-single-source-4.7 */\n  .alternative-recommendation-footer--single {\n    justify-content: flex-start;\n  }\n\n  .alternative-recommendation-footer--single > a {\n    width: fit-content;\n  }\n" + card[style_close:]
index = replace_once(originals["index"], "import type { AlternativeRecommendation } from \"@affiliate-core/components/product/alternativeRecommendation.types\";\nimport { getFutterautomatenAlternatives } from \"./categories/futterautomaten\";", "import type { AlternativeRecommendation } from \"@affiliate-core/components/product/alternativeRecommendation.types\";\nimport { resolveEditorialScore } from \"@affiliate-core/utils/editorialScore\";\nimport { getFutterautomatenAlternatives } from \"./categories/futterautomaten\";", "Score-Resolver Import im Index")
index = replace_once(index, "          (b.data.score ?? b.data.rating * 20) -\n            (a.data.score ?? a.data.rating * 20)", "          resolveEditorialScore({\n            score: b.data.score,\n            rating: b.data.rating\n          }) -\n            resolveEditorialScore({\n              score: a.data.score,\n              rating: a.data.rating\n            })", "einheitliche Sortierung Trinkbrunnen")
index = replace_once(index, "          score:\n            candidate.data.score ??\n            Math.round(candidate.data.rating * 20),\n          rating: candidate.data.rating,\n          icon: \"\",", "          score: resolveEditorialScore({\n            score: candidate.data.score,\n            rating: candidate.data.rating\n          }),\n          icon: \"\",", "einheitlicher Score Trinkbrunnen")
feeders = replace_once(originals["feeders"], "import { stripLeadingIcon } from \"@affiliate-core/utils/content\";\nimport type { AlternativeRecommendation } from \"@affiliate-core/components/product/alternativeRecommendation.types\";", "import { stripLeadingIcon } from \"@affiliate-core/utils/content\";\nimport { resolveEditorialScore } from \"@affiliate-core/utils/editorialScore\";\nimport type { AlternativeRecommendation } from \"@affiliate-core/components/product/alternativeRecommendation.types\";", "Score-Resolver Import Futterautomaten")
feeders = replace_once(feeders, "    .sort(\n      (a, b) =>\n        (b.data.score ?? 0) -\n        (a.data.score ?? 0)\n    );", "    .sort(\n      (a, b) =>\n        resolveEditorialScore({\n          score: b.data.score,\n          rating: b.data.rating\n        }) -\n        resolveEditorialScore({\n          score: a.data.score,\n          rating: a.data.rating\n        })\n    );", "einheitliche Sortierung Futterautomaten")
feeders = replace_once(feeders, "      score: candidate.data.score ?? 0,\n      rating: candidate.data.rating,\n      icon: feature.icon,", "      score: resolveEditorialScore({\n        score: candidate.data.score,\n        rating: candidate.data.rating\n      }),\n      icon: feature.icon,", "einheitlicher Score Futterautomaten")
package_data = json.loads(originals["package"])
package_data.setdefault("scripts", {})["audit:editorial-score"] = "node ../../scripts/audit-editorial-score-consistency.mjs"
package = json.dumps(package_data, ensure_ascii=False, indent=2) + "\n"
audit = "import fs from \"node:fs\";\nimport path from \"node:path\";\n\nconst cwd = process.cwd();\nconst root = fs.existsSync(path.join(cwd, \"apps\", \"pfotentechnik\"))\n  ? cwd\n  : path.resolve(cwd, \"../..\");\n\nconst checks = [\n  {\n    file: \"packages/affiliate-core/src/utils/editorialScore.ts\",\n    required: [\"resolveEditorialScore\", \"score\", \"rating\"]\n  },\n  {\n    file: \"apps/pfotentechnik/src/domain/productAlternatives/index.ts\",\n    required: [\"resolveEditorialScore\"]\n  },\n  {\n    file: \"apps/pfotentechnik/src/domain/productAlternatives/categories/futterautomaten.ts\",\n    required: [\"resolveEditorialScore\"]\n  }\n];\n\nconst problems = [];\n\nfor (const check of checks) {\n  const full = path.join(root, check.file);\n  if (!fs.existsSync(full)) {\n    problems.push(`Fehlende Datei: ${check.file}`);\n    continue;\n  }\n\n  const content = fs.readFileSync(full, \"utf8\");\n  for (const marker of check.required) {\n    if (!content.includes(marker)) {\n      problems.push(`${check.file}: ${marker} fehlt`);\n    }\n  }\n}\n\nconst typeFile = path.join(\n  root,\n  \"packages/affiliate-core/src/components/product/alternativeRecommendation.types.ts\"\n);\nconst cardFile = path.join(\n  root,\n  \"packages/affiliate-core/src/components/product/AlternativeRecommendationCard.astro\"\n);\n\nif (fs.existsSync(typeFile)) {\n  const content = fs.readFileSync(typeFile, \"utf8\");\n  if (/^\\s*rating:\\s*number;/m.test(content)) {\n    problems.push(\"AlternativeRecommendation enthält weiterhin eine zweite Rating-Quelle.\");\n  }\n}\n\nif (fs.existsSync(cardFile)) {\n  const content = fs.readFileSync(cardFile, \"utf8\");\n  const scoreOccurrences = (\n    content.match(/<EditorialScore\\b/g) ?? []\n  ).length;\n\n  if (scoreOccurrences !== 1) {\n    problems.push(\n      `AlternativeRecommendationCard zeigt ${scoreOccurrences} Bewertungsblöcke statt genau einem.`\n    );\n  }\n\n  if (content.includes(\"alternative.rating\")) {\n    problems.push(\"AlternativeRecommendationCard verwendet weiterhin alternative.rating.\");\n  }\n}\n\nif (problems.length) {\n  console.error(\"Editorial-Score-Audit fehlgeschlagen:\");\n  problems.forEach((problem) => console.error(`- ${problem}`));\n  process.exit(1);\n}\n\nconsole.log(\"Editorial-Score-Audit erfolgreich: eine Quelle, eine Anzeige.\");\n"
stamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".editorial-score-single-source-4.7-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)
for key, content in originals.items():
    relative = Path(PATHS[key])
    dest = backup / relative
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(content, encoding="utf-8")
audit_path = root / PATHS["audit"]
audit_existed = audit_path.exists()
audit_original = audit_path.read_text(encoding="utf-8") if audit_existed else None
try:
    writes = {"util": util, "types": types, "card": card, "index": index, "feeders": feeders, "package": package}
    for key, content in writes.items():
        (root / PATHS[key]).write_text(content, encoding="utf-8")
    audit_path.parent.mkdir(parents=True, exist_ok=True)
    audit_path.write_text(audit, encoding="utf-8")
    run(["npm", "run", "build:pfotentechnik"], root)
    run(["npm", "--workspace", "apps/pfotentechnik", "run", "audit:editorial-score"], root)
    if "\"audit:recommendations\"" in package:
        run(["npm", "--workspace", "apps/pfotentechnik", "run", "audit:recommendations"], root)
except Exception as exc:
    print(f"Validierung fehlgeschlagen: {exc}", file=sys.stderr)
    print("Automatischer Rollback wird ausgeführt.", file=sys.stderr)
    for key, content in originals.items():
        (root / PATHS[key]).write_text(content, encoding="utf-8")
    if audit_existed:
        audit_path.write_text(audit_original, encoding="utf-8")
    elif audit_path.exists():
        audit_path.unlink()
    raise SystemExit(1)
print("Editorial Score Single Source 4.7 erfolgreich installiert.")
print(f"Backup: {backup}")

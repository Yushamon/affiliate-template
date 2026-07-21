#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import subprocess, sys
TARGETS = ['apps/pfotentechnik/src/pages/[slug].astro', 'apps/pfotentechnik/src/components/DecisionNextSteps.astro', 'packages/affiliate-core/src/styles/article.css']
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
for relative in TARGETS:
    if not (root / relative).is_file(): stop(f"Datei fehlt: {relative}")
originals = {relative: (root / relative).read_text(encoding="utf-8") for relative in TARGETS}
if "money-pages-next-steps-4.3" in originals[TARGETS[1]]:
    stop("Patch 4.3 scheint bereits installiert zu sein.")
updated = dict(originals)
updated[TARGETS[0]] = replace_once(updated[TARGETS[0]], "const isMoneyPage =\n  recommendationJourney?.mode === \"filtered\" ||\n  page.data.contentPlatform?.intent === \"buying-guide\" ||\n  page.data.contentPlatform?.intent === \"comparison-support\";", "const isMoneyPage =\n  recommendationJourney?.mode === \"filtered\" ||\n  page.data.contentPlatform?.intent === \"buying-guide\" ||\n  page.data.contentPlatform?.intent === \"comparison-support\";\n\nconst isRecommendationPage =\n  isMoneyPage ||\n  Boolean(assembledPage.closingCta) ||\n  Boolean(assembledPage.decisionKey);", "Empfehlungsseiten-Erkennung")
updated[TARGETS[0]] = replace_once(updated[TARGETS[0]], "const moneyPageNextSteps = isMoneyPage\n  ? buildMoneyPageNextSteps({\n      page: page.data,\n      comparisons,\n      products\n    })\n  : [];", "const moneyPageNextSteps = isRecommendationPage\n  ? buildMoneyPageNextSteps({\n      page: page.data,\n      comparisons,\n      products\n    })\n  : [];", "Next-Steps für alle kaufnahen Ratgeber")
updated[TARGETS[0]] = replace_once(updated[TARGETS[0]], "      isMoneyPage && moneyPageNextSteps.length > 0 && (\n        <DecisionNextSteps\n          title=\"Passend weiterentscheiden\"\n          intro=\"Öffne die stärkste passende Produktempfehlung oder den zugehörigen Vergleich.\"\n          items={moneyPageNextSteps}\n        />\n      )", "      isRecommendationPage && moneyPageNextSteps.length > 0 && (\n        <DecisionNextSteps\n          title=\"Deine nächsten Schritte\"\n          intro=\"Wähle zwischen der passenden Produktempfehlung, dem direkten Vergleich und weiterführender Einordnung.\"\n          items={moneyPageNextSteps}\n        />\n      )", "vereinheitlichte Next-Steps-Ausgabe")
updated[TARGETS[0]] = replace_once(updated[TARGETS[0]], "      !isMoneyPage && assembledPage.closingCta && closingProduct && (", "      !isRecommendationPage && assembledPage.closingCta && closingProduct && (", "Hardcoded Closing-CTA unterdrücken")
updated[TARGETS[0]] = replace_once(updated[TARGETS[0]], "{!isMoneyPage && (\n  <ConversionJourney", "{!isRecommendationPage && (\n  <ConversionJourney", "ConversionJourney auf Kaufseiten unterdrücken")
updated[TARGETS[1]] = updated[TARGETS[1]].rstrip() + "\n\n<style is:global>\n  /* money-pages-next-steps-4.3 */\n  .pt-next-steps {\n    --next-bg: linear-gradient(145deg, #0a4d3f 0%, #0b3e36 100%);\n    --next-card: rgba(255, 255, 255, 0.08);\n    --next-card-border: rgba(184, 239, 197, 0.24);\n    --next-text: #f8fafc;\n    --next-muted: #d7e4df;\n    --next-accent: #63e6a3;\n\n    color: var(--next-text);\n    border-color: rgba(184, 239, 197, 0.2);\n    background: var(--next-bg);\n    box-shadow: 0 22px 60px rgba(4, 24, 20, 0.24);\n  }\n\n  .pt-next-steps__header h2,\n  .pt-next-steps__card h3 {\n    color: var(--next-text);\n  }\n\n  .pt-next-steps__header > p:last-child,\n  .pt-next-steps__card p {\n    color: var(--next-muted);\n  }\n\n  .pt-next-steps__eyebrow,\n  .pt-next-steps__label,\n  .pt-next-steps__card strong {\n    color: var(--next-accent);\n  }\n\n  .pt-next-steps__card {\n    border-color: var(--next-card-border);\n    background: var(--next-card);\n    color: var(--next-text);\n    box-shadow: none;\n  }\n\n  .pt-next-steps__card:first-child {\n    border-color: rgba(99, 230, 163, 0.6);\n    background: linear-gradient(\n      145deg,\n      rgba(99, 230, 163, 0.15),\n      rgba(255, 255, 255, 0.07)\n    );\n  }\n\n  .pt-next-steps__card:hover,\n  .pt-next-steps__card:focus-visible {\n    border-color: var(--next-accent);\n    box-shadow: 0 14px 34px rgba(3, 20, 16, 0.24);\n  }\n\n  @media (prefers-color-scheme: dark) {\n    .pt-next-steps {\n      --next-bg: linear-gradient(145deg, #0a4d3f 0%, #082f2a 100%);\n      --next-card: rgba(15, 35, 47, 0.58);\n      --next-card-border: rgba(99, 230, 163, 0.26);\n      --next-text: #f8fafc;\n      --next-muted: #d5e2dd;\n      --next-accent: #63e6a3;\n    }\n  }\n\n  @media (max-width: 720px) {\n    .pt-next-steps {\n      padding: 1.35rem;\n    }\n\n    .pt-next-steps__grid {\n      gap: 0.85rem;\n    }\n\n    .pt-next-steps__card {\n      padding: 1.2rem;\n    }\n  }\n</style>\n" + "\n"
updated[TARGETS[2]] = updated[TARGETS[2]].rstrip() + "\n\n/* money-pages-next-steps-4.3: Fließtextlinks wieder als Textlinks */\n.article p a:not([class]),\n.article li a:not([class]),\n.article dd a:not([class]),\n.article td a:not([class]) {\n  display: inline;\n  padding: 0;\n  border: 0;\n  border-radius: 0;\n  background: transparent;\n  box-shadow: none;\n  color: var(--primary-dark);\n  font: inherit;\n  font-weight: 750;\n  line-height: inherit;\n  text-decoration: underline;\n  text-decoration-thickness: 2px;\n  text-underline-offset: 0.18em;\n}\n\n.article p a:not([class]):hover,\n.article li a:not([class]):hover,\n.article dd a:not([class]):hover,\n.article td a:not([class]):hover {\n  background: transparent;\n  color: var(--primary);\n  text-decoration-thickness: 3px;\n}\n\n@media (prefers-color-scheme: dark) {\n  .article p a:not([class]),\n  .article li a:not([class]),\n  .article dd a:not([class]),\n  .article td a:not([class]) {\n    color: #63e6a3;\n  }\n}\n" + "\n"
if updated[TARGETS[0]].count("isRecommendationPage") < 5:
    stop("Empfehlungsseiten-Integration ist unvollständig.")
stamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".money-pages-next-steps-4.3-backup-{stamp}"
backup.mkdir(parents=True, exist_ok=False)
for relative, content in originals.items():
    dest = backup / relative
    dest.parent.mkdir(parents=True, exist_ok=True)
    dest.write_text(content, encoding="utf-8")
try:
    for relative, content in updated.items():
        (root / relative).write_text(content, encoding="utf-8")
    run(["npm", "run", "build:pfotentechnik"], root)
    package = (root / "apps/pfotentechnik/package.json").read_text(encoding="utf-8")
    if "\"audit:recommendations\"" in package:
        run(["npm", "--workspace", "apps/pfotentechnik", "run", "audit:recommendations"], root)
except Exception as exc:
    print(f"Validierung fehlgeschlagen: {exc}", file=sys.stderr)
    print("Automatischer Rollback wird ausgeführt.", file=sys.stderr)
    for relative, content in originals.items():
        (root / relative).write_text(content, encoding="utf-8")
    raise SystemExit(1)
print("Money Pages Next Steps 4.3 erfolgreich installiert.")
print(f"Backup: {backup}")

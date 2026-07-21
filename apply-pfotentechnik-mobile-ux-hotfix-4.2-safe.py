#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import subprocess, sys
TARGETS = ['packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro', 'packages/affiliate-core/src/components/comparison/comparison.css', 'apps/pfotentechnik/src/components/DecisionNextSteps.astro', 'packages/affiliate-core/src/renderer/PremiumRenderer.astro', 'apps/pfotentechnik/src/pages/[slug].astro']
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
if "pfotentechnik-mobile-ux-hotfix-4.2" in originals[TARGETS[1]]:
    stop("Hotfix 4.2 scheint bereits installiert zu sein.")
updated = dict(originals)
updated["packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro"] = replace_once(updated["packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro"], "import { toEditorialScore } from \"@affiliate-core/utils/editorialScore\";\n", "", "unnötigen Score-Import entfernen")
updated["packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro"] = replace_once(updated["packages/affiliate-core/src/components/comparison/ComparisonMobileCards.astro"], "            {typeof product.rating === \"number\" && (\n              <strong>{toEditorialScore(product.rating, 5)}</strong>\n            )}", "            {typeof product.rating === \"number\" && (\n              <strong>\n                {product.rating.toFixed(1).replace(\".\", \",\")} / 5\n              </strong>\n            )}", "Bewertungsskala vereinheitlichen")
updated["packages/affiliate-core/src/renderer/PremiumRenderer.astro"] = replace_once(updated["packages/affiliate-core/src/renderer/PremiumRenderer.astro"], "    gap: clamp(42px, 6vw, 72px);", "    gap: clamp(26px, 4vw, 44px);", "Premium-Block-Abstand reduzieren")
updated["packages/affiliate-core/src/components/comparison/comparison.css"] = updated["packages/affiliate-core/src/components/comparison/comparison.css"].rstrip() + "\n\n/* pfotentechnik-mobile-ux-hotfix-4.2 */\n@media (prefers-color-scheme: dark) {\n  .comparison-sticky-bar {\n    border-color: rgba(148, 163, 184, 0.24);\n    background: rgba(15, 29, 47, 0.96);\n    color: #f8fafc;\n    box-shadow: 0 18px 55px rgba(0, 0, 0, 0.42);\n  }\n\n  .comparison-sticky-bar span {\n    color: #b8c4d3;\n  }\n\n  .comparison-sticky-bar strong {\n    color: #f8fafc;\n  }\n\n  .comparison-sticky-bar .comparison-button--secondary {\n    border-color: rgba(148, 163, 184, 0.28);\n    background: #17263a;\n    color: #f8fafc;\n  }\n\n  .comparison-sticky-bar .comparison-button {\n    color: #061a12;\n    background: #5ee19a;\n    border-color: #5ee19a;\n  }\n}\n\n@media (max-width: 760px) {\n  .comparison-mobile-product__head strong {\n    color: var(--comparison-accent);\n    font-size: 1rem;\n    font-variant-numeric: tabular-nums;\n  }\n\n  .comparison-mobile-product__actions .comparison-button {\n    min-height: 52px;\n    padding-inline: 0.8rem;\n    line-height: 1.15;\n  }\n}\n" + "\n"
updated["apps/pfotentechnik/src/components/DecisionNextSteps.astro"] = updated["apps/pfotentechnik/src/components/DecisionNextSteps.astro"].rstrip() + "\n\n<style is:global>\n  /* pfotentechnik-mobile-ux-hotfix-4.2 */\n  @media (prefers-color-scheme: dark) {\n    .pt-next-steps {\n      --surface-color: #101f32;\n      --surface-subtle: #16263c;\n      --text-muted: #b8c4d3;\n      --border-color: rgba(203, 213, 225, 0.16);\n      --accent-color: #5ee19a;\n      color: #f8fafc;\n      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.28);\n    }\n\n    .pt-next-steps__header h2,\n    .pt-next-steps__card h3 {\n      color: #f8fafc;\n    }\n\n    .pt-next-steps__card {\n      color: #f8fafc;\n    }\n  }\n</style>\n" + "\n"
updated["apps/pfotentechnik/src/pages/[slug].astro"] = updated["apps/pfotentechnik/src/pages/[slug].astro"].rstrip() + "\n\n<style is:global>\n  /* pfotentechnik-mobile-ux-hotfix-4.2 */\n  .money-page-intent-primary {\n    color: #06251a !important;\n    background: #5ee19a !important;\n  }\n\n  .money-page-intent-primary:hover,\n  .money-page-intent-primary:focus-visible {\n    color: #04170f !important;\n    background: #72e7a8 !important;\n  }\n\n  @media (prefers-color-scheme: dark) {\n    .money-page-intent-entry {\n      border-color: rgba(203, 213, 225, 0.16);\n      background: #101f32;\n      color: #f8fafc;\n      box-shadow: 0 18px 44px rgba(0, 0, 0, 0.24);\n    }\n\n    .money-page-intent-entry h2 {\n      color: #f8fafc;\n    }\n\n    .money-page-intent-secondary {\n      border-color: rgba(203, 213, 225, 0.2);\n      background: #16263c;\n      color: #5ee19a !important;\n    }\n  }\n\n  @media (max-width: 760px) {\n    .premium-v3--pfotentechnik {\n      gap: 26px !important;\n    }\n\n    .premium-v3--pfotentechnik .premium-v3-block + .premium-v3-block {\n      margin-top: 0 !important;\n    }\n  }\n</style>\n" + "\n"
stamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".mobile-ux-hotfix-4.2-backup-{stamp}"
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
print("Mobile UX Hotfix 4.2 erfolgreich installiert.")
print(f"Backup: {backup}")

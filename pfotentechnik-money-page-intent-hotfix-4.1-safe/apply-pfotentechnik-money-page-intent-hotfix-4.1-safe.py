#!/usr/bin/env python3
from pathlib import Path
from datetime import datetime
import subprocess, sys
APP = Path("apps/pfotentechnik")
TARGET = APP / "src/pages/[slug].astro"
def stop(message):
    print(f"FEHLER: {message}", file=sys.stderr)
    raise SystemExit(1)
def find_root(start):
    for candidate in (start, *start.parents):
        if (candidate / APP / "package.json").is_file(): return candidate
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
target = root / TARGET
if not target.is_file(): stop(f"Datei fehlt: {TARGET}")
original = target.read_text(encoding="utf-8")
if "money-page-intent-entry-4.1" in original: stop("Hotfix 4.1 scheint bereits installiert zu sein.")
updated = original
updated = replace_once(updated, "const journeyTopProduct = journeyProducts[0];\n\nconst journeyComparisonHref = recommendationJourney", "const journeyTopProduct = journeyProducts[0];\nconst journeyFallbackProduct = comparisonProductEntries\n  .slice()\n  .sort((a, b) =>\n    (b.data.score ?? toEditorialScore(b.data.rating, 5)) -\n    (a.data.score ?? toEditorialScore(a.data.rating, 5))\n  )[0];\nconst journeyRecommendedProduct =\n  journeyTopProduct ?? journeyFallbackProduct;\nconst journeyHasExactMatch = Boolean(journeyTopProduct);\n\nconst journeyComparisonHref = recommendationJourney", "Fallback-Empfehlung")
updated = replace_once(updated, "    <AutoContentBlocks\n      page={assembledPage}\n      products={products}\n    />\n    {", "    <AutoContentBlocks\n      page={assembledPage}\n      products={products}\n    />\n\n    {\n      isMoneyPage && journeyComparisonHref && (\n        <nav\n          class=\"money-page-intent-entry\"\n          aria-label=\"Direkteinstieg\"\n          data-feature=\"money-page-intent-entry-4.1\"\n        >\n          <div>\n            <p>Schon kaufbereit?</p>\n            <h2>Direkt vergleichen oder erst Kriterien prüfen?</h2>\n          </div>\n          <div class=\"money-page-intent-actions\">\n            <a class=\"money-page-intent-primary\" href={journeyComparisonHref}>\n              Zum Vergleich\n            </a>\n            <a class=\"money-page-intent-secondary\" href=\"#kaufberatung\">\n              Kriterien prüfen\n            </a>\n          </div>\n        </nav>\n      )\n    }\n\n    {", "oberer Vergleichseinstieg")
updated = replace_once(updated, "    <AutoLinkContent\n      definitions={internalLinkDefinitions}\n      sourcePath={`/${page.data.slug}/`}\n      sourceGroup=\"knowledge\"\n      sourceContexts={sourceContexts}\n      maxLinksPerPage={7}\n    >\n      <Content />\n    </AutoLinkContent>", "    <div id=\"kaufberatung\" class=\"money-page-guide-anchor\" aria-hidden=\"true\"></div>\n    <AutoLinkContent\n      definitions={internalLinkDefinitions}\n      sourcePath={`/${page.data.slug}/`}\n      sourceGroup=\"knowledge\"\n      sourceContexts={sourceContexts}\n      maxLinksPerPage={7}\n    >\n      <Content />\n    </AutoLinkContent>", "Kaufberatungsanker")
updated = replace_once(updated, "            journeyTopProduct ? (\n              <>\n                <div class=\"ranking-section-header\">\n                  <p class=\"ranking-eyebrow\">Top-Empfehlung</p>\n                  <h2>Die passendste dokumentierte Auswahl</h2>\n                  <p>Dieses Modell erfüllt die hinterlegten Eignungsfilter.</p>\n                </div>\n                <a class=\"decision-product-card\" href={`/produkt/${journeyTopProduct.data.slug}/`}>\n                  <OptimizedImage\n                    src={journeyTopProduct.data.images.thumbnail?.src ?? journeyTopProduct.data.images.hero.src}\n                    alt={journeyTopProduct.data.images.thumbnail?.alt ?? journeyTopProduct.data.images.hero.alt}\n                    width={480}\n                    height={360}\n                    layout=\"constrained\"\n                  />\n                  <div>\n                    <p>{journeyTopProduct.data.manufacturer.name} · {journeyTopProduct.data.score ?? toEditorialScore(journeyTopProduct.data.rating, 5)} Punkte</p>\n                    <h3>{journeyTopProduct.data.title}</h3>\n                    <p>{journeyTopProduct.data.recommendation}</p>\n                    <strong>Produkt ansehen</strong>\n                  </div>\n                </a>\n              </>\n            ) : (\n              <div class=\"recommendation-journey-empty\">\n                <p class=\"ranking-eyebrow\">Redaktionelle Einordnung</p>\n                <h2>{recommendationJourney.emptyTitle}</h2>\n                <p>{recommendationJourney.emptyText}</p>\n              </div>\n            )", "            journeyRecommendedProduct ? (\n              <>\n                <div class=\"ranking-section-header\">\n                  <p class=\"ranking-eyebrow\">\n                    {journeyHasExactMatch ? \"Top-Empfehlung\" : \"Beste verfügbare Option\"}\n                  </p>\n                  <h2>\n                    {journeyHasExactMatch\n                      ? \"Die passendste dokumentierte Auswahl\"\n                      : \"Dieses Modell kommt den Anforderungen am nächsten\"}\n                  </h2>\n                  <p>\n                    {journeyHasExactMatch\n                      ? \"Dieses Modell erfüllt die hinterlegten Eignungsfilter.\"\n                      : recommendationJourney.emptyText}\n                  </p>\n                </div>\n                <a\n                  class=\"decision-product-card\"\n                  href={`/produkt/${journeyRecommendedProduct.data.slug}/`}\n                >\n                  <OptimizedImage\n                    src={\n                      journeyRecommendedProduct.data.images.thumbnail?.src ??\n                      journeyRecommendedProduct.data.images.hero.src\n                    }\n                    alt={\n                      journeyRecommendedProduct.data.images.thumbnail?.alt ??\n                      journeyRecommendedProduct.data.images.hero.alt\n                    }\n                    width={480}\n                    height={360}\n                    layout=\"constrained\"\n                  />\n                  <div>\n                    <p>\n                      {journeyRecommendedProduct.data.manufacturer.name} ·{\" \"}\n                      {journeyRecommendedProduct.data.score ??\n                        toEditorialScore(journeyRecommendedProduct.data.rating, 5)} Punkte\n                    </p>\n                    <h3>{journeyRecommendedProduct.data.title}</h3>\n                    <p>{journeyRecommendedProduct.data.recommendation}</p>\n                    <strong>Produkt ansehen</strong>\n                  </div>\n                </a>\n              </>\n            ) : (\n              <div class=\"recommendation-journey-empty\">\n                <p class=\"ranking-eyebrow\">Redaktionelle Einordnung</p>\n                <h2>{recommendationJourney.emptyTitle}</h2>\n                <p>{recommendationJourney.emptyText}</p>\n              </div>\n            )", "sichtbare Fallback-Empfehlung")
updated = replace_once(updated, "                <span>{recommendationJourney.comparisonLabel}</span>\n                <strong>Zum Vergleich</strong>", "                <span>Passende Modelle vergleichen</span>\n                <strong>Zum Vergleich</strong>", "kurze Vergleichsbenennung")
updated = replace_once(updated, "  .recommendation-journey-state {\n    display: grid;", "  .money-page-guide-anchor {\n    position: relative;\n    top: -1rem;\n    scroll-margin-top: 6rem;\n  }\n\n  .money-page-intent-entry {\n    display: flex;\n    justify-content: space-between;\n    align-items: center;\n    gap: 1.5rem;\n    margin: 1.5rem 0 2.25rem;\n    padding: clamp(1.15rem, 3vw, 1.5rem);\n    border: 1px solid var(--pt-theme-border, #d9e2e7);\n    border-radius: 1.25rem;\n    background: var(--pt-theme-surface, #fff);\n    box-shadow: 0 12px 34px rgba(20, 32, 26, 0.06);\n  }\n\n  .money-page-intent-entry p {\n    margin: 0 0 0.35rem;\n    color: var(--pt-theme-accent, #238657);\n    font-size: 0.78rem;\n    font-weight: 800;\n    letter-spacing: 0.07em;\n    text-transform: uppercase;\n  }\n\n  .money-page-intent-entry h2 {\n    margin: 0;\n    font-size: clamp(1.15rem, 2.5vw, 1.45rem);\n    line-height: 1.25;\n  }\n\n  .money-page-intent-actions {\n    display: flex;\n    flex: 0 0 auto;\n    gap: 0.75rem;\n  }\n\n  .money-page-intent-actions a {\n    display: inline-flex;\n    align-items: center;\n    justify-content: center;\n    min-height: 44px;\n    padding: 0.75rem 1rem;\n    border-radius: 0.85rem;\n    font-weight: 800;\n    text-decoration: none;\n  }\n\n  .money-page-intent-primary {\n    background: var(--pt-theme-accent, #238657);\n    color: #fff;\n  }\n\n  .money-page-intent-secondary {\n    border: 1px solid var(--pt-theme-border, #d9e2e7);\n    color: var(--pt-theme-text, #12342f);\n    background: transparent;\n  }\n\n  .recommendation-journey-state {\n    display: grid;", "Intent-Entry Styles")
updated = replace_once(updated, "  @media (max-width: 640px) {\n    .recommendation-journey-state {", "  @media (max-width: 640px) {\n    .money-page-intent-entry {\n      align-items: stretch;\n      flex-direction: column;\n      margin-top: 1.25rem;\n    }\n\n    .money-page-intent-actions {\n      display: grid;\n      grid-template-columns: 1fr;\n    }\n\n    .recommendation-journey-state {", "Mobile Intent-Entry")
if updated.count("money-page-intent-entry-4.1") != 1: stop("Feature-Marker fehlt.")
if updated.count("journeyRecommendedProduct") < 4: stop("Fallback-Empfehlung unvollständig.")
stamp = datetime.now().strftime("%Y-%m-%dT%H-%M-%S")
backup = root / f".money-page-intent-hotfix-4.1-backup-{stamp}"
backup_file = backup / TARGET
backup_file.parent.mkdir(parents=True, exist_ok=False)
backup_file.write_text(original, encoding="utf-8")
try:
    target.write_text(updated, encoding="utf-8")
    run(["npm", "run", "build:pfotentechnik"], root)
    package_text = (root / APP / "package.json").read_text(encoding="utf-8")
    if "\"audit:recommendations\"" in package_text:
        run(["npm", "--workspace", "apps/pfotentechnik", "run", "audit:recommendations"], root)
    if "\"audit:repository\"" in package_text:
        run(["npm", "--workspace", "apps/pfotentechnik", "run", "audit:repository"], root)
except Exception as exc:
    print(f"Validierung fehlgeschlagen: {exc}", file=sys.stderr)
    print("Automatischer Rollback wird ausgeführt.", file=sys.stderr)
    target.write_text(original, encoding="utf-8")
    raise SystemExit(1)
print("Money Page Intent Hotfix 4.1 erfolgreich installiert.")
print(f"Backup: {backup}")

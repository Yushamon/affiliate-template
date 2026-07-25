# SEO-Release-Workflow

Dieser Workflow trennt lokale Qualitätskontrolle und externe Indexierungsbenachrichtigung.

## 1. Vor dem Deployment

Im Repository-Root:

```powershell
npm run seo:release:check
```

Der Befehl:

1. baut PfotenTechnik,
2. prüft Sitemap, Canonicals und strukturierte Daten,
3. führt vorhandene Wochen- und Comparison-Audits aus,
4. erkennt committed, uncommitted und ungetrackte Änderungen,
5. erzeugt unter `apps/pfotentechnik/.seo-release/` ein URL-Manifest.

Für einen bereits vorhandenen Build:

```powershell
npm run seo:release:check:no-build
```

Eine bestimmte Vergleichsbasis:

```powershell
npm run seo:release:check -- --base=origin/main
```

## 2. Manifest kontrollieren

Die neuesten Dateien liegen hier:

```text
apps/pfotentechnik/.seo-release/latest.json
apps/pfotentechnik/.seo-release/latest.md
apps/pfotentechnik/.seo-release/preflight-latest.json
```

Das Manifest kennt:

- Seiten, Produkte, Comparisons und Hersteller,
- gelöschte und umbenannte Content-Dateien,
- Redirect-Quellen und Redirect-Ziele,
- ungetrackte Dateien,
- globale Template- und Layoutänderungen,
- produktbezogene und redaktionelle Bildänderungen.

Eine bestehende indexierbare URL, die nach dem Build nicht in der Sitemap liegt, beendet den Preflight mit Fehler.

## 3. Deployment

Erst nach erfolgreichem Preflight deployen.

## 4. Nach dem Deployment

IndexNow-Key prüfen:

```powershell
npm run indexnow:status
```

Geänderte URLs zunächst ohne Übertragung anzeigen:

```powershell
npm run seo:release:indexnow:dry-run
```

Danach übertragen:

```powershell
npm run seo:release:indexnow
```

IndexNow ersetzt weder die XML-Sitemap noch die Google Search Console. Google übernimmt URLs primär über interne Links, Sitemaps und normales Crawling.

## 5. Basisrevision festlegen

Standardmäßig wird `HEAD~1` als Basis verwendet. Für einen vollständigen Branchvergleich:

```powershell
npm run seo:release:manifest -- --base=origin/main
```

Alternativ:

```powershell
$env:SEO_RELEASE_BASE_REF = "origin/main"
npm run seo:release:check
```

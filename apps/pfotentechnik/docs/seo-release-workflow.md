# SEO-Release-Workflow

Ein lokaler Build ist ein Deployment-Kandidat. Eine erfolgreiche Production-Freigabe benötigt zusätzlich den Live-HTTP-Gate gegen `pfotentechnik.de`.

## 1. Vor dem Deployment

Im Repository-Root:

```powershell
npm --workspace apps/pfotentechnik run seo:release:prepare
```

Der Befehl:

1. baut PfotenTechnik,
2. prüft Sitemap, Canonicals und strukturierte Daten,
3. führt vorhandene Wochen- und Comparison-Audits aus,
4. erkennt committed, uncommitted und ungetrackte Änderungen,
5. erzeugt unter `apps/pfotentechnik/.seo-release/` ein URL-Manifest,
6. endet als `ready-to-deploy`, ausdrücklich ohne Production-Freigabe.

Für einen bereits vorhandenen Build:

```powershell
node apps/pfotentechnik/scripts/seo/release-preflight.mjs --diagnostic --skip-build
```

Die Diagnose endet als `diagnostic-only`. Sie kann den Live-Gate nicht ersetzen. Eine bestimmte Vergleichsbasis für das Manifest:

```powershell
npm run seo:release:manifest -- --base=origin/main
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

Für 34.8 muss zusätzlich die Cloudflare-Single-Redirect-Regel aus
`apps/pfotentechnik/config/cloudflare-preferred-host-rule.json` angewendet sein.
Sie matcht ausschließlich `www.pfotentechnik.de`, unabhängig von HTTP/HTTPS,
und setzt 301 auf `https://pfotentechnik.de` mit identischem Pfad und Querystring.
Die Regeln anderer Hosts dürfen nicht ersetzt werden. Anleitung: [HTTP-Deployment](production-http-deployment-34.8.md).

## 4. Nach dem Deployment

Zuerst zwingend:

```sh
npm --workspace apps/pfotentechnik run seo:release:verify-production
```

Der Gate prüft manuell nachvollzogene Redirectketten, Host/HTTPS, Queryerhalt,
zwei neue zufällige Fehlerpfade auf beiden Hosts, sämtliche Legacy-Regeln,
die vollständige veröffentlichte Sitemap, Canonicals, robots und exakt die
15 Beobachtungs-URLs aus 34.7. Netzwerkfehler und leere Sitemaps sind FAIL.
Berichte: `apps/pfotentechnik/reports/seo-release/production-http-latest.{md,json}`.

Der vollständige Release-Aufruf `npm run seo:release:check` enthält denselben
Live-Gate als zwingende letzte Phase. Er darf erst mit fehlerfreier Production
`ok` melden. Eine fehlende `dist/404.html` blockiert bereits den Build-Audit.

Nach erfolgreichem Gate die Messbaseline mit dem tatsächlichen, im
Deploymentprotokoll nachgewiesenen ISO-Zeitpunkt festhalten:

```sh
npm --workspace apps/pfotentechnik run seo:release:measurement-baseline -- --deployed-at=YYYY-MM-DDTHH:mm:ssZ
```

Ohne erfolgreichen frischen Gate und Deploymentzeitpunkt entsteht nur eine
explizit wartende Baseline. Keine erfundene Startzeit für die 14-Tage-Messung.

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

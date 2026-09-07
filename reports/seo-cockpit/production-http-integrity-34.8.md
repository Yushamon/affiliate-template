# PFOTENTECHNIK 34.8 — PRODUCTION HTTP INTEGRITY

**Status: NICHT ABGESCHLOSSEN — Live-Deployment/Zonenregel ausstehend.** Der lokale Fix ist vorbereitet; Production zeigt weiterhin www-200 und Homepage-200 für unbekannte Pfade. Kein Ranking- oder Recovery-Nachweis.

## GSC REBASELINE

- 07.09 export imported: YES; Original-ZIP mit SHA-256 `580fc49471dd9f20703a381ce3bc0971b30e1d0667b808fa1e6693215b17d480`.
- Verified data through: **05.09.2026**; 34.7-Berichte und relevante Timeline-/Summary-Dateien korrigiert.
- Rewritten snapshots excluded: YES; bestehende Ausschlüsse `3dc0987`, `dc73a31`, `d50e45c` bleiben bestehen.
- 34.7 conclusion changed: **NO**.
- Originalexport: 736 Impressionen / 20 Klicks. Letzte 28 Tage (09.08.–05.09.): 44 / 0. Letzte 7 Tage (30.08.–05.09.): 7 / 0.
- 153 originale Host-Seitenzeilen, 134 normalisierte Pfade, 117 offengelegte Queries; 60 Top-10 / 86 Top-20 im gesamten Exportzeitraum. Keine aktuellen 7-/28-Tage-URL-/Query-Kohorten ableitbar; entsprechende Werte bleiben unbekannt.

## PREFERRED HOST

- Canonical host: `https://pfotentechnik.de`.
- HTTPS non-www: 200 PASS. HTTPS www: 200 **FAIL**, keine permanente Hostweiterleitung.
- HTTP non-www: 301 → HTTPS non-www → 200 PASS.
- HTTP www: 301 → HTTPS www → 200 **FAIL**, falscher finaler Host.
- Redirect chains: richtige Ein-Hop-Konsolidierung für www noch nicht wirksam; Gate verlangt höchstens einen Hop und unveränderte Pfade/Queries.
- Repository/Build: Canonical, Sitemap, robots, JSON-LD, OpenGraph und interne absolute URL-Signale auf apex geprüft. 372 HTML-Dateien; 0 falsche Hostsignale. RSS verwendet `site.domain`; keine hreflang-Ausgabe gefunden. Historische GSC-Daten und Admin-Normalisierung bleiben unverändert.

## 404 INTEGRITY

- Zwei je Lauf neue UUID-Pfade, jeweils apex und www: final **200 FAIL**, Homepage-Title/-Canonical/-HTML erkannt.
- Homepage fallback removed: **NO (live)**.
- Lokal: `src/pages/404.astro` erzeugt Top-Level `404.html`, noindex, eigener Canonical `/404/`, keine Sitemap-Aufnahme. Der Build-Audit verlangt dieses Artefakt; das Release-Manifest schließt technische 404/500-Routen aus.
- Cloudflare Pages behandelt eine Site ohne Top-Level-404 als SPA und liefert bei unbekannten Pfaden den Root-Inhalt. Die veröffentlichte 404-Datei beendet diesen dokumentierten Fallback. Eine verdeckte zusätzliche Edge-Regel kann erst durch den abschließenden Live-Gate ausgeschlossen werden. [Cloudflare Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/).

## LEGACY REDIRECT

- Source: `/produkt/petkit-yumshare-solo/` (auch ohne Schluss-Slash).
- Target: `/produkt/petkit-yumshare-solo-2/`.
- Live: **301 → 200 PASS**, ein Hop, korrekter Canonical.
- Content changed: **NO**. Die in 34.7 belegte identische Produktidentität bleibt Grundlage.
- Alle 68 bestehenden Regelvarianten live PASS. Alter Pfad in gerenderten Links/strukturierten Daten und Sitemap: keine Vorkommen; NO CHANGE. Historische Suchdaten werden nicht umgeschrieben.

## PRODUCTION HTTP GATE

- Added: **YES**, `audit:production-http`, integriert als kritische Phase im bestehenden Release-Preflight.
- Preferred host / www→non-www: FAIL. HTTP→HTTPS apex: PASS; HTTP-www finaler Host: FAIL.
- Random 404 / homepage fallback: FAIL. Legacy redirect: PASS.
- Canonical: repräsentative vier Seitentypen PASS; Sitemap: **258/258 PASS**, Soll-/Live-Mengen abgeglichen. robots PASS.
- Redirect chains: alle Legacy-Regeln ein Hop; www-Endzielvertrag FAIL. Query-Erhalt wird separat geprüft.
- Gesamt: **9 fehlgeschlagene URL-Prüfungen**, 0 Sitemap-Dokumentfehler, 0 robots-Fehler. Dieser rote Gate ist ein bestätigter Production-Befund und verhindert eine falsche Freigabe.
- `seo:release:prepare` bedeutet ausschließlich Deployment-Kandidat; diagnostische Läufe erteilen ebenfalls keine Production-Freigabe.

## IMPLEMENTATION

- Hosting config changed: Regelbody vorbereitet, **nicht live angewendet**.
- Redirect config changed: vorhandene Solo-Regeln beibehalten; keine unzulässige Domainregel in Pages `_redirects`. Cloudflare unterstützt dort keine Domainweiterleitungen. [Pages Redirects](https://developers.cloudflare.com/pages/configuration/redirects/).
- Zonenregel: Host `www.pfotentechnik.de`, dynamisches Ziel `concat("https://pfotentechnik.de", http.request.uri.path)`, 301, Query-Erhalt aktiv; ohne Protokollfilter. [Cloudflare www-Redirect](https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-www-to-root/).
- Tests added: 13 HTTP-/Release-/Messbaseline-Regressionstests.
- Content files changed: **0**; SEO copy changes: **0**; 34.6: **6/6 NO CHANGE**.
- Files changed (technische Implementierung):

- `apps/pfotentechnik/docs/seo-release-workflow.md`
- `apps/pfotentechnik/package.json`
- `apps/pfotentechnik/scripts/seo/audit-release-build-output.mjs`
- `apps/pfotentechnik/scripts/seo/release-preflight.mjs`
- `apps/pfotentechnik/scripts/seo/release-url-utils.mjs`
- `apps/pfotentechnik/config/cloudflare-preferred-host-rule.json`
- `apps/pfotentechnik/docs/production-http-deployment-34.8.md`
- `apps/pfotentechnik/scripts/seo/production-http-integrity.mjs`
- `apps/pfotentechnik/scripts/seo/record-http-measurement.mjs`
- `apps/pfotentechnik/src/pages/404.astro`
- `apps/pfotentechnik/test/production-http-integrity-34.8.test.mjs`

## VALIDATION

- PfotenTechnik tests: **747/747 PASS**.
- Production Build / Release phases: **ready-to-deploy**, 23/23 Phasen bestanden.
- Production HTTP Gate: **FAIL**, oben aufgeführte bestehende Hostingfehler.
- Schema / Sitemap / robots / rendered links / Canonical / Duplicate-URL-Checks: siehe bestandene bestehende Releasephasen und Build-Report.
- Orphans: bestehende Befunde nicht durch Content-/Linkänderungen bearbeitet; keine neue Contentroute außer technischer noindex-404.
- New blockers: kein neuer lokaler P0/P1-Befund; Live-Abschluss benötigt Cloudflare-Zugang und Veröffentlichung.
- Pre-existing Shared-Core failure: `packages/affiliate-core/src/linking/linkEngine.test.ts:126`, identischer Syntaxfehler, Datei gegenüber `6cbb5b6` unverändert; außerhalb 34.8, nicht repariert und kein zusätzlicher 34.8-Fehler.

## MEASUREMENT

- Deployment baseline date: **ausstehend**; kein Datum aus lokalem Build oder Git-Commit erfunden.
- Observation URLs: exakt **15/15 aus 34.7**, mit Seitentyp, Cluster, originalen Zeitraum-Metriken, historischen Bestpositionen/Query-Zahlen, Live-HTTP/Canonical und letzter Änderung gespeichert. Aktuelle Einzel-URL-Position/Queryzahl mangels zeitlich passender Daten unbekannt.
- Observation window: mindestens **14 Tage ab tatsächlichem Deployment**, erst nach frischem erfolgreichem Live-Gate aktivieren.
- Content freeze: Kohorte stabil halten; danach 14 Tage, außer belegtem P0/P1.
- `measurement-baseline.json` ist ausdrücklich **PENDING_LIVE_FIX**, kein abgeschlossener Post-Fix-Messpunkt.

## CONCLUSION

1. www/non-www konsolidiert? **Nein, live noch offen.**
2. Unbekannte URLs echte 404? **Nein; lokaler Fix vorbereitet, Veröffentlichung offen.**
3. Solo-Legacy-Redirect live? **Ja, 301 → Solo 2 → 200.**
4. Erkennt Release-QA diese Fehler künftig? **Ja, kritischer Live-Gate mit Regressionstests.**
5. Ausschließlich bestätigte technische Probleme bearbeitet? **Ja; keine Contentoptimierung.**
6. Google-Einbruch weiterhin unbewiesen? **Ja, domainweite Ursache bleibt unbewiesen.**
7. Beginn der Nachmessung? **Tatsächliches Deploymentdatum nach erfolgreicher Live-Verifikation; derzeit nicht festgelegt.**

Der fehlende authentifizierte Cloudflare-Zugang verhindert die Zonenregel und das Pages-Deployment in dieser Sitzung. Es gab keine Ablehnung durch automatische Freigabeprüfung. Die konkrete Umsetzung steht in [Deployment-Anleitung](../../apps/pfotentechnik/docs/production-http-deployment-34.8.md).

## Evidenz

- [Vollständiger Production HTTP Test Report](http-integrity-34.8-evidence/production-http-test-report.md): jede URL mit initialem Status, Kette, finalem Status/URL, Canonical, PASS/FAIL.
- [Redirect Matrix](http-integrity-34.8-evidence/redirect-matrix.json), [404-Proben](http-integrity-34.8-evidence/404-probes.json), [Preferred Host Report](http-integrity-34.8-evidence/preferred-host-report.json).
- [Messbaseline](http-integrity-34.8-evidence/measurement-baseline.json), [GSC-Rebaseline](http-integrity-34.8-evidence/gsc-rebaseline.json), [Scope-Prüfung](http-integrity-34.8-evidence/scope-validation.json).

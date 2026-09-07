# PFOTENTECHNIK 34.8 — PRODUCTION HTTP INTEGRITY

**Status: ABGESCHLOSSEN MIT AKZEPTIERTER AUSNAHME.** Production-Gate PASS am 2026-09-07T13:27:50.265Z. Der Nutzer akzeptiert ausdrücklich maximal zwei permanente Hops für HTTP-www. Alle anderen HTTP-/URL-Verträge bleiben verbindlich. Kein Ranking- oder Recovery-Nachweis.

## GSC REBASELINE

- 07.09 export imported: YES; Original-ZIP mit SHA-256 `580fc49471dd9f20703a381ce3bc0971b30e1d0667b808fa1e6693215b17d480`.
- Verified data through: **05.09.2026**; 34.7-Berichte und relevante Timeline-/Summary-Dateien korrigiert.
- Rewritten snapshots excluded: YES; bestehende Ausschlüsse `3dc0987`, `dc73a31`, `d50e45c` bleiben bestehen.
- 34.7 conclusion changed: **NO**.
- Originalexport: 736 Impressionen / 20 Klicks. Letzte 28 Tage (09.08.–05.09.): 44 / 0. Letzte 7 Tage (30.08.–05.09.): 7 / 0.
- 153 originale Host-Seitenzeilen, 134 normalisierte Pfade, 117 offengelegte Queries; 60 Top-10 / 86 Top-20 im gesamten Exportzeitraum. Keine aktuellen 7-/28-Tage-URL-/Query-Kohorten ableitbar; entsprechende Werte bleiben unbekannt.

## PREFERRED HOST

- Canonical host: `https://pfotentechnik.de`.
- HTTPS non-www: 200 PASS; HTTPS-www: 301 → HTTPS non-www → 200 PASS.
- HTTP non-www: 301 → HTTPS non-www → 200 PASS.
- HTTP-www: 301 → HTTPS-www → 301 → HTTPS non-www → 200. **Zwei Hops ausdrücklich vom Nutzer akzeptiert**, keine behauptete Plattformbeschränkung.
- Pfade, Querystrings und finales Hostziel: PASS. Ausnahme gilt nur für HTTP-www und maximal zwei permanente Weiterleitungen.
- Bestehender Build-Audit: 372 HTML-Dateien, 0 falsche öffentliche Hostsignale; Canonical, Sitemap, robots, JSON-LD, OpenGraph, interne absolute URLs und RSS geprüft.

## 404 INTEGRITY

- Zwei neue zufällige Pfade: non-www direkt 404; www permanent zum identischen non-www-Pfad, final 404. PASS.
- Homepage fallback removed: **YES (live)**; weder Homepage-200 noch Homepage-Title/-Canonical/-HTML.
- `404.html` aus Astro, noindex, außerhalb der Sitemap. Bestehende Legacy-Redirects bleiben wirksam.

## LEGACY REDIRECT

- `/produkt/petkit-yumshare-solo/` (auch ohne Schluss-Slash) → 301 → `/produkt/petkit-yumshare-solo-2/` → 200. PASS.
- Alle 68 Legacy-Regelvarianten PASS. Keine Contentänderung; keine alten Solo-Verweise in gerenderten Links, Schema oder Sitemap.

## PRODUCTION HTTP GATE

- **PASS mit dokumentierter HTTP-www-Ausnahme**, 0 fehlgeschlagene URL-Prüfungen, 0 Sitemap-Dokumentfehler, 0 robots-Fehler.
- 16 repräsentative Prüfungen, 258/258 Sitemap-URLs, 68/68 Legacy-Regeln und 15/15 Beobachtungs-URLs bestanden.
- Preferred host, HTTP→HTTPS, www→non-www, Query-Erhalt, echte 404, Legacy, Canonical, Sitemap und Homepage-Fallback-Erkennung: PASS.
- Der bestehende Release-Gate liest `config/production-http-policy.json`. Nur HTTP-www darf maximal zwei Hops verwenden; HTTPS-www und Legacy bleiben auf einen Hop begrenzt. Drei Hops, temporäre Redirects, falsche Ziele, Queryverlust oder Soft-404 bleiben Fehler.

## IMPLEMENTATION

- Hosting config changed: Hostweiterleitung und 404 live wirksam. Tatsächliche Cloudflare-Regelkonfiguration nicht eingesehen; HTTP-www-Zweischritt ausdrücklich akzeptiert.
- Redirect config changed: vorhandene Solo-Regeln beibehalten; keine unzulässige Domainregel in Pages `_redirects`. Cloudflare unterstützt dort keine Domainweiterleitungen. [Pages Redirects](https://developers.cloudflare.com/pages/configuration/redirects/).
- Zonenregel: Host `www.pfotentechnik.de`, dynamisches Ziel `concat("https://pfotentechnik.de", http.request.uri.path)`, 301, Query-Erhalt aktiv; ohne Protokollfilter. [Cloudflare www-Redirect](https://developers.cloudflare.com/rules/url-forwarding/examples/redirect-www-to-root/).
- Tests added: 14 HTTP-/Release-/Messbaseline-Regressionstests.
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

- PfotenTechnik tests: **748/748 PASS**, erneut nach Einführung der Ausnahme. Regression prüft zusätzlich Queryverlust und Homepage-Fallback trotz Ausnahme.
- Production Build und 23/23 lokale Releasephasen: zuvor bestanden; unveränderte Website-Dateien, keine erneute Build-Behauptung. Neuer vollständiger Live-Gate: PASS mit akzeptierter Ausnahme.
- Schema, Sitemap, robots, rendered links, Canonical, Duplicate-URL- und Orphan-Checks: bestehende lokale Validierung bleibt gültig; keine Content-/Linkänderungen.
- New blockers: **0**. 34.6 erneut per Hash geprüft: **6/6 NO CHANGE**.
- Shared-Core-Syntaxfehler weiterhin vorbestehend und außerhalb 34.8; nicht verändert oder repariert.

## MEASUREMENT

- Messbeginn: **2026-09-07T13:27:50.265Z**; Ende der ersten 14 Tage: **2026-09-21T13:27:50.265Z**.
- Zeitbasis: erfolgreiche Live-Verifikation des vom Nutzer bestätigten Fixes. Dies ist der autorisierte Messanker; kein unabhängig aus Cloudflare ausgelesener Deploymentzeitpunkt.
- Baseline: **POST_FIX_BASELINE**, exakt 15/15 Beobachtungs-URLs aus 34.7, aktuelle HTTP-/Canonical-Signale gespeichert.
- GSC bleibt Originalexport bis 05.09.; Zeitraum-Metriken und historische Bestpositionen/Queryzahlen klar getrennt. Aktuelle Einzel-URL-Positionen und Queryzahlen mangels passender Tagesdaten unbekannt.
- Content der 15 URLs mindestens 14 Tage stabil halten, außer belegten P0/P1-Fehlern. Keine kurzfristige Rankingwirkung behauptet.

## CONCLUSION

1. www/non-www konsolidiert? **Ja. HTTP-www mit ausdrücklich akzeptierten zwei Hops.**
2. Unbekannte URLs echte 404? **Ja.**
3. Solo-Redirect live? **Ja, 301 → Solo 2 → 200.**
4. Erkennt die Release-QA diese Fehler künftig? **Ja; ausschließlich der autorisierte HTTP-www-Zweischritt ist ausgenommen.**
5. Ausschließlich bestätigte technische Probleme bearbeitet? **Ja, keine Contentoptimierung.**
6. Ursache des Google-Einbruchs weiterhin unbewiesen? **Ja; auch kein Recovery-Nachweis.**
7. Nachmessung? **14 Tage ab dem oben dokumentierten erfolgreichen Live-Prüfzeitpunkt.**

## Evidenz

- [Vollständiger Production HTTP Test Report](http-integrity-34.8-evidence/production-http-test-report.md): jede URL mit initialem Status, Kette, finalem Status/URL, Canonical, PASS/FAIL.
- [Redirect Matrix](http-integrity-34.8-evidence/redirect-matrix.json), [404-Proben](http-integrity-34.8-evidence/404-probes.json), [Preferred Host Report](http-integrity-34.8-evidence/preferred-host-report.json).
- [Messbaseline](http-integrity-34.8-evidence/measurement-baseline.json), [GSC-Rebaseline](http-integrity-34.8-evidence/gsc-rebaseline.json), [Scope-Prüfung](http-integrity-34.8-evidence/scope-validation.json).

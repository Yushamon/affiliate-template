# 34.8: HTTP-Integrität veröffentlichen

Bevorzugter Host bleibt `https://pfotentechnik.de`. Inhalt und URL-Owner bleiben unverändert.

## Cloudflare-Hostregel

Im bestehenden Cloudflare-Zonenprojekt für **pfotentechnik.de** unter
**Rules → Redirect Rules → Single Redirect** eine Regel mit folgenden Werten
anlegen, oder genau diese bestehende Regel aktualisieren:

- Name: `PfotenTechnik preferred host 34.8`
- Custom filter expression: `(http.host eq "www.pfotentechnik.de")`
- Dynamic target expression: `concat("https://pfotentechnik.de", http.request.uri.path)`
- Status: **301**
- Preserve query string: **aktiviert**
- Vor konkurrierenden Host-/HTTPS-Weiterleitungen ausführen.

Der prüfbare API-Regelbody liegt in
[`cloudflare-preferred-host-rule.json`](../config/cloudflare-preferred-host-rule.json).
Er gehört in den Zonen-Ruleset der Phase `http_request_dynamic_redirect`.
Bestehende andere Regeln erhalten; nicht den gesamten Ruleset durch diesen Body ersetzen.
Kein Protokollfilter: dadurch werden HTTP-www und HTTPS-www direkt adressiert.
DNS ist bereits live erreichbar; keine pauschale DNS-Änderung.

Dies ist ein dokumentierter, vorbereiteter Regelbody, **keine automatisch durch
Pages eingelesene Konfiguration**. Der Gate bestätigt erst die tatsächliche
Wirksamkeit. Domainregeln in `public/_redirects` sind auf Cloudflare Pages nicht
unterstützt. [Single Redirects](https://developers.cloudflare.com/rules/url-forwarding/single-redirects/settings/),
[Pages Redirects](https://developers.cloudflare.com/pages/configuration/redirects/).

Die direkte Ein-Hop-Lösung bleibt bevorzugt. Für 34.8 hat der Nutzer den
HTTP-www-Zweischritt ausdrücklich akzeptiert. `config/production-http-policy.json`
erlaubt ausschließlich für HTTP-www maximal zwei permanente Hops. Zielhost,
Pfad, Querystring und sämtliche übrigen Prüfungen bleiben verbindlich.
Die Ausnahme wird in jedem Production-HTTP-Report ausgewiesen.

## Pages-Deployment

1. `npm --workspace apps/pfotentechnik run seo:release:prepare`
2. Bestehendes Pages-Projekt mit dem vorhandenen Git-/Deploymentweg veröffentlichen.
   Build: `npm run build:pfotentechnik`; Output: `apps/pfotentechnik/dist`.
3. Im Artefakt müssen `404.html` und `_redirects` enthalten sein. Die Solo-Regeln
   bleiben 301; kein Worker und keine neue Catch-all-Rewrite-Regel.
4. Deployment-ID, Revision und tatsächlichen Veröffentlichungszeitpunkt sichern.
5. `npm --workspace apps/pfotentechnik run seo:release:verify-production`
6. Nur nach PASS die 14-Tage-Baseline gemäß [Release-Workflow](seo-release-workflow.md) erfassen.

Astro baut `src/pages/404.astro` als Top-Level `404.html`. Diese beendet den
Cloudflare-Pages-SPA-Fallback für unbekannte Pfade, während `_redirects`
weiterhin bekannte Altpfade vor der Dateiauflösung behandelt.
[Astro Error Pages](https://docs.astro.build/en/basics/astro-pages/),
[Cloudflare Serving Pages](https://developers.cloudflare.com/pages/configuration/serving-pages/).

## Regression / Rücknahme

Prüfen: vorhandene Seiten 200, alle Sitemap-URLs direkt 200/self-canonical,
bekannte Legacy-URLs permanent zum richtigen Owner, zufällige Pfade 404,
www pfad-/querytreu nach apex. Keine Rücknahme der bestehenden Legacy-Regeln.
Bei einem durch die neue Hostregel verursachten Loop nur die Regel mit Ref
`pfotentechnik_preferred_host_34_8` deaktivieren und die Ursache prüfen.
Den 404-Fix nicht durch einen Homepage-Fallback umgehen.

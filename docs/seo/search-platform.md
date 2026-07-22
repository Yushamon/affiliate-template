# PfotenTechnik Search Platform

## 1. Architektur und Datenfluss

Die öffentliche Astro-Site bleibt ein statischer Build. Laufzeitaktionen werden nicht in die öffentliche Site eingebaut, sondern von einem ausschließlich lokalen Node-Service ausgeführt.

```text
Google OAuth
  → Google Provider (Auth + API-Client)
  → normalisierter Sync
  → src/data/seo/gsc-dashboard*.json
  → Search-Dashboard-Loader
  → SEO Cockpit und SEO Advisor

/admin/seo (Browser)
  → http://127.0.0.1:4178
  → Origin- und Request-Prüfung
  → feste Action-Allowlist
  → Provider oder fest registriertes Wartungsskript
```

Gemeinsame Module liegen unter `apps/pfotentechnik/src/lib/search/`. CLI-Einstiege unter `scripts/gsc/` sind dünne Wrapper um dieselben Provider-Services. Dadurch verwenden Setup, Test, Sync, Bericht und Dashboard-Aktionen dieselbe Authentifizierung und dieselben Pfade.

## 2. SearchProvider

`types.ts` definiert das gemeinsame `SearchProvider`-Interface sowie normalisierte Status-, Metrik-, Range-, Action- und Result-Typen. Die Registry stellt aktuell `google` und ein ehrliches Bing-Skeleton bereit. Der Advisor liest weiterhin das kompatible Dashboardformat über `dashboard-loader.ts`; GSC-spezifische Implementierungsdetails bleiben außerhalb des Advisors.

## 3. Lokale Dateien

Alle lokalen Search-Laufzeitdateien liegen gitignoriert unter `apps/pfotentechnik/.search/`:

- `google-client.json`: optionaler lokaler OAuth-Desktop-Client
- `google-token.json`: OAuth-Token einschließlich Refresh Token
- `google-config.json`: ausgewählte Property, keine Secrets
- `status.json`: Health- und Sync-Status, keine Secrets
- `audit.log.jsonl`: redigiertes lokales Action-Protokoll
- `admin-runtime.json`: Host und Port des laufenden Admin-Service

Vorhandene `.gsc/client-secret.json`, `.gsc/token.json` und `.gsc/config.json` werden lesend als Legacy-Fallback akzeptiert und nicht gelöscht. Neue oder erneuerte Tokens werden zentral nach `.search/google-token.json` geschrieben.

## 4. Google Cloud einmalig einrichten

1. In Google Cloud ein Projekt wählen oder anlegen.
2. Die Google Search Console API aktivieren.
3. Den OAuth-Zustimmungsbildschirm konfigurieren. Bei einer App im Testmodus das verwendete Google-Konto als Testnutzer zulassen.
4. Einen OAuth-Client vom Typ „Desktop-App“ erstellen.
5. Das Client-JSON herunterladen oder Client-ID und Client-Secret als lokale Umgebungsvariablen setzen.
6. Das Google-Konto muss Zugriff auf `sc-domain:pfotentechnik.de` besitzen.

Benötigte Umgebungsvariablen stehen in `apps/pfotentechnik/.env.example`:

```dotenv
GOOGLE_SEARCH_CLIENT_ID=
GOOGLE_SEARCH_CLIENT_SECRET=
GOOGLE_SEARCH_REDIRECT_URI=http://127.0.0.1:53682/oauth2callback
GOOGLE_SEARCH_PROPERTY=sc-domain:pfotentechnik.de
```

Eine lokale Client-Datei ist eine Alternative zu den ersten beiden Variablen. Niemals echte Werte in `.env.example` oder Git einchecken.

## 5. Erster OAuth-Setup

Mit heruntergeladener Desktop-App-Datei:

```powershell
npm run gsc:setup -- --client="C:\Pfad\client_secret.json"
```

macOS/Linux:

```bash
npm run gsc:setup -- --client=/pfad/client_secret.json
```

Der Ablauf prüft den Client, startet einen zeitlich begrenzten Loopback-Callback auf `127.0.0.1`, erzeugt einen zufälligen OAuth-State, öffnet die Google-URL und speichert erst nach erfolgreichem Code-Austausch den Token. `sc-domain:pfotentechnik.de` wird bevorzugt. Existiert bereits ein funktionierender Refresh Token, wird keine unnötige Neuanmeldung erzwungen. Explizit neu verbinden:

```powershell
npm run gsc:setup -- --force
```

Bei einem blockierten Browserstart wird die vollständige Autorisierungs-URL in der Konsole ausgegeben. Der Setup-Vorgang endet nach fünf Minuten statt still zu hängen. Der konfigurierte Loopback-Port muss frei sein; alternativ `GOOGLE_SEARCH_REDIRECT_URI` auf einen anderen lokalen Port setzen.

## 6. Verbindung testen

```powershell
npm run gsc:test
```

Der Test erzwingt die Nutzung des Refresh Tokens, prüft API-Erreichbarkeit und Property-Zugriff, führt eine kleine Search-Analytics-Abfrage aus und prüft den Dashboard-Schreibpfad. Normale Fehler enthalten eine deutsche Ursache, nächste Aktion und Fehlercode. Stacktraces erscheinen nur mit `SEARCH_DEBUG=1`.

## 7. Daten synchronisieren

```powershell
npm run gsc:sync
```

Der Sync lädt 7 Tage, 28 Tage, 3 Monate, 6 Monate und 12 Monate einschließlich Vergleichszeitraum, Seiten, Queries und Datumstrend. Große Dimensionstabellen werden über `startRow` paginiert; 429- und vorübergehende Serverfehler werden begrenzt wiederholt. CTR wird aus Klicks und Impressionen neu berechnet, Positionen werden impressionsgewichtet.

Ergebnisse bleiben kompatibel:

- `src/data/seo/gsc-dashboard-ranges.json`
- `src/data/seo/gsc-dashboard.json`

Erst nach vollständigem API-Erfolg werden validierte temporäre Dateien atomar ersetzt. Ein API-, Auth- oder No-Data-Fehler leert vorhandene Dashboarddaten nicht. Schema 2 ergänzt `provider: "google"` und `lowData`, ohne Schema-1-Daten unlesbar zu machen.

## 8. Bericht

```powershell
npm run gsc:report
```

Der Bericht belastet die Google API nicht erneut. Er liest die synchronisierte Range-Datei und erzeugt:

- `reports/search/google-search-report.md`
- `reports/search/google-search-report.json`

Enthalten sind Zeitraum, Kennzahlen, Änderungen, Top-Seiten, Top-Queries, Quick Wins, CTR-Chancen und Datenhinweis.

## 9. Lokaler Admin-Service und Dashboard

Separat starten:

```powershell
npm run seo:admin
npm exec --workspace apps/pfotentechnik -- astro dev
```

Oder kombiniert:

```powershell
npm run dev:pfotentechnik:seo
```

Danach `http://localhost:4321/admin/seo/` öffnen. Die Karte „Search Integrations“ zeigt Verbindung, Property, Tests, Syncs, Dauer, Datenumfang und sichere Fehler. Verfügbar sind:

- Google verbinden / OAuth neu verbinden
- Verbindung testen
- Jetzt synchronisieren
- Bericht erzeugen
- Content Graph aktualisieren
- SEO Audit starten

Ohne lokalen Service bleibt die statisch erzeugte Adminseite lesbar, kennzeichnet Aktionen aber als lokal nicht verfügbar und deaktiviert die Buttons. Nach einem erfolgreichen Sync wird die Seite neu geladen, damit die statisch eingelesenen Dashboarddaten aktualisiert erscheinen.

## 10. Sicherheitsmodell

Der Admin-Service bindet standardmäßig ausschließlich an `127.0.0.1:4178`. Er akzeptiert Browserzugriffe nur von explizit bekannten lokalen Astro-Origins. Verändernde Aktionen benötigen `POST` und `application/json`; Form-POSTs und unbekannte Origins werden abgewiesen.

Der Client sendet ausschließlich eine Action-ID. Es gibt keine Route für freie Commands, Argumente oder Dateipfade. Google-Aktionen rufen Provider-Funktionen direkt auf. Zwei Wartungsskripte werden nur mit festem Node-Pfad, festen Argumenten, `shell: false`, festem Arbeitsverzeichnis, Timeout und Output-Limit ausgeführt.

Weitere Schutzmaßnahmen:

- zufälliger OAuth-State und zehn Minuten gültige Setup-Session
- Token und Client Secret werden nie an den Browser gesendet
- sichere Statusantworten ohne Kontodaten oder ENV-Ausgabe
- Redaction für Token, Secret, Code, State und Authorization-Header
- Start-Rate-Limit und Lock pro Action
- `409 Conflict` bei identischer paralleler Aktion
- lokales, secretfreies Audit-Log
- keine öffentliche Bindung, außer `SEARCH_ADMIN_HOST` wird bewusst geändert

## 11. Statischer Build und Deployment

`astro.config.mjs` bleibt bei `output: "static"` und verwendet keinen Server-Adapter. Astro-API-Routen existieren nach dem Build daher nicht als allgemeiner Admin-Server. Der lokale Search-Admin-Service ist nicht Teil von `dist`, wird nicht deployed und darf auf einem Produktionshost nicht als Dashboard-Backend vorausgesetzt werden. Online sind die Adminseiten nur lesbare, `noindex,nofollow`-markierte statische Ansichten.

## 12. OAuth über das Dashboard

„Google verbinden“ fordert beim lokalen Service eine zeitlich begrenzte Setup-Session an. Das Dashboard öffnet die serverseitig erzeugte Google-URL. Google leitet zum lokalen Callback zurück; dort werden State und Ablaufzeit validiert, der Code eingelöst und der Refresh Token serverseitig gespeichert. Das Dashboard pollt ausschließlich den sicheren Sessionstatus. Bei „OAuth neu verbinden“ ist eine explizite Bestätigung nötig; der vorhandene Token wird nicht gelöscht, bevor der neue erfolgreich gespeichert wurde.

## 13. Status, Actions und Logging

Actions besitzen ID, Status (`queued`, `running`, `succeeded`, `failed`, `cancelled`), reale Schrittangaben sowie Start- und Endzeit. Das Dashboard pollt den Status. Es zeigt keine erfundenen Prozentwerte. `status.json` wird atomar aktualisiert und kann fehlen, ohne den Build zu beschädigen.

`audit.log.jsonl` enthält Zeitstempel, Provider, Aktion, Status, Dauer, sicheren Fehlercode und optionale Datensatzangaben. Mit `SEARCH_DEBUG=1` werden zusätzliche technische Informationen in der lokalen Konsole ausgegeben; Secrets bleiben redigiert.

## 14. Fehlerbehebung

- `SEARCH_CLIENT_CREDENTIALS_MISSING`: Desktop-Client-Datei über `gsc:setup -- --client=...` importieren oder ENV setzen.
- `SEARCH_TOKEN_MISSING`: OAuth-Setup starten.
- `SEARCH_TOKEN_REFRESH_FAILED`: OAuth explizit neu verbinden.
- `SEARCH_PROPERTY_ACCESS_DENIED`: Berechtigung für `sc-domain:pfotentechnik.de` prüfen.
- `SEARCH_RATE_LIMITED`: kurz warten und erneut versuchen.
- `SEARCH_SYNC_ALREADY_RUNNING`: laufende Action beenden lassen.
- `SEARCH_ADMIN_SERVICE_UNAVAILABLE`: `npm run seo:admin` starten.
- `SEARCH_WRITE_FAILED`: Rechte und freien Speicher prüfen; vorhandene Daten nicht manuell leeren.

Wenn der OAuth-Callback-Port belegt ist, `GOOGLE_SEARCH_REDIRECT_URI` auf einen freien `127.0.0.1`-Port setzen. Wenn Astro auf einem anderen Port läuft, dessen vollständigen Origin in `SEARCH_ADMIN_ORIGINS` ergänzen.

## 15. Token zurücksetzen und Property ändern

Ein Token darf nur bewusst lokal entfernt werden. Zuerst Admin-Service und Astro stoppen, dann `apps/pfotentechnik/.search/google-token.json` sichern oder entfernen und `npm run gsc:setup -- --force` ausführen. Die alte `.gsc`-Datei kann sonst als Legacy-Fallback greifen; für einen vollständigen Reset auch deren Nutzung bewusst prüfen. Keine dieser Dateien committen.

Die Property wird beim Setup gewählt und in `.search/google-config.json` gespeichert. Alternativ vor dem Setup `GOOGLE_SEARCH_PROPERTY` setzen. Die Property muss in der Liste des verbundenen Google-Kontos vorkommen.

## 16. Bing-Vorbereitung

Bing besitzt Provider-ID, Konfigurationstyp, Registry-Eintrag und ehrlichen Status `not-configured`. Es werden keine Dummy-Metriken und keine scheinbar funktionsfähigen Buttons ausgegeben. Für die spätere Integration fehlen noch sichere API-Konfiguration, Authentifizierung, Bing-spezifischer Client, normalisierter Sync und echte CLI-Commands. Erst danach sollten `bing:setup`, `bing:test` und `bing:sync` ergänzt werden.

## 17. Tests und Wartung

```powershell
npm run test:search
npm run build:pfotentechnik
npm run seo:audit
npm run audit:content-graph
npm run lint:content
```

Die Search-Tests benötigen keine echten Google-Zugangsdaten. Google-API-Antworten werden für Normalisierungs- und Range-Tests gemockt. Ein lokales `gsc:test` darf ohne Credentials erwartungsgemäß mit einem verständlichen Konfigurationsfehler enden.

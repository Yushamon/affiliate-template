# Bing Webmaster Tools für PfotenTechnik

## API-Key und Website einrichten

1. Bei [Bing Webmaster Tools](https://www.bing.com/webmasters/) anmelden.
2. `https://pfotentechnik.de` im selben Konto hinzufügen und verifizieren.
3. Unter Einstellungen → API-Zugriff einen API-Key erzeugen.
4. Im Repository lokal `apps/pfotentechnik/.env` anlegen oder ergänzen:

```dotenv
BING_WEBMASTER_API_KEY=HIER_DEN_API_KEY_EINTRAGEN
BING_WEBMASTER_SITE_URL=https://pfotentechnik.de
```

Der kompatible ältere Name `BING_SITE_URL` wird akzeptiert, wenn `BING_WEBMASTER_SITE_URL` nicht gesetzt ist. Die `.env`-Datei ist gitignoriert. Den Key niemals in `.env.example`, ein `PUBLIC_*`-Feld, ein Dashboard-JSON oder einen Browserrequest schreiben.

Microsoft dokumentiert die API-Key-Einrichtung und weist darauf hin, dass ein Key für den Benutzer und dessen verifizierte Sites gilt: [Getting Access to the Bing Webmaster Tools API](https://learn.microsoft.com/en-us/bingwebmaster/getting-access).

## Verbindung und Synchronisierung

Aus dem Repository-Root:

```powershell
npm run bing:test
npm run bing:sync
npm run bing:report
```

`bing:test` prüft:

- lokale Key- und Site-Konfiguration,
- Erreichbarkeit der offiziellen Bing-API,
- eindeutige Zuordnung der normalisierten Site,
- `IsVerified`,
- einen echten Statistikabruf,
- den lokalen Schreibpfad.

`bing:sync` lädt echte Daten über:

- `GetUserSites`
- `GetQueryStats`
- `GetPageStats`
- `GetCrawlStats`

Die Bing-Antworthülle `{ "d": ... }` wird validiert und entpackt. Microsoft-Datumswerte wie `/Date(1316156400000-0700)/` und ISO-Daten werden unterstützt; ungültige Daten werden verworfen. Die Request-URL wird nie protokolliert, da sie den API-Key enthält.

Ausgaben:

- `src/data/seo/bing-dashboard-ranges.json`
- `src/data/seo/bing-dashboard.json`
- `reports/search/bing-search-report.md`
- `reports/search/bing-search-report.json`

Bei einem API- oder Mappingfehler bleiben vorhandene gültige Bing-Dateien erhalten. Neue Dateien werden zunächst vollständig erzeugt und validiert, danach atomar ersetzt.

## Datenmodell und Aktualität

`GetQueryStats` liefert unter anderem `Query`, `Date`, `Clicks`, `Impressions`, `AvgClickPosition` und `AvgImpressionPosition`. `GetPageStats` nutzt dasselbe Modell; im Feld `Query` steht dort die Seiten-URL. Die sichtbare durchschnittliche Position basiert auf `AvgImpressionPosition`, die Klickposition bleibt separat erhalten. CTR wird stets als Klicks geteilt durch Impressionen neu berechnet.

Laut Microsoft werden Query- und Page-Statistiken wöchentlich aktualisiert: [GetQueryStats](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.getquerystats?view=bing-webmaster-dotnet), [GetPageStats](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.getpagestats?view=bing-webmaster-dotnet). Crawl-Statistiken werden täglich aktualisiert und enthalten reale Felder wie `CrawledPages`, `CrawlErrors`, `Code4xx`, `Code5xx` und `InIndex`: [GetCrawlStats](https://learn.microsoft.com/en-us/dotnet/api/microsoft.bing.webmaster.api.interfaces.iwebmasterapi.getcrawlstats?view=bing-webmaster-dotnet).

Die Plattform interpoliert deshalb keine Tagesdaten, verteilt Wochenwerte nicht künstlich und rechnet nicht hoch. Ein leerer Zeitraum ist ein gültiges leeres Ergebnis. Fehlende Trafficdaten bedeuten nicht automatisch „nicht indexiert“.

## Gemeinsamer Google-/Bing-Sync

```powershell
npm run search:test
npm run search:sync
npm run search:report
```

Der gemeinsame Sync:

1. setzt einen lokalen Lock,
2. startet konfigurierte Provider isoliert,
3. sammelt Ergebnisse und Fehler je Provider,
4. verwendet nur gültige aktuelle oder ausdrücklich als veraltet markierte lokale Daten,
5. normalisiert URL- und Query-Dubletten,
6. erzeugt `search-dashboard-ranges.json` und `search-dashboard.json`,
7. validiert die Datenquelle des SEO Advisors,
8. aktualisiert den lokalen Status.

Statuswerte:

- `succeeded`: alle konfigurierten Provider erfolgreich
- `partial`: mindestens ein Erfolg und mindestens ein Fehler
- `failed`: kein konfigurierter Provider erfolgreich; Combined bleibt unverändert
- `skipped`: kein Provider konfiguriert

Combined summiert Klicks und Impressionen, berechnet CTR aus den Summen und gewichtet Positionen mit Impressionen. Pro Seite und Query bleiben `providers.google`, `providers.bing` und `sources` erhalten. Empfehlungen formulieren fehlende Trafficdaten vorsichtig und behaupten keinen Indexierungsstatus ohne echten Indexierungsendpunkt.

## Dashboard

```powershell
npm run dev:pfotentechnik:seo
```

Dann `http://localhost:4321/admin/seo/` öffnen. Die Search-Karte zeigt Google, Bing und Combined getrennt. Primäraktion ist „Alle Suchdaten synchronisieren“. Während des Ablaufs werden echte Schritte angezeigt; bei Teilerfolg bleiben Providerstatus und konkrete sichere Fehlermeldung getrennt sichtbar.

Der Admin-Service bindet standardmäßig ausschließlich an `127.0.0.1`. Der Browser kann nur feste Action-IDs senden; API-Key, Befehle, Argumente, Pfade und Environment sind keine Clienteingaben.

## Fehlerbehebung

- `BING_API_KEY_MISSING`: Key in `apps/pfotentechnik/.env` ergänzen.
- `BING_AUTH_FAILED`: Key im Bing-Portal prüfen oder rotieren.
- `BING_SITE_NOT_FOUND`: prüfen, ob exakt dieselbe Site im Key-Konto liegt.
- `BING_SITE_NOT_VERIFIED`: Site im Bing-Portal verifizieren.
- `BING_RATE_LIMITED`: warten und erneut versuchen.
- `BING_TIMEOUT` oder `BING_API_UNAVAILABLE`: Verbindung prüfen und später wiederholen.
- `BING_NO_DATA`: Verbindung kann trotzdem gültig sein; Datenstand und Bing-Portal prüfen.

## Key rotieren oder kompromittierter Key

Wenn der Key verloren oder kompromittiert wurde, im Bing-Webmaster-Portal den alten Key löschen und neu erzeugen. Danach ausschließlich den lokalen Wert in `apps/pfotentechnik/.env` ersetzen und `npm run bing:test` ausführen. Microsoft weist darauf hin, dass beim Löschen des alten Keys alle daran gebundenen Anwendungen aktualisiert werden müssen. Den alten oder neuen Key niemals in Tickets, Logs, Screenshots oder Git einfügen.

## Deployment-Grenze

Die öffentliche Astro-Site bleibt vollständig statisch. Der lokale Admin-Service und der Bing-Key werden nicht nach `dist` ausgeliefert. Online zeigt der Adminbereich nur den beim Build vorhandenen lesbaren Datenstand; Aktionen funktionieren ausschließlich mit dem lokal gestarteten Service.

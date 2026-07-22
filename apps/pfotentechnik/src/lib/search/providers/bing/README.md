# Bing-Provider

Der Bing-Provider ist absichtlich nur vorbereitet. Registry, Typen und Statusmodell existieren, aber es gibt noch keine API-Konfiguration, Authentifizierung oder Synchronisierung. Er liefert keine Dummy-Daten und meldet Aktionen als nicht konfiguriert.

Vor neuen `bing:*`-Commands müssen implementiert werden:

1. sichere lokale API-Konfiguration,
2. echter Bing-Webmaster-Tools-Client,
3. normalisierte Range-Abfragen,
4. atomare Provider-Datendateien,
5. gemockte Provider-Tests,
6. Dashboard-Aktionen über dieselbe Allowlist.

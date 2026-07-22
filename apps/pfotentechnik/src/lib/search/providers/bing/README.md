# Bing-Provider

Der Provider nutzt die offizielle JSON-API von Bing Webmaster Tools mit API-Key-Authentifizierung. Unterstützt werden `GetUserSites`, `GetQueryStats`, `GetPageStats` und `GetCrawlStats`. Trafficdaten werden ohne Interpolation nach den tatsächlich gelieferten Datumswerten gefiltert; Crawl-Daten bleiben als eigene Bing-Felder erhalten.

Der API-Key wird ausschließlich serverseitig aus `BING_WEBMASTER_API_KEY` gelesen und weder in Status, Dashboarddateien, Logs noch Browserantworten übernommen.

# SEO Price Editor Stability 1.0.0

## Ursache

Die Produktpflege lädt nach dem Rendern den persistierten Zustand vom lokalen
Admin-Dienst. Jede Serverantwort rief `updateRow()` auf, und `updateRow()`
synchronisierte den Editor ohne Rücksicht auf Fokus oder ungespeicherte Eingaben.
Damit konnten verspätete oder wiederholte Synchronisierungen ein gerade
bearbeitetes Preisfeld zurücksetzen.

Im Astro-Entwicklungsmodus kommt hinzu, dass Änderungen an Produktdateien einen
Reload auslösen können. Ein reiner Fokusschutz reicht deshalb nicht.

## Änderung

- Aktive oder geänderte Editoren werden von Server-Synchronisierungen nicht überschrieben.
- Ungespeicherte Entwürfe werden im Session Storage des Tabs gehalten.
- Nach einem Dev-Reload werden Entwürfe wiederhergestellt.
- Serverseitiges Sortieren und Umhängen der Zeilen wird während der Bearbeitung ausgesetzt.
- Erst nach erfolgreichem Speichern wird der Entwurf verworfen und der persistierte Wert erzwungen übernommen.
- Ein sichtbarer Warnrahmen kennzeichnet ungespeicherte Editoren.

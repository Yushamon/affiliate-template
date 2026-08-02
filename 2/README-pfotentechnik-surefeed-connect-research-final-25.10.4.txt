PfotenTechnik SureFeed Connect Research Final 25.10.4

Ein finaler, wiederholbarer Installer für den vollständigen
SureFeed-Connect-Research-Auftrag.

Eigenschaften:
- erkennt unveränderte, teilweise angewendete und bereits fertige Stände
- strukturelle Frontmatter- und Vergleichsbearbeitung
- keine komplexen dynamischen RegExp für Datenänderungen
- Backups unter .patch-backups
- Score und redaktionelle Produktempfehlung werden vor und nach dem
  Schreiben verglichen und dürfen sich nicht ändern
- kein statischer Preis im Fließtext oder Preisblock
- Preis und Verfügbarkeit bleiben "unknown" bzw. "aktuell prüfen"
- Hub, Einzelgerät und Bundle werden klar getrennt
- App-Auswertung, 1-Gramm-Portionierung, 400 ml sowie Nass- und
  Trockenfutter werden belegt eingeordnet
- alle Vergleiche, die das Produkt führen, werden automatisch gefunden
- Windows: npm über cmd.exe /d /s /c
- macOS/Linux: direkter npm-Aufruf
- kompatibel mit Node 24 und Node 26
- führt Tests, Audits, Release-Gate und vollständigen Build aus
- zweiter Lauf bleibt erfolgreich und schreibt aktuelle Dateien nicht neu

Installation:
  Datei in Ordner 3 legen

  node ./3/apply-pfotentechnik-surefeed-connect-research-final-25.10.4.mjs

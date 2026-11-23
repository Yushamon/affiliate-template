# Geräteübergreifende Fehlerprüfung

110 Produktquellen wurden inventarisiert; alle 14 GPS-Produktseiten zusätzlich im Build und live nach
Netz-/Notstromfehlbehauptungen geprüft. Der Bericht `scope-and-render-validation.json` dokumentiert
den Renderbefund; `source-access.json` die tatsächlichen Live-Abrufe. Die kanonischen Ziele stammen aus
Bestandsdaten beziehungsweise dem Production-HTML.

## Herkunft des früheren Akku-Problems

Die gemeinsamen Ableitungen liegen in `src/domain/productExperience/decisionQuality.mjs` und
`legacyConsequences.ts`. Dort existiert ein legitimer Text für Geräte ohne Akku. Sein bloßes Vorkommen
im Repository beweist keinen aktuellen Trackerfehler. Die Existenz eines Akkus, fehlende Angaben zur
Zellchemie und unbekannte Austauschbarkeit werden inzwischen differenziert behandelt.
`consequences.ts` hält den alten Renderer nur für die zehn geschützten Experimentprodukte isoliert.
Es wird kein weiteres globales Template verändert.

Die produktbezogenen Daten, zur Buildzeit abgeleiteten Entscheidungshinweise, generierten
Astro-Collectiondaten, finalen Dokumente und Live-Ausgaben sind unterschiedliche Prüfobjekte.
Die neue Regression berechnet Hinweise für alle echten GPS-Produkte und verbietet darin
Netz-/Notstrom- sowie Nachfüllkontext. Bestehende Tests decken explizite/verneinte/unbekannte Akkuwerte ab.

## Weitere Klassen

- One RFID: Halsband-Tag und implantierter Chip sind korrekt getrennt; eine absolute Zugangs-/Schutzbehauptung
  blieb in Stärke, Konsens und Urteil stehen. Diese lokalen Formulierungen wurden angepasst.
- Standard-SureFeed und Connect: keine Gleichsetzung von Offline-Napf und Hub-/App-Gerät.
- Kamera-WiFi-Generationen: keine neue Kamera- oder Firmwareeigenschaft auf Geräte ohne passenden Beleg übertragen.
- Mehrere Näpfe bedeuten in den geprüften Mehrtiertexten bereits keine individuellen Rationen.
- Hersteller-Akkumaxima werden bei Tractive bereits von Praxisbedingungen getrennt. Die Live-Ausnahme
  innerhalb einer Energiesparzone ist ein eigenständiger konkreter FAQ-Befund, kein Wiederauftreten des Akkufehlers.

Die Prüfung ist ein gezielter Textbaustein- und Variantenabgleich, keine Behauptung einer vollständigen
Neuverifikation jeder technischen Eigenschaft aller 110 Produkte. Nicht ausreichend belegte Angaben werden
nicht aus plausiblem Verhalten ergänzt. Für neue ungeprüfte Produktfehler wird keine Fehlerzahl erfunden.

PfotenTechnik Product UX Architecture Fix 25.7.4

Diese Version ersetzt den zuvor erstellten Patch 25.7.3.

Grundsatz:
Die Fehler werden an ihrer gemeinsamen Ursache behoben. Der Patch hinterlässt keine
zusätzlichen CSS-Gegenregeln für Timeline, Produkt-Fit oder einzelne Produktseiten.

Behoben wird:

1. Listenmarker
   - Der breite Legacy-Selektor `.product-detail li::before` wird auf direkte alte
     Inhaltslisten begrenzt.
   - Neue Produktkomponenten werden dadurch nicht mehr pauschal mit Haken überschrieben.
   - „Ja, wenn …“ besitzt eigene grüne Haken.
   - „Nein, wenn …“ besitzt eigene rote Kreuze.
   - Keine `content: none`-Sonderregeln für Timeline, Fit-Assistent oder Verdict.

2. Geeignet-für-Angabe
   - Die Hero-Angabe wird zentral aus Tierart und Tiergröße gebildet.
   - Beispiel: „Katzen und kleine bis mittelgroße Hunde“.
   - Kein `slice(0, 2)` und keine produktbezogene Xiaomi-Sonderlogik.

3. Technische Daten
   - Kamera, WLAN, Futterart und Akku werden vorrangig aus strukturierten
     Spezifikationen abgeleitet.
   - „Akku: Nein“ wird nicht mehr durch den Begriff „Batterie-Backup“ zu einem
     vermeintlichen Akkubetrieb.
   - Akku, Notstrombatterie und Netzbetrieb erhalten unterschiedliche Erklärungen.
   - Alte generische Stromversorgungs-Erklärungen werden zentral normalisiert.

4. Produktgalerie
   - Die Bildfläche wird klar begrenzt.
   - Das Hauptbild nutzt die verfügbare Fläche mit `object-fit: contain`.
   - Infografiken und Hochformate bleiben vollständig sichtbar.

5. Absicherung
   - Sieben Regressionstests.
   - Konfliktsichere Vorprüfung vor dem Schreiben.
   - Keine Teiländerungen bei fehlgeschlagener Vorprüfung.
   - Backup unter `.patch-backups/`.
   - Wiederholbar und idempotent.

Empfohlener Ablauf

1. Aktuellen Stand committen.

2. Nur prüfen:

   node 3/apply-pfotentechnik-product-ux-architecture-fix-25.7.4.mjs --check

3. Anwenden:

   node 3/apply-pfotentechnik-product-ux-architecture-fix-25.7.4.mjs

4. Build:

   npm --workspace apps/pfotentechnik run build

Ohne automatische Testläufe:

   node 3/apply-pfotentechnik-product-ux-architecture-fix-25.7.4.mjs --no-tests

Der Installer führt standardmäßig aus:

- product-ux-architecture-25.7.4.test.mjs
- test:product-standard-3
- test:product-ux-cleanup
- test:css-product-system

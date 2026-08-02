PfotenTechnik SureFeed Comparison Coverage Final 25.10.5

Behebt die zwei konkreten Blocker des Comparison Data Platform Audits.

Änderungen:
- Mehrtiervergleich:
  - PETLIBRO Granary Dual: keine individuelle Tiertrennung
  - PETLIBRO Granary Dual: keine Mikrochip-/RFID-Zugangskontrolle
- Seniorenvergleich:
  - SureFeed Connect: geschützter 400-ml-Einzelnapf
  - SureFeed Connect: konkrete Reinigungseinordnung

Warum Vergleichs-Overrides:
Die vier Begriffe sind redaktionelle Vergleichskriterien. Die zugrunde
liegenden Fakten sind bereits in den Produkt-MDs vorhanden. Neue globale
Produktfelder wären Doppelpflege und würden das Datenmodell unnötig
erweitern.

Der Installer:
- ist idempotent
- legt Backups an
- prüft die zugrunde liegenden Produktbelege vor dem Schreiben
- verändert nur zwei Vergleichsdateien, einen Test und package.json
- verwendet unter Windows cmd.exe für npm
- führt Test, striktes Vergleichs-Audit, Release-Gate und Build aus
- prüft im Report, dass genau die zwei Zielvergleiche nicht mehr blockieren

Ausführen:
  node ./3/apply-pfotentechnik-surefeed-comparison-coverage-final-25.10.5.mjs

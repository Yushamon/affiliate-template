PfotenTechnik SureFeed Price Source Schema Fix 25.10.6

Ursache:
price.source.type war auf "manufacturer" gesetzt. Das Produktschema
erlaubt jedoch nur:
- merchant
- affiliate
- editorial
- manual
- unknown

Lösung:
- SureFeed price.source.type wird auf "manual" gesetzt
- Hersteller-ID und Hersteller-Label bleiben unverändert
- der alte SureFeed-Finalinstaller 25.10.4 wird ebenfalls korrigiert
- keine Änderung am Schema
- keine Änderung an Score, Empfehlung, Preisstatus oder Verfügbarkeit
- Tests, Produkt-Audit, Vergleichs-Audit, Release-Gate und Build laufen erneut

Ausführen:
  node ./3/apply-pfotentechnik-surefeed-price-source-schema-fix-25.10.6.mjs

Bei Ablage im Ordner 2:
  node ./2/apply-pfotentechnik-surefeed-price-source-schema-fix-25.10.6.mjs

PfotenTechnik Herstellerbereich Rebuild 30.1.0

Dieser Patch ersetzt das alte Hersteller-Hero-Element vollständig.

Änderungen:
- Neues Component:
  apps/pfotentechnik/src/components/manufacturer/ManufacturerOverviewHero.astro
- Herstellerroute nutzt nur noch dieses Component.
- Altes <header class="manufacturer-hero"> wird entfernt.
- Legacy-Hero-Styles 4.2.0, 4.3.0 und 30.0.x werden aus der Route entfernt.
- Das neue Element verwendet ausschließlich kollisionsfreie
  pt-manufacturer-overview-Klassen.
- packages/affiliate-core/src/styles/manufacturer.css wird nicht verändert,
  weil es auch von anderen Workspaces genutzt werden kann.
- Mobil: Name, Bild, Beschreibung.
- Desktop: Text links, Bild rechts.
- OptimizedImage erhält seine Klasse direkt. Es wird kein picture-Wrapper
  vorausgesetzt.
- Kein !important.
- Verhaltenstest statt Formatierungsprüfung.
- Backup und idempotenter zweiter Lauf.

Ausführen:
node ./2/apply-pfotentechnik-manufacturer-overview-rebuild-30.1.0.mjs

Prüfen:
node --check ./2/apply-pfotentechnik-manufacturer-overview-rebuild-30.1.0.mjs
node --test apps/pfotentechnik/test/manufacturer-overview-rebuild-30.1.0.test.mjs
npm --workspace apps/pfotentechnik run build

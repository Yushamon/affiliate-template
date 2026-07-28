# Interne Verlinkung 3.0.0

## Ziel

Die automatische interne Verlinkung trennt seit Version 3.0 anklickbare Begriffe strikt von bloßen Kontext- und Intent-Signalen. Semantische Nähe darf ein Ziel bewerten, aber keinen neuen Ankertext erzeugen.

## Zentrale Taxonomie

Die Datenbasis liegt in `src/domain/content/linkTaxonomy.data.mjs`. Der typisierte Zugriff erfolgt über `linkTaxonomy.ts`.

Jeder Eintrag unterscheidet:

- `anchorAliases`: explizit erlaubte, anklickbare Wortgruppen
- `contextTerms`: thematische Signale, die nie selbst zu einem Link werden
- `intentTerms`: Signale für Vergleich, Kaufberatung, Anleitung oder Fehlerbehebung
- `exclusiveAnchors`: Begriffe mit einem einzigen deterministischen Eigentümer
- `topics`: gemeinsame Themenbasis für Inline-Links, Related Content, Next Steps und Content Graph

## Ownership

Die generischen Kategorien besitzen feste Eigentümer:

- `Futterautomat` und `Futterautomaten` → `/smarte-futterautomaten/`
- `Trinkbrunnen` → `/trinkbrunnen/`
- `GPS-Tracker` → `/gps-tracker/`
- `smarte Haustiertechnik` und `Pet Tech` → `/smarte-haustiertechnik/`

Bei konkurrierenden Treffern gilt: exklusiver Eigentümer, längere Phrase, Intent-Passung, Kontext-Passung, Funnel-Priorität, redaktionelle Priorität und erst zuletzt die stabile ID.

## Blockierte Einzelanker

Generische Wörter wie `Hund`, `Katze`, `App`, `Kamera`, `Wasser`, `Nassfutter`, `Test` oder `Ratgeber` dürfen nur Kontext sein. Längere eindeutige Phrasen wie `Futterautomat für Hunde` oder `Futterautomat mit Kamera` bleiben zulässig.

## Produkt- und Herstellerlinks

Produktseiten werden nur durch den exakten Produktnamen oder explizite Aliase verlinkt. Herstellerseiten werden nur durch den exakten Herstellernamen oder gepflegte Aliase verlinkt. Kategoriebegriffe und allgemeine Modellzusätze werden nicht aus Titeln abgeleitet.

## Funnel-Regelwerk

`packages/affiliate-core/src/linking/rules.ts` ist die einzige Gewichtungsquelle. Es kennt `hub`, `knowledge`, `comparison`, `product` und `manufacturer`. Gruppenlimits werden bei der Auswahl tatsächlich angewendet.

## Linkbudget

- Cornerstone: 8
- Wissensseite: 7
- Vergleich: 6
- Produktseite: 5
- Herstellerseite: 6

`AutoLinkContent.astro` hält das Budget requestweit in `Astro.locals`. Mehrere Renderer auf derselben Seite teilen dadurch Zielverbrauch, Gruppenlimits und Gesamtbudget.

## Globale Auswahl

Der HTML-Linker sammelt zuerst alle Treffer in allen zulässigen Textknoten. Erst danach wird seitenweit ausgewählt. Normale Absätze erhalten einen Bonus. Badges, Labels, Tabellen, kurze UI-Texte, Navigation und ähnliche Bereiche werden abgewertet oder vollständig ignoriert. Bestehende Links, Überschriften, Buttons, Code, Formulare, Script und Style bleiben unangetastet.

## Related Content

Ein Typbonus wird erst nach bestätigter thematischer Nähe vergeben. Erforderlich ist mindestens eines der folgenden Signale: gemeinsames Thema, exakter Tag, gemeinsamer Hub, ausreichende semantische Nähe oder eine explizite Relation.

## Next Steps

Die Erkennung verwendet mehrere Themen gleichzeitig. Inhalte wie `Katze trinkt zu wenig` können `gesundheit` und `trinkbrunnen` besitzen. Ein First-Match-Verfahren wird nicht mehr verwendet.

## Content Graph

Der Builder liest Vergleiche aus `src/content/comparisons`, erzeugt Produktrouten unter `/produkt/`, markiert Cornerstones anhand der zentralen Taxonomie und unterscheidet explizite von automatisch erzeugbaren Relationen.

## SEO-Co-Pilot

`loadContent.ts` berechnet effektive Auto-Links und stellt sie dem Advisor als nicht sichtbare Prüfmarker bereit. `engineV3.ts` erkennt Cornerstones dynamisch aus der Taxonomie. Ein Hub-Link wird daher nicht mehr als fehlend gemeldet, wenn ihn die reale Link-Engine erzeugen würde.

## Pflege neuer Begriffe

1. Begriff einem oder mehreren Themen zuordnen.
2. Nur echte Synonyme oder eindeutige Namensvarianten in `anchorAliases` aufnehmen.
3. Generische, tierbezogene oder funktionale Wörter als `contextTerms` pflegen.
4. Vergleichs- oder How-to-Signale als `intentTerms` pflegen.
5. Einen generischen Begriff nur dann exklusiv vergeben, wenn genau eine Zielseite die Suchintention besitzt.
6. Core-Tests und `test:internal-linking` ausführen.
7. Strict-Audit prüfen.

## Audit und Strict-Modus

`scripts/audit-internal-links.mjs` erzeugt:

- `internal-link-audit.json`
- `internal-link-audit.md`
- `internal-link-migration.md`

Strict schlägt bei ungültigen Zielrouten, unlösbaren Ownership-Konflikten, blockierten effektiven Ankern, Selbstlinks, alter semantischer Anchor-Erweiterung und hochkonfidenten fachfremden Links fehl.

## Grenzen

Die Engine bewertet lokalen Satz- und Absatzkontext regelbasiert. Sie ersetzt keine redaktionelle Prüfung seltener Mehrdeutigkeiten. Produkt- und Herstelleraliase werden bewusst nicht automatisch erfunden. Neue Aliase müssen explizit gepflegt werden.

# Evidenzänderungen und historische Prüfsnapshots

35.6.1 behält die historischen Baselines bei und ergänzt einen expliziten Revisionsnachweis für die fünf
belegten Inhaltsänderungen aus 35.6. `research/product-evidence-35.6/changes.json` nennt pro Datei den
exakten Vorher-/Nachherhash und die erlaubten Feldgruppen; `originals.json.gz` erhält den ursprünglichen
Quelltext. Experimentseiten können keine Ausnahme erhalten. Scores, Metadaten, Preis- und Kaufdaten,
URLs und Original-Entscheidungshinweise bleiben außerhalb der erlaubten Gruppen.

`scripts/product-evidence/approved-changes.mjs` prüft zuerst die tatsächliche heutige Datei vollständig.
Erst bei exakter Übereinstimmung wird für einen ausdrücklich historischen Vertrag die vorherige Fassung
bereitgestellt. Es gibt keinen Pfad-/Hash-Wildcard, keinen allgemeinen Skip und keine Erlaubnis für weitere
Produktänderungen. Aktuelle Quellen, Rendering, Kaufziele und neue Regressionen werden zusätzlich geprüft.

Ein neuer Befund erfordert eine eigene begründete Revision. Einfaches Anpassen eines Hashes darf keine
Score-/Preisänderung legitimieren. `applyDecisions --write` aus 36.0 verweigert das Überschreiben neuerer
Evidenz vor dem ersten Schreibvorgang. Die ursprünglichen 35.4-/35.5-Inhalte und Zuteilungen bleiben erhalten.

Für ortsabhängige Astro-Style-IDs existiert eine zusätzliche Beweisprüfung. Nur unveränderte Quellen von
ProductScore und TableOfContents sowie bis auf ihre nachgewiesenen Scope-IDs bytegleiche Stylesheets
werden gleichgesetzt. Geänderte CSS-Eigenschaften oder Komponentenquellen bestehen diese Prüfung nicht.
Die Normalisierung dient nur dem Audit; sie schreibt weder Website-HTML noch Styles um.

Die Entscheidungshinweis-Snapshots 35.7 wurden nur bei den vier betroffenen Quellhashes aktualisiert.
Der Indexationsreport 36.1 einschließlich seiner Cockpit-Projektion wurde nach Einzelprüfung der fünf
bekannten Textänderungen und des automatisch verlinkten Testtitels erneuert. Historische GSC- und
HTTP-Beobachtungen behalten ihre ursprünglichen Datumsangaben; das ist keine neue Indexierungsmessung.

Das Befundregister beschreibt den Veröffentlichungszustand unabhängig von diesen Prüfungen. Ein Build
oder bestandener Test kann eine lokale Korrektur nicht zu einer Live-Verifikation machen.

# Prevention 35.3

Die vorhandene Content-Quality-Architektur wird um `apps/pfotentechnik/scripts/content-quality/editorial-leakage.mjs` erweitert. Kein zweites Content-System und keine Textfilterung im Produkt-Renderer.

## Verbindlicher Ablauf

`npm run build --workspace=@affiliate-sites/pfotentechnik`, danach `npm test --workspace=@affiliate-sites/pfotentechnik` und `npm run audit:editorial-leakage --workspace=@affiliate-sites/pfotentechnik`.

Die bestehende `scripts/seo/release-preflight.mjs` ruft das neue Gate nach dem Produktionsbuild auf. Bei `--skip-build` gilt wie bei den anderen gerenderten Gates die Verantwortung für einen aktuellen Build.

## Kleine Menge zuverlässiger Regeln

- Bekannte eindeutige Produktionsphrasen: Cornerstone, Information Gain, Cluster-Hub und spezifische Intent-Begriffe.
- Workflow-Kombinationen und bekannte interne Eigentümer-/Statusbezeichnungen; keine Sperre für gewöhnliches „Status“.
- Öffentlich herausgerutschte Schema-/Implementierungsbezeichner wie externalEvidence, evidenceSources, reviewCount, Frontmatter und Content Registry.
- Platzhalter-/TODO-/Template-Artefakte sowie als Text ausgegebene Markdown-Fettdrucksyntax.
- Kontextregel für einzelne interne Maschinenzustände in Tabellenzellen. Produktsprachliche Einschränkungen wie „nicht belegt“ bleiben erlaubt.

Geprüft wird ausschließlich erzeugtes öffentliches HTML einschließlich Alt-/ARIA-Beschriftungen, ausklappbarer Inhalte, Metadaten und menschlich lesbarer JSON-LD-Werte. Keine Prüfung interner JS-Daten, Schema-Schlüssel, IDs, URL-Fragmente, Kommentare oder Reports. Admin- und Foundation-Routen sind ausgeschlossen. Ein fehlender Build darf nicht als bestanden gelten.

Die Allowlist verlangt gleichzeitig Route, Regel-ID, exakten Lesertext und Begründung. Aktuell ist keine Ausnahme nötig. Eine fachliche Quelle mit einem sonst geschützten Begriff kann so eng und nachvollziehbar zugelassen werden. Keine pauschalen Domain-/Datei-Ausnahmen.

## Tests und Grenzen

Sieben Tests sichern die öffentlichen Oberflächen, JSON-LD-Text gegenüber internen Schlüsseln, Kommentare/Attribute, legitime Produktbegriffe und Affiliate-Offenlegung, Publikationsartefakte, Tabellenzustände, Release-Anbindung und die vollständige gerenderte Seite. Der Regressionstest für die Ratgeber-Kurzfassung prüft sowohl den korrekten Plaintext als auch die weiterhin formatierte Originaltabelle.

Breite Wortlisten gehören zur manuellen Audit-Suche, nicht in das harte Gate. Das Gate beweist nicht, dass jeder denkbare zukünftige Produktionssatz sprachlich erkannt wird. Die zwölf als „Consensus“ eingestuften Review-Fälle bleiben unverändert und werden nicht durch eine neue pauschale Sperre zu Fehlern erklärt. Keine stilbasierte KI-Erkennung.

Für Textänderungen genügt automatisierte Geometrieprüfung. `google-signal-browser-check.mjs --editorial-geometry` prüft 20 Routen bei 375/768/1024/1600 Pixeln in beiden Farbmodi ohne Screenshots. Browserprotokollaufrufe und Bild-/Font-Wartezeiten sind begrenzt.

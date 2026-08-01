PfotenTechnik Theme- und Journey-Architektur 25.8.4

Korrektur gegenüber 25.8.3
=========================
25.8.3 wurde korrekt zurückgerollt. Der einzige ausgelöste Fehler lag in der
Installer-Logik:

Die Homepage enthielt bereits einen normalen `.home3`-Block. Die generische
Ersetzungsfunktion deutete dessen Existenz fälschlich als bereits erfolgte
Migration und ließ deshalb den globalen `:root`-Block stehen.

25.8.4 ersetzt nun ausschließlich den konkreten Homepage-Tokenblock:

  :root { --home3-* ... }

durch:

  .home3 { --home3-* ... }

Der Regressionstest prüft zusätzlich, dass kein globaler `:root`-Block mit
`--home3-*` mehr existiert.

Alle übrigen Änderungen entsprechen 25.8.3:
- zentrale semantische Theme-Tokens
- Header, Footer und allgemeine Karten
- Homepage- und Vergleichsüberschriften
- harte Trennung der Produktfamilien
- Reduktion doppelter Folgeempfehlungen
- allgemeine Satzgroßschreibung technischer Werte
- automatisches Backup und Rollback

Ausführen:
  node 3/apply-pfotentechnik-theme-journey-architecture-25.8.4.mjs

Vorprüfung:
  node 3/apply-pfotentechnik-theme-journey-architecture-25.8.4.mjs --check

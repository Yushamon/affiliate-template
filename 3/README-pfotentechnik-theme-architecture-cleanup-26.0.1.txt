PfotenTechnik Theme Architecture Cleanup 26.0.1

Korrektur gegenüber 26.0.0
=========================
26.0.0 wurde vollständig zurückgerollt.

Der Public-Theme-Architecture-Audit war bereits erfolgreich. Der Abbruch kam
durch einen fehlerhaften Regressionstest:

Der Ausdruck begann an einem Dark-Mode-Media-Block und suchte danach ohne
Blockgrenze nach `--pt-theme-`. Dadurch traf er später folgende normale
Verwendungen wie `var(--pt-theme-text)`, obwohl keine Theme-Definition mehr im
Dark-Mode-Block vorhanden war.

Zusätzlich wurde in der Terminalausgabe ein zweiter Fehler sichtbar:
Die Selektor-Migration arbeitete mit Präfixen. Dadurch konnte eine Änderung für
`.nav-toggle-button` auch Pseudoelemente wie
`.nav-toggle-button::before` verändern.

26.0.1 korrigiert beides:

- Dark-Mode-Tests untersuchen echte Media-Blöcke einzeln.
- Geprüft werden nur Definitionen `--pt-theme-*:`, nicht Verwendungen.
- CSS-Regeln werden nur bei exakt gleichem Selektor geändert.
- Pseudoelemente, Hover- und Statusvarianten werden nicht mehr mitverändert.
- Zusätzliche Regressionstests sichern diese Selektorgrenzen ab.

Die fachliche Architektur bleibt unverändert:
- eine autoritative Palette
- reine Alias-Schichten
- keine zweite Dark-Mode-Palette
- Bereinigung von Header, Footer, Home, Vergleichen, Produkten,
  Herstellern und allgemeinen Content-Flächen
- Audit über alle öffentlichen CSS- und Astro-Dateien

Ausführen:
  node 3/apply-pfotentechnik-theme-architecture-cleanup-26.0.1.mjs

Vorprüfung:
  node 3/apply-pfotentechnik-theme-architecture-cleanup-26.0.1.mjs --check

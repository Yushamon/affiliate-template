PfotenTechnik Editorial Trust 20.0.0
====================================

1. ZIP entpacken.
2. Die Datei pfotentechnik-editorial-trust-20.0.0.mjs in das
   Hauptverzeichnis des Repositories affiliate-template kopieren.
3. Im Hauptverzeichnis ausführen:

   node pfotentechnik-editorial-trust-20.0.0.mjs

Optionale reine Vorprüfung:

   node pfotentechnik-editorial-trust-20.0.0.mjs --check

Der Installer prüft den erwarteten Ausgangsstand, legt Backups unter
.patch-backups/ an, installiert alle Änderungen und führt anschließend
das Editorial-Transparency-Audit sowie den Komponenten-Audit aus.

Danach den vollständigen Projekt-Build ausführen:

   npm --workspace apps/pfotentechnik run build

Anschließend Änderungen prüfen und committen.

Hinweis:
Bei unerwartet veränderten Zieldateien bricht der Installer ab, damit keine
neueren Arbeiten überschrieben werden. --force sollte nur nach manueller
Prüfung verwendet werden.

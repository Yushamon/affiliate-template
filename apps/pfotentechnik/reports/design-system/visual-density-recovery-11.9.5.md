# PfotenTechnik Visual Density Recovery 11.9.5

## Ursache

Der Audit aus 11.9.4 enthielt eine im generierten JavaScript überescaped
Import-RegEx. Dadurch wurde der tatsächlich vorhandene Import nicht erkannt.

## Korrektur

- Importerkennung vollständig auf zeilenbasierte String-Prüfung umgestellt
- keine komplexe Import-RegEx mehr
- vorhandene Importvarianten entfernt: **1**
- final erkannte Density-Imports: **1**
- ProjectLayout geändert: **nein**
- Density-Datei geändert: **nein**
- Audit geändert: **ja**
- CSS-Budget-Baseline bleibt unverändert

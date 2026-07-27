# PfotenTechnik Mobile Decision UX 4.1.0

Kumulativer Folgepatch für das mobile Produktseitenlayout 4.0.2.

## Enthalten

- Frage-Icons für Tier, Tieranzahl, Trockenfutter, Nassfutter, Budget, WLAN und Kamera
- eigene reduzierte Icons für Katze und Hund
- keine Icons als Bilddateien, sondern zugängliche Inline-SVGs
- neutraler Punkt als Strich, negativer Punkt als X, positiver Punkt als Haken
- 12 Pixel fester Abstand zwischen Statuszeichen und Erklärung
- kompaktere Fragen bei weiterhin mindestens 44 Pixel Touchhöhe
- Divider oberhalb der Frage statt einer seitlich weiterlaufenden Legendelinie
- kontraststärkere Dark-Mode-Flächen
- größere Schrift in „Ideal für“, Vor-/Nachteilen und Preisnotizen
- kleine Eyebrows und Metadaten bleiben bewusst kompakt
- bestehende Entscheidungs- und Alternativenlogik bleibt unverändert

## Installation

```powershell
node .\pfotentechnik-mobile-decision-ux-4.1.0\install.mjs --repo C:\hp\Projekt\affiliate-template
```

Version 4.0.2 sollte bereits installiert sein. Der Installer prüft den
vorhandenen Komponentenaufbau, erstellt Sicherungen, führt 18 Quellaudits und
den vollständigen PfotenTechnik-Build aus.

## Rollback

```powershell
node .\pfotentechnik-mobile-decision-ux-4.1.0\rollback.mjs --repo C:\hp\Projekt\affiliate-template
```

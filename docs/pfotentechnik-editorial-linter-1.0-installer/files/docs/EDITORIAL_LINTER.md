# PfotenTechnik Editorial Linter

Der Linter prüft Markdown- und MDX-Dateien auf wiederkehrende
redaktionelle Qualitätsprobleme.

## Ausführen

```bash
npm run lint:content
```

Strikter Modus:

```bash
npm run lint:content:strict
```

Der normale Modus blockiert nur bei Fehlern. Warnungen werden
ausgegeben, führen aber nicht zu Exit-Code 1.

Im Strict-Modus blockieren auch Warnungen.

## Fehler

- doppelte FAQ-Fragen
- Bilder ohne Alt-Text

## Warnungen

- doppelte Überschriften
- mehr als 20 FAQ
- zu viele Listenblöcke
- sehr lange Listen
- zu viele Checklisten-Signale
- Absätze mit mehr als 150 Wörtern
- H2 ohne kurze Einleitung
- ungewöhnlich kurze oder lange Titel
- ungewöhnlich kurze oder lange Descriptions
- Gesundheitsinhalte ohne erkennbare Quellen

## Konfiguration

```text
apps/pfotentechnik/scripts/editorial-lint.config.mjs
```

Die Grenzwerte können dort an den realen Bestand angepasst
werden.

## Empfohlene Einführung

1. normalen Modus ausführen
2. doppelte FAQ und fehlende Alt-Texte zuerst beheben
3. Warnungsgrenzen kalibrieren
4. neue Inhalte im Strict-Modus prüfen
5. Strict-Modus später in CI übernehmen

## Grenzen

Der Linter bewertet Strukturmuster. Er ersetzt keine
fachliche Prüfung und verändert keine Inhaltsdateien.


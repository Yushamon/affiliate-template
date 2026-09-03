# Litter Compatibility Readiness

Stand: 2026-09-02. Dieser Check ist rein berichtend; es wurde kein neues Data Asset veröffentlicht.

## Population und Abdeckung

- Aktive automatische Katzentoiletten: **11**
- Mit strukturierter `litterCompatibility`: **11/11**
- Mit mindestens einer Quellen-URL: **9/11**
- Mit mindestens einer belastbaren, nicht-`unknown` Kompatibilitätsangabe: **9/11**
- In allen sechs modellierten Achsen vollständig (Bentonit-Klumpstreu, Tofu, pflanzlich, Holzpellets, Crystal/Silica, nicht klumpend): **1/11** (`petkit-purobot-crystal-duo`)
- Ohne belastbare Kompatibilitätsaussage und ohne Quelle: **2/11** (`devoko-90l-automatisches-katzenklo`, `petsnowy-snow-plus`)

## Feldreife

Das vorhandene Schema bildet die verlangten Materialachsen ab. Eine eigene numerische Korngrößenachse fehlt; Partikelgrenzen stehen derzeit nur in `condition`-Texten einzelner PETKIT-Produkte. Klumpanforderung wird ebenfalls indirekt über die Status-/Bedingungsfelder je Streuart ausgedrückt.

## Entscheidung

Noch **kein eigenständiges Data Asset**: Die formale Feldabdeckung ist hoch, die belegte inhaltliche Vollständigkeit jedoch nur 1/11. Vor Veröffentlichung wären mindestens Quellen für die zwei leeren Datensätze, ein strukturiertes Korngrößenfeld sowie eine eindeutige Klumpstreu-Achse nötig.


# Comparison GPS Evidence Guard 32.6.13

## Problem

Der GPS-Fallback hat bislang fehlende oder unklare Angaben automatisch
klassifiziert:

- kein explizites "nicht erforderlich" beim Abo => "mit-abo"
- kein VHF-Hinweis => "mobilfunk"

Das erzeugt falsche Filterwerte, sobald Specs unvollständig sind.

## Neue Regel

Abo:
- "ohne-abo" nur bei expliziter Aussage wie "nicht erforderlich", "kein Abo"
  oder "ohne Abo"
- "mit-abo" nur bei explizitem Hinweis auf erforderliches Abo oder laufende
  Gebühren
- sonst kein Fallback-Filterwert

Übertragung:
- "vhf" nur bei explizitem VHF-Hinweis
- "mobilfunk" nur bei explizitem Mobilfunk/LTE/4G/5G/SIM-Hinweis
- sonst kein Fallback-Filterwert

Strukturierte gps-Felder bleiben weiterhin autoritativ.

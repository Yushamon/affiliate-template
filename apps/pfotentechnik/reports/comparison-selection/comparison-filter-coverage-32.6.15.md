# Comparison Filter Coverage 32.6.15

## Problem

Die bestehende Abdeckungsprüfung wurde nur für Tier und Tiergröße verwendet.
Andere Filter konnten erscheinen, obwohl nur wenige Produkte dafür belastbare
Daten besaßen.

Betroffen waren insbesondere:

- Futterart
- App
- Kamera
- Zugang
- Strombackup
- Preisklasse
- GPS-Abo
- GPS-Übertragung
- GPS-Gewicht

## Neue Regel

Ein Filter wird nur angeboten, wenn:

1. mindestens zwei sichtbare Produkte einen belastbaren Wert besitzen
2. mindestens 50 Prozent der sichtbaren Produkte für diesen Filter abgedeckt sind
3. nach dem Entfernen nicht vorkommender Optionen mindestens zwei Optionen
   tatsächlich im Vergleich vorkommen

## Sicherheitswirkung

Fehlende Filterdaten entfernen niemals ein Produkt.
Sie führen nur dazu, dass der betreffende Filter nicht angezeigt wird.

Membership, Ranking und Vergleichstabellen bleiben unverändert.

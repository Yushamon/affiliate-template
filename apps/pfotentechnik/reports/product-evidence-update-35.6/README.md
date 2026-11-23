# Product Evidence & Editorial Accuracy Update 35.6

23.11.2026 · Lokale redaktionelle Prüfung; **kein Push, Deployment, Release oder Indexierungsantrag**.
Ausgangscommit: `8f3bae47761007b9c5725f5a4add70ff0f898385`; Arbeitsbaum anfangs sauber.

Fünf Inhaltsseiten gezielt verbessert, zwölf dauerhafte Befunde eingeführt.
Die 20 Seiten aus 35.5 behalten ihre Inhaltsquellen. Die HTML-Prüfung unterscheidet Textänderungen
von belegten Build-Aliasnamen identischer Bildquellen. Kein neuer URL- oder Redirectbestand.
Die technische Gesamtfreigabe ist wegen der in [validation.md](validation.md) getrennt ausgewiesenen
Bestandsfehler und historischen Snapshot-Konflikte nicht vollständig grün.

## Entscheidungsvorlage

1. **Korrekt am Wochen-Research:** Die beiden PETLIBRO-Mindestversionen sind dokumentiert;
   die frühere Tractive-Akkufehlaussage fehlt aktuell auf den tatsächlich abgerufenen Live-Seiten.
   Der Fremdtest-Metadatenhinweis ist bestätigt; Details und Grenzen im [Testabgleich](independent-test-comparison.md).
2. **Falsch/veraltet/ungenügend belegt:** PETKITs aktueller Play-Stand weicht vom gemeldeten Datum ab.
   Firmwarestände sind ohne Veröffentlichungsdatum keine neuen Novemberupdates. Die sechs Testneuzugänge
   sind nicht einzeln nachgewiesen; Modellnamen allein sichern keine Generation.
3. **Tatsächlich neu nutzbar:** zusätzlicher passender Fremdtestbeleg und Kameragrenze beim Granary Camera.
4. **Bestätigte Einordnungen:** Kamerafunktionen und Grenzen dieses Granary, Catit-Tageskonzept,
   Standard-SureFeed-Rolle; bereits vorhandene App-/Wartungshinweise bleiben relevant.
5. **Widersprüche:** One-RFID-Schutzversprechen gegen bereits vorhandene Nutzungsgrenze;
   CAT-6-Mini-FAQ gegen aktuelle Bluetooth-Ausnahme. Solo-Testgerät gegen P570 nicht abschließend zugeordnet.
6. **Firmware verifiziert:** [One AF301/PLAF301 und Granary AF103/PLAF103](petlibro-firmware-review.md),
   jeweils nur für ihre dokumentierten Modelle; kein Beleg garantierter Förderung durch mechanische Blockaden.
7. **Tractive-Akkufehler behoben?** Ja, auf beiden angefragten Live-Seiten verifiziert. Das ist keine Behauptung,
   dass die heutigen zusätzlichen lokalen Präzisierungen bereits veröffentlicht wären.
8. **Ähnliche Fehler?** Kein weiterer gleichartiger Akku-/Netzstromfehler unter 14 gerenderten und live
   geprüften GPS-Produkten. Andere konkret bestätigte Übertreibungen wurden separat behandelt.
9. **Umgesetzt:** [fünf Inhaltsänderungen](editorial-changes.md), versioniertes Befundregister,
   Validator und gezielte Regressionen. Die [Trackerprüfung](tractive-accuracy-review.md) trennt alle Zustände.
10. **Unterblieben:** Scores, Rankings, Preise, Affiliate-Ziele, Metadaten, neue URLs, globale Templates,
    Catit-Kontrolle sowie nicht eindeutig zugeordnete Modellübertragungen.
11. **Überwachen:** Solo-Identität, Firmwaretermine/-varianten, neue belastbare App-Releases und echte neue
    Incident-Einträge; erledigte Akkufehler mit bestehenden IDs weiterführen.
12. **Prioritäten:** kein neuer P0. P1: Solo-Zuordnung, Test-/Snapshotkompatibilität vor einem späteren Release
    und nach Release Live-Verifikation der lokalen Korrekturen. P2: weitere dokumentierte Herstelleränderungen.

## Nachweise und Weiterführung

- [Recherche](research-findings.md), [Hersteller](manufacturer-update-review.md), [gemeinsame Ursachen](cross-product-error-audit.md).
- [Betroffene Canonicals](affected-canonicals.csv), [Quellenledger](evidence-ledger.csv), `page-review.json`, `source-access.json`.
- [Validierung](validation.md), [offene Punkte](remaining-issues.md).
- Dauerdatei: [editorial-findings.json](../../research/editorial-findings.json),
  [Pflegeanleitung](../../docs/editorial-findings.md).

Ein lokaler Korrekturstatus wird niemals aus einem erfolgreichen Build in „Live verifiziert“ umgewandelt.
Die Untersuchung verspricht weder eine Indexierungs- noch eine Rankingverbesserung.

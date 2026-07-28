# Changelog

## 15.2.3

- Globales Comparison-Release-Gate vom technischen Installer-Erfolg getrennt.
- `comparison:release:check` bleibt sichtbar, ist aber bei offenen manuellen/globalen Closure-Punkten nicht mehr install-blockierend.
- Technical-SEO-Audit wird vor dem globalen Statuscheck ausgeführt.
- Abschlussmeldung unterscheidet klar zwischen erfolgreicher Hero-Installation und globaler Release-Bereitschaft.

## 15.2.2

- `pt-control` zusätzlich am statischen `.comparison-cover-filter__control`-Wrapper ergänzt.
- Post-Write-Verifikation für Select und Wrapper ergänzt.
- Verhindert erneute Auditfehler durch nicht adoptierte statische Control-Klassen.

## 15.2.1

- Design-System-Adoption für Hero-Filter korrigiert (`pt-control`, `pt-button`).
- Bestehenden Header-Auditfund durch gezielte `pt-button`-Adoption behoben.
- Header wird vor Änderungen gesichert.
- Komponenten-Audit bleibt verpflichtend.

## 15.2.0

- Release-Paket mit README, Changelog und Prompt-Sammlung ergänzt.
- Installer auf Versionskennung 15.2.0 angehoben.
- Automatische Hero-Zuordnung nach `<slug>-editorial-hero.webp` beibehalten.
- Unterstützung für Einzelimport über `--hero-slug` und `--hero-image` dokumentiert.
- Unterstützung für Stapelimport über `--hero-dir` dokumentiert.
- Standard-Fallback und striktes Hero-Audit dokumentiert.
- Prompt-Vorlagen für GPS-Tracker, Futterautomaten, Trinkbrunnen und Mikrochip-Futterautomaten ergänzt.

## 15.1.0

- Automatische Hero-Erkennung pro Vergleichsslug eingeführt.
- Fallback auf `default-editorial-hero.webp` ergänzt.
- Hero-Audit und strikte Hero-Prüfung ergänzt.
- Stapelübernahme vorhandener Editorial-Heros ergänzt.

## 15.0.0

- Neuer Editorial-Cover-Hero.
- Mobile 2×2-Filterstruktur.
- Redaktionelle Top-Empfehlung.
- Light- und Dark-Mode-Grundlage.
- Cleanup alter Hero-Stile und Backups.

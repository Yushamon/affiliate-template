# Changelog

## 15.3.3

- Zusätzlichen 15.3.2-CSS-Block vollständig entfernt.
- Comparison-CSS ausschließlich über kleine Änderungen bestehender Regeln angepasst.
- CSS-Budget vor und nach Installation messen.
- Abbruch nur bei einer durch den Patch verursachten Budgetverschlechterung.
- Bestehende globale Budgetüberschreitung bleibt sichtbar, aber nicht Comparison-blockierend.
- Keine Baseline-Erhöhung.

## 15.3.2

- CSS-Budget-Recovery ohne Baseline-Erhöhung.
- Veraltete 15.3.0/15.3.1-CSS-Dateien und Imports werden entfernt.
- UI-Regeln kompakt in `comparison-editorial-cover.css` konsolidiert.
- Keine zusätzlichen Root-Blöcke, Hex-Farben oder `!important`-Regeln.

## 15.3.1

- Ungültigen Aufruf des nicht vorhandenen Workspace-Scripts `check` entfernt.
- Verwendet stattdessen das vorhandene `design-system:check` und den Astro-Build als harte Prüfpfade.
- Workspace-Scripts werden vor der Ausführung aus `apps/pfotentechnik/package.json` erkannt.
- Wiederholte Ausführung über einen teilweise angewendeten 15.3.0-Stand unterstützt.

## 15.3.0

- Comparison-Hero-Asset-Priorität korrigiert.
- Kontextbasierte Filter-Vorauswahl und URL-Synchronisierung ergänzt.
- Filter-UI mobile-first verdichtet.
- Dark-Mode-Oberflächen und Kontraste konsolidiert.
- Burger-/Close-Control und mobiles Navigationspanel korrigiert.
- Sticky CTA, Safe Area und Top-Empfehlung visuell stabilisiert.

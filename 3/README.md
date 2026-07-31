# PfotenTechnik SEO Copilot Cleanup 1.0.6

Dieser Installer setzt den Architektur-, UX- und Code-Cleanup gegen den geprüften Repository-Stand um.

## Anwendung

ZIP in oder neben das Repository entpacken. Dann im Repository-Root ausführen:

```bash
node ./pfotentechnik-seo-copilot-cleanup-1.0.6/apply-pfotentechnik-seo-copilot-cleanup-1.0.6.mjs
```

Der Installer:

1. prüft den Basis-Commit `fe54eeaaf6382a01a24ee906678847e8a9102b60`
2. stoppt bei lokalen Änderungen an Zieldateien
3. legt den Branch `agent/seo-copilot-architecture-cleanup` an
4. sichert alle Zieldateien unter `.patch-backups/`
5. schreibt und patcht die konsolidierte Architektur
   - verhindert den Methodik-Selbstlink auf `/so-bewerten-wir/`
6. führt Tests, Audits und Build vollständig aus
7. rollt bei einem Fehler standardmäßig zurück
8. schreibt bei Erfolg das Validierungsprotokoll
9. erstellt einen lokalen Commit

## Bewusste Optionen

```bash
--no-branch
```

Auf dem aktuellen Branch arbeiten.

```bash
--no-commit
```

Nach erfolgreicher Validierung nicht committen.

```bash
--keep-on-failure
```

Einen fehlgeschlagenen Stand zur Diagnose behalten. Ohne diese Option wird zurückgerollt.

```bash
--force
```

Basis- und Änderungsprüfungen bewusst übergehen. Nur nach manueller Prüfung verwenden.

## Ergebnis

Architekturbericht:

```text
apps/pfotentechnik/docs/SEO_COPILOT_ARCHITECTURE_CLEANUP.md
```

Validierungsbericht:

```text
apps/pfotentechnik/reports/seo-copilot/architecture-cleanup-validation-latest.json
```

## Korrekturen in 1.0.6

- Kompatibilität mit dem bestehenden Compact-Report-Vertrag
- explizite Freigabe im Codex-Prompt
- tokenisierter Pill-Radius
- zulässiger diagnostischer Release-Check
- Astro-sicheres `getStaticPaths()` für Produkt-Workspaces


## Korrektur in 1.0.6

Die abschließende SEO-Release-Diagnose bleibt vollständig aktiv, wird aber als nicht blockierende Fremdprüfung behandelt. Bereits vorhandene Performance-Release-Blocker werden im Validierungsbericht als `warning` dokumentiert und rollen den fachlich bestandenen SEO-Copilot-Architektur-Patch nicht mehr zurück. Alle patchbezogenen Tests, Design-System-Prüfungen, der Astro-Build sowie die fachlichen SEO-Audits bleiben blockierend.

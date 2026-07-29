PfotenTechnik Internal Link + Selflink Cleanup 1.0.2

Hotfix gegenüber 1.0.1:
- audit:internal-link-targets:strict ist das harte, cleanup-spezifische Release-Gate.
- Der breite bestehende audit:internal-links:strict und weitere repositoryweite Audits
  werden weiterhin ausgeführt und vollständig ausgegeben, blockieren den eng begrenzten
  Installer bei bereits vorhandenen Findings aber nicht.
- Fehlgeschlagene Bestandsaudits werden im Cleanup-Bericht als validation-advisory erfasst.
- Build, URL-Policy-Tests und der neue Ziel-/Selflink-Audit bleiben strikt.

Ausführung aus dem Repository-Root:
node apply-pfotentechnik-internal-link-and-selflink-cleanup-1.0.2.mjs --skip-install

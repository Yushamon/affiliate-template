# SEO Copilot Action Guarantee 22.10.10

## Ziel

Jedes Finding besitzt nach der Normalisierung mindestens eine ausführbare
nächste Aktion.

## Reihenfolge

1. Registrierter sicherer Auto-Fix, wenn das Finding einen solchen anbietet.
2. Fachspezifische AI Action aus der Action Registry.
3. Generischer Codex-Remediation-Prompt als letzter Fallback.

## Zusätzlich behoben

- fehlende `aiActionIds` verursachen keinen Runtime-Absturz mehr
- `Lösung: undefined` wird nicht mehr gerendert
- Internal-Link-Findings erhalten eine konkrete Standardlösung
- der veraltete Admin-CSS-Test wird an die modulare Layer-Architektur angepasst

## Sicherheitsgrenze

Ein Finding wird nur automatisch verändert, wenn bereits ein registrierter
Auto-Fix vorhanden und vom Finding freigegeben ist. Alle übrigen Findings
erhalten eine konkrete, kopierbare Remediation-Aktion statt eines blinden
Schreibzugriffs.

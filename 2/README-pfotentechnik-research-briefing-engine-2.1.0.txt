PfotenTechnik Research Briefing Engine 2.1.0

Jedes offene Research-Finding wird im Cockpit zu einem direkt ausführbaren ChatGPT-/Codex-Auftrag.

Enthalten:
- implementationBrief im zentralen Research-Schema
- Rückwärtskompatibilität für vorhandene Findings
- Ziel, Problem, Nutzwert, konkrete Umsetzung, Dateien, Schutzbereiche, Akzeptanzkriterien und Prüfung
- zentral erzeugter Entwickler-Prompt pro Finding
- aufklappbares Briefing im Research Workbench
- Button „Umsetzungsauftrag kopieren“
- Regressionstests

Vorprüfung:
node 3/apply-pfotentechnik-research-briefing-engine-2.1.0.mjs --check

Anwenden:
node 3/apply-pfotentechnik-research-briefing-engine-2.1.0.mjs

Danach:
npm --workspace apps/pfotentechnik run build

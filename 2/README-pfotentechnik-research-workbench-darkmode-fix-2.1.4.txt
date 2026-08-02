PfotenTechnik Research Workbench Dark Mode Fix 2.1.4

Behebt die unlesbaren hellen Flächen im Research-Cockpit.

Ursache

Die Komponente verwendete feste helle Fallbacks wie #f4f6f8. Im Dark Mode
wurden diese Flächen weiterhin hell dargestellt, während Textfarben teilweise
aus dem dunklen Theme kamen. Dadurch waren Listen, Codeblöcke und Briefings
kaum lesbar.

Lösung

- ein zentraler Token-Layer innerhalb der Research-Workbench
- dark-mode-fähige Oberflächen auf Basis von Canvas und CanvasText
- konsistente Text-, Rand-, Code- und Hintergrundfarben
- keine produktspezifischen oder einzelnen Dark-Mode-Gegenregeln
- bestehende SEO-Tokens bleiben vorrangig
- neue Regressionstests
- Windows-sicherer optionaler Build-Aufruf

Anwendung

node ./2/apply-pfotentechnik-research-workbench-darkmode-fix-2.1.4.mjs --check

Danach

node ./2/apply-pfotentechnik-research-workbench-darkmode-fix-2.1.4.mjs

Tests und Build zusammen

node ./2/apply-pfotentechnik-research-workbench-darkmode-fix-2.1.4.mjs --build

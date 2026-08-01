PfotenTechnik Product FAQ Cleanup 25.6.1

Behebt ausschließlich den fehlerhaften FAQ-Test:
- entfernt das in JavaScript ungültige Regex-Ende \Z
- zählt FAQ-Blöcke zeilenbasiert bis zum nächsten Top-Level-Feld
- ändert keine Produktinhalte
- führt Test, Audit und Release-Gate ohne Build erneut aus

Installation:
  node 3/apply-pfotentechnik-product-faq-cleanup-25.6.1.mjs

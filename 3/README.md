# PfotenTechnik: Stromausfall-Content-Konsolidierung 1.0.0

Der Patch:

- ersetzt `futterautomat-bei-stromausfall.md` durch die ausführliche SEO-Fassung,
- entfernt `futterautomat-batterie-oder-netzteil.md`,
- ersetzt interne Links auf die alte URL,
- entfernt das alte Hero-Bild nur dann, wenn es nach der Konsolidierung nirgends mehr referenziert wird,
- ergänzt permanente 301-Redirects mit und ohne abschließenden Slash,
- prüft nach dem Build Route, Sitemap und die kopierte `_redirects`-Datei,
- führt den Repository-Audit aus,
- legt vor Änderungen ein Backup unter `.patch-backups/` an,
- rollt Änderungen bei fehlgeschlagener Verifikation zurück.

## Windows PowerShell

```powershell
node .\2\apply-pfotentechnik-power-outage-consolidation-1.0.0.mjs
```

## macOS / Linux

```bash
node ./2/apply-pfotentechnik-power-outage-consolidation-1.0.0.mjs
```

## Nur prüfen

```powershell
node .\2\apply-pfotentechnik-power-outage-consolidation-1.0.0.mjs --check
```

## Ohne Build installieren

```powershell
node .\2\apply-pfotentechnik-power-outage-consolidation-1.0.0.mjs --skip-build
```

Entpacke den gesamten ZIP-Inhalt gemeinsam in denselben Ordner, damit der Installer den `payload`-Ordner findet.

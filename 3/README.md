# PfotenTechnik CSS Admin Operations + Cleanup 22.9.6

22.9.6 ersetzt 22.9.5.

Der 22.9.5-Rollback war korrekt. Der Fehler lag ausschließlich im Test:
Die responsive Regel `.seo-workspace-summary { grid-template-columns: 1fr; }`
muss in `seo-admin.css` erhalten bleiben.

22.9.6 unterscheidet nun zwischen:

- ausgelagerter statischer Basisregel mit `display: grid`
- beibehaltener responsiver Override-Regel

Ausführen:

```bash
node 3/apply-pfotentechnik-css-admin-operations-cleanup-22.9.6.mjs
```

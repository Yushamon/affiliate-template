# PfotenTechnik Component Simplification Recovery 12.0.3

Behebt den verbliebenen Component-Adoption-Audit-Fehler im offenen 12.0.x-Stand.

## Ursache

Der Audit interpretiert auch Unterelement-Klassen mit dem Wort `button` als
Button-Komponenten. Daher wurden diese Klassen beanstandet:

```text
nav-toggle-button__icon
nav-toggle-button__label
```

## Ausführen

```bash
node 3/pfotentechnik-component-simplification-recovery-12.0.3.mjs
```

Den offenen Stand aus 12.0.0–12.0.2 nicht zurücksetzen.

Der echte Toggle bleibt:

```html
class="pt-button nav-toggle-button"
```

Nur die Unterelemente werden zu `nav-toggle__icon` und `nav-toggle__label`
umbenannt. Danach laufen alle Audits, Build, Visual-QA und der gemeinsame
lokale Commit.

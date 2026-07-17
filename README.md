# PfotenTechnik Label- und Grammatik-Fix V4

Dieses Paket basiert auf den vollständigen Dateien aus dem aktuellen
`main`-Branch von:

```text
Yushamon/affiliate-template
```

## Behobene Ursache

In den Trinkbrunnen-Alternativen wurde bisher pauschal Folgendes erzeugt:

```ts
`Wenn ${bestFor.toLowerCase()} wichtig ist`
```

Dadurch entstanden Texte wie:

```text
Wenn große hunde wichtig ist
```

Die neue Lösung verwendet semantische Formulierungen:

```text
Für große Hunde
Bei hohem Wasserbedarf
Für Mehrkatzenhaushalte
Mit App
Mit Kamera
Für Nassfutter
```

## Ebenfalls angepasst

Die Empfehlungstitel für Futterautomaten wurden vereinheitlicht:

```text
Für die Fütterung mit Nassfutter
Für die getrennte Fütterung mehrerer Tiere
Für die Kontrolle per Kamera
Für flexible Steuerung per App
Für Mehrtierhaushalte
Für wenig Stellfläche
Als Preis-Leistungs-Alternative
```

Sichtbare Tags beginnen außerdem mit einem Großbuchstaben.

## Installation

ZIP entpacken und im Stamm des Repositories ausführen:

```bash
node /PFAD/ZUM/ENTPACKTEN-PAKET/install.mjs
```

Danach den vorhandenen Build-Befehl für PfotenTechnik ausführen.

Der Installer erzeugt vor dem Überschreiben Sicherungskopien mit der Endung:

```text
.before-label-fix-v4
```

## Enthaltene vollständige Ersatzdateien

```text
apps/pfotentechnik/src/domain/productAlternatives/index.ts
apps/pfotentechnik/src/domain/productAlternatives/categories/futterautomaten.ts
```

`AlternativeRecommendationCard.astro` wird bewusst nicht mehr durch fragiles
String-Matching verändert. Die sichtbaren Texte werden bereits in den beiden
Datenquellen korrekt formatiert.

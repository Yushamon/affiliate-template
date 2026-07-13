# Bildsystem

## Ziel

Alle redaktionellen Bilder werden durch Astro geladen, validiert und beim Build optimiert. Markdown ist die Quelle der Bildzuordnung; TypeScript-Bildlisten werden nicht parallel gepflegt.

## Speicherorte

- Content- und Produktbilder: `apps/pfotentechnik/src/assets/images/`
- Statische Dateien ohne Astro-Verarbeitung: `apps/pfotentechnik/public/`
- Legacy-Kopien: vorübergehend `apps/pfotentechnik/public/images/`

Neue Markdown-Inhalte verwenden ausschließlich relative Pfade nach `src/assets/images`. `public/images` ist keine Quelle für neue Content-Bilder.

## Datenfluss

```text
Markdown-Frontmatter
  → Collection-Schema mit image()
  → ImageMetadata
  → Astro Image/getImage oder OptimizedImage
  → responsive, optimierte Build-Dateien
```

Die Core-Komponente `OptimizedImage.astro` akzeptiert `ImageMetadata` und unterstützt während der Migration weiterhin externe oder alte String-URLs. Neue Inhalte sollen diese Rückwärtskompatibilität nicht benötigen.

## Bildtypen

- `hero`: Hauptmotiv eines Inhalts
- `thumbnail`: optionaler quadratischer Kartenausschnitt
- `comparison`: optionaler Vergleichsausschnitt
- `gallery`: eigenständige Anwendungs- und Detailmotive
- Hersteller-, Vergleichs- und Wissensbilder: jeweils contentnah unter dem entsprechenden Asset-Ordner

## Qualitätsregeln

- WebP, JPEG und PNG sind als Quellen zulässig; Astro erzeugt die Auslieferungsvarianten.
- Keine eingebetteten Preise, Rabatttexte oder fremden Wasserzeichen.
- Alttexte beschreiben das sichtbare Motiv konkret.
- Tiermotive müssen zum Inhalt passen: Hundethemen zeigen Hunde, Katzenthemen Katzen.
- Das Hero-Bild darf nicht als Galerieaufnahme wiederverwendet werden.
- Galeriebilder müssen sich auch untereinander sichtbar unterscheiden.

## Legacy-Strategie

`public/images` bleibt nur so lange parallel bestehen, wie alte Daten oder direkte URL-Strings darauf zugreifen. Vor dem Löschen werden repositoryweit Legacy-Referenzen geprüft und ein vollständiger Build ausgeführt.

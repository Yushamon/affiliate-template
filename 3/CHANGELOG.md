# Changelog

## 15.4.4

- Comparison-Hero-Asset-Verzeichnisse prüfen.
- Falsch abgelegte Editorial-Hero-Dateien automatisch übernehmen.
- Hero-Asset-Bericht erzeugen.
- Hero-Bild inklusive Unterkante vollständig runden.
- Mobile Filterkarten und Selects verdichten.
- Keine bestehende Hero-Datei überschreiben.

## 15.4.3

- Menü-Performance-Fix 15.4.2 übernommen.
- Burger-Button auf 56 × 56 px vergrößert.
- Hamburger-Linien verbreitert und auf 3 px verstärkt.
- Close-X verlängert, zentriert und gegen Clipping abgesichert.
- Desktop-Dark-Mode von Backdrop-Blur und transparenten Flächen befreit.
- Dark-Mode-Schatten und großflächige Verläufe reduziert.
- Keine neue CSS-Datei.

## 15.4.2

- Langsames `hidden`/`display`-Toggling der mobilen Navigation entfernt.
- Menü wird vorgerendert und compositor-basiert eingeblendet.
- Öffnungsanimation auf 120 ms begrenzt.
- `touch-action: manipulation` ergänzt.
- Globale Button-Transition am Toggle auf Border und Hintergrund begrenzt.
- Layout/Paint über `contain` isoliert.

## 15.4.1

- `pt-button` am Header-Toggle wiederhergestellt.
- Design-System-Komponenten-Audit wird wieder erfüllt.
- Primitive-Pseudoelemente nur am Navigationstoggle neutralisiert.
- Stabiler Hamburger-/X-State bleibt erhalten.
- Direkt über einem teilweise angewendeten 15.4.0-Stand ausführbar.

## 15.4.0

- Repository-basierter Fix statt angenommener Komponentenstruktur.
- Hamburger-State vollständig neu implementiert.
- `pt-button`-Konflikt am Navigationstoggle entfernt.
- Mobile Navigation konsolidiert.
- Sticky-Bar von 211 CSS-Zeilen mit mehreren Recovery-Layern auf einen klaren Style-Block reduziert.
- Sticky CTA erst nach der Top-Empfehlung sichtbar.
- Dark-Mode-Tokens direkt auf Hero, Filter und Recommendation angewendet.
- Keine neue CSS-Datei.

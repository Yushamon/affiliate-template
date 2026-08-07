PfotenTechnik Petporte Media Path Repair 32.4.2

Problem:
Die Petporte-MD referenziert mindestens
petsafe-petporte-smart-flap-09-glass.webp,
die im lokalen Asset-Ordner nicht existiert.

Der Installer rät keine Dateinamen, sondern liest den lokalen Ordner:
apps/pfotentechnik/src/assets/images/products/petsafe-petporte-smart-flap/

Verhalten:
- listet alle tatsächlich vorhandenen .webp-Dateien
- validiert Hero (01), Thumbnail (02) und Comparison (03)
- korrigiert abweichende Dateisuffixe über das Nummernpräfix
- prüft jeden Galerieeintrag
- fehlt ein optionales Galerie-Asset vollständig, wird nur dieser Eintrag entfernt
- Pflichtbilder werden niemals still entfernt
- am Ende müssen 100 % aller src-WebP-Referenzen der MD auf existierende Dateien zeigen
- legt ein Backup der MD an
- keine anderen Produktdaten werden verändert

Ausführen:
node 3/apply-pfotentechnik-petporte-media-path-repair-32.4.2.mjs

Danach:
npm --workspace apps/pfotentechnik run build

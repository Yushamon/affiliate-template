# Comparison Data Integrity Repair 32.6.3

Erstellt: 2026-08-17T09:53:46.741Z

## Zweck

32.6.2 hat technische Merkmale aus Volltext-Heuristiken ergänzt.
Der anschließende Selection-Audit zeigte Fehlklassifikationen, unter anderem
bei Kamera, Futterart und Mikrochip-Zugang.

32.6.3 stellt deshalb ausschließlich den comparisonFilters-Block aus den
vor 32.6.2 angelegten Backups wieder her.

Andere Änderungen an den Produktdateien bleiben erhalten.

## Sicherheitsregeln

- Keine Comparison-MD wird verändert.
- Kein items[]-Eintrag wird entfernt.
- Keine comparisons[]-Verknüpfung wird verändert.
- Nur comparisonFilters wird aus dem unmittelbaren 32.6.2-Backup restauriert.
- Vor jeder Reparatur wird ein 32.6.3-Backup der aktuellen Datei erzeugt.
- NO COMPARISON REGRESSION bleibt harte Invariante.

## Ergebnis

- Reparierte Produktdateien: 86
- Unveränderte Backup-Kandidaten: 0
- Comparison-Regressions: 0

## Reparierte Dateien

- apps/pfotentechnik/src/content/products/aqara-smart-pet-feeder-c1.md
- apps/pfotentechnik/src/content/products/cat-mate-335-pet-fountain.md
- apps/pfotentechnik/src/content/products/cat-mate-c200.md
- apps/pfotentechnik/src/content/products/cat-mate-c300.md
- apps/pfotentechnik/src/content/products/cat-mate-c500.md
- apps/pfotentechnik/src/content/products/cat-mate-elite-355w.md
- apps/pfotentechnik/src/content/products/cat-mate-shell-fountain.md
- apps/pfotentechnik/src/content/products/catit-pixi-smart-6-meal-feeder.md
- apps/pfotentechnik/src/content/products/catit-pixi-vision-smart-feeder.md
- apps/pfotentechnik/src/content/products/devoko-90l-automatisches-katzenklo.md
- apps/pfotentechnik/src/content/products/enabot-ebo-air-2.md
- apps/pfotentechnik/src/content/products/enabot-rola-pettracker.md
- apps/pfotentechnik/src/content/products/feelneedy-fn-w18-8l-katzenbrunnen.md
- apps/pfotentechnik/src/content/products/furbo-360-hundekamera.md
- apps/pfotentechnik/src/content/products/garmin-alpha-t-20.md
- apps/pfotentechnik/src/content/products/garmin-alpha-tt-25.md
- apps/pfotentechnik/src/content/products/honeyguardian-a305d.md
- apps/pfotentechnik/src/content/products/honeyguardian-a68.md
- apps/pfotentechnik/src/content/products/honeyguardian-smart-pet-feeder-s305d.md
- apps/pfotentechnik/src/content/products/imipaw-3l-automatic-cat-feeder.md
- apps/pfotentechnik/src/content/products/litter-robot-5-pro.md
- apps/pfotentechnik/src/content/products/neakasa-m1-lite.md
- apps/pfotentechnik/src/content/products/neakasa-m1-plus.md
- apps/pfotentechnik/src/content/products/oneisall-2-2l-cordless-fountain.md
- apps/pfotentechnik/src/content/products/oneisall-2-in-1-feeder-water.md
- apps/pfotentechnik/src/content/products/oneisall-3-2l-cordless-fountain.md
- apps/pfotentechnik/src/content/products/oneisall-3-5l-cordless-fountain.md
- apps/pfotentechnik/src/content/products/oneisall-5l-automatic-cat-feeder.md
- apps/pfotentechnik/src/content/products/oneisall-7l-dog-water-fountain.md
- apps/pfotentechnik/src/content/products/paj-pet-finder-4g-mini.md
- apps/pfotentechnik/src/content/products/pawbby-smart-pet-feeder.md
- apps/pfotentechnik/src/content/products/pawsync-smart-pet-feeder.md
- apps/pfotentechnik/src/content/products/petkit-eversweet-3-pro-uvc.md
- apps/pfotentechnik/src/content/products/petkit-eversweet-5-mini.md
- apps/pfotentechnik/src/content/products/petkit-eversweet-max-2-uvc.md
- apps/pfotentechnik/src/content/products/petkit-eversweet-max-cordless.md
- apps/pfotentechnik/src/content/products/petkit-eversweet-solo-2-fountain.md
- apps/pfotentechnik/src/content/products/petkit-eversweet-solo-se.md
- apps/pfotentechnik/src/content/products/petkit-eversweet-ultra.md
- apps/pfotentechnik/src/content/products/petkit-fresh-element-infinity.md
- apps/pfotentechnik/src/content/products/petkit-fresh-element-solo.md
- apps/pfotentechnik/src/content/products/petkit-purobot-max-3.md
- apps/pfotentechnik/src/content/products/petkit-purobot-max-pro-2.md
- apps/pfotentechnik/src/content/products/petkit-yumshare-dual-hopper.md
- apps/pfotentechnik/src/content/products/petkit-yumshare-solo-2.md
- apps/pfotentechnik/src/content/products/petlibro-air-automatic-feeder.md
- apps/pfotentechnik/src/content/products/petlibro-air-wifi-feeder.md
- apps/pfotentechnik/src/content/products/petlibro-capsule-dog-fountain.md
- apps/pfotentechnik/src/content/products/petlibro-dockstream-2-smart-cordless.md
- apps/pfotentechnik/src/content/products/petlibro-dockstream-2-smart.md
- apps/pfotentechnik/src/content/products/petlibro-dockstream-cordless.md
- apps/pfotentechnik/src/content/products/petlibro-dockstream-rfid-smart.md
- apps/pfotentechnik/src/content/products/petlibro-glacier-ultrafiltration.md
- apps/pfotentechnik/src/content/products/petlibro-granary-2-vision.md
- apps/pfotentechnik/src/content/products/petlibro-granary-camera-feeder.md
- apps/pfotentechnik/src/content/products/petlibro-granary-dual-feeder.md
- apps/pfotentechnik/src/content/products/petlibro-granary-wifi-feeder.md
- apps/pfotentechnik/src/content/products/petlibro-one-rfid-smart-feeder.md
- apps/pfotentechnik/src/content/products/petlibro-polar-wet-food-feeder.md
- apps/pfotentechnik/src/content/products/petlibro-scout-smart-camera.md
- apps/pfotentechnik/src/content/products/petlibro-space-smart-feeder.md
- apps/pfotentechnik/src/content/products/petlibro-stainless-steel-fountain.md
- apps/pfotentechnik/src/content/products/petsafe-freshfeed-refrigerated-feeder.md
- apps/pfotentechnik/src/content/products/petsafe-healthy-pet-simply-feed.md
- apps/pfotentechnik/src/content/products/petsafe-mikrochip-katzenklappe.md
- apps/pfotentechnik/src/content/products/petsafe-petporte-smart-flap.md
- apps/pfotentechnik/src/content/products/petsafe-smart-feed-2.md
- apps/pfotentechnik/src/content/products/petsnowy-snow-plus.md
- apps/pfotentechnik/src/content/products/pettec-cam-360.md
- apps/pfotentechnik/src/content/products/surefeed-microchip-pet-feeder-connect.md
- apps/pfotentechnik/src/content/products/surefeed-microchip-pet-feeder.md
- apps/pfotentechnik/src/content/products/sureflap-dualscan-mikrochip-katzenklappe.md
- apps/pfotentechnik/src/content/products/sureflap-mikrochip-katzenklappe-connect.md
- apps/pfotentechnik/src/content/products/sureflap-mikrochip-katzenklappe.md
- apps/pfotentechnik/src/content/products/tractive-cat-6-mini.md
- apps/pfotentechnik/src/content/products/tractive-dog-6-xl.md
- apps/pfotentechnik/src/content/products/tractive-dog-6.md
- apps/pfotentechnik/src/content/products/weenect-xs.md
- apps/pfotentechnik/src/content/products/weenect-xt.md
- apps/pfotentechnik/src/content/products/wopet-cube-air-ca10.md
- apps/pfotentechnik/src/content/products/wopet-heritage-view-camera-feeder.md
- apps/pfotentechnik/src/content/products/wopet-patrol-f07-pro.md
- apps/pfotentechnik/src/content/products/wopet-pioneer-f01-plus.md
- apps/pfotentechnik/src/content/products/xiaomi-smart-pet-food-feeder-2.md
- apps/pfotentechnik/src/content/products/xiaomi-smart-pet-fountain-2.md
- apps/pfotentechnik/src/content/products/zeromouse-2-0.md

## Nächste Architekturregel

Automatische Comparison-Zuordnung darf künftig nicht aus unstrukturiertem
Volltext auf boolesche technische Merkmale schließen.

Für die erste produktive Hybridstufe werden nur zwei Quellen akzeptiert:

1. bestehende kuratierte items[]
2. explizite product.comparisons[]-Backlinks

Damit gilt zunächst: visible = curated ∪ explicitBacklinks.
Eine spätere technische Selection darf diese Menge ergänzen, aber nicht verkleinern.
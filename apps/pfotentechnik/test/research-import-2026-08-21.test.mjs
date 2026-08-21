import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const APP = process.cwd();
const read = (relative) => fs.readFileSync(path.join(APP, relative), "utf8");

test("Crystal Duo besitzt vollständige Produkt- und Journey-Integration", () => {
  const product = read("src/content/products/petkit-purobot-crystal-duo.md");
  const comparison = read("src/content/comparisons/beste-automatische-katzentoiletten.md");
  assert.match(product, /P9905/);
  assert.match(product, /818 × 507 × 334 mm/);
  assert.match(product, /PETKIT Crystal Litter Set/);
  assert.match(product, /Care\+/);
  assert.match(product, /keine medizinische Diagnose/);
  for (const token of ["petkit-purobot-crystal-duo", "verbrauchssystem", "video_cloud", "mindestalter"]) assert.ok(comparison.includes(token));
});

test("Furbo Katzenkamera bleibt eigenes Modell mit transparenter Nanny-Grenze", () => {
  const product = read("src/content/products/furbo-360-katzenkamera.md");
  const comparison = read("src/content/comparisons/beste-haustierkameras.md");
  for (const token of ["1080p", "360°", "4× Digitalzoom", "Feder-Spielzeug", "Meowing Alert", "Kitty Diary", "Furbo Nanny"]) assert.ok(product.includes(token));
  assert.match(product, /keine individuelle Mehrkatzenerkennung/);
  assert.match(comparison, /katzeninteraktion/);
});

test("Daily Feast bleibt Ankündigung und verzerrt keinen Vergleich", () => {
  const manufacturer = read("src/content/manufacturers/petkit.md");
  const wetComparison = read("src/content/comparisons/beste-futterautomaten-fuer-nassfutter.md");
  assert.match(manufacturer, /Angekündigt: YUMSHARE DAILY FEAST/);
  assert.match(manufacturer, /keine kaufbare Produktseite/);
  assert.doesNotMatch(wetComparison, /daily.feast/i);
  assert.equal(fs.existsSync(path.join(APP, "src/content/products/petkit-yumshare-daily-feast.md")), false);
});

test("Kratzmonitoring ist nur DOG 6 und DOG 6 XL zugeordnet", () => {
  for (const slug of ["tractive-dog-6", "tractive-dog-6-xl"]) {
    const source = read(`src/content/products/${slug}.md`);
    assert.match(source, /Fremdes Kratzen/);
    assert.match(source, /Bluetooth-Nähe/);
    assert.match(source, /keine Diagnose|keine klinische Messung/);
  }
});

test("Produktbilder nutzen sechs produktspezifische, austauschbare Zielslots", () => {
  for (const slug of ["petkit-purobot-crystal-duo", "furbo-360-katzenkamera"]) {
    const source = read(`src/content/products/${slug}.md`);
    for (const role of ["hero", "thumbnail", "comparison", "gallery-1", "gallery-2", "gallery-3"]) {
      assert.match(source, new RegExp(`products/${slug}/${role}\\.webp`));
      assert.equal(fs.existsSync(path.join(APP, `src/assets/images/products/${slug}/${role}.webp`)), true);
    }
    assert.match(source, /aktuell Platzhalter|Temporärer (?:Editorial-)?Platzhalter/);
  }
});

test("Dockstream SEO-Strings mit Doppelpunkt sind YAML-sicher gequotet", () => {
  const source = read("src/content/products/petlibro-dockstream-rfid-smart.md");
  assert.match(source, /title: "PETLIBRO Dockstream RFID Smart: RFID-Trinktracking im Check"/);
  assert.match(source, /description: "PETLIBRO Dockstream RFID Smart PLWF305:/);
});

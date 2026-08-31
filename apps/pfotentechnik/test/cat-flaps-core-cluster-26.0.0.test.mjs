import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { evaluateClusterJourney, getJourneyRequirements } from "../src/lib/seo/topical-authority/journey-completion.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");
const exists = (relative) => fs.existsSync(path.join(root, relative));

test("Cornerstone ersetzt den alten Smart-Hub und besitzt einen Redirect", () => {
  assert.ok(exists("src/content/pages/katzenklappen.md"));
  assert.equal(exists("src/content/pages/smarte-katzenklappen.md"), false);
  assert.match(read("public/_redirects"), /\/smarte-katzenklappen\/ \/katzenklappen\/ 301/);
});

test("zwei Vergleiche, vier eigenständige Praxisratgeber und fünf neue Produkte sind vorhanden", () => {
  for (const file of [
    "src/content/comparisons/beste-mikrochip-katzenklappen.md",
    "src/content/comparisons/katzenklappen-mit-app-und-beuteerkennung.md",
    "src/content/pages/katzenklappe-einbauen.md",
    "src/content/pages/katze-an-katzenklappe-gewoehnen.md",
    "src/content/pages/katzenklappe-fuer-mehrere-katzen.md",
    "src/content/pages/katzenklappe-zugluft-und-waermedaemmung.md",
    "src/content/products/sureflap-mikrochip-katzenklappe.md",
    "src/content/products/sureflap-dualscan-mikrochip-katzenklappe.md",
    "src/content/products/petsafe-mikrochip-katzenklappe.md",
    "src/content/products/onlycat-mikrochip-katzenklappe.md",
    "src/content/products/petwalk-medium-tiertuer.md",
  ]) assert.ok(exists(file), file);
  assert.equal(exists("src/content/pages/katzenklappe-mit-chip-oder-app.md"), false);
});

test("ungetestete Produkte erzeugen keine falschen Bewertungs-Signale", () => {
  for (const slug of ["sureflap-mikrochip-katzenklappe", "sureflap-dualscan-mikrochip-katzenklappe", "petsafe-mikrochip-katzenklappe", "onlycat-mikrochip-katzenklappe", "petwalk-medium-tiertuer"]) {
    const product = read(`src/content/products/${slug}.md`);
    assert.match(product, /testStatus: "manufacturer-data"/);
    assert.match(product, /testedHandsOn: false/);
    assert.match(product, /evidenceSources:/);
  }
  const route = read("src/pages/produkt/[product].astro");
  assert.match(route, /rating: undefined/);
  assert.match(route, /productScore100 !== null && productScore100 > 0/);
});

test("jedes neue Produkt besitzt die Pflichtbilder und mindestens drei Galeriebilder", () => {
  for (const slug of ["sureflap-mikrochip-katzenklappe", "sureflap-dualscan-mikrochip-katzenklappe", "petsafe-mikrochip-katzenklappe", "onlycat-mikrochip-katzenklappe", "petwalk-medium-tiertuer"]) {
    const product = read(`src/content/products/${slug}.md`);
    const refs = product.match(new RegExp(`assets/images/products/${slug}/`, "g")) ?? [];
    assert.ok(refs.length >= 6, slug);
    assert.match(product, /^  hero:/m);
    assert.match(product, /^  thumbnail:/m);
    assert.match(product, /^  comparison:/m);
  }
});

test("Katzenklappen-Journey deckt die entscheidenden Bestandskanten ab", () => {
  const requirements = getJourneyRequirements("katzenklappen");
  assert.equal(requirements.length, 10);
  const documents = [
    { route: "/smarte-haustiertechnik/", links: ["/katzenklappen/"] },
    { route: "/katzenklappen/", links: ["/vergleiche/beste-mikrochip-katzenklappen/", "/vergleiche/katzenklappen-mit-app-und-beuteerkennung/", "/katzenklappe-einbauen/", "/katze-an-katzenklappe-gewoehnen/", "/katzenklappe-fuer-mehrere-katzen/", "/katzenklappe-zugluft-und-waermedaemmung/"] },
    { route: "/vergleiche/beste-mikrochip-katzenklappen/", links: ["/produkt/sureflap-dualscan-mikrochip-katzenklappe/"] },
    { route: "/vergleiche/katzenklappen-mit-app-und-beuteerkennung/", links: ["/produkt/onlycat-mikrochip-katzenklappe/"] },
    { route: "/produkt/onlycat-mikrochip-katzenklappe/", links: ["/vergleiche/katzenklappen-mit-app-und-beuteerkennung/"] },
  ];
  assert.equal(evaluateClusterJourney("katzenklappen", documents).complete, true);
});

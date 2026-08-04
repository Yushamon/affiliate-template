import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

import {
  evaluateClusterJourney,
  getJourneyRequirements,
} from "../src/lib/seo/topical-authority/journey-completion.ts";

const root = process.cwd();
const read = (relative) => fs.readFileSync(path.join(root, relative), "utf8");

test("Katzenklappen-Journey besitzt nur belegte Bestandskanten", () => {
  const requirements = getJourneyRequirements("katzenklappen");

  assert.equal(requirements.length, 7);
  assert.equal(
    requirements.some((item) => item.target.includes("/vergleiche/")),
    false,
  );
  assert.equal(
    requirements.some((item) => item.target === "/produkt/zeromouse-2-0/"),
    true,
  );
});

test("Katzenklappen-Journey ist mit den expliziten redaktionellen Links vollständig", () => {
  const documents = [
    {
      route: "/smarte-haustiertechnik/",
      links: ["/smarte-katzenklappen/"],
    },
    {
      route: "/smarte-katzenklappen/",
      links: [
        "/produkt/sureflap-mikrochip-katzenklappe-connect/",
        "/produkt/zeromouse-2-0/",
      ],
    },
    {
      route: "/produkt/sureflap-mikrochip-katzenklappe-connect/",
      links: ["/smarte-katzenklappen/"],
    },
    {
      route: "/produkt/zeromouse-2-0/",
      links: ["/smarte-katzenklappen/"],
    },
    {
      route: "/hersteller/surefeed/",
      links: ["/smarte-katzenklappen/"],
    },
    {
      route: "/hersteller/zeromouse/",
      links: ["/smarte-katzenklappen/"],
    },
  ];

  const result = evaluateClusterJourney("katzenklappen", documents);

  assert.equal(result.applicable, true);
  assert.equal(result.complete, true);
  assert.equal(result.completedCount, 7);
  assert.deepEqual(result.missingEdges, []);
});

test("Hub trennt Vergleichs- und Produkt-Intent explizit", () => {
  const hub = read("src/content/pages/smarte-katzenklappen.md");

  assert.match(hub, /Warum aktuell kein Mikrochip- oder App-Vergleich entsteht/);
  assert.match(hub, /ZeroMOUSE 2\.0 ist ein Zusatzmodul/);
  assert.match(hub, /mindestens ein weiteres vollständiges Katzenklappen-Modell/);
  assert.doesNotMatch(hub, /\/vergleiche\/beste-mikrochip-katzenklappen\//);
});

test("Bestandsseiten führen nachvollziehbar zum neuen Intent-Owner", () => {
  for (const relative of [
    "src/content/pages/smarte-haustiertechnik.md",
    "src/content/products/sureflap-mikrochip-katzenklappe-connect.md",
    "src/content/products/zeromouse-2-0.md",
    "src/content/manufacturers/surefeed.md",
    "src/content/manufacturers/zeromouse.md",
  ]) {
    assert.match(read(relative), /\/smarte-katzenklappen\//, relative);
  }
});

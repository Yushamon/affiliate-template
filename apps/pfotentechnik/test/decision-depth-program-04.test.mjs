import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { createRequire } from "node:module";
import { fileURLToPath } from "node:url";
import { validateDecisionDepthProduct } from "../scripts/audit-decision-depth-program-04.mjs";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const require = createRequire(path.join(app, "package.json"));
const yaml = require("js-yaml");
const read = (relative) => fs.readFileSync(path.join(app, relative), "utf8");
const parse = (slug) => yaml.load(read(`src/content/products/${slug}.md`).match(/^---\s*\r?\n([\s\S]*?)\r?\n---/)[1], { schema: yaml.JSON_SCHEMA });

test("Dispensing trennt nominale Portion von garantierter Grammmenge", () => {
  for (const slug of ["petlibro-granary-camera-feeder", "petlibro-air-wifi-feeder", "petkit-yumshare-solo-2"]) {
    const product = parse(slug);
    assert.ok(product.dispensingPrecision);
    assert.equal(product.dispensingPrecision.portionIsApproximate, true);
    assert.deepEqual(validateDecisionDepthProduct(product), []);
  }
  const invalid = validateDecisionDepthProduct({ slug: "invalid", dispensingPrecision: {
    status: "documented", portionUnit: "portion", nominalPortionGrams: 0, portionIsApproximate: false
  }});
  assert.ok(invalid.some((error) => error.includes("muss positiv")));
  assert.ok(invalid.some((error) => error.includes("ohne Evidence")));
});

test("Repairability akzeptiert nur offiziell belegte positive Ersatzteilclaims", () => {
  for (const slug of ["petsafe-streamside-trinkbrunnen", "sureflap-mikrochip-katzenklappe", "cat-mate-elite-355w", "litter-robot-4"]) {
    assert.deepEqual(validateDecisionDepthProduct(parse(slug)), []);
  }
  const invalid = validateDecisionDepthProduct({ slug: "invalid", repairability: { parts: [
    { type: "pump", status: "supported", officialPart: false, detail: "nur Shopfund" }
  ] } });
  assert.ok(invalid.some((error) => error.includes("ohne Evidence")));
  assert.ok(invalid.some((error) => error.includes("officialPart")));
});

test("Data Portability bewahrt Retention, Abo-Bedingung und Unknowns", () => {
  const dog = parse("tractive-dog-6");
  assert.equal(dog.dataPortability.historyRetentionDays, 365);
  assert.equal(dog.dataPortability.export.status, "conditional");
  assert.equal(dog.dataPortability.postSubscriptionAccess.status, "unknown");
  assert.deepEqual(validateDecisionDepthProduct(dog), []);
  const reolink = parse("reolink-e1-zoom");
  assert.equal(reolink.dataPortability.historyRetentionDays, 8);
  assert.equal(reolink.failureModes.internetOutage.functions.localRecording, "supported");
});

test("Sensorgrenzen unterscheiden Mindestgewicht, Baseline und Umgebung", () => {
  const litterRobot = parse("litter-robot-4");
  assert.equal(litterRobot.sensorLimits.automaticModeMinimumWeightKg, 1.36);
  assert.equal(litterRobot.sensorLimits.belowMinimumBehavior, "manualOnly");
  assert.equal(litterRobot.failureModes.mechanicalBlock.status, "partial");
  assert.deepEqual(validateDecisionDepthProduct(litterRobot), []);
  const dog = parse("tractive-dog-6");
  assert.equal(dog.gps.healthCapabilities.baselineDaysRequired, 7);
  assert.equal(dog.gps.healthCapabilities.barking, "supported");
  assert.equal(parse("tractive-cat-6-mini").gps.healthCapabilities.barking, "notApplicable");
});

test("Identification Depth trennt ID-Kapazitaet von individuellen Regeln", () => {
  const standard = parse("sureflap-mikrochip-katzenklappe").multiPet;
  const dual = parse("sureflap-dualscan-mikrochip-katzenklappe").multiPet;
  const catMate = parse("cat-mate-elite-355w").multiPet;
  assert.equal(standard.identitiesStored, 32);
  assert.equal(standard.individualRules, "partial");
  assert.equal(dual.identitiesStored, 32);
  assert.equal(dual.individualRules, "supported");
  assert.equal(catMate.identitiesStored, 9);
  assert.equal(catMate.individualSchedules, "unavailable");
});

test("genau fuenf bestehende Owner tragen die neuen Decision-Depth-Hinweise", () => {
  const owners = [
    ["src/content/pages/smarte-futterautomaten.md", "Herstellerportion ist Nennwert"],
    ["src/content/pages/trinkbrunnen.md", "Kabellos“ und „reparierbar"],
    ["src/content/pages/gps-tracker.md", "Positionsdaten gehören nicht automatisch"],
    ["src/content/comparisons/beste-mikrochip-katzenklappen.md", "Batteriewechsel, Speicher und Regeln"],
    ["src/content/comparisons/beste-haustierkameras.md", "Lokale Aufnahme ist nicht lokaler Vollbetrieb"]
  ];
  for (const [file, marker] of owners) assert.match(read(file), new RegExp(marker));
});

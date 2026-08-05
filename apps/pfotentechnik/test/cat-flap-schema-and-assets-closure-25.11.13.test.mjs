import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";

const read = (slug) =>
  fs.readFileSync(path.join(process.cwd(), "src/content/products", slug + ".md"), "utf8");

const connect = read("sureflap-mikrochip-katzenklappe-connect");
const standard = read("sureflap-mikrochip-katzenklappe");
const dualscan = read("sureflap-dualscan-mikrochip-katzenklappe");
const petporte = read("petsafe-petporte-smart-flap");
const petsafeMicrochip = read("petsafe-mikrochip-katzenklappe");

test("Connect besitzt alle Pflichtfelder und gültige Statuswerte", () => {
  for (const marker of [
    /^title:/m,
    /^slug:/m,
    /^description:/m,
    /^recommendation:/m,
    /^manufacturer:/m,
    /^category:/m,
    /^images:/m,
    /^rating: 0$/m,
    /^decision:/m,
    /^review:/m,
    /^testStatus: "manufacturer-data"$/m,
    /^productStatus: "active"$/m,
  ]) assert.match(connect, marker);
  assert.doesNotMatch(connect, /^score:/m);
});

test("Standard besitzt gültigen Prüfstatus und neutralen Rating-Platzhalter", () => {
  assert.match(standard, /^testStatus: "manufacturer-data"$/m);
  assert.match(standard, /^rating: 0$/m);
  assert.doesNotMatch(standard, /^score:/m);
});

test("alle vier Katzenklappen-Dateien besitzen Frontmatter", () => {
  for (const source of [connect, standard, dualscan, petporte]) {
    const lines = source
      .replaceAll(String.fromCharCode(13), "")
      .split(String.fromCharCode(10));

    assert.equal(lines[0], "---");
    assert.equal(lines.slice(1).includes("---"), true);
  }
});

test("Produktklassen bleiben klar getrennt", () => {
  assert.match(connect, /Hub/);
  assert.match(connect, /App/);
  assert.match(dualscan, /Ausgangsrechte|welche Katze wieder hinaus darf/i);
  assert.match(standard, /ohne App oder Hub/i);
});

test("DualScan besitzt alle Pflichtfelder und gültige Statuswerte", () => {
  for (const marker of [
    /^title:/m,
    /^slug:/m,
    /^description:/m,
    /^recommendation:/m,
    /^manufacturer:/m,
    /^category:/m,
    /^images:/m,
    /^rating: 0$/m,
    /^decision:/m,
    /^review:/m,
    /^testStatus: "manufacturer-data"$/m,
    /^productStatus: "active"$/m,
  ]) assert.match(dualscan, marker);
  assert.doesNotMatch(dualscan, /^score:/m);
});

test("PetSafe Mikrochip referenziert nur vorhandene lokale Bildassets", () => {
  const imagePattern = /src:s*"([^"]+)"/g;
  for (const match of petsafeMicrochip.matchAll(imagePattern)) {
    const sourcePath = match[1];
    if (
      sourcePath.startsWith("http://") ||
      sourcePath.startsWith("https://") ||
      sourcePath.startsWith("data:") ||
      sourcePath.startsWith("/")
    ) continue;
    const absolute = path.resolve(
      process.cwd(),
      "src/content/products",
      sourcePath,
    );
    assert.equal(
      fs.existsSync(absolute),
      true,
      "Fehlendes PetSafe-Bild: " + sourcePath,
    );
  }
});

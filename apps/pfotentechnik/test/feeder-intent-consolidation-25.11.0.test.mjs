import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const read = (relative) => fs.readFileSync(path.join(appRoot, relative), "utf8");

test("Smarte Futterautomaten bleibt alleiniger Cluster-Hub", () => {
  const source = read("src/content/pages/smarte-futterautomaten.md");
  assert.match(source, /feeder-intent-owner: cluster-hub/);
  assert.match(source, /Zentraler Cluster-Hub|Zentrale Kaufberatung/);
});

test("Auswahlhilfe besitzt einen klar begrenzten Intent", () => {
  const source = read("src/content/pages/welcher-futterautomat-ist-der-richtige.md");
  assert.match(source, /feeder-intent-owner: compact-chooser/);
  assert.match(source, /Auswahlhilfe in 5 Schritten/);
  assert.match(source, /Kompakte Auswahlhilfe/);
  assert.match(source, /smarte-futterautomaten/);
});

test("Die beiden Seiten beanspruchen nicht mehr dieselbe Beschreibung", () => {
  const hub = read("src/content/pages/smarte-futterautomaten.md");
  const chooser = read("src/content/pages/welcher-futterautomat-ist-der-richtige.md");
  assert.notEqual(
    hub.match(/^description:\s*(.+)$/m)?.[1],
    chooser.match(/^description:\s*(.+)$/m)?.[1]
  );
});

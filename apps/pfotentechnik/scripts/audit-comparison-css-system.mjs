#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");
const repo = path.resolve(app, "../..");
const shell = fs.readFileSync(
  path.join(repo, "packages/affiliate-core/src/components/comparison/ComparisonShell.astro"),
  "utf8"
);
const css = fs.readFileSync(
  path.join(repo, "packages/affiliate-core/src/components/comparison/comparison-system.css"),
  "utf8"
);

const imports = [...shell.matchAll(/import "\.\/([^"]+\.css)";/g)]
  .map((match) => match[1]);

const errors = [];

if (imports.length !== 1 || imports[0] !== "comparison-system.css") {
  errors.push("ComparisonShell importiert nicht genau eine CSS-Systemdatei.");
}
if (!css.includes("padding-inline: 16px")) {
  errors.push("Der mobile 16-px-Gutter fehlt.");
}
if (!css.includes("[data-comparison-table-view][hidden]")) {
  errors.push("Der eindeutige View-State fehlt.");
}

if (errors.length) {
  errors.forEach((error) => console.error("FEHLER  " + error));
  process.exit(1);
}

console.log("OK  ComparisonShell importiert genau comparison-system.css.");
console.log("OK  Mobile Außenabstände sind zentral mit 16 px definiert.");
console.log("OK  Karten- und Tabellenansicht besitzen einen eindeutigen hidden-State.");

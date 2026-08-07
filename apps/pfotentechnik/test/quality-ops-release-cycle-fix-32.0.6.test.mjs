import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const app = path.resolve(here, "..");

test("Release-Preflight kann Quality Operations nicht rekursiv blockieren", () => {
  const source = fs.readFileSync(path.join(app, "scripts", "quality-ops", "sources.mjs"), "utf8");
  assert.match(source, /source\.id === "release-preflight"\) return false/);
});

test("Haustierkameras enthält im Markdown-Body keine zweite identische H1", () => {
  const file = fs.readFileSync(path.join(app, "src", "content", "pages", "haustierkameras.md"), "utf8");
  const fm = file.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  assert.ok(fm);
  const titleMatch = fm[1].match(/^title:\s*(?:"([^"]+)"|'([^']+)'|(.+))$/m);
  const title = (titleMatch?.[1] || titleMatch?.[2] || titleMatch?.[3] || "").trim();
  const body = file.slice(fm[0].length);
  const duplicate = [...body.matchAll(/^#\s+(.+?)\s*$/gm)]
    .some((match) => match[1].trim() === title);
  assert.equal(duplicate, false);
});

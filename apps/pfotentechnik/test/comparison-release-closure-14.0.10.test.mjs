import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  ".."
);
const comparisonDir = path.join(
  appRoot,
  "src",
  "content",
  "comparisons"
);

const forbidden = [
  "/redaktion/",
  "/trockenfutter-oder-nassfutter-hund/",
  "/trinkbrunnen-richtig-reinigen/",
  "/wasserbedarf-hund/"
];

test("comparison links only use existing editorial targets", async () => {
  const files = (await fs.readdir(comparisonDir))
    .filter((name) => /\.mdx?$/.test(name))
    .sort();

  assert.equal(files.length, 24);

  for (const name of files) {
    const source = await fs.readFile(
      path.join(comparisonDir, name),
      "utf8"
    );

    for (const target of forbidden) {
      assert.equal(
        source.includes(target),
        false,
        `${name}: ${target}`
      );
    }
  }
});

test("the replacement editorial-methodology route exists", async () => {
  await fs.access(
    path.join(
      appRoot,
      "src",
      "content",
      "pages",
      "so-bewerten-wir.md"
    )
  );
});

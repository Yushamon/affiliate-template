import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { buildLitterCompatibilitySnapshot, loadLitterProducts, renderLitterCompatibilityMarkdown } from "../../src/lib/authority-distribution/litter-compatibility.mjs";

const app = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const products = await loadLitterProducts(path.join(app, "src/content/products"));
const snapshot = buildLitterCompatibilitySnapshot(products);
if (snapshot.publicationGate.status !== "ready") throw new Error(`Litter Asset nicht publication-ready: ${snapshot.publicationGate.reasons.join(", ")}`);
const target = path.join(app, "reports/authority-distribution/data-assets");
await fs.mkdir(target, { recursive: true });
await fs.writeFile(path.join(target, "litter-compatibility.json"), `${JSON.stringify(snapshot, null, 2)}\n`);
await fs.writeFile(path.join(target, "litter-compatibility.md"), `${renderLitterCompatibilityMarkdown(snapshot)}\n`);
console.log(`Litter Compatibility Asset ${snapshot.snapshotVersion}: ${snapshot.publicationGate.status}, ${snapshot.population.coverage} % Coverage.`);

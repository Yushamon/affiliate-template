import { runAudit } from "./audit.mjs";
const report = runAudit({ write: true });
const codes = new Set([
  "PRODUCT_REFERENCE_BROKEN", "MANUFACTURER_REFERENCE_BROKEN",
  "WINNER_NOT_IN_ITEMS", "ALTERNATIVE_NOT_IN_ITEMS",
  "ITEM_DUPLICATE", "RECOMMENDATION_DUPLICATE", "PRODUCT_HERO_MISSING"
]);
const relevant = report.issues.filter((x) => codes.has(x.code));
for (const x of relevant) console.log(x.level.toUpperCase() + " " + x.code + " " + x.file + ": " + x.message);
if (relevant.some((x) => x.level === "error")) process.exitCode = 1;

#!/usr/bin/env node
import { generateGoogleReport } from "../../src/lib/search/providers/google/report.mjs";
import { toPublicError } from "../../src/lib/search/errors.mjs";

try {
  const result = await generateGoogleReport();
  console.log("Google-Search-Bericht erstellt:");
  console.log(result.markdownFile);
  console.log(result.jsonFile);
} catch (error) {
  const safe = toPublicError(error);
  console.error(`${safe.message}\nNächste Aktion: ${safe.nextAction}\nFehlercode: ${safe.code}`);
  if (process.env.SEARCH_DEBUG === "1") console.error(error?.stack);
  process.exitCode = 1;
}

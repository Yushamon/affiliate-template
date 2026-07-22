#!/usr/bin/env node
import { syncGoogleSearch } from "../../src/lib/search/providers/google/sync.mjs";
import { toPublicError } from "../../src/lib/search/errors.mjs";

try {
  const result = await syncGoogleSearch({ onProgress: (progress) => console.log(progress.message) });
  console.log("\nGSC-Dashboard aktualisiert");
  console.log(`- Property: ${result.property}`);
  console.log(`- Zeiträume: ${result.ranges.join(", ")}`);
  console.log(`- Seiten: ${result.pagesCount}`);
  console.log(`- Queries: ${result.queriesCount}`);
  console.log(`- Dauer: ${result.durationMs} ms`);
} catch (error) {
  const safe = toPublicError(error);
  console.error(`\nGSC-Synchronisierung fehlgeschlagen: ${safe.message}`);
  console.error(`Nächste Aktion: ${safe.nextAction}`);
  console.error(`Fehlercode: ${safe.code}`);
  console.error("Vorhandene Dashboarddaten wurden nicht absichtlich geleert.");
  if (process.env.SEARCH_DEBUG === "1") console.error(error?.stack);
  process.exitCode = 1;
}

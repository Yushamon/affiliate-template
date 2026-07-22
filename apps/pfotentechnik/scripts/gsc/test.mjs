#!/usr/bin/env node
import { testGoogleSearch } from "../../src/lib/search/providers/google/test.mjs";
import { toPublicError } from "../../src/lib/search/errors.mjs";

try {
  const result = await testGoogleSearch();
  console.log("Google Search Console");
  console.log("- OAuth: verbunden");
  console.log(`- Property: ${result.property}`);
  console.log("- Token Refresh: erfolgreich");
  console.log("- API: erreichbar");
  console.log("- Datenzugriff: erfolgreich");
  console.log(`- Schreibpfad: ${result.writePath}`);
} catch (error) {
  const safe = toPublicError(error);
  console.error("Google Search Console");
  console.error(`- Status: fehlgeschlagen`);
  console.error(`- Ursache: ${safe.message}`);
  console.error(`- Nächste Aktion: ${safe.nextAction}`);
  console.error(`- Fehlercode: ${safe.code}`);
  if (process.env.SEARCH_DEBUG === "1") console.error(error?.stack);
  process.exitCode = 1;
}

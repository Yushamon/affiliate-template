#!/usr/bin/env node
import { setupGoogleSearch } from "../../src/lib/search/providers/google/setup.mjs";
import { toPublicError } from "../../src/lib/search/errors.mjs";

const clientArg = process.argv.find((value) => value.startsWith("--client="));
const force = process.argv.includes("--force");
try {
  const result = await setupGoogleSearch({ clientFile: clientArg?.slice("--client=".length), force, interactive: true });
  console.log("\nGoogle Search Console");
  console.log(`- OAuth: verbunden`);
  console.log(`- Property: ${result.property}`);
  console.log(`- Status: ${result.message}`);
  console.log("\nNächster Schritt: npm run gsc:test");
} catch (error) {
  const safe = toPublicError(error);
  console.error(`\n${safe.message}`);
  console.error(`Nächste Aktion: ${safe.nextAction}`);
  console.error(`Fehlercode: ${safe.code}`);
  if (process.env.SEARCH_DEBUG === "1") console.error(error?.stack);
  process.exitCode = 1;
}

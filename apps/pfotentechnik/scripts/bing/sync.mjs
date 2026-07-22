#!/usr/bin/env node
import { syncBingSearch } from "../../src/lib/search/providers/bing/sync.mjs";
import { toPublicError } from "../../src/lib/search/errors.mjs";
try { const result = await syncBingSearch({ onProgress: (progress) => console.log(progress.message) }); console.log(`\nBing synchronisiert\n- Website: ${result.siteUrl}\n- Seiten: ${result.pagesCount}\n- Queries: ${result.queriesCount}\n- Crawl-Zeilen: ${result.crawlRowsCount}\n- Datenstand: ${result.dataUpdatedAt || "keine datierten Daten"}`); }
catch (error) { const safe = toPublicError(error); console.error(`\nBing-Synchronisierung fehlgeschlagen: ${safe.message}\nNächste Aktion: ${safe.nextAction}\nFehlercode: ${safe.code}\nVorhandene Bing-Daten wurden nicht absichtlich geleert.`); if (process.env.SEARCH_DEBUG === "1") console.error(error?.stack); process.exitCode = 1; }

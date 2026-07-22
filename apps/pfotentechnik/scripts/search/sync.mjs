#!/usr/bin/env node
import { syncSearchPlatform } from "../../src/lib/search/platform.mjs";
import { toPublicError } from "../../src/lib/search/errors.mjs";
try { const result = await syncSearchPlatform({ onProgress: (progress) => console.log(progress.message) }); console.log(`\nSearch-Sync: ${result.status}\nGoogle: ${result.providerResults.google}\nBing: ${result.providerResults.bing}`); if (result.combined) console.log(`Combined: ${result.combined.pagesCount} Seiten, ${result.combined.queriesCount} Queries`); if (result.status === "failed") process.exitCode = 1; }
catch (error) { const safe = toPublicError(error); console.error(`${safe.message}\n${safe.nextAction}\n${safe.code}`); process.exitCode = 1; }

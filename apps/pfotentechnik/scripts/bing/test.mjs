#!/usr/bin/env node
import { testBingSearch } from "../../src/lib/search/providers/bing/test.mjs";
import { toPublicError } from "../../src/lib/search/errors.mjs";
try { const result = await testBingSearch(); console.log(`Bing Webmaster Tools\n✓ API-Key gefunden\n✓ API erreichbar\n✓ Website gefunden\n✓ Website: ${result.siteUrl}\n✓ Zugriff bestätigt\n✓ Statistikabruf erfolgreich`); }
catch (error) { const safe = toPublicError(error); console.error(`Bing Webmaster Tools ist nicht verbunden.\n\nUrsache:\n${safe.message}\n\nNächster Schritt:\n${safe.nextAction}\n\nFehlercode: ${safe.code}`); if (process.env.SEARCH_DEBUG === "1") console.error(error?.stack); process.exitCode = 1; }

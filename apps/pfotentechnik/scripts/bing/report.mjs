#!/usr/bin/env node
import { generateBingReport } from "../../src/lib/search/providers/bing/report.mjs";
import { toPublicError } from "../../src/lib/search/errors.mjs";
try { const result = await generateBingReport(); console.log(`Bing-Bericht erstellt:\n${result.markdownFile}\n${result.jsonFile}`); }
catch (error) { const safe = toPublicError(error); console.error(`${safe.message}\nNächste Aktion: ${safe.nextAction}\nFehlercode: ${safe.code}`); process.exitCode = 1; }

#!/usr/bin/env node
import { generateSearchReport } from "../../src/lib/search/search-report.mjs";
import { toPublicError } from "../../src/lib/search/errors.mjs";
try { const result = await generateSearchReport(); console.log(`Search-Bericht erstellt:\n${result.markdownFile}\n${result.jsonFile}`); }
catch (error) { const safe = toPublicError(error); console.error(`${safe.message}\n${safe.nextAction}\n${safe.code}`); process.exitCode = 1; }

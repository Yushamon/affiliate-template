#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { priceAudit } from "../../src/lib/price-intelligence/service.mjs";
const appRoot = path.resolve(fileURLToPath(new URL("../..", import.meta.url)));
const report = await priceAudit();
await fs.mkdir(path.join(appRoot,"reports"),{recursive:true});
await fs.writeFile(path.join(appRoot,"reports","price-intelligence-audit.json"),JSON.stringify(report,null,2));
console.log(`Price Intelligence: ${report.summary.products} Produkte, ${report.summary.missingPrice} ohne Preis, ${report.summary.stale30} Prüfungen fällig, ${report.summary.missingAffiliate} ohne Affiliate-Ziel.`);
if(process.argv.includes("--strict") && report.summary.missingAffiliate>0) process.exitCode=1;

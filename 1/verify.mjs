#!/usr/bin/env node
import process from "node:process";
import { command, resolveRepoRoot } from "./lib/installer-utils.mjs";
const repoArg=process.argv.find((arg)=>arg.startsWith("--repo="))?.slice(7);const repoRoot=await resolveRepoRoot(repoArg||process.cwd());
for(const [cmd,label] of [
 ["npm --workspace apps/pfotentechnik run test:product-experience-2","Product Experience Tests"],
 ["npm --workspace apps/pfotentechnik run test:price-intelligence","Price Intelligence Tests"],
 ["npm --workspace apps/pfotentechnik run test:media-center","Media Center Tests"],
 ["npm --workspace apps/pfotentechnik run audit:product-experience-2","Product Experience Audit"],
 ["npm --workspace apps/pfotentechnik run price:audit","Preis-Audit"],
 ["npm --workspace apps/pfotentechnik run media:audit","Medien-Audit"],
 ["npm --workspace apps/pfotentechnik run audit:repository","Repository-Audit"],
 ["npm run build:pfotentechnik","Finaler Build"]
])command(cmd,{cwd:repoRoot,label});
console.log("Alle Platform-2.0-Prüfungen sind erfolgreich.");

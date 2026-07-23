import fs from "node:fs";
import {
  generateProductDraft,
  refreshContentGaps,
  refreshNicheOpportunities,
  runProductDiscovery,
  runStoredCandidatePreflight,
  validateStoredCandidate,
} from "../src/lib/seo-copilot/workflow.mjs";

const [command = "report", ...rawArgs] = process.argv.slice(2);
const args = Object.fromEntries(rawArgs.filter((arg) => arg.startsWith("--")).map((arg) => {
  const [key, ...value] = arg.slice(2).split("=");
  return [key, value.join("=") || true];
}));

const requireArg = (name) => {
  if (typeof args[name] !== "string" || !args[name]) throw new Error(`Argument --${name}=... fehlt.`);
  return args[name];
};

let result;
if (command === "discover") {
  result = await runProductDiscovery({
    category: requireArg("category"),
    targetAnimal: args.animal || "",
    targetSize: args.size || "",
    market: args.market || "DE",
    onlyNewProducts: true,
    minimumValidationScore: Number(args.minimumScore) || 60,
  }, { progress: (progress) => console.log(progress.message) });
} else if (command === "validate") {
  result = validateStoredCandidate({ candidateId: requireArg("candidate") });
} else if (command === "preflight") {
  result = runStoredCandidatePreflight({ candidateId: requireArg("candidate"), slug: args.slug });
} else if (command === "draft") {
  result = generateProductDraft({ candidateId: requireArg("candidate"), slug: args.slug });
} else if (command === "gaps") {
  result = refreshContentGaps();
} else if (command === "niches") {
  const input = JSON.parse(fs.readFileSync(requireArg("input"), "utf8"));
  result = refreshNicheOpportunities({ minimumScore: Number(args.minimumScore) || 65, opportunities: input.opportunities || input });
} else if (command === "report" || command === "health") {
  await import("./seo-copilot-report.mjs");
  result = { ok: true };
} else {
  throw new Error(`Unbekannter SEO-Copilot-Befehl: ${command}`);
}

if (result) console.log(JSON.stringify(result, null, 2));

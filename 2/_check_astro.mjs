import fs from "node:fs";
import ts from "typescript";

const source = fs.readFileSync(process.argv[2], "utf8");
const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
if (!frontmatterMatch) throw new Error("Astro frontmatter missing");

const scripts = [frontmatterMatch[1]];
for (const match of source.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)) {
  if (!match[0].includes('type="application/json"')) scripts.push(match[1]);
}

for (const [index, script] of scripts.entries()) {
  const result = ts.transpileModule(script, {
    compilerOptions: {
      target: ts.ScriptTarget.ES2022,
      module: ts.ModuleKind.ESNext,
      strict: true
    },
    reportDiagnostics: true
  });
  const errors = (result.diagnostics ?? []).filter(
    (diagnostic) => diagnostic.category === ts.DiagnosticCategory.Error
  );
  if (errors.length) {
    throw new Error(`TypeScript block ${index} failed: ${errors.map(
      (error) => ts.flattenDiagnosticMessageText(error.messageText, "\n")
    ).join("; ")}`);
  }
}
console.log(`Astro TypeScript blocks valid: ${scripts.length}`);

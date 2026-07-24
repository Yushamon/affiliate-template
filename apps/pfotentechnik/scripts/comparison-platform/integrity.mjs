import { runAudit } from "./audit.mjs";
const report = runAudit({ write: true });
const integrity = report.issues.filter((item) => item.category === "integrity" || item.category === "structure");
for (const item of integrity) {
  console.log(item.level.toUpperCase() + " " + item.code + " " + item.file + ": " + item.message);
}
if (integrity.some((item) => item.level === "error")) process.exitCode = 1;

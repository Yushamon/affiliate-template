import { runAudit } from "./audit.mjs";
const report = runAudit({ write: true });
console.log(JSON.stringify(report.summary, null, 2));
if (report.summary.errors) process.exitCode = 1;

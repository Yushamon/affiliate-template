import fs from "node:fs";
import path from "node:path";
import { SEARCH_DIR, ensureSearchDirectories } from "./config.mjs";
import { SearchError } from "./errors.mjs";

export async function withSearchLock(name, operation, { staleAfterMs = 30 * 60_000 } = {}) {
  ensureSearchDirectories(); const file = path.join(SEARCH_DIR, `${name}.lock`);
  if (fs.existsSync(file)) {
    const age = Date.now() - fs.statSync(file).mtimeMs;
    if (age < staleAfterMs) throw new SearchError("SEARCH_SYNC_ALREADY_RUNNING");
    fs.unlinkSync(file);
  }
  let handle;
  try { handle = fs.openSync(file, "wx", 0o600); fs.writeFileSync(handle, JSON.stringify({ pid: process.pid, startedAt: new Date().toISOString() })); }
  catch (cause) { throw new SearchError("SEARCH_SYNC_ALREADY_RUNNING", { cause }); }
  try { return await operation(); } finally { try { fs.closeSync(handle); } catch {} try { fs.unlinkSync(file); } catch {} }
}

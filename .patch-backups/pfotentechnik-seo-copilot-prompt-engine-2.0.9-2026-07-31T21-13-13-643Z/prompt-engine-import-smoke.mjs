import { buildChatGptPrompt, buildCodexPrompt } from "../../apps/pfotentechnik/src/lib/seo-copilot/prompts.ts";
if (typeof buildChatGptPrompt !== "function" || typeof buildCodexPrompt !== "function") {
  process.exitCode = 1;
}

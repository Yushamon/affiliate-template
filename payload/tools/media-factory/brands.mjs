import path from "node:path";
import { exists, readJson, slugify, writeJson } from "./lib.mjs";
const defaults = {
  style: ["bright","minimal","premium","realistic"],
  preserve: ["exact geometry","brand mark","controls","ports","camera","bowl","materials","color"],
  forbidden: ["invented hardware","changed logo","extra displays","missing parts","fantasy accessories"]
};
export async function brandProfile(appRoot, manufacturer="generic"){
  const slug=slugify(manufacturer)||"generic", file=path.join(appRoot,"media-brands",`${slug}.json`);
  if(!await exists(file)) await writeJson(file,{manufacturer,slug,...defaults});
  return readJson(file,{manufacturer,slug,...defaults});
}

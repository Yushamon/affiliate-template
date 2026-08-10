import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const targets=["petkit-yumshare-solo-2","petlibro-polar-wet-food-feeder","petkit-eversweet-ultra","petlibro-stainless-steel-fountain","petkit-eversweet-max-cordless","cat-mate-c500","oneisall-2-in-1-feeder-water","surefeed-microchip-pet-feeder-connect","petlibro-dockstream-rfid-smart","petsafe-freshfeed-refrigerated-feeder"];
const read=s=>fs.readFileSync(path.join(app,"src/content/products",s+".md"),"utf8");

test("Batch 4 enthält externalEvidence für alle zehn Zielprodukte",()=>{for(const slug of targets) assert.match(read(slug),/^externalEvidence:\s*$/m,slug);});
test("bestehende PfotenTechnik-Ratings werden nicht ersetzt",()=>{for(const slug of targets) assert.match(read(slug),/^rating:\s*[0-9.]+/m,slug);});
test("keine PfotenTechnik-Hands-on-Behauptung wird erzeugt",()=>{for(const slug of targets) assert.doesNotMatch(read(slug),/PfotenTechnik[^\n]{0,80}hands-on|von PfotenTechnik getestet/i,slug);});
test("bewusste Evidence-Gaps bleiben transparent",()=>{assert.match(read("petkit-yumshare-solo-2"),/Evidence-Gap bewusst dokumentiert/);assert.match(read("petkit-eversweet-ultra"),/Teil-Evidenz/);assert.match(read("oneisall-2-in-1-feeder-water"),/Teil-Evidenz/);assert.match(read("petsafe-freshfeed-refrigerated-feeder"),/Teil-Evidenz/);});
test("starke Quellen sind modellbezogen hinterlegt",()=>{assert.ok(read("petlibro-polar-wet-food-feeder").includes("reviewed.com/pets/content/petlibro-polar"));assert.ok(read("cat-mate-c500").includes("cats.com/cat-mate-c500"));assert.ok(read("surefeed-microchip-pet-feeder-connect").includes("expertreviews.co.uk"));assert.ok(read("petlibro-dockstream-rfid-smart").includes("wired.com/story/amazon-pet-day-deals"));});

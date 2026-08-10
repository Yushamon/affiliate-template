import assert from "node:assert/strict"; import fs from "node:fs"; import path from "node:path"; import test from "node:test"; import {fileURLToPath} from "node:url";
const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),".."), r=p=>fs.readFileSync(path.join(app,p),"utf8");
test("Schema",()=>{const s=r("src/content/schema/product.ts"); for(const x of ["productProfessionalReviewSchema","productUserReviewSourceSchema","productEvidenceConsensusItemSchema","externalEvidence:"]) assert.ok(s.includes(x));});
test("Model",()=>{const s=r("src/domain/productExperience/model.ts"); for(const x of ["professionalReviews","userReviewSources","consensusPositives","sourcePlatforms"]) assert.ok(s.includes(x));});
test("UI",()=>{const s=r("src/components/product-experience-2/ProductEvidence2.astro"); assert.ok(s.includes("Unabhängige Tests und Reviews")); assert.ok(s.includes("nicht zu einer künstlichen Gesamtnote verrechnet"));});
test("Scripts",()=>{const p=JSON.parse(r("package.json")); assert.ok(p.scripts["audit:product-evidence"]); assert.ok(p.scripts["product-evidence:research"]);});

import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import yaml from "js-yaml";
import { fileURLToPath } from "node:url";

function findRepoRoot(start){
 let d=start;
 while(true){
   if(fs.existsSync(path.join(d,"apps","pfotentechnik","package.json"))) return d;
   const p=path.dirname(d);
   if(p===d) throw new Error("repo root");
   d=p;
 }
}

const ROOT=findRepoRoot(path.dirname(fileURLToPath(import.meta.url)));
const PRODUCTS=path.join(ROOT,"apps","pfotentechnik","src","content","products");

function fm(src){
 const m=src.match(/^---\\r?\\n([\\s\\S]*?)\\r?\\n---/);
 return yaml.load(m[1]);
}

test("Katzenklappen folgen dem Produktschema",()=>{
 const files=fs.readdirSync(PRODUCTS)
   .filter(f=>f.endsWith(".md"))
   .map(f=>path.join(PRODUCTS,f));

 const cat=files
   .map(f=>({f,data:fm(fs.readFileSync(f,"utf8"))}))
   .filter(x=>String(x.data?.category?.key??x.data?.category??"").trim()==="katzenklappen");

 assert.ok(cat.length>=1,"Keine Katzenklappen gefunden.");

 for(const {f,data} of cat){
   assert.equal(typeof data.manufacturer,"object",f);
   assert.ok(data.manufacturer.name,f);
   assert.equal(data.price?.source?.url,undefined,f);
   assert.equal(data.price?.affiliateUrl,undefined,f);
   if(data.affiliate?.url){
      assert.match(data.affiliate.url,/^https:\/\//);
      assert.equal(data.affiliateAvailable,true);
   }
 }
});
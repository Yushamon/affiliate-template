import test from "node:test";
import assert from "node:assert/strict";
import { buildPriceIndex } from "../src/domain/price/engine.ts";
import { evaluateDecision } from "../src/domain/productExperience/decisionEngine.ts";

const product=(slug,current,category="futterautomaten")=>({data:{slug,title:slug,category:{key:category,label:category},price:{current,currency:"EUR",status:"unknown",checkedAt:"2026-07-26T10:00:00.000Z"},affiliate:{url:`https://shop.example/${slug}`}}});

test("berechnet Kategorie-Ranges ausschließlich aus Vergleichsprodukten",()=>{
  const index=buildPriceIndex([product("a",40),product("b",80),product("c",120)],undefined,new Date("2026-07-26T12:00:00.000Z"));
  assert.equal(index.bySlug.get("a")?.assessment,"cheap");
  assert.equal(index.bySlug.get("b")?.assessment,"fair");
  assert.equal(index.bySlug.get("c")?.assessment,"expensive");
  assert.equal(index.ranges.get("futterautomaten")?.sampleSize,3);
});

test("interaktive Entscheidung benennt harte Zielkonflikte",()=>{
  const result=evaluateDecision({productName:"Test",animals:["cat"],petSizes:["small"],foodTypes:["dry"],supportsMultiplePets:false,hasWifi:true,worksOffline:false,hasCamera:false,priceTier:"premium"},{animal:"dog",animalCount:2,dryFood:true,wetFood:true,budget:"budget",wifi:"offline",camera:"required"});
  assert.ok(result.score<50);
  assert.ok(result.mismatchKeys.includes("animal"));
  assert.ok(result.mismatchKeys.includes("wet-food"));
  assert.equal(result.verdict,"weak");
});


test("schließt veraltete Preise aus der automatischen Range aus",()=>{
  const stale=product("stale",55);stale.data.price.checkedAt="2026-05-01T10:00:00.000Z";
  const index=buildPriceIndex([stale,product("fresh",90)],undefined,new Date("2026-07-26T12:00:00.000Z"));
  assert.equal(index.ranges.has("futterautomaten"),false);
  assert.equal(index.bySlug.get("stale")?.isStale,true);
});

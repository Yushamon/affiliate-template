import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import test from "node:test";
import { fileURLToPath } from "node:url";

const app=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=(slug)=>fs.readFileSync(path.join(app,"src/content/products",slug+".md"),"utf8");

test("YumShare Solo 2 enthält research-led Review und Nutzerquelle",()=>{
  const s=read("petkit-yumshare-solo-2");
  assert.ok(s.includes("pettechai.com/petkit-yumshare-solo-2-camera-review"));
  assert.ok(s.includes('platform: "TikTok Shop"'));
});

test("Eversweet Ultra nutzt The Verge und Chewy",()=>{
  const s=read("petkit-eversweet-ultra");
  assert.ok(s.includes("theverge.com/news/850992"));
  assert.ok(s.includes("chewy.com/petkit-ever-sweet-ultra"));
});

test("FreshFeed enthält transparente Hands-on-Evidenz",()=>{
  const s=read("petsafe-freshfeed-refrigerated-feeder");
  assert.ok(s.includes("hercozycrew.com/post/petsafe-freshfeed"));
  assert.ok(s.includes("spchlang.com/index.php/2026/07/03"));
  assert.ok(s.includes("kostenlos zur Verfügung gestellt"));
});

test("Oneisall bleibt bewusst partial",()=>{
  const s=read("oneisall-2-in-1-feeder-water");
  assert.ok(s.includes('publisher: "WIRED"'));
  assert.ok(s.includes("userReviews: []"));
});

test("PfotenTechnik-Ratings bleiben erhalten",()=>{
  const expected={
    "petkit-yumshare-solo-2":"rating: 4.1",
    "petkit-eversweet-ultra":"rating: 4.1",
    "petsafe-freshfeed-refrigerated-feeder":"rating: 4.5"
  };
  for(const [slug,rating] of Object.entries(expected)) {
    assert.ok(read(slug).includes(rating), slug+" "+rating);
  }
});

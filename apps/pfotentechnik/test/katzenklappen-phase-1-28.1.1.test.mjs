import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import test from 'node:test';
import { getJourneyRequirements } from '../src/lib/seo/topical-authority/journey-completion.ts';
const root=process.cwd();
const read=(relative)=>fs.readFileSync(path.join(root,relative),'utf8');

test('Hub nutzt die aktuelle kanonische Route und konkrete Nutzerentscheidungen',()=>{
 const hub=read('src/content/pages/katzenklappen.md');
 assert.match(hub,/canonical: \"\/katzenklappen\/\"/);
 assert.match(hub,/Schnellentscheidung nach Nutzerproblem/);
 assert.doesNotMatch(hub,/Intent-Owner/);
});

test('SureFlap Connect besitzt keinen künstlichen Null-Score',()=>{
 const product=read('src/content/products/sureflap-mikrochip-katzenklappe-connect.md');
 assert.doesNotMatch(product,/^rating:\s*0\s*$/m);
 assert.match(product,/availability: \"unavailable\"/);
 assert.match(product,/visualStatus: \"reference-pack-required\"/);
});

test('Katzenklappen-Journey bildet Vergleich und Praxis ab',()=>{
 const requirements=getJourneyRequirements('katzenklappen');
 assert.ok(requirements.length>=10);
 assert.ok(requirements.some((item)=>item.target==='/vergleiche/beste-mikrochip-katzenklappen/'));
 assert.ok(requirements.some((item)=>item.target==='/katzenklappe-einbauen/'));
 assert.ok(requirements.some((item)=>item.target==='/katze-an-katzenklappe-gewoehnen/'));
});

import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { assessProductReview } from '../src/domain/productReview.ts';

const documented = () => ({ testStatus: 'manufacturer-data', score: 80, ratings: { bedienung: 4 },
  review: { verdict: 'Geeignet für dokumentierte lokale Fütterungspläne.' },
  experience: { methodology: 'Abgleich von Anleitung und technischen Daten; kein eigener Praxistest.' },
  evidenceSources: [{ url: 'https://example.org/manual', assertion: 'Lokale Zeitpläne sind dokumentiert.' }] });

test('manufacturer-data score alone does not qualify for Review', () => {
  assert.equal(assessProductReview({testStatus:'manufacturer-data',score:85}).eligible,false);
});
test('documented editorial manufacturer-data review stays eligible without claiming a practical test', () => {
  const result=assessProductReview(documented());
  assert.equal(result.eligible,true); assert.equal(result.handsOn,false);
  assert.equal(result.label,'Datencheck'); assert.match(result.basis,/kein eigener Praxistest/);
});
test('criteria, methodology, verdict and evidence are independently required', () => {
  for(const key of ['ratings','experience','review','evidenceSources']) {
    const data=documented();delete data[key];assert.equal(assessProductReview(data).eligible,false,key);
  }
});
test('actual hands-on and long-term tests retain Review and Testbericht', () => {
  for(const testStatus of ['hands-on','long-term-test']) {
    const data={...documented(),testStatus,editorial:{testedHandsOn:true},experience:{methodology:'Eigene Prüfung der programmierten Ausgabe.'},evidenceSources:[]};
    const result=assessProductReview(data);
    assert.equal(result.eligible,true);assert.equal(result.handsOn,true);assert.equal(result.label,'Testbericht');
  }
});
test('contradictory flags or a test status alone do not claim a practical test', () => {
  assert.equal(assessProductReview({...documented(),editorial:{testedHandsOn:true}}).handsOn,false);
  assert.equal(assessProductReview({...documented(),testStatus:'hands-on'}).handsOn,false);
});
test('external user ratings alone are not an editorial review', () => {
  assert.equal(assessProductReview({rating:4.7,externalEvidence:{userReviews:[{rating:4.7,reviewCount:100}]}}).eligible,false);
});
test('existing rendered consensus and qualitative source analysis preserve an editorial review', () => {
  const data=documented();delete data.experience;delete data.evidenceSources;
  data.externalEvidence={consensus:{editorialAssessment:'Modellbezogene Käuferberichte stützen die dokumentierten Funktionen; Langzeitdaten fehlen.'},
    userReviews:[{platform:'Model owner reports',url:'https://example.org/reports',recurringPositives:['Gespeicherte Mahlzeiten werden ausgegeben.']}]};
  assert.equal(assessProductReview(data).eligible,true);
  delete data.externalEvidence.userReviews[0].recurringPositives;
  assert.equal(assessProductReview(data).eligible,false);
});
test('product route gates Review through the tested policy and renderer exposes its basis', () => {
  const route=fs.readFileSync(new URL('../src/pages/produkt/[product].astro',import.meta.url),'utf8');
  const hero=fs.readFileSync(new URL('../src/components/product-experience-2/ProductHero2.astro',import.meta.url),'utf8');
  assert.match(route,/reviewAssessment\.eligible\s*&&\s*productScore100/);
  assert.match(route,/title=\{`\$\{pageTitle\} – \$\{reviewAssessment\.label\}`\}/);
  assert.doesNotMatch(route,/title=\{`\$\{pageTitle\} Testbericht`\}/);
  assert.match(hero,/description=\{model\.reviewBasis\}/);
});

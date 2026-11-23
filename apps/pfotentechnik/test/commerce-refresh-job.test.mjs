import test from 'node:test';
import assert from 'node:assert/strict';
import {createCommerceRefreshJob} from '../src/lib/price-intelligence/commerce-refresh-job.mjs';

const deferred = () => {let resolve;const promise = new Promise(r => {resolve=r});return {promise,resolve}};
const tick = () => new Promise(resolve => setImmediate(resolve));

test('server job completes every product after its original caller disappears and a new client resumes', async () => {
  const first=deferred(),seen=[];
  const job=createCommerceRefreshJob({listDocuments:async()=>[
    {slug:'active',data:{}},{slug:'archived',data:{maintenanceStatus:'archived'}},{slug:'no-source',data:{priceAutomation:'editorial'}}
  ],check:async slug=>{seen.push(slug);if(slug==='active')await first.promise;return {ok:slug!=='no-source',record:{slug}}}});
  const initial=job.start();assert.equal(initial.status,'running');await tick();
  // A reload creates a new observer; it neither owns nor restarts the queue.
  assert.equal(job.start().id,initial.id);assert.equal(job.get().completed,0);
  first.resolve();await tick();
  const reloaded=job.get();assert.equal(reloaded.id,initial.id);assert.equal(reloaded.status,'completed');
  assert.deepEqual(seen,['active','archived','no-source']);assert.equal(reloaded.total,3);assert.equal(reloaded.completed,3);
  assert.equal(reloaded.succeeded,2);assert.equal(reloaded.failed,1);
  reloaded.results.length=0;assert.equal(job.get().results.length,3,'Observers cannot mutate server state');
});

test('a provider rejection never aborts later products; duplicate starts share one active queue', async () => {
  const gate=deferred(),seen=[];
  const job=createCommerceRefreshJob({listDocuments:async()=>{await gate.promise;return ['broken','good'].map(slug=>({slug}))},check:async slug=>{seen.push(slug);if(slug==='broken')throw Error('source failed');return {ok:true}}});
  const initial=job.start();assert.equal(job.start().id,initial.id);gate.resolve();await tick();
  const completed=job.get();assert.equal(completed.completed,2);assert.equal(completed.failed,1);assert.equal(completed.succeeded,1);assert.equal(completed.status,'completed');assert.deepEqual(seen,['broken','good']);
  assert.notEqual(job.start().id,initial.id,'A completed run can be started again');
  await tick();
});

test('inventory failure is explicit, without claiming that zero products were successfully checked', async () => {
  const job=createCommerceRefreshJob({listDocuments:async()=>{throw Error('inventory unreadable')},check:async()=>assert.fail('must not run')});
  job.start();await tick();assert.equal(job.get().status,'failed');assert.equal(job.get().total,null);assert.equal(job.get().error,'inventory unreadable');
});

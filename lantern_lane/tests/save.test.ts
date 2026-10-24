import test from 'node:test';
import assert from 'node:assert/strict';
import 'fake-indexeddb/auto';
import {saveState,loadSave} from '../src/save.ts';
import {initialState,clone,completeDelivery,purchase,place} from '../src/state.ts';

test('IndexedDB serializes rapid saves, reloads full progress, and recovers a corrupt current snapshot',async()=>{
  assert.equal((await loadSave()).state,null);
  const s=initialState();s.name='QA neighbor';s.started=true;await saveState(s);
  s.quests.delivery='active';completeDelivery(s);const a=clone(s);a.revision=1;
  const lamp=purchase(s,'lamp')!;place(s,lamp.id,{x:1.75,z:0,rotation:0});s.revision=2;
  await Promise.all([saveState(a),saveState(s)]);const loaded=await loadSave();assert.equal(loaded.state!.revision,2);assert.equal(loaded.state!.coins,440);assert.ok(loaded.state!.furniture.find(f=>f.id===lamp.id)!.placement);
  const d=await new Promise<IDBDatabase>((resolve,reject)=>{const r=indexedDB.open('lantern-lane-v1',1);r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
  await new Promise<void>((resolve,reject)=>{const tx=d.transaction('saves','readwrite');tx.objectStore('saves').put({schemaVersion:1,coins:-999},'current');tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);});
  const recovery=await loadSave();assert.equal(recovery.recovered,true);assert.equal(recovery.state!.revision,1);assert.equal(recovery.state!.coins,620);
  await saveState(recovery.state!);const healthy=await loadSave();assert.equal(healthy.recovered,false);assert.equal(healthy.state!.coins,620);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import {initialState,clone,validateSave,completeDelivery,beginMintDate,shareMintDateDrink,completeMintDate,inviteMintHome,beginMintSnuggle,sendMintHome,atMintDateStop,mintDateStop} from '../src/state.ts';
import {MINT_DATE_STOPS,MINT_HOME_SPOT} from '../src/content.ts';

const reload=(s:unknown)=>validateSave(JSON.parse(JSON.stringify(s)));
function delivered(){const s=initialState();s.quests.delivery='active';completeDelivery(s);return s;}

test('existing saves migrate without losing progress or unlocking the date early',()=>{
  const old:any=delivered();delete old.quests.mintDate;delete old.mintDateDrink;old.name='Returning neighbor';old.collected=['sticker-cafe'];
  const migrated=reload(old);assert.equal(migrated.quests.mintDate,'new');assert.equal(migrated.mintDateDrink,null);assert.equal(migrated.coins,620);assert.equal(migrated.name,old.name);assert.deepEqual(migrated.collected,old.collected);
  assert.equal(beginMintDate(initialState()),false);migrated.scene='home';assert.equal(beginMintDate(migrated),false);migrated.scene='town';assert.equal(beginMintDate(migrated),true);assert.equal(beginMintDate(migrated),false);
});

test('date requires both people at each stop, saves the drink, and awards its keepsake only once',()=>{
  for(const drink of ['soda','tea'] as const){
    let s=delivered();assert.equal(shareMintDateDrink(s,drink,MINT_DATE_STOPS.cafe),false);beginMintDate(s);
    assert.equal(completeMintDate(s),false);
    assert.equal(shareMintDateDrink(s,drink,MINT_DATE_STOPS.cafe),false); // player elsewhere
    s.player={...MINT_DATE_STOPS.cafe};assert.equal(shareMintDateDrink(s,drink,{x:12,z:8}),false); // Mint still walking
    s.scene='home';assert.equal(atMintDateStop(s,MINT_DATE_STOPS.cafe),false);s.scene='town';
    assert.equal(shareMintDateDrink(s,drink,MINT_DATE_STOPS.cafe),true);s=reload(s);assert.equal(s.mintDateDrink,drink);assert.deepEqual(mintDateStop(s),MINT_DATE_STOPS.canal);
    assert.equal(completeMintDate(s),false);s.player={...MINT_DATE_STOPS.canal};
    assert.equal(inviteMintHome(s,MINT_DATE_STOPS.canal),true);s=reload(s);
    assert.equal(beginMintSnuggle(s),false);assert.equal(completeMintDate(s),false);
    s.scene='home';s.mintAtHome=true;s.player={x:0,z:2.8};assert.equal(beginMintSnuggle(s),false);
    s.player={...MINT_HOME_SPOT};assert.equal(beginMintSnuggle(s),true);s=reload(s);
    assert.equal(completeMintDate(s),true);s=reload(s);
    assert.equal(s.friendship.mint,30);assert.equal(s.coins,620);assert.equal(s.collected.filter(x=>x==='mint-date-keepsake').length,1);
    assert.equal(completeMintDate(s),false);assert.equal(beginMintDate(s),false);assert.equal(s.friendship.mint,30);
    assert.equal(sendMintHome(s),true);assert.equal(sendMintHome(s),false);assert.equal(reload(s).mintAtHome,false);
  }
});

test('date save validation rejects impossible stages and inconsistent rewards',()=>{
  for(const mutate of [
    (s:any)=>s.quests.mintDate='unknown',
    (s:any)=>s.quests.mintDate='cafe', // delivery not complete
    (s:any)=>{s.quests.delivery='done';s.quests.mintDate='canal';}, // no drink chosen
    (s:any)=>s.mintDateDrink='unknown',
    (s:any)=>s.rewards.push('mint-first-date'),
    (s:any)=>s.mintAtHome=true,
    (s:any)=>{s.quests.delivery='done';s.quests.mintDate='snuggle';s.mintDateDrink='tea';},
    (s:any)=>{s.quests.delivery='done';s.quests.mintDate='done';s.mintDateDrink='tea';}, // missing keepsake
  ]){const bad=clone(initialState());mutate(bad);assert.throws(()=>validateSave(bad));}
});

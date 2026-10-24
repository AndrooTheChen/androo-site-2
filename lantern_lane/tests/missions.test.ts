import test from 'node:test';
import assert from 'node:assert/strict';
import {MISSION_IDS} from '../src/content.ts';
import {initialState,validateSave,clone,completeDelivery,completeAnomaly,completeStickers,completeMintDate,sendMintHome} from '../src/state.ts';
import {MISSIONS,missionProgress,selectMission,trackedMission,restartMission,skipMission,jumpMissionStep} from '../src/missions.ts';

const reload=(s:unknown)=>validateSave(JSON.parse(JSON.stringify(s)));
test('every mission can be selected, skipped, replayed, and jumped to every valid checkpoint',()=>{
  let s=initialState();
  for(const id of MISSION_IDS){
    selectMission(s,id);assert.equal(trackedMission(reload(s)),id);
    skipMission(s,id);s=reload(s);assert.equal(missionProgress(s,id).skipped,true);
    restartMission(s,id);s=reload(s);assert.equal(missionProgress(s,id).step,0);assert.equal(missionProgress(s,id).skipped,false);
    for(let step=0;step<MISSIONS[id].steps.length;step++){assert.equal(jumpMissionStep(s,id,step),true);s=reload(s);assert.equal(missionProgress(s,id).step,step);}
    const before=clone(s);assert.equal(jumpMissionStep(s,id,99),false);assert.deepEqual(s,before);
  }
});
test('replaying completed quests retains earned coins, furniture and friendship without issuing rewards again',()=>{
  let s=initialState();
  for(let run=0;run<3;run++){
    jumpMissionStep(s,'delivery',1);assert.equal(completeDelivery(s),true);
    jumpMissionStep(s,'anomaly',2);assert.equal(completeAnomaly(s),true);
    jumpMissionStep(s,'stickers',1);s.collected.push('sticker-cafe','sticker-canal','sticker-alley');assert.equal(completeStickers(s),true);
    jumpMissionStep(s,'mintDate',4);assert.equal(completeMintDate(s),true);sendMintHome(s);s=reload(s);
    assert.equal(s.coins,870);assert.equal(s.friendship.mint,30);assert.equal(s.friendship.nanally,20);assert.equal(s.friendship.hotori,10);
    assert.equal(s.furniture.filter(f=>f.item==='clock').length,1);assert.equal(s.collected.filter(c=>c==='mint-date-keepsake').length,1);
  }
});
test('parcel replay resets its dependent date and visitor without deleting earned keepsakes',()=>{
  const s=initialState();jumpMissionStep(s,'mintDate',4);completeMintDate(s);assert.equal(s.mintAtHome,true);
  restartMission(s,'delivery');const restored=reload(s);assert.equal(restored.quests.mintDate,'new');assert.equal(restored.mintDateDrink,null);assert.equal(restored.mintAtHome,false);assert.ok(restored.collected.includes('mint-date-keepsake'));
});
test('skips issue no rewards and legacy completed dates remain completed until explicitly replayed',()=>{
  const s=initialState();for(const id of MISSION_IDS)skipMission(s,id);const skipped=reload(s);assert.equal(skipped.coins,500);assert.equal(skipped.friendship.mint,0);assert.equal(skipped.rewards.length,0);
  const legacy:any=initialState();delete legacy.mintAtHome;delete legacy.selectedMission;delete legacy.skippedMissions;delete legacy.quests.home;
  legacy.quests.delivery='done';legacy.quests.mintDate='done';legacy.mintDateDrink='soda';legacy.rewards=['mint-first-date','first-decoration'];legacy.collected=['mint-date-keepsake'];
  const loaded=reload(legacy);assert.equal(loaded.mintAtHome,false);assert.equal(loaded.quests.mintDate,'done');assert.equal(loaded.quests.home,'done');assert.equal(loaded.selectedMission,null);
});

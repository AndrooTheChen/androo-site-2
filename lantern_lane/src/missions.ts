import {MISSION_IDS,MINT_DATE_STOPS,MINT_HOME_SPOT,type MissionId} from './content';
import {type GameState,type MintDateStage} from './state';

export const MISSIONS = {
  delivery:{title:'Special delivery',steps:['Accept Mint’s parcel in the courtyard.','Bring the parcel to Nanally by the canal.']},
  anomaly:{title:'A tiny mystery',steps:['Ask Hotori about the wandering clock.','Find the shimmer by the green vending machine.','Return the clock to Hotori.']},
  stickers:{title:'Sticker expedition',steps:['Accept Nanally’s sticker expedition.','Find all three stickers, then return to Nanally.']},
  home:{title:'Make yourself at home',steps:['Buy a decoration from Curios & Co.','Place a decoration inside your apartment.']},
  mintDate:{title:'First date with Mint',steps:['Accept Mint’s invitation in the courtyard.','Share a drink at Morrow Café.','Meet by the canal and invite Mint over.','Bring Mint home and talk to her by the bed.','Snuggle together, then finish your first date.']},
} as const;
export function missionProgress(s:GameState,id:MissionId){
  const status=s.quests[id],total=MISSIONS[id].steps.length;
  const stages:Record<MissionId,readonly string[]>={delivery:['new','active'],anomaly:['new','active','found'],stickers:['new','active'],home:['new','bought'],mintDate:['new','cafe','canal','apartment','snuggle']};
  const step=status==='done'?total:Math.max(0,stages[id].indexOf(status));
  return {step,total,done:status==='done',skipped:s.skippedMissions.includes(id),hint:status==='done'?(s.skippedMissions.includes(id)?'Skipped for testing. Replay whenever you like.':id==='mintDate'&&s.mintAtHome?'Mint is resting at home. Talk to her to send her back to the courtyard.':'Complete. Replay this mission whenever you like.'):MISSIONS[id].steps[step]};
}
export function trackedMission(s:GameState):MissionId|null {
  return s.selectedMission??(s.quests.mintDate!=='new'&&s.quests.mintDate!=='done'?'mintDate':MISSION_IDS.find(id=>s.quests[id]!=='done')??null);
}
export function selectMission(s:GameState,id:MissionId){s.selectedMission=id;}
function resetDate(s:GameState){s.quests.mintDate='new';s.mintDateDrink=null;s.mintAtHome=false;s.skippedMissions=s.skippedMissions.filter(id=>id!=='mintDate');}
export function restartMission(s:GameState,id:MissionId){
  s.skippedMissions=s.skippedMissions.filter(m=>m!==id);s.selectedMission=id;
  if(id==='delivery'){s.quests.delivery='new';resetDate(s);}
  if(id==='anomaly'){s.quests.anomaly='new';s.collected=s.collected.filter(c=>c!=='odd-clock');}
  if(id==='stickers'){s.quests.stickers='new';s.collected=s.collected.filter(c=>!c.startsWith('sticker-'));}
  if(id==='home')s.quests.home='new';
  if(id==='mintDate'){
    resetDate(s);
    // Test access bypasses the prerequisite without issuing delivery rewards.
    if(s.quests.delivery!=='done'){s.quests.delivery='done';if(!s.skippedMissions.includes('delivery'))s.skippedMissions.push('delivery');}
  }
}
export function skipMission(s:GameState,id:MissionId){
  s.selectedMission=id;s.quests[id]='done';if(!s.skippedMissions.includes(id))s.skippedMissions.push(id);
  if(id==='mintDate'){
    if(s.quests.delivery!=='done'){s.quests.delivery='done';if(!s.skippedMissions.includes('delivery'))s.skippedMissions.push('delivery');}
    s.mintDateDrink??='tea';s.mintAtHome=false;
  }
}
export function jumpMissionStep(s:GameState,id:MissionId,step:number):boolean {
  if(!Number.isInteger(step)||step<0||step>=MISSIONS[id].steps.length)return false;
  const drink=s.mintDateDrink??'tea';restartMission(s,id);s.started=true;s.scene='town';
  if(id==='delivery'){s.quests.delivery=step===0?'new':'active';s.player=step===0?{x:-3,z:5.5}:{x:9,z:7};}
  if(id==='anomaly'){s.quests.anomaly=(['new','active','found'] as const)[step];s.player=step===1?{x:-14,z:-2}:{x:8,z:-2};if(step===2)s.collected.push('odd-clock');}
  if(id==='stickers'){s.quests.stickers=step===0?'new':'active';s.player={x:9,z:7};}
  if(id==='home'){
    s.quests.home=step===0?'new':'bought';s.player=step===0?{x:6,z:-3}:{x:0,z:2.8};
    if(step===1){s.scene='home';if(!s.furniture.some(f=>f.item!=='rug')&&s.furniture.length<80)s.furniture.push({id:`f-${s.nextId++}`,item:'lamp',placement:null});}
  }
  if(id==='mintDate'){
    s.quests.mintDate=(['new','cafe','canal','apartment','snuggle'] as MintDateStage[])[step];
    s.mintDateDrink=step>=2?drink:null;
    if(step===0)s.player={x:-3,z:5.5};
    if(step===1||step===2){const stop=step===1?MINT_DATE_STOPS.cafe:MINT_DATE_STOPS.canal;s.player={x:stop.x+1,z:stop.z+.5};}
    if(step>=3){s.scene='home';s.player={...MINT_HOME_SPOT};s.mintAtHome=true;}
  }
  return true;
}

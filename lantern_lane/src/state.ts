import { CATALOG, CONTENT_VERSION, MINT_DATE_STOPS, type ItemId, type CharacterId } from './content';
export type MintDateStage = 'new'|'cafe'|'canal'|'done';
export type DateDrink = 'soda'|'tea';
export type Placement = {x:number; z:number; rotation:number};
export type Furniture = {id:string; item:ItemId; placement:Placement|null};
export type GameState = {
  schemaVersion:1; contentVersion:string; revision:number; name:string; color:string;
  day:number; minutes:number; coins:number; scene:'town'|'home'; player:{x:number;z:number};
  quests:{delivery:'new'|'active'|'done'; anomaly:'new'|'active'|'found'|'done'; stickers:'new'|'active'|'done'; mintDate:MintDateStage};
  mintDateDrink:DateDrink|null;
  collected:string[]; rewards:string[]; furniture:Furniture[]; nextId:number;
  friendship:Record<CharacterId,number>; greeted:Record<string,number>;
  settings:{sound:boolean; reducedMotion:boolean}; started:boolean;
};
export function initialState():GameState {return {
  schemaVersion:1,contentVersion:CONTENT_VERSION,revision:0,name:'Neighbor',color:'#e7aa74',
  day:1,minutes:16*60+20,coins:500,scene:'town',player:{x:-3,z:8},
  quests:{delivery:'new',anomaly:'new',stickers:'new',mintDate:'new'},mintDateDrink:null,collected:[],rewards:[],
  furniture:[{id:'f-1',item:'rug',placement:{x:0,z:0,rotation:0}}],nextId:2,
  friendship:{mint:0,nanally:0,hotori:0},greeted:{},settings:{sound:false,reducedMotion:false},started:false,
};}
export function clone<T>(s:T):T { return structuredClone(s); }
export function reward(s:GameState,key:string,coins:number,friends:CharacterId[]=[]):boolean {
  if(s.rewards.includes(key)) return false;
  s.rewards.push(key);s.coins+=coins;for(const f of friends)s.friendship[f]=Math.min(100,s.friendship[f]+10);return true;
}
export function greet(s:GameState,who:CharacterId) { if(s.greeted[who]!==s.day){s.greeted[who]=s.day;s.friendship[who]=Math.min(100,s.friendship[who]+2);} }
export function completeDelivery(s:GameState):boolean {
  if(s.quests.delivery!=='active')return false;
  s.quests.delivery='done';return reward(s,'delivery-intro',120,['mint','nanally']);
}
export function mintDateStop(s:GameState){return s.quests.mintDate==='cafe'||s.quests.mintDate==='canal'?MINT_DATE_STOPS[s.quests.mintDate]:null;}
export function beginMintDate(s:GameState):boolean {
  if(s.quests.delivery!=='done'||s.quests.mintDate!=='new'||s.scene!=='town')return false;
  s.quests.mintDate='cafe';return true;
}
export function atMintDateStop(s:GameState,mint:{x:number;z:number}):boolean {
  const stop=mintDateStop(s);
  return !!stop&&s.scene==='town'&&Math.hypot(s.player.x-stop.x,s.player.z-stop.z)<=2.6&&Math.hypot(mint.x-stop.x,mint.z-stop.z)<=.65;
}
export function shareMintDateDrink(s:GameState,drink:DateDrink,mint:{x:number;z:number}):boolean {
  if(s.quests.mintDate!=='cafe'||!atMintDateStop(s,mint)||!['soda','tea'].includes(drink))return false;
  s.mintDateDrink=drink;s.quests.mintDate='canal';return true;
}
export function completeMintDate(s:GameState,mint:{x:number;z:number}):boolean {
  if(s.quests.mintDate!=='canal'||!atMintDateStop(s,mint))return false;
  s.quests.mintDate='done';
  if(!reward(s,'mint-first-date',0,['mint']))return false;
  s.friendship.mint=Math.min(100,s.friendship.mint+10);
  s.collected.push('mint-date-keepsake');return true;
}
export function completeAnomaly(s:GameState):boolean {
  if(s.quests.anomaly!=='found')return false;
  s.quests.anomaly='done';if(!reward(s,'anomaly-intro',100,['hotori']))return false;
  s.furniture.push({id:`f-${s.nextId++}`,item:'clock',placement:null});return true;
}
export function completeStickers(s:GameState):boolean {
  if(s.quests.stickers!=='active'||s.collected.filter(x=>x.startsWith('sticker-')).length<3)return false;
  s.quests.stickers='done';return reward(s,'stickers-intro',150,['nanally']);
}
export function purchase(s:GameState,item:ItemId):Furniture|null {
  const def=CATALOG[item];if(!def||def.price<=0||s.coins<def.price||s.furniture.length>=80)return null;
  s.coins-=def.price;const f: Furniture={id:`f-${s.nextId++}`,item,placement:null};s.furniture.push(f);return f;
}
export function dimensions(item:ItemId,r:number):[number,number] {const [x,z]=CATALOG[item].size;return r%180===0?[x,z]:[z,x];}
export function canPlace(s:GameState,id:string,p:Placement):boolean {
  const f=s.furniture.find(x=>x.id===id);if(!f||![p.x,p.z,p.rotation].every(Number.isFinite)||![0,90,180,270].includes(p.rotation))return false;
  const [w,d]=dimensions(f.item,p.rotation);
  if(Math.abs(p.x)+w/2>3.8||Math.abs(p.z)+d/2>3.8)return false;
  if(f.item==='rug')return !s.furniture.some(o=>o.id!==id&&o.item==='rug'&&o.placement&&Math.abs(o.placement.x-p.x)<(2+w)/2&&Math.abs(o.placement.z-p.z)<(1.5+d)/2);
  // Reserve the doorway and a clear corridor to the fixed bed.
  if(Math.abs(p.x)<0.6+w/2&&p.z+d/2>1.6)return false;
  if(p.x-w/2< -1.5&&p.z-d/2< -0.5)return false;
  if(p.z-d/2< -3.2)return false;
  for(const other of s.furniture){if(other.id===id||!other.placement||other.item==='rug')continue;
    const [ow,od]=dimensions(other.item,other.placement.rotation);
    if(Math.abs(p.x-other.placement.x)<(w+ow)/2+0.05&&Math.abs(p.z-other.placement.z)<(d+od)/2+0.05)return false;
  }return true;
}
export function place(s:GameState,id:string,p:Placement):boolean {if(!canPlace(s,id,p))return false;s.furniture.find(f=>f.id===id)!.placement={...p};return true;}
export function validateSave(value:unknown):GameState {
  if(!value||typeof value!=='object')throw Error('This file does not contain a save.');
  const s=clone(value) as GameState;
  if(s.schemaVersion!==1)throw Error('This save version is not supported. Your current progress is unchanged.');
  const finite=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isFinite(v)&&v>=min&&v<=max;
  if(typeof s.name!=='string'||s.name.length>30||!/^#[0-9a-f]{6}$/i.test(s.color)||!finite(s.day,1,100000)||!Number.isInteger(s.day)||!finite(s.minutes,0,1440)||!finite(s.coins,0,1e9)||!finite(s.revision,0,1e9)||!finite(s.nextId,1,1e9)||typeof s.started!=='boolean'||!['home','town'].includes(s.scene))throw Error('Invalid player or world data.');
  if(!s.player||!finite(s.player.x,-100,100)||!finite(s.player.z,-100,100))throw Error('Invalid location.');
  if(!s.quests||!['new','active','done'].includes(s.quests.delivery)||!['new','active','found','done'].includes(s.quests.anomaly)||!['new','active','done'].includes(s.quests.stickers))throw Error('Invalid quest data.');
  // Additive migration: existing schema-1 saves keep all their progress.
  if(s.quests.mintDate===undefined)s.quests.mintDate='new';
  if(s.mintDateDrink===undefined)s.mintDateDrink=null;
  if(!['new','cafe','canal','done'].includes(s.quests.mintDate)||![null,'soda','tea'].includes(s.mintDateDrink))throw Error('Invalid Mint date data.');
  if(s.quests.mintDate!=='new'&&s.quests.delivery!=='done')throw Error('Mint’s date requires the parcel delivery.');
  if((s.quests.mintDate==='canal'||s.quests.mintDate==='done')!==!!s.mintDateDrink)throw Error('Invalid Mint date progress.');
  for(const a of [s.collected,s.rewards])if(!Array.isArray(a)||a.length>500||a.some(v=>typeof v!=='string')||new Set(a).size!==a.length)throw Error('Invalid journal data.');
  if((s.quests.mintDate==='done')!==s.rewards.includes('mint-first-date')||(s.quests.mintDate==='done')!==s.collected.includes('mint-date-keepsake'))throw Error('Invalid Mint date keepsake.');
  if(!s.friendship||!['mint','nanally','hotori'].every(k=>finite(s.friendship[k as CharacterId],0,100))||!s.greeted||typeof s.greeted!=='object')throw Error('Invalid friendship data.');
  if(Object.entries(s.greeted).some(([k,v])=>!['mint','nanally','hotori'].includes(k)||!finite(v,1,100000)))throw Error('Invalid greetings.');
  if(!Array.isArray(s.furniture)||s.furniture.length>80||new Set(s.furniture.map(f=>f.id)).size!==s.furniture.length)throw Error('Invalid furniture collection.');
  for(const f of s.furniture){if(typeof f.id!=='string'||!/^f-\d+$/.test(f.id)||!Object.hasOwn(CATALOG,f.item))throw Error('Unknown furniture in save.');
    if(f.placement&&(!finite(f.placement.x,-3.8,3.8)||!finite(f.placement.z,-3.8,3.8)||![0,90,180,270].includes(f.placement.rotation)))throw Error('Invalid furniture position.');
  }
  if(s.furniture.some(f=>f.placement&&!canPlace(s,f.id,f.placement)))throw Error('Furniture overlaps a protected space.');
  s.nextId=Math.max(s.nextId,...s.furniture.map(f=>Number(f.id.slice(2))+1));
  if(!s.settings||typeof s.settings.sound!=='boolean'||typeof s.settings.reducedMotion!=='boolean')throw Error('Invalid settings.');
  s.contentVersion=CONTENT_VERSION;
  return s;
}

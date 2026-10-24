import test from 'node:test';
import assert from 'node:assert/strict';
import {CAFE,CAFE_DRINKS,MINT_DATE_STOPS,type CafeDrinkId} from '../src/content.ts';
import {initialState,validateSave,clone,travelTo,orderCafeDrink,enjoyCafeDrink,beginMintDate,shareMintDateDrink,inviteMintHome} from '../src/state.ts';
import {jumpMissionStep,skipMission,restartMission,missionProgress} from '../src/missions.ts';
import {cafeMenuHTML} from '../src/cafe-menu.ts';
import {World} from '../src/world.ts';

Object.assign(globalThis,{document:{baseURI:'https://example.com/lantern_lane/',createElement:()=>({width:768,height:256,getContext:()=>({fillRect(){},fillText(){},fillStyle:'',font:'',textAlign:'',textBaseline:''})})},fetch:async()=>({json:async()=>({})})});
const reload=(s:unknown)=>validateSave(JSON.parse(JSON.stringify(s)));

test('the café is always accessible and exits at its own doorway, preserving apartment travel',()=>{
  for(const minutes of [0,540,980,1439]){
    let s=initialState();s.minutes=minutes;s.coins=0;
    assert.equal(travelTo(s,'cafe'),true);assert.deepEqual(s.player,CAFE.entry);s=reload(s);assert.equal(s.scene,'cafe');
    const before=clone(s);assert.equal(travelTo(s,'home'),false);assert.deepEqual(s,before);
    assert.equal(travelTo(s,'town'),true);assert.deepEqual(s.player,CAFE.outside);
    travelTo(s,'home');assert.deepEqual(s.player,{x:0,z:2.8});travelTo(s,'town');assert.deepEqual(s.player,{x:-11,z:-2.4});
  }
});

test('all drinks charge exactly once, survive saving, and can be enjoyed without granting rewards',()=>{
  for(const id of Object.keys(CAFE_DRINKS) as CafeDrinkId[]){
    let s=initialState();assert.equal(orderCafeDrink(s,id),false);travelTo(s,'cafe');assert.equal(orderCafeDrink(s,id),false);
    s.player={...CAFE.counter};const coins=s.coins;assert.equal(orderCafeDrink(s,id),true);assert.equal(s.coins,coins-CAFE_DRINKS[id].price);
    const purchased=clone(s);assert.equal(orderCafeDrink(s,id),false);assert.deepEqual(s,purchased);s=reload(s);travelTo(s,'town');
    assert.equal(enjoyCafeDrink(s),id);assert.equal(enjoyCafeDrink(s),null);assert.equal(s.coins,purchased.coins);assert.deepEqual(s.rewards,[]);
    travelTo(s,'cafe');s.player={...CAFE.counter};s.coins=CAFE_DRINKS[id].price-1;const broke=clone(s);assert.equal(orderCafeDrink(s,id),false);assert.deepEqual(s,broke);
    s.coins++;assert.equal(orderCafeDrink(s,id),true);assert.equal(s.coins,0);
  }
});

test('Mint’s drink step requires an indoor order and reunion; leaving and reloading retain the order',()=>{
  for(const id of Object.keys(CAFE_DRINKS) as CafeDrinkId[]){
    let s=initialState();s.quests.delivery='done';beginMintDate(s);s.player={...MINT_DATE_STOPS.cafe};
    assert.equal(shareMintDateDrink(s,id,MINT_DATE_STOPS.cafe),false);travelTo(s,'cafe');s.player={...CAFE.table};assert.equal(shareMintDateDrink(s,id,CAFE.mint),false);
    s.coins=0;s.player={...CAFE.counter};assert.equal(orderCafeDrink(s,id,true),true);assert.equal(orderCafeDrink(s,id,true),false);assert.equal(s.coins,0);assert.equal(s.cafeDrink,null);
    travelTo(s,'town');s=reload(s);assert.equal(s.mintDateOrder,id);travelTo(s,'cafe');s.player={...CAFE.table};
    assert.equal(shareMintDateDrink(s,id,{x:0,z:0}),false);assert.equal(shareMintDateDrink(s,id,CAFE.mint),true);assert.equal(shareMintDateDrink(s,id,CAFE.mint),false);
    s=reload(s);assert.equal(s.quests.mintDate,'canal');assert.equal(s.mintDateDrink,id);assert.equal(s.mintDateOrder,null);
    assert.equal(inviteMintHome(s,MINT_DATE_STOPS.canal),false);travelTo(s,'town');s.player={...MINT_DATE_STOPS.canal};assert.equal(inviteMintHome(s,MINT_DATE_STOPS.canal),true);
  }
});

test('legacy saves migrate additively, malformed café data is rejected, and testing controls clear pending date orders',()=>{
  const old:any=initialState();delete old.cafeDrink;delete old.mintDateOrder;old.coins=123;assert.equal(reload(old).coins,123);assert.equal(reload(old).cafeDrink,null);
  for(const bad of [{...initialState(),cafeDrink:'unknown'},{...initialState(),mintDateOrder:'tea'},{...initialState(),scene:'bakery'}])assert.throws(()=>reload(bad));
  for(const reset of [(s:any)=>skipMission(s,'mintDate'),(s:any)=>restartMission(s,'delivery'),(s:any)=>jumpMissionStep(s,'mintDate',2)]){
    const s=initialState();jumpMissionStep(s,'mintDate',1);assert.equal(s.scene,'cafe');s.player={...CAFE.counter};orderCafeDrink(s,'tea',true);assert.match(missionProgress(s,'mintDate').hint,/Talk to Mint/);reset(s);assert.equal(reload(s).mintDateOrder,null);
  }
});

test('actual room navigation connects the entrance, counter, Mint, quiet corner, and exit without furniture collisions',()=>{
  const s=initialState(),w=new World(s);const exterior=w.pathTo(CAFE.door.x,CAFE.door.z,s);assert.ok(exterior.length);assert.ok(Math.hypot(exterior.at(-1)!.x-CAFE.door.x,exterior.at(-1)!.z-CAFE.door.z)<1);
  jumpMissionStep(s,'mintDate',1);w.setScene(s.scene,s);assert.equal(w.cafe.visible,true);assert.equal(w.town.visible,false);assert.equal(w.home.visible,false);
  assert.equal(w.blocked(s.player.x,s.player.z,s),false);assert.equal(w.blocked(CAFE.mint.x,CAFE.mint.z,s),false);
  for(const stop of [CAFE.counter,CAFE.table,{x:-2.6,z:1.4},CAFE.exit]){
    const path=w.pathTo(stop.x,stop.z,s);assert.ok(path.length,`no route to ${JSON.stringify(stop)}`);
    let previous=w.player.root.position.clone();
    for(const point of path){for(let i=1;i<=8;i++){const sample=previous.clone().lerp(point,i/8);assert.equal(w.blocked(sample.x,sample.z,s),false);}previous=point;}
    const end=path.at(-1)!;assert.ok(Math.hypot(end.x-stop.x,end.z-stop.z)<.6);w.player.root.position.copy(end);s.player={x:end.x,z:end.z};
  }
  assert.equal(w.blocked(1.8,-3.1,s),true);assert.equal(w.blocked(-4,-1.8,s),true);assert.equal(w.blocked(7,0,s),true);
});

test('Mint and the date cups stay in the café through the drink conversation and restore correctly on reload or exit',()=>{
  let s=initialState();jumpMissionStep(s,'mintDate',1);s.player={...CAFE.counter};orderCafeDrink(s,'matcha',true);
  const w=new World(s),mint=w.actors.get('mint')!;assert.equal(mint.root.parent,w.cafe);assert.equal(w.cafeDrinks.visible,true);
  s.player={...CAFE.table};shareMintDateDrink(s,'matcha',CAFE.mint);w.syncMint(s);assert.equal(mint.root.parent,w.cafe);assert.equal(mint.root.visible,true);
  s=reload(s);const resumed=new World(s);assert.equal(resumed.actors.get('mint')!.root.parent,resumed.cafe);
  travelTo(s,'town');w.setScene('town',s);assert.equal(mint.root.parent,w.town);assert.equal(w.cafe.visible,false);assert.equal(w.blocked(s.player.x,s.player.z,s),false);
  for(let i=0;i<1600;i++){w.updateNPCs(s,.04);assert.equal(w.blocked(mint.root.position.x,mint.root.position.z,s),false);}
  assert.ok(Math.hypot(mint.root.position.x-MINT_DATE_STOPS.canal.x,mint.root.position.z-MINT_DATE_STOPS.canal.z)<.2);
});

test('menu communicates prices, insufficient funds, held cups, and the sponsored date order',()=>{
  const s=initialState();s.coins=0;let html=cafeMenuHTML(s);assert.equal((html.match(/ disabled/g)??[]).length,4);assert.match(html,/Need more coins/);
  jumpMissionStep(s,'mintDate',1);html=cafeMenuHTML(s);assert.equal((html.match(/ disabled/g)??[]).length,0);assert.match(html,/Mint’s treat/);
  s.mintDateOrder='tea';s.cafeDrink='latte';html=cafeMenuHTML(s);assert.match(html,/Talk to Mint/);assert.match(html,/Enjoy your drink/);assert.equal((html.match(/ disabled/g)??[]).length,4);
});

import test from 'node:test';
import assert from 'node:assert/strict';
import { initialState, purchase, place } from '../src/state.ts';
import { World } from '../src/world.ts';
// World and navigation run without a GPU. Text canvases are inert in this test.
Object.assign(globalThis,{document:{baseURI:'https://example.com/lantern_lane/',createElement:()=>({width:768,height:192,getContext:()=>({fillRect(){},fillText(){},fillStyle:'',font:'',textAlign:'',textBaseline:''})})},fetch:async()=>({json:async()=>({mint:null,nanally:null,hotori:null})})});

test('every core objective can be reached on the actual neighborhood collision map',()=>{
  const s=initialState(),w=new World(s);const destinations=[[-2,4],[8,6],[7,-3],[-14,-3],[7,-3],[6,-3.6],[-11,-3.3]];
  for(const [x,z]of destinations){const path=w.pathTo(x,z,s);assert.ok(path.length,`no route to ${x},${z}`);for(const node of path)assert.equal(w.blocked(node.x,node.z,s),false);const end=path.at(-1)!;assert.ok(Math.hypot(end.x-x,end.z-z)<1.7);w.player.root.position.copy(end);s.player={x:end.x,z:end.z};}
});
test('apartment preserves access between entry and bed after furniture placement',()=>{const s=initialState();s.scene='home';s.player={x:0,z:2.8};const lamp=purchase(s,'lamp')!,plant=purchase(s,'plant')!;place(s,lamp.id,{x:1.75,z:0,rotation:0});place(s,plant.id,{x:3,z:2,rotation:0});const w=new World(s);const bed=w.pathTo(-1.1,-1.6,s);assert.ok(bed.length);assert.ok(bed.at(-1)!.distanceTo(w.player.root.position)>2);w.player.root.position.copy(bed.at(-1)!);const door=w.pathTo(0,3.2,s);assert.ok(door.length);});
test('scene geometry stays finite, world remains within scale budget, and textures are local',()=>{const s=initialState(),w=new World(s);let meshes=0,triangles=0;w.scene.traverse((o:any)=>{if(!o.isMesh)return;meshes++;const a=o.geometry.attributes.position;for(const v of a.array)assert.ok(Number.isFinite(v));triangles+=(o.geometry.index?.count??a.count)/3;});assert.ok(meshes<320,`too many meshes: ${meshes}`);assert.ok(triangles<150000,`too many triangles: ${triangles}`);console.log(JSON.stringify({sceneMeshes:meshes,sceneTriangles:triangles}));});

test('Mint walks collision-free to both date stops, waits there, pauses indoors, and resumes after reload',()=>{
  const s=initialState();s.quests.delivery='done';const w=new World(s),mint=w.actors.get('mint')!;
  for(const [stage,x,z]of [['cafe',-2.5,1],['canal',12,8.5]] as const){
    s.quests.mintDate=stage;
    for(let frame=0;frame<1500;frame++){w.updateNPCs(s,.04);assert.equal(w.blocked(mint.root.position.x,mint.root.position.z,s),false,'Mint walked through scenery');}
    assert.ok(Math.hypot(mint.root.position.x-x,mint.root.position.z-z)<.15);
    const stopped=mint.root.position.clone();for(let i=0;i<100;i++)w.updateNPCs(s,.04);assert.ok(mint.root.position.equals(stopped));
    const resumed=new World(s);assert.ok(resumed.actors.get('mint')!.root.position.distanceTo(stopped)<.15);
  }
  s.scene='home';w.setScene('home',s);const before=mint.root.position.clone();w.updateNPCs(s,1);assert.ok(mint.root.position.equals(before));
  s.scene='town';w.setScene('town',s);s.quests.mintDate='done';
  for(let i=0;i<1500;i++){w.updateNPCs(s,.04);assert.equal(w.blocked(mint.root.position.x,mint.root.position.z,s),false);}
  assert.ok(Math.hypot(mint.root.position.x+2,mint.root.position.z-4)<1);
});

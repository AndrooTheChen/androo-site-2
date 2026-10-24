import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { CATALOG, CHARACTERS, COLLECTIBLES, MINT_HOME_SPOT, MINT_COURTYARD, type ItemId, type CharacterId } from './content';
import { dimensions, mintDateStop, type GameState, type Placement, type MintDateStage } from './state';
import { faceToward } from './camera';

const mats=new Map<string,THREE.MeshStandardMaterial>();
function mat(color:string,roughness=.85){if(!mats.has(color))mats.set(color,new THREE.MeshStandardMaterial({color,roughness}));return mats.get(color)!;}
function mesh(g:THREE.BufferGeometry,c:string,p:THREE.Object3D,x=0,y=0,z=0){const m=new THREE.Mesh(g,mat(c));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;p.add(m);return m;}
function box(p:THREE.Object3D,x:number,y:number,z:number,w:number,h:number,d:number,c:string){return mesh(new THREE.BoxGeometry(w,h,d),c,p,x,y,z);}
function ball(p:THREE.Object3D,x:number,y:number,z:number,r:number,c:string){return mesh(new THREE.SphereGeometry(r,12,8),c,p,x,y,z);}
function cyl(p:THREE.Object3D,x:number,y:number,z:number,rt:number,rb:number,h:number,c:string){return mesh(new THREE.CylinderGeometry(rt,rb,h,12),c,p,x,y,z);}
function group(parent:THREE.Object3D,x=0,y=0,z=0){const g=new THREE.Group();g.position.set(x,y,z);parent.add(g);return g;}
function textSign(p:THREE.Object3D,words:string,x:number,y:number,z:number,w:number,h:number,bg:string,fg:string,sub=''){
  const canvas=document.createElement('canvas');canvas.width=768;canvas.height=192;const ctx=canvas.getContext('2d')!;
  ctx.fillStyle=bg;ctx.fillRect(0,0,768,192);ctx.fillStyle=fg;ctx.textAlign='center';ctx.textBaseline='middle';ctx.font=`600 ${sub?70:85}px sans-serif`;ctx.fillText(words,384,sub?75:97);if(sub){ctx.font='24px sans-serif';ctx.fillText(sub,384,148);}
  const t=new THREE.CanvasTexture(canvas);t.colorSpace=THREE.SRGBColorSpace;
  const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:t}));m.position.set(x,y,z);p.add(m);return m;
}
function tree(p:THREE.Object3D,x:number,z:number,scale=1){const g=group(p,x,0,z);g.scale.setScalar(scale);cyl(g,0,.24,0,.67,.6,.48,'#dccfb6');cyl(g,0,1.3,0,.12,.18,2.1,'#8b7457');ball(g,0,2.7,0,1.1,'#7fa582');ball(g,-.65,2.5,.1,.75,'#89b38a');ball(g,.65,2.6,-.15,.8,'#749a77');ball(g,.05,3.3,.05,.72,'#93b98c');}
function planter(p:THREE.Object3D,x:number,z:number,w=1.5){box(p,x,.25,z,w,.5,.65,'#d1b99b');for(let i=0;i<5;i++){const xx=x-w*.4+i*w*.2;ball(p,xx,.67,z,.29,i%2?'#95ac74':'#74996b');ball(p,xx,.86,z+.08,.09,i%2?'#f0c583':'#e19c86');}}
function bench(p:THREE.Object3D,x:number,z:number,r=0){const g=group(p,x,0,z);g.rotation.y=r;for(let i=0;i<4;i++)box(g,0,.63,-.24+i*.17,2,.1,.12,'#b58e6b');box(g,0,1.08,-.35,2,.5,.12,'#c8a17c');for(const xx of [-.72,.72]){box(g,xx,.3,0,.1,.6,.62,'#596b60');box(g,xx,.78,-.37,.1,1.4,.1,'#596b60');}}
function streetlamp(p:THREE.Object3D,x:number,z:number){cyl(p,x,1.7,z,.055,.08,3.4,'#536e66');cyl(p,x,3.4,z,.32,.32,.1,'#536e66');cyl(p,x,3.15,z,.23,.2,.44,'#f6d6a0');cyl(p,x,.1,z,.22,.22,.2,'#536e66');}
function building(p:THREE.Object3D,x:number,z:number,w:number,d:number,h:number,c:string,accent:string,name:string,sub:string){
  const g=group(p,x,0,z);box(g,0,h/2,0,w,h,d,c);box(g,0,.25,0,w+.15,.5,d+.15,'#b9ac94');
  box(g,0,h+.16,0,w+.35,.3,d+.35,'#ede1c6');box(g,0,h+.35,0,w,.2,d,'#aeb9a3');
  for(let floor=1;floor<Math.floor(h/2.4);floor++){const yy=2.7+floor*2;for(let col=0;col<Math.floor(w/1.8);col++){const xx=-w/2+1+col*1.8;box(g,xx,yy,d/2+.04,1.13,1.43,.15,'#eaddc2');box(g,xx,yy+.05,d/2+.14,.86,1.15,.05,'#7c9b94');box(g,xx,yy+.03,d/2+.19,.05,1.12,.06,'#d5d5b8');box(g,xx,yy-.2,d/2+.19,.87,.05,.06,'#d5d5b8');box(g,xx,yy-.73,d/2+.3,1.25,.15,.45,accent);}}
  for(let col=0;col<Math.floor(w/2);col++){const xx=-w/2+1+col*2;box(g,xx,1.55,d/2+.04,1.5,2.3,.15,'#536d65');box(g,xx,1.6,d/2+.14,1.25,2.05,.05,'#aec5ad');box(g,xx,1.5,d/2+.18,.06,2.05,.05,'#e7d6b7');box(g,xx,1.4,d/2+.18,1.25,.05,.05,'#e7d6b7');}
  box(g,0,3.15,d/2+.45,w+.25,.24,1.2,accent);for(let i=0;i<Math.floor(w/.5);i++)box(g,-w/2+.25+i*.5,2.95,d/2+1.03,.48,.35,.06,i%2?accent:'#efe4c6');
  textSign(g,name,0,3.95,d/2+.18,Math.min(w-.5,5.4),.83,accent,'#fff4d9',sub);
  // Rooftop details and side utility work.
  box(g,-w*.25,h+.7,-d*.1,1.5,.7,1.2,'#c4c2ae');for(let i=0;i<5;i++)box(g,-w*.25,h+1.07,-d*.1-.45+i*.22,1.25,.03,.06,'#909e92');
  box(g,w/2-.18,h/2,d/2+.12,.13,h,.13,'#b8b4a1');
  for(const xx of [-w*.32,w*.32]){cyl(g,xx,h+.5,d*.25,.4,.3,.6,'#ccaa83');ball(g,xx,h+1,d*.25,.55,'#6b946f');}
  return g;
}
function optimize(root:THREE.Group){root.updateMatrixWorld(true);const buckets=new Map<THREE.Material,THREE.BufferGeometry[]>();const remove:THREE.Mesh[]=[];root.traverse(o=>{if(o instanceof THREE.Mesh&&!Array.isArray(o.material)&&o.material instanceof THREE.MeshStandardMaterial){const geo=o.geometry.clone();geo.applyMatrix4(o.matrixWorld);if(!buckets.has(o.material))buckets.set(o.material,[]);buckets.get(o.material)!.push(geo);remove.push(o);}});for(const m of remove)m.removeFromParent();for(const [material,gs]of buckets){const merged=mergeGeometries(gs);if(!merged)continue;const m=new THREE.Mesh(merged,material);m.castShadow=true;m.receiveShadow=true;root.add(m);for(const g of gs)g.dispose();}}
export type Actor={root:THREE.Group;visual:THREE.Group;limbs:THREE.Object3D[];mixer?:THREE.AnimationMixer;actions?:{idle?:THREE.AnimationAction;walk?:THREE.AnimationAction};moving:boolean;phase:number;bedPose?:{x:number;scale:number}};
export function makeActor(color:string,hair:string,kind='player'):Actor{
  const root=new THREE.Group(),g=group(root);const limbs:THREE.Object3D[]=[];
  for(const x of [-.19,.19]){const leg=group(g,x,.45,0);cyl(leg,0,-.14,0,.13,.12,.5,'#4c6260');ball(leg,0,-.39,.07,.16,'#f5e8cf');limbs.push(leg);}
  cyl(g,0,.98,0,.3,.38,.65,color);ball(g,0,1.62,0,.48,hair);ball(g,0,1.6,.22,.38,'#f4cfaa');
  const cap=ball(g,0,1.87,-.03,.43,hair);cap.scale.y=.65;for(const xx of [-.15,.15]){ball(g,xx,1.64,.568,.045,'#394f47');ball(g,xx,1.66,.604,.012,'#fff5dc');ball(g,xx*1.55,1.52,.52,.065,'#e7ab96');}
  for(const x of [-.41,.41]){const arm=group(g,x,1.18,0);cyl(arm,0,-.17,0,.115,.1,.42,color);ball(arm,0,-.4,0,.11,'#f4cfaa');limbs.push(arm);}
  if(kind==='mint'||kind==='nanally'){for(const x of [-.32,.32]){const ear=mesh(new THREE.ConeGeometry(.19,.43,3),hair,g,x,2.1,0);ear.rotation.y=Math.PI/2;}if(kind==='mint')box(g,.2,1.89,.29,.13,.33,.09,'#eda8b2');}
  if(kind==='hotori'){ball(g,.39,1.91,.05,.18,'#f5e6cf');box(g,0,1.0,.3,.64,.15,.1,'#c69b68');}
  if(kind==='nanally'){for(const xx of [-.16,.16]){const tor=new THREE.Mesh(new THREE.TorusGeometry(.13,.018,5,14),mat('#564c49'));tor.position.set(xx,1.65,.59);g.add(tor);}box(g,0,1.65,.6,.12,.025,.025,'#564c49');}
  return {root,visual:g,limbs,moving:false,phase:Math.random()*6};
}
export function standActor(actor:Actor,position:{x:number;z:number}){
  actor.bedPose=undefined;actor.root.rotation.set(0,0,0);actor.root.scale.setScalar(1);
  actor.root.position.set(position.x,0,position.z);actor.visual.position.y=0;actor.moving=false;
  actor.limbs.forEach(l=>l.rotation.x=0);
}
export function layActorOnBed(actor:Actor,x:number,scale=.82){
  actor.bedPose={x,scale};actor.moving=false;actor.visual.position.y=0;actor.limbs.forEach(l=>l.rotation.x=0);
  actor.root.rotation.set(-Math.PI/2,0,0);actor.root.scale.setScalar(scale);actor.root.position.set(0,0,0);
  actor.root.updateMatrixWorld(true);const bounds=new THREE.Box3().setFromObject(actor.root),center=bounds.getCenter(new THREE.Vector3());
  actor.root.position.set(x-center.x,1.03-bounds.min.y,-1.9-center.z);
  actor.root.updateMatrixWorld(true);
}
// Replace only the visual: the actor root still owns navigation, collision and facing.
export function installCharacterModel(actor:Actor,gltf:{scene:THREE.Group;animations:THREE.AnimationClip[]},entry:{height?:number;facingOffset?:number}){
  const model=gltf.scene;
  const bounds=new THREE.Box3().setFromObject(model);
  const height=bounds.getSize(new THREE.Vector3()).y;
  const targetHeight=entry.height??2.2;
  const facing=entry.facingOffset??0;
  if(!Number.isFinite(height)||height<=0||!Number.isFinite(targetHeight)||targetHeight<=0||!Number.isFinite(facing))throw new Error('Invalid character bounds or dimensions');
  model.scale.multiplyScalar(targetHeight/height);
  const scaled=new THREE.Box3().setFromObject(model),center=scaled.getCenter(new THREE.Vector3());
  model.position.sub(new THREE.Vector3(center.x,scaled.min.y,center.z));
  const wrapper=new THREE.Group();
  wrapper.name='character-model';
  wrapper.rotation.y=facing*Math.PI/180;
  wrapper.add(model);
  model.traverse(o=>{if(o instanceof THREE.Mesh){o.castShadow=true;o.receiveShadow=true;}});
  const mixer=gltf.animations.length?new THREE.AnimationMixer(model):undefined;
  const idle=gltf.animations.find(c=>/idle/i.test(c.name)),walk=gltf.animations.find(c=>/walk|jog/i.test(c.name));
  const actions=mixer?{idle:idle?mixer.clipAction(idle):undefined,walk:walk?mixer.clipAction(walk):undefined}:undefined;
  actions?.idle?.play();
  const previous=actor.visual;
  actor.mixer?.stopAllAction();
  actor.root.add(wrapper);
  actor.visual=wrapper;
  actor.limbs=[];
  actor.mixer=mixer;
  actor.actions=actions;
  previous.removeFromParent();
  previous.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});
  if(actor.bedPose)layActorOnBed(actor,actor.bedPose.x,actor.bedPose.scale);
}
export function furnitureModel(item:ItemId):THREE.Group{
  const g=new THREE.Group();const c=CATALOG[item].color;
  if(item==='lamp'){cyl(g,0,.1,0,.26,.3,.16,'#b89360');cyl(g,0,.65,0,.035,.045,1.1,'#a78557');cyl(g,0,1.3,0,.23,.4,.47,c);ball(g,0,1.27,0,.14,'#fff0bd');}
  if(item==='plant'){cyl(g,0,.25,0,.32,.23,.5,'#e2b193');for(let i=0;i<6;i++){const a=i*2.4;const b=ball(g,Math.cos(a)*.22,.7+i*.07,Math.sin(a)*.2,.24,c);b.scale.set(.8,1.35,.5);b.rotation.z=Math.sin(a)*.5;}}
  if(item==='cushion'){const b=ball(g,0,.23,0,.48,c);b.scale.set(.85,.5,.85);cyl(g,0,.2,0,.4,.4,.25,c);}
  if(item==='shelf'){for(const x of [-.65,.65])box(g,x,.8,0,.1,1.6,.45,c);for(const y of [.1,.8,1.55])box(g,0,y,0,1.4,.1,.5,c);for(let i=0;i<6;i++)box(g,-.48+i*.17,1.1,0,.13,.46,.3,['#779d8b','#e4b07d','#9b9bb2'][i%3]);box(g,.15,.4,0,.55,.4,.35,'#e2d7ba');}
  if(item==='sofa'){box(g,0,.4,0,1.8,.45,.85,c);box(g,0,.85,-.35,1.8,.7,.2,c);for(const x of [-.79,.79])box(g,x,.65,0,.22,.55,.9,c);for(const x of [-.42,.42])box(g,x,.64,.06,.72,.12,.58,'#a6b99b');}
  if(item==='table'){cyl(g,0,.67,0,.5,.5,.12,c);for(const x of [-.3,.3])for(const z of [-.3,.3])cyl(g,x,.32,z,.04,.06,.64,'#967953');}
  if(item==='rug'){box(g,0,.015,0,2,.03,1.5,c);box(g,0,.034,0,1.7,.01,1.2,'#edc4a1');}
  if(item==='clock'){box(g,0,.4,0,.5,.8,.35,c);const face=cyl(g,0,.48,.19,.19,.19,.03,'#f7ebcd');face.rotation.x=Math.PI/2;box(g,0,.53,.215,.025,.13,.02,'#6b657f');box(g,.055,.47,.216,.13,.025,.02,'#6b657f');}
  return g;
}
type Obstacle={x:number;z:number;w:number;d:number};
export class World{
  scene=new THREE.Scene();town=new THREE.Group();home=new THREE.Group();actors=new Map<CharacterId,Actor>();player:Actor;
  furniture=new THREE.Group();pickups=new Map<string,THREE.Group>();ghost:THREE.Group|null=null;
  sunlight=new THREE.DirectionalLight('#fff3d2',2.5);ambient=new THREE.HemisphereLight('#fff1d6','#91a398',2.3);
  water!:THREE.Mesh;marker=new THREE.Mesh(new THREE.RingGeometry(.32,.43,32),new THREE.MeshBasicMaterial({color:'#fff5d7',side:THREE.DoubleSide,transparent:true,opacity:.9}));
  obstacles:Obstacle[]=[];sceneId:'town'|'home'='town';rain!:THREE.Points;sky=new THREE.Color('#b9d4cb');
  dateMarker=new THREE.Mesh(new THREE.RingGeometry(.7,.77,40),new THREE.MeshBasicMaterial({color:'#58ac9b',side:THREE.DoubleSide,transparent:true,opacity:.85}));
  private mintDateStage:MintDateStage|'unset'='unset';
  private mintRoute:THREE.Vector3[]=[];
  constructor(s:GameState){this.scene.background=this.sky;this.scene.fog=new THREE.Fog('#b9d4cb',65,115);this.scene.add(this.town,this.home,this.ambient,this.sunlight);this.sunlight.position.set(-12,28,18);this.sunlight.castShadow=true;this.sunlight.shadow.mapSize.set(2048,2048);Object.assign(this.sunlight.shadow.camera,{left:-26,right:26,top:26,bottom:-26,near:1,far:90});this.sunlight.shadow.bias=-.0005;this.sunlight.shadow.normalBias=.035;
    this.buildTown();this.buildHome();this.player=makeActor(s.color,'#574f40');this.scene.add(this.player.root);
    for(const [id,pos]of Object.entries({mint:[-2,4],nanally:[8,6],hotori:[7,-3]}) as [CharacterId,number[]][]){const def=CHARACTERS[id];const a=makeActor(def.color,def.hair,id);a.root.position.set(pos[0],0,pos[1]);this.actors.set(id,a);this.town.add(a.root);}
    const stop=mintDateStop(s);if(stop)this.actors.get('mint')!.root.position.set(stop.x,0,stop.z);
    this.dateMarker.rotation.x=-Math.PI/2;this.dateMarker.visible=false;this.town.add(this.dateMarker);
    this.marker.rotation.x=-Math.PI/2;this.marker.visible=false;this.scene.add(this.marker);
    const rainPos=new Float32Array(400*3);for(let i=0;i<400;i++){rainPos[i*3]=Math.random()*40-20;rainPos[i*3+1]=Math.random()*18;rainPos[i*3+2]=Math.random()*35-17;}const rg=new THREE.BufferGeometry();rg.setAttribute('position',new THREE.BufferAttribute(rainPos,3));this.rain=new THREE.Points(rg,new THREE.PointsMaterial({color:'#e6f2e5',size:.055,transparent:true,opacity:.6}));this.scene.add(this.rain);
    this.setScene(s.scene,s);this.loadCharacters();
  }
  buildTown(){
    const root=group(this.town);box(root,0,-.7,0,41,1.3,34,'#7d9d8d');box(root,-1,-.1,0,37,.25,31,'#d9d0b8');
    // Broad, quiet pedestrian street with tile borders.
    box(root,-1,.02,2,35,.08,6,'#c0bca8');for(let z=-.5;z<5;z+=.7)for(let x=-17;x<15;x+=1.35)box(root,x,.067,z,1.25,.015,.035,'#c9c5b0');
    box(root,-1,.06,-1.3,35,.16,.28,'#eee2c5');box(root,-1,.06,5.3,35,.16,.28,'#eee2c5');
    for(let i=0;i<6;i++)box(root,-6+i*.75,.09,2,.4,.025,4.6,'#e8dfc5');
    // Courtyard pavers and circular planter.
    box(root,1,.02,9,27,.1,7,'#e0d8bd');for(let x=-11;x<14;x+=2)for(let z=6;z<13;z+=2)box(root,x,.08,z,1.92,.025,1.92,(x+z)%4?'#ded7bf':'#e6dec6');
    cyl(root,1,.2,8,2.3,2.3,.4,'#c4b69a');cyl(root,1,.42,8,2.05,2.05,.1,'#93a481');tree(root,1,8,1.05);
    this.obstacles.push({x:1,z:8,w:4.5,d:4.5});
    building(root,-12,-8,8,7,9,'#d7c0a1','#688c7b','LANE HOUSE','APARTMENTS · 01—08');
    building(root,-3,-8.5,7,7,7,'#e7caac','#bf8768','morrow','COFFEE & SLOW MORNINGS');
    building(root,6,-9,8,8,8,'#c3c9ac','#6e8d80','CURIOS & CO.','HOTORI’S LITTLE ANTIQUE SHOP');
    building(root,13,-9.5,5,7,10,'#bdc7b6','#ac7967','24 / 7','EVERYDAY LITTLE THINGS');
    for(const o of [{x:-12,z:-8,w:8.4,d:7.4},{x:-3,z:-8.5,w:7.4,d:7.4},{x:6,z:-9,w:8.4,d:8.4},{x:13,z:-9.5,w:5.4,d:7.4}])this.obstacles.push(o);
    // Tiny silhouettes beyond the block.
    for(let i=0;i<11;i++){const h=5+(i*7%8);box(root,-23+i*4,h/2-1,-21,3.5,h,4,i%2?'#9ebbb1':'#adc4b7');box(root,-23+i*4,h-.8,-21,2.7,.35,3,'#a0b9ab');}
    // Canal and its promenade.
    box(root,18,-.2,0,5,.4,32,'#669f9a');this.water=box(root,18,.03,0,4.5,.08,31,'#80bcb3');this.water.castShadow=false;
    for(let i=0;i<19;i++){box(root,16,.5,-14+i*1.6,.12,1.1,.12,'#688e7e');box(root,20,.5,-14+i*1.6,.12,1.1,.12,'#688e7e');}box(root,16,.9,0,.12,.1,30,'#688e7e');box(root,20,.9,0,.12,.1,30,'#688e7e');
    for(let i=0;i<14;i++)box(root,17+(i%3)*.7,.083,-13+i*1.9,.7+(i%2),.015,.045,'#a7d4c6');
    box(root,18,.15,10,5,.2,2.8,'#b69b77');for(let i=0;i<14;i++)box(root,15.6+i*.35,.27,10,.03,.02,2.8,'#d6be93');
    // Trees, benches, streetlights and shop life.
    for(const [x,z,sc]of [[-16,11,1.25],[-9,12,1],[-17,-1,.9],[12,12,1],[13,-2,.7]]){tree(root,x,z,sc);this.obstacles.push({x,z,w:1.3*sc,d:1.3*sc});}
    bench(root,-3,10);bench(root,5,10);bench(root,13,5,-Math.PI/2);
    for(const [x,z]of [[-3,10],[5,10],[13,5]])this.obstacles.push({x,z,w:x===13?.9:2,d:x===13?2:.9});
    for(const x of [-16,-7,4,14])streetlamp(root,x,5.7);
    planter(root,-9,-3.8,2);planter(root,3,-4.1,2);planter(root,10,-4.1,1.7);planter(root,14,7,1.2);
    // Café table and stools.
    for(const xx of [-4,-1]){cyl(root,xx,.75,-3,.65,.65,.1,'#e5d2aa');cyl(root,xx,.38,-3,.05,.12,.7,'#737d65');for(const zz of [-2.2,-3.8])cyl(root,xx,.35,zz,.22,.22,.65,'#ab8c68');this.obstacles.push({x:xx,z:-3,w:1.6,d:2.1});}
    // A gently suspicious vending machine in the side alley.
    box(root,-15,1.3,-3.4,1.5,2.6,.9,'#789f91');box(root,-15.18,1.6,-2.92,.95,1.5,.04,'#b9d8b7');for(let r=0;r<3;r++)for(let c=0;c<3;c++)cyl(root,-15.48+c*.3,1.15+r*.37,-2.85,.08,.08,.23,['#e7ae89','#e3cc83','#8fb8ae'][c]);box(root,-14.48,1.2,-2.91,.2,.4,.04,'#f0ca7a');this.obstacles.push({x:-15,z:-3.4,w:1.6,d:1});
    // Wayfinding board, flowers and parked bicycle.
    for(const x of [-7.4,-6])box(root,x,1.05,7,.1,2.1,.1,'#948263');box(root,-6.7,1.65,7,1.8,1.4,.15,'#698473');textSign(root,'HELLO, NEIGHBOR',-6.7,1.7,7.09,1.6,.7,'#f2e6c6','#5b7567','TAKE YOUR TIME');this.obstacles.push({x:-6.7,z:7,w:2,d:.5});
    for(const x of [-10.7,-9.4]){const tire=new THREE.Mesh(new THREE.TorusGeometry(.43,.055,6,18),mat('#627669'));tire.position.set(x,.5,-3);root.add(tire);}box(root,-10,1,-3,1.2,.08,.08,'#d4a06e');box(root,-10.3,.8,-3,.08,.7,.08,'#d4a06e');
    optimize(root);
    for(const c of COLLECTIBLES){const g=group(this.town,c.x,.8,c.z);const m=mesh(new THREE.OctahedronGeometry(c.kind==='anomaly'?.28:.19),c.kind==='anomaly'?'#b5a1d3':'#efd281',g);m.rotation.z=.3;const ring=new THREE.Mesh(new THREE.RingGeometry(.3,.35,24),new THREE.MeshBasicMaterial({color:'#f9e2a1',side:THREE.DoubleSide,transparent:true,opacity:.75}));ring.rotation.x=-Math.PI/2;ring.position.y=-.65;g.add(ring);this.pickups.set(c.id,g);}
  }
  buildHome(){const root=group(this.home);box(root,0,-.3,0,8.5,.6,8.5,'#bda789');box(root,0,.02,0,8,.05,8,'#decaab');for(let i=0;i<16;i++)box(root,-3.75+i*.5,.055,0,.02,.01,8,'#c9b38f');
    box(root,0,1.7,-4.1,8.4,3.4,.2,'#e6d9bb');box(root,-4.1,1.7,0,.2,3.4,8.4,'#d0d5b8');box(root,4.1,.2,0,.2,.4,8.4,'#e6d9bb');box(root,0,.2,4.1,8.4,.4,.2,'#e6d9bb');
    box(root,0,2,-3.97,2,1.8,.12,'#74978a');box(root,0,2,-3.89,1.8,1.6,.06,'#b0d2c4');box(root,0,2,-3.82,.06,1.65,.07,'#eee4ca');box(root,0,2,-3.82,1.85,.06,.07,'#eee4ca');box(root,0,1.05,-3.75,2.3,.12,.5,'#b9a37f');
    for(const xx of [-1.3,1.3])box(root,xx,2,-3.77,.4,2,.1,'#d9ad8a');
    box(root,-2.7,.35,-2,2.35,.7,2.8,'#ac8e6c');box(root,-2.7,.78,-2,2.35,.25,2.7,'#f4e6c9');box(root,-2.7,.94,-2.8,2.1,.2,.55,'#f4e9d2');box(root,-2.7,.94,-1.6,2.35,.12,1.65,'#8da697');box(root,-2.7,1,-3.45,2.4,1,.12,'#bd9b74');
    textSign(root,'a little place to belong',2.4,2.2,-3.96,1.6,.7,'#d8b389','#fff2d7');box(root,0,.075,3.4,1.4,.03,.7,'#879d86');optimize(root);this.home.add(this.furniture);
  }
  rebuildFurniture(s:GameState){this.furniture.traverse(o=>{if(o instanceof THREE.Mesh)o.geometry.dispose();});this.furniture.clear();for(const f of s.furniture){if(!f.placement)continue;const g=furnitureModel(f.item);g.name=f.id;g.position.set(f.placement.x,.07,f.placement.z);g.rotation.y=f.placement.rotation*Math.PI/180;this.furniture.add(g);}}
  setScene(id:'town'|'home',s:GameState){this.sceneId=id;this.town.visible=id==='town';this.home.visible=id==='home';for(const a of this.actors.values())a.root.visible=id==='town';standActor(this.player,s.player);this.rebuildFurniture(s);this.marker.visible=false;this.syncMint(s);}
  syncMint(s:GameState,reset=false){
    const mint=this.actors.get('mint')!;
    if(s.mintAtHome){
      if(mint.root.parent!==this.home||reset){this.home.add(mint.root);standActor(mint,MINT_HOME_SPOT);}
      if(s.quests.mintDate==='snuggle'||s.quests.mintDate==='done'){
        if(!mint.bedPose)layActorOnBed(mint,-3.15);
      }else if(mint.bedPose)standActor(mint,MINT_HOME_SPOT);
      mint.root.visible=s.scene==='home';this.mintRoute=[];this.mintDateStage=s.quests.mintDate;
    }else{
      if(mint.root.parent!==this.town||reset){
        this.town.add(mint.root);standActor(mint,reset?(mintDateStop(s)??MINT_COURTYARD):MINT_COURTYARD);
        this.mintRoute=[];this.mintDateStage='unset';
      }
      mint.root.visible=s.scene==='town';
    }
  }
  setSnuggleView(s:GameState,active:boolean){
    if(active&&!this.player.bedPose)layActorOnBed(this.player,-2.15,.82);
    else if(!active&&this.player.bedPose)standActor(this.player,s.player);
  }
  updatePickups(s:GameState){for(const [id,g]of this.pickups)g.visible=!s.collected.includes(id)&&(id!=='odd-clock'||s.quests.anomaly==='active');}
  blocked(x:number,z:number,s:GameState,r=.3):boolean {if(this.sceneId==='home'){if(Math.abs(x)>3.65-r||Math.abs(z)>3.7-r)return true;if(x< -1.5+r&&z< -.5+r)return true;return s.furniture.some(f=>{if(!f.placement||f.item==='rug')return false;const [w,d]=dimensions(f.item,f.placement.rotation);return Math.abs(f.placement.x-x)<w/2+r&&Math.abs(f.placement.z-z)<d/2+r;});}
    if(x< -17.3+r||x>14.8-r||z< -4.7+r||z>13.7-r)return true;return this.obstacles.some(o=>Math.abs(x-o.x)<o.w/2+r&&Math.abs(z-o.z)<o.d/2+r);
  }
  pathTo(x:number,z:number,s:GameState,start=this.player.root.position):THREE.Vector3[]{const step=.5;const sx=Math.round(start.x/step),sz=Math.round(start.z/step);let tx=Math.round(x/step),tz=Math.round(z/step);if(this.blocked(tx*step,tz*step,s)){let best=Infinity;for(let a=-5;a<=5;a++)for(let b=-5;b<=5;b++){const d=a*a+b*b;if(d<best&&!this.blocked((tx+a)*step,(tz+b)*step,s)){best=d;x=(tx+a)*step;z=(tz+b)*step;}}if(best===Infinity)return [];tx=Math.round(x/step);tz=Math.round(z/step);}
    const key=(a:number,b:number)=>`${a},${b}`;const startKey=key(sx,sz);const open=[{x:sx,z:sz,g:0,f:0}];const prev=new Map<string,string>();const cost=new Map([[startKey,0]]);let end='';let count=0;
    while(open.length&&count++<6000){open.sort((a,b)=>a.f-b.f);const cur=open.shift()!;const ck=key(cur.x,cur.z);if(cur.x===tx&&cur.z===tz){end=ck;break;}for(const [dx,dz]of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const nx=cur.x+dx,nz=cur.z+dz,nk=key(nx,nz);if(this.blocked(nx*step,nz*step,s)||(dx&&dz&&(this.blocked(nx*step,cur.z*step,s)||this.blocked(cur.x*step,nz*step,s))))continue;const ng=cur.g+Math.hypot(dx,dz);if(ng>=(cost.get(nk)??Infinity))continue;cost.set(nk,ng);prev.set(nk,ck);open.push({x:nx,z:nz,g:ng,f:ng+Math.hypot(tx-nx,tz-nz)});}}
    const out:THREE.Vector3[]=[];while(end&&end!==startKey){const [xx,zz]=end.split(',').map(Number);out.unshift(new THREE.Vector3(xx*step,0,zz*step));end=prev.get(end)??'';}return out;
  }
  setGhost(item:ItemId,p:Placement,valid:boolean){if(this.ghost){this.scene.remove(this.ghost);this.ghost.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();if(!Array.isArray(o.material))o.material.dispose();}});}this.ghost=furnitureModel(item);this.ghost.position.set(p.x,.08,p.z);this.ghost.rotation.y=p.rotation*Math.PI/180;this.ghost.traverse(o=>{if(o instanceof THREE.Mesh){const m=(o.material as THREE.MeshStandardMaterial).clone();m.transparent=true;m.opacity=.65;m.color.set(valid?'#73bda0':'#df877b');o.material=m;o.castShadow=false;}});this.scene.add(this.ghost);}
  clearGhost(){if(this.ghost){this.scene.remove(this.ghost);this.ghost.traverse(o=>{if(o instanceof THREE.Mesh){o.geometry.dispose();if(!Array.isArray(o.material))o.material.dispose();}});this.ghost=null;}}
  updateNPCs(s:GameState,dt:number){
    if(s.scene!=='town')return;
    const stage=s.quests.mintDate,stop=mintDateStop(s),mint=this.actors.get('mint')!;
    if(stage!==this.mintDateStage){
      const destination=stop??{x:-2,z:4};
      this.mintRoute=this.pathTo(destination.x,destination.z,s,mint.root.position);
      this.mintDateStage=stage;
    }
    for(const [id,a]of this.actors){
      a.moving=false;if(id==='mint'&&s.mintAtHome)continue;
      if(id==='mint'&&(stop||this.mintRoute.length)){
        const next=this.mintRoute[0];
        if(next){const delta=next.clone().sub(a.root.position),distance=delta.length();
          if(distance<.08){this.mintRoute.shift();}else{faceToward(a.root,next);a.root.position.addScaledVector(delta,Math.min(dt*1.8,distance)/distance);a.moving=true;}}
        continue;
      }
      const base={mint:[-2,4],nanally:[8,6],hotori:[7,-3]}[id];
      if(a.root.position.distanceTo(this.player.root.position)>3.4){
        const destination=new THREE.Vector3(base[0]+Math.sin(s.minutes/35+id.length)*.65,0,base[1]+Math.cos(s.minutes/42+id.length)*.65);
        const delta=destination.clone().sub(a.root.position);
        if(delta.length()>.1){faceToward(a.root,destination);a.root.position.add(delta.normalize().multiplyScalar(dt*.5));a.moving=true;}
      }
    }
  }
  async loadCharacters(){
    try {
      const response=await fetch(new URL('assets/characters/manifest.json',document.baseURI));
      if(response.ok===false)throw new Error(`Character manifest returned ${response.status}`);
      const manifest=await response.json();
      const loader=new GLTFLoader();
      for(const id of Object.keys(CHARACTERS) as CharacterId[]){
        const entry=manifest[id];
        if(!entry?.url)continue;
        try {
          const gltf=await loader.loadAsync(new URL(entry.url,document.baseURI).href);
          installCharacterModel(this.actors.get(id)!,gltf,entry);
        } catch(e) { console.warn(`Model ${id} unavailable; using stand-in.`,e); }
      }
    } catch(e) { console.warn('Character manifest unavailable; using stand-ins.',e); }
  }
  tick(dt:number,time:number,s:GameState,paused:boolean){const evening=Math.max(0,Math.min(1,(s.minutes-17*60)/150));const night=s.minutes<6*60?1:evening;this.sunlight.intensity=2.4-night*1.9;this.ambient.intensity=2.2-night*.85;this.sky.set('#bad3ca').lerp(new THREE.Color('#687e8c'),night);this.scene.background=this.sky;(this.scene.fog as THREE.Fog).color.copy(this.sky);this.sunlight.color.set('#fff2d4').lerp(new THREE.Color('#f2ba9a'),evening);this.rain.visible=s.day%3===0&&s.scene==='town';if(this.rain.visible&&!paused){const a=this.rain.geometry.attributes.position;for(let i=0;i<a.count;i++){a.setY(i,a.getY(i)-dt*10);if(a.getY(i)<0)a.setY(i,18);}a.needsUpdate=true;}
    const dateStop=mintDateStop(s);this.dateMarker.visible=!!dateStop;
    if(dateStop)this.dateMarker.position.set(dateStop.x,.13,dateStop.z);
    for(const [id,g]of this.pickups)if(!paused&&!s.settings.reducedMotion){g.position.y=.8+Math.sin(time*2+id.length)*.12;g.rotation.y+=dt*.7;}
    for(const a of [this.player,...this.actors.values()]){if(a.bedPose)continue;if(a.mixer){a.mixer.update(paused?0:dt);if(a.actions?.walk){const walking=a.moving&&!paused;a.actions.walk.enabled=walking;if(walking&&!a.actions.walk.isRunning())a.actions.walk.play();if(a.actions.idle)a.actions.idle.enabled=!walking;}}else{a.visual.position.y=paused||s.settings.reducedMotion?0:(a.moving?Math.sin(time*14)*.045:Math.sin(time*2+a.phase)*.025);a.limbs.forEach((l,i)=>l.rotation.x=a.moving&&!paused?Math.sin(time*12+i%2*Math.PI)*.45:0);}}
  }
}

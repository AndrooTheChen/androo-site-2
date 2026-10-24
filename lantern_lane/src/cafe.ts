import * as THREE from 'three';
import {mergeGeometries} from 'three/addons/utils/BufferGeometryUtils.js';
import {CAFE_DRINKS,type CafeDrinkId} from './content';

// A cutaway room: tall walls at the back and window side keep the player visible.
export const CAFE_OBSTACLES = [
  {x:1.8,z:-3.1,w:8,d:1.45}, {x:1.8,z:-4.65,w:8,d:.7},
  {x:-5.9,z:-.3,w:.95,d:6.5},
  {x:-4,z:-1.8,w:1.4,d:1.4}, {x:-4,z:1.4,w:1.4,d:1.4},
  {x:.1,z:1.4,w:1.55,d:1.55}, {x:.1,z:2.7,w:1.1,d:.55},
  {x:-6,z:3.65,w:.9,d:.9}, {x:6,z:-3.8,w:.8,d:.8},
];

export function buildCafe(){
  const root=new THREE.Group();root.name='Morrow Café';
  const materials=new Map<string,THREE.MeshStandardMaterial>();
  const material=(color:string)=>{if(!materials.has(color))materials.set(color,new THREE.MeshStandardMaterial({color,roughness:.88}));return materials.get(color)!;};
  function mesh(geo:THREE.BufferGeometry,color:string,x:number,y:number,z:number,parent:THREE.Object3D=root){const m=new THREE.Mesh(geo,material(color));m.position.set(x,y,z);m.castShadow=true;m.receiveShadow=true;parent.add(m);return m;}
  const box=(x:number,y:number,z:number,w:number,h:number,d:number,c:string)=>mesh(new THREE.BoxGeometry(w,h,d),c,x,y,z);
  const cyl=(x:number,y:number,z:number,rt:number,rb:number,h:number,c:string)=>mesh(new THREE.CylinderGeometry(rt,rb,h,16),c,x,y,z);
  function ball(x:number,y:number,z:number,r:number,c:string){return mesh(new THREE.SphereGeometry(r,12,8),c,x,y,z);}
  function sign(text:string,sub:string,x:number,y:number,z:number,w:number,h:number,bg='#486452'){
    const canvas=document.createElement('canvas');canvas.width=768;canvas.height=256;const ctx=canvas.getContext('2d')!;
    ctx.fillStyle=bg;ctx.fillRect(0,0,768,256);ctx.textAlign='center';ctx.fillStyle='#f5e6c8';ctx.font='58px Georgia';ctx.fillText(text,384,115);ctx.font='22px sans-serif';ctx.fillText(sub,384,185);
    const texture=new THREE.CanvasTexture(canvas);texture.colorSpace=THREE.SRGBColorSpace;
    const m=new THREE.Mesh(new THREE.PlaneGeometry(w,h),new THREE.MeshBasicMaterial({map:texture}));m.position.set(x,y,z);root.add(m);return m;
  }
  function plant(x:number,z:number,size=1,y=0){cyl(x,y+.27*size,z,.29*size,.22*size,.54*size,'#c38f71');for(let i=0;i<7;i++){const a=i*2.4;const leaf=ball(x+Math.cos(a)*.24*size,y+(.65+i*.08)*size,z+Math.sin(a)*.24*size,.25*size,'#79996e');leaf.scale.set(.7,1.5,.55);leaf.rotation.z=Math.sin(a)*.55;}}
  function cup(x:number,y:number,z:number,color:string,parent:THREE.Object3D=root){
    const saucer=mesh(new THREE.CylinderGeometry(.2,.2,.03,16),'#f5e8d2',x,y,z,parent);
    mesh(new THREE.CylinderGeometry(.13,.1,.19,16),'#f5e8d2',x,y+.1,z,parent);
    mesh(new THREE.CylinderGeometry(.115,.115,.012,16),color,x,y+.2,z,parent);
    const handle=mesh(new THREE.TorusGeometry(.065,.022,6,12),'#f5e8d2',x+.14,y+.12,z,parent);handle.rotation.y=Math.PI/2;return saucer;
  }
  box(0,-.25,0,14.2,.5,10.2,'#94735a');
  for(let x=-6.75;x<7;x+=.5){box(x,.02,0,.48,.07,10,'#cda77e');for(let z=-4;z<5;z+=2)box(x,.06,z+(Math.round(x*2)%2)*.6,.48,.006,.015,'#b18a66');}
  box(0,1.85,-5,14,3.7,.2,'#eddfc8');box(-7,1.85,0,.2,3.7,10,'#e3d6ba');
  box(7,.25,0,.18,.5,10,'#b7bba0');box(0,.25,5,14,.5,.18,'#b7bba0');
  // Sage wainscot, slim walnut mouldings, exposed ceiling beam.
  box(0,.6,-4.86,13.8,1.2,.08,'#91a18a');box(-6.86,.6,0,.08,1.2,10,'#91a18a');
  for(let x=-6.5;x<7;x+=.6)box(x,.6,-4.8,.035,1.1,.04,'#788d77');
  box(0,1.2,-4.75,13.8,.07,.18,'#9f7956');box(-6.75,1.2,0,.18,.07,10,'#9f7956');
  box(0,3.65,-4.8,14,.22,.3,'#99714d');box(-6.8,3.65,0,.3,.22,10,'#99714d');
  // Broad windows with a painted city view, curtains, and afternoon light on the floor.
  for(const z of [-2.4,1.05]){
    box(-6.82,2.3,z,.07,2.05,2.85,'#849e88');box(-6.76,2.3,z,.04,1.85,2.65,'#c1d5bd');
    for(let i=0;i<4;i++)box(-6.70,1.62+(i%2)*.1,z-1+i*.65,.025,.55+(i%2)*.2,.45,i%2?'#a3b5a0':'#adbeaa');
    box(-6.6,2.3,z,.13,1.92,.07,'#f6e9cd');box(-6.6,2.3,z,.13,.07,2.7,'#f6e9cd');
    box(-6.5,1.31,z,.5,.13,3,'#a6815c');
    for(const dz of [-1.47,1.47])box(-6.4,2.35,z+dz,.22,2.2,.23,'#eee1bd');
    const light=box(-4.7,.071,z+1,3,.009,1.8,'#dfbf8e');light.rotation.y=-.3;light.castShadow=false;
  }
  // Window banquette and two little marble-topped tables.
  box(-6,.33,-.3,.9,.65,6.6,'#9b7958');box(-5.94,.73,-.3,.95,.2,6.5,'#91a690');box(-6.35,1.15,-.3,.2,.85,6.5,'#829984');
  for(const z of [-2.5,-.9,.8,2.3])box(-6.05,1.01,z,.5,.38,.7,z<0?'#d8ad87':'#b8bba0');
  for(const z of [-1.8,1.4]){
    cyl(-4,.5,z,.09,.28,.95,'#6a705a');cyl(-4,1.02,z,.7,.7,.13,'#ede0be');
    cyl(-5.05,.28,z,.13,.18,.5,'#9e7956');cyl(-5.05,.58,z,.32,.32,.14,'#a4ae8b');
    cyl(-4.18,1.15,z-.2,.085,.06,.17,'#cdad85');ball(-4.18,1.34,z-.2,.12,'#e1b597');
  }
  // A reading nook with an open book, cushion and terracotta pot.
  cyl(.1,.5,1.4,.1,.35,.95,'#7e7960');cyl(.1,1.02,1.4,.76,.76,.12,'#b88d65');
  box(.1,.4,2.7,1.1,.75,.55,'#9c795c');box(.1,.8,2.7,1.05,.13,.55,'#b7a878');box(.1,1.1,2.95,1.1,.6,.12,'#8d9e80');
  box(-.08,1.095,1.4,.53,.035,.38,'#f3e5c7');box(.19,1.10,1.4,.025,.01,.38,'#b69773');cup(.45,1.09,1.12,'#b18b68');
  // Service counter, fluted front, brass rail, espresso machine and pastry display.
  box(1.8,.62,-3.1,8,1.24,1.45,'#8b6549');
  for(let x=-2.1;x<5.8;x+=.21)box(x,.65,-2.34,.075,1.12,.035,'#b58d63');
  box(1.8,1.3,-3.05,8.25,.16,1.62,'#e9d9b8');box(1.8,.18,-2.23,7.6,.045,.045,'#bba273');
  box(3.7,1.75,-3.24,1.5,.8,.7,'#6a7a70');box(3.7,1.57,-2.84,1.3,.1,.3,'#c5bda4');
  for(const x of [3.35,3.75,4.1]){cyl(x,2.21,-3.3,.12,.12,.16,'#f2e4c9');cup(x,1.62,-2.78,'#805c42');}
  box(-1.05,1.43,-3.05,1.9,.1,1.05,'#b69976');
  const glass=new THREE.MeshPhysicalMaterial({color:'#d7e6d6',transparent:true,opacity:.18,roughness:.15,depthWrite:false});
  const display=new THREE.Mesh(new THREE.BoxGeometry(1.9,.65,1.05),glass);display.position.set(-1.05,1.8,-3.05);root.add(display);
  for(const x of [-1.7,-.4])box(x,1.8,-2.55,.035,.65,.035,'#b99d75');
  for(const x of [-1.5,-.95,-.4]){const pastry=ball(x,1.57,-2.95,.2,'#d4a069');pastry.scale.set(1,.55,.7);ball(x,1.7,-3.28,.13,'#dcb680');}
  box(1.65,1.47,-2.7,.55,.2,.38,'#536f5d');box(1.65,1.65,-2.7,.55,.24,.08,'#425f52');
  sign('ORDER HERE','coffee · tea · a little time',1.8,.9,-2.30,1.6,.48);
  // Backbar shelves, jars and colorful books; menu is also a real in-world sign.
  box(1.8,.8,-4.65,8,1.6,.6,'#aa8965');box(1.8,1.63,-4.6,8.1,.12,.8,'#d6bf96');
  for(const y of [2.15,2.9]){box(3.9,y,-4.5,3.6,.1,.65,'#a27d57');for(let i=0;i<8;i++){const x=2.45+i*.4;cyl(x,y+.22,-4.5,.11,.11,.34,i%2?'#c8b08c':'#e3d0a9');cyl(x,y+.41,-4.5,.12,.12,.05,'#8e7756');}}
  sign('morrow','COFFEE & SLOW MORNINGS',-3.2,2.9,-4.83,3.2,.95,'#a67858');
  sign('Something lovely','JASMINE 18  ·  SODA 24  ·  LATTE 28  ·  MATCHA 30',.6,2.65,-4.83,3.5,1.15);
  for(let i=0;i<6;i++)box(-5.4+i*.2,2.35,-4.55,.14,.55,.3,['#b99376','#849b83','#bfaa79'][i%3]);box(-4.9,2.03,-4.5,1.5,.1,.6,'#a27d57');
  // Soft pendant shades stay above sightlines; small warm lights keep nights cozy.
  for(const [x,z]of [[-4,-1.8],[-4,1.4],[1.8,-2.8]]){
    cyl(x,3.3,z,.018,.018,1,'#786d55');cyl(x,2.83,z,.18,.43,.35,'#d1b582');
    const bulb=ball(x,2.68,z,.16,'#ffe2a1');bulb.material=new THREE.MeshStandardMaterial({color:'#ffe2a1',emissive:'#ffcf86',emissiveIntensity:1.2});
  }
  plant(-6,3.65,1.2);plant(6,-3.8,1.1);plant(5.15,-4.6,.55,1.7);plant(-6.35,-.5,.42,1.4);
  box(4.8,.075,4.1,1.8,.04,.95,'#6f8c78');sign('See you soon','the lane is just outside',4.8,.55,4.85,1.7,.5);
  // Merge static opaque geometry by material to keep the room inexpensive to render.
  root.updateMatrixWorld(true);const buckets=new Map<THREE.Material,THREE.BufferGeometry[]>();const remove:THREE.Mesh[]=[];
  root.traverse(o=>{if(o instanceof THREE.Mesh&&o.material instanceof THREE.MeshStandardMaterial&&!o.material.transparent){const g=o.geometry.clone().applyMatrix4(o.matrixWorld);const list=buckets.get(o.material)??[];list.push(g);buckets.set(o.material,list);remove.push(o);}});
  for(const m of remove){m.removeFromParent();m.geometry.dispose();}
  for(const [m,gs]of buckets){const g=mergeGeometries(gs);if(g){const joined=new THREE.Mesh(g,m);joined.castShadow=true;joined.receiveShadow=true;root.add(joined);}gs.forEach(g=>g.dispose());}
  const light=new THREE.PointLight('#ffd7a0',16,14,1.5);light.position.set(0,3,0);root.add(light);
  const drinks=new THREE.Group();drinks.name='date-drinks';root.add(drinks);
  for(const z of [-2.1,-1.48])cup(-3.85,1.1,z,'#d5bc76',drinks);
  drinks.visible=false;
  return {root,drinks};
}

export function tintCafeDrinks(drinks:THREE.Group,drink:CafeDrinkId){
  // Cup surfaces and saucers keep their cream glaze; only the liquid changes color.
  drinks.children.forEach((o,i)=>{if(i%4===2&&(o as THREE.Mesh).isMesh){const m=o as THREE.Mesh;if(!m.userData.liquidMaterial){m.material=(m.material as THREE.MeshStandardMaterial).clone();m.userData.liquidMaterial=true;}(m.material as THREE.MeshStandardMaterial).color.set(CAFE_DRINKS[drink].color);}});
}

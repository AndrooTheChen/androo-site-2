import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {installCharacterModel,makeActor,layActorOnBed,standActor} from '../src/world.ts';

test('imported character is grounded, faces forward, and retains the gameplay root',()=>{
  const actor=makeActor('#00aaaa','#00dddd','mint'),previous=actor.visual;
  actor.root.position.set(-2,0,4);actor.root.rotation.y=.7;
  const scene=new THREE.Group();
  scene.position.set(3,5,-2);
  const mesh=new THREE.Mesh(new THREE.BoxGeometry(1,4,2),new THREE.MeshStandardMaterial());
  scene.add(mesh);
  installCharacterModel(actor,{scene,animations:[]},{height:2.2,facingOffset:0});
  actor.root.updateMatrixWorld(true);
  const bounds=new THREE.Box3().setFromObject(actor.visual);
  assert.ok(Math.abs(bounds.min.y)<1e-6);
  assert.ok(Math.abs(bounds.getSize(new THREE.Vector3()).y-2.2)<1e-6);
  assert.ok(bounds.getCenter(new THREE.Vector3()).distanceTo(new THREE.Vector3(-2,1.1,4))<1e-6);
  assert.deepEqual(actor.root.position.toArray(),[-2,0,4]);
  assert.equal(actor.root.rotation.y,.7);
  assert.equal(previous.parent,null);
  assert.equal(actor.visual.parent,actor.root);
  assert.equal(actor.limbs.length,0);
  assert.equal(actor.mixer,undefined);
  assert.equal(mesh.castShadow,true);
});

test('invalid imported geometry preserves the working stand-in',()=>{
  const actor=makeActor('#00aaaa','#00dddd','mint'),previous=actor.visual;
  assert.throws(()=>installCharacterModel(actor,{scene:new THREE.Group(),animations:[]},{height:2.2}));
  assert.equal(actor.visual,previous);
  assert.equal(previous.parent,actor.root);
  assert.equal(previous.visible,true);
});

test('Mint ships with embedded textures, finite geometry and a bounded game asset',()=>{
  const manifest=JSON.parse(readFileSync(new URL('../public/assets/characters/manifest.json',import.meta.url),'utf8'));
  assert.equal(manifest.mint.url,'assets/characters/mint.glb');
  const data=readFileSync(new URL('../public/'+manifest.mint.url,import.meta.url));
  assert.equal(data.subarray(0,4).toString(),'glTF');
  assert.equal(data.readUInt32LE(4),2);
  assert.equal(data.readUInt32LE(8),data.length);
  const jsonLength=data.readUInt32LE(12);
  const gltf=JSON.parse(data.subarray(20,20+jsonLength).toString());
  const binary=data.subarray(28+jsonLength);
  let triangles=0;
  for(const mesh of gltf.meshes)for(const primitive of mesh.primitives){
    assert.equal(primitive.mode??4,4);
    const position=gltf.accessors[primitive.attributes.POSITION];
    const view=gltf.bufferViews[position.bufferView];
    const offset=(view.byteOffset??0)+(position.byteOffset??0);
    for(let i=0;i<position.count;i++)for(let component=0;component<3;component++)assert.ok(Number.isFinite(binary.readFloatLE(offset+i*(view.byteStride??12)+component*4)));
    triangles+=(primitive.indices===undefined?position.count:gltf.accessors[primitive.indices].count)/3;
  }
  assert.ok(triangles>0&&triangles<=90000,`${triangles} triangles`);
  assert.ok(data.length<6*1024*1024,`${data.length} bytes`);
  assert.ok(gltf.images.length>=2);
  for(const image of gltf.images){assert.equal(image.uri,undefined);assert.ok(gltf.bufferViews[image.bufferView]);}
  for(const buffer of gltf.buffers)assert.equal(buffer.uri,undefined);
  const source=readFileSync(new URL('../art/characters/mint/mint-trellis-original.glb',import.meta.url));
  const sourceJsonLength=source.readUInt32LE(12),sourceJson=JSON.parse(source.subarray(20,20+sourceJsonLength).toString());
  const sourceBin=source.subarray(28+sourceJsonLength);
  for(let i=0;i<gltf.images.length;i++){
    const current=gltf.bufferViews[gltf.images[i].bufferView],original=sourceJson.bufferViews[sourceJson.images[i].bufferView];
    assert.deepEqual(binary.subarray(current.byteOffset??0,(current.byteOffset??0)+current.byteLength),sourceBin.subarray(original.byteOffset??0,(original.byteOffset??0)+original.byteLength),'texture bytes must be preserved');
  }
  assert.equal(gltf.skins?.length??0,0);
  assert.equal(gltf.animations?.length??0,0);
  console.log(JSON.stringify({mintTriangles:triangles,mintBytes:data.length}));
});


test('the real Mint geometry fits the bed and a late GLB load preserves the reclining pose',()=>{
  const data=readFileSync(new URL('../public/assets/characters/mint.glb',import.meta.url));
  const length=data.readUInt32LE(12),gltf=JSON.parse(data.subarray(20,20+length).toString()),binary=data.subarray(28+length);
  const primitive=gltf.meshes[0].primitives[0],accessor=gltf.accessors[primitive.attributes.POSITION],view=gltf.bufferViews[accessor.bufferView];
  const positions=new Float32Array(accessor.count*3),offset=(view.byteOffset??0)+(accessor.byteOffset??0);
  for(let i=0;i<accessor.count;i++)for(let k=0;k<3;k++)positions[i*3+k]=binary.readFloatLE(offset+i*(view.byteStride??12)+k*4);
  const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));
  const actor=makeActor('#00aaaa','#00dddd','mint');layActorOnBed(actor,-3.15);
  const scene=new THREE.Group();scene.add(new THREE.Mesh(geometry,new THREE.MeshStandardMaterial()));installCharacterModel(actor,{scene,animations:[]},{height:2.2});
  const bounds=new THREE.Box3().setFromObject(actor.root);
  assert.ok(Math.abs(bounds.min.y-1.03)<1e-5);assert.ok(bounds.min.x>=-3.875&&bounds.max.x<=-1.525);assert.ok(bounds.min.z>=-3.35&&bounds.max.z<=-.65);
  assert.equal(actor.root.rotation.x,-Math.PI/2);assert.ok(actor.bedPose);
  standActor(actor,{x:-2,z:4});assert.equal(actor.bedPose,undefined);const upright=new THREE.Box3().setFromObject(actor.root);assert.ok(Math.abs(upright.min.y)<1e-5);assert.ok(Math.abs(upright.max.y-2.2)<1e-5);
});

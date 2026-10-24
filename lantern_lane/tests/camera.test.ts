import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {clampZoom,faceToward,townCameraFrame,conversationCameraFrame,conversationNearPlane} from '../src/camera.ts';

test('close town zoom follows the player even at the edges of the map',()=>{
  for(const p of [new THREE.Vector3(-16,0,-3),new THREE.Vector3(13,0,12)]){
    const near=townCameraFrame(p,clampZoom(-10),false),oldMinimum=townCameraFrame(p,.65,false);
    assert.equal(near.look.x,p.x);assert.equal(near.look.z,p.z);
    assert.ok(near.position.distanceTo(near.look)<oldMinimum.position.distanceTo(oldMinimum.look)*.4);
  }
  assert.equal(clampZoom(-1,true),.45);assert.equal(clampZoom(10),1.5);
});

test('conversation cutaway removes foreground obstructions while retaining the whole model at every zoom',()=>{
  for(const zoom of [.65,1,1.4])for(const orbit of [0,Math.PI/2,Math.PI]){
    const frame=conversationCameraFrame(new THREE.Vector3(),0,orbit,zoom,390,844);
    const camera=new THREE.PerspectiveCamera(38,390/844,conversationNearPlane(frame.position,frame.look),160);
    camera.position.copy(frame.position);camera.lookAt(frame.look);camera.updateMatrixWorld(true);
    const foreground=camera.position.clone().lerp(frame.look,.1).project(camera);assert.ok(foreground.z< -1);
    for(const x of [-.8,.8])for(const y of [0,2.2])for(const z of [-.8,.8])assert.ok(new THREE.Vector3(x,y,z).project(camera).z>=-1);
  }
});

test('talking faces the player from every approach without moving or tipping the actor',()=>{
  const actor=new THREE.Group();actor.position.set(-2,0,4);
  for(const [x,z]of [[1,0],[0,1],[-1,0],[0,-1]]){
    const target=actor.position.clone().add(new THREE.Vector3(x,0,z));faceToward(actor,target);
    const forward=new THREE.Vector3(0,0,1).applyQuaternion(actor.quaternion);
    assert.ok(forward.distanceTo(new THREE.Vector3(x,0,z))<1e-8);assert.deepEqual(actor.position.toArray(),[-2,0,4]);
  }
  const old=actor.rotation.y;faceToward(actor,actor.position);assert.equal(actor.rotation.y,old);
});

test('conversation orbit covers all four sides and default framing leaves room for desktop and mobile dialogue',()=>{
  for(const [width,height]of [[1280,800],[390,844],[844,390]]){
    for(const orbit of [0,Math.PI/2,Math.PI,Math.PI*1.5]){
      const frame=conversationCameraFrame(new THREE.Vector3(),0,orbit,1,width,height);
      const camera=new THREE.PerspectiveCamera(38,width/height,.1,160);camera.position.copy(frame.position);camera.lookAt(frame.look);camera.setViewOffset(width,height,frame.offsetX,frame.offsetY,width,height);camera.updateMatrixWorld(true);
      for(const y of [0,2.2]){
        const projected=new THREE.Vector3(0,y,0).project(camera),sx=(projected.x+1)/2,sy=(1-projected.y)/2;
        assert.ok(sx>0&&sx<(width>=900?.6:1));assert.ok(sy>0&&sy<(width<900?.6:1),`${width}x${height}: body outside conversation area (${sy})`);
      }
    }
  }
});

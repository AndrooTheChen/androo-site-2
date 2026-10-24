import * as THREE from 'three';

export function clampZoom(value:number,home=false){return THREE.MathUtils.clamp(value,home?.45:.23,1.5);}

export function faceToward(actor:THREE.Object3D,target:THREE.Vector3){
  const dx=target.x-actor.position.x,dz=target.z-actor.position.z;
  if(dx*dx+dz*dz>.0025)actor.rotation.y=Math.atan2(dx,dz);
}

export function townCameraFrame(player:THREE.Vector3,zoom:number,narrow:boolean,started=true){
  const overview=new THREE.Vector3(THREE.MathUtils.clamp(player.x*.32,-4,4),0,1+player.z*.2);
  const follow=narrow?1:1-THREE.MathUtils.smoothstep(zoom,.23,.8);
  const look=started?overview.lerp(new THREE.Vector3(player.x,.85,player.z),follow):new THREE.Vector3(0,0,1);
  return {look,position:look.clone().add(new THREE.Vector3(21,27,32).multiplyScalar(clampZoom(zoom)*(narrow?.85:1.04)))};
}

export function cafeCameraFrame(player:THREE.Vector3,zoom:number,aspect:number){
  const look=new THREE.Vector3(0,.35,-.3).lerp(new THREE.Vector3(player.x,.9,player.z),1-THREE.MathUtils.smoothstep(zoom,.45,.9));
  const fit=Math.max(1,1.12/Math.max(.3,aspect));
  return {look,position:look.clone().add(new THREE.Vector3(12,13,17).multiplyScalar(clampZoom(zoom,true)*fit))};
}

// Framing reserves space for the dialogue panel. Orbit changes the camera,
// never the character's facing or gameplay position.
export function conversationCameraFrame(position:THREE.Vector3,facing:number,orbit:number,zoom:number,width:number,height:number,reclining=false){
  const stacked=width<900,aspect=width/height;
  const distance=5.8*THREE.MathUtils.clamp(zoom,.65,1.4)*(stacked?Math.max(1, .55/aspect):1);
  const angle=facing+orbit;
  const look=position.clone().add(new THREE.Vector3(0,(reclining?0:1.15+(1-Math.min(1,zoom))*.7),0));
  return {look,position:look.clone().add(new THREE.Vector3(Math.sin(angle)*distance,distance*(reclining?.85:.23),Math.cos(angle)*distance)),offsetX:stacked?0:width*.2,offsetY:stacked?height*.2:0};
}

// A close-up cuts away foreground scenery (including nearby trees)
// while retaining a generous sphere around the whole character.
export function conversationNearPlane(cameraPosition:THREE.Vector3,look:THREE.Vector3){return Math.max(.1,cameraPosition.distanceTo(look)-2.3);}

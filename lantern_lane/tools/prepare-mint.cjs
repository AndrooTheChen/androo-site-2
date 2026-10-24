// npm ci --prefix tools && node tools/prepare-mint.cjs
// The original GLB and texture bytes are preserved; only geometry is reduced.
const path = require('node:path');
const {NodeIO} = require('@gltf-transform/core');
const {EXTTextureWebP} = require('@gltf-transform/extensions');
const {compactPrimitive,prune,weld} = require('@gltf-transform/functions');
const {MeshoptSimplifier} = require('meshoptimizer');

(async () => {
  const root=path.resolve(__dirname,'..');
  const io=new NodeIO().registerExtensions([EXTTextureWebP]);
  const document=await io.read(path.join(root,'art/characters/mint/mint-trellis-original.glb'));
  await MeshoptSimplifier.ready;
  await document.transform(weld());
  let triangles=0;
  for(const mesh of document.getRoot().listMeshes())for(const primitive of mesh.listPrimitives()){
    const position=primitive.getAttribute('POSITION').getArray();
    const normal=primitive.getAttribute('NORMAL').getArray();
    const uv=primitive.getAttribute('TEXCOORD_0').getArray();
    const attributes=new Float32Array(position.length/3*5);
    for(let i=0;i<position.length/3;i++)attributes.set([normal[i*3],normal[i*3+1],normal[i*3+2],uv[i*2],uv[i*2+1]],i*5);
    const accessor=primitive.getIndices();
    const indices=new Uint32Array(accessor.getArray());
    const [reduced,error]=MeshoptSimplifier.simplifyWithAttributes(indices,position,3,attributes,5,[0.5,0.5,0.5,1,1],null,Math.floor(indices.length*.18/3)*3,.008);
    accessor.setArray(reduced);
    compactPrimitive(primitive);
    triangles+=reduced.length/3;
    console.log({triangles:reduced.length/3,error});
  }
  await document.transform(prune());
  await io.write(path.join(root,'public/assets/characters/mint.glb'),document);
  console.log('Mint game triangles:',triangles);
})().catch(error=>{console.error(error);process.exitCode=1;});

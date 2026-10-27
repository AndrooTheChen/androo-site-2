import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';

const modelPath = new URL('../public/assets/characters/nanally.glb', import.meta.url);
const manifestPath = new URL('../public/assets/characters/manifest.json', import.meta.url);
const selectedModelSha = 'd0d4801995b4cfa86c12429b61699d20c00295c3a65ed3ce88dc63c1b4b1b26e';

function readModel() {
  assert.ok(existsSync(modelPath), 'Upload the selected nanally.glb to lantern_lane/public/assets/characters/ before merging this branch.');
  const bytes = readFileSync(modelPath);
  assert.equal(bytes.toString('ascii', 0, 4), 'glTF');
  assert.equal(bytes.readUInt32LE(4), 2);
  assert.equal(bytes.readUInt32LE(8), bytes.length);
  const jsonLength = bytes.readUInt32LE(12);
  assert.equal(bytes.readUInt32LE(16), 0x4e4f534a);
  const json = JSON.parse(bytes.toString('utf8', 20, 20 + jsonLength));
  const binHeader = 20 + jsonLength;
  assert.equal(bytes.readUInt32LE(binHeader + 4), 0x004e4942);
  const bin = bytes.subarray(binHeader + 8, binHeader + 8 + bytes.readUInt32LE(binHeader));
  assert.ok(bin.length >= json.buffers[0].byteLength);
  return { bytes, json, bin };
}

test('Nanally uses the exact textured model selected by the owner', () => {
  const { bytes, json, bin } = readModel();
  assert.equal(createHash('sha256').update(bytes).digest('hex'), selectedModelSha);
  assert.equal(json.meshes.length, 1);
  assert.equal(json.meshes[0].primitives.length, 1);
  const primitive = json.meshes[0].primitives[0];
  assert.equal(primitive.mode ?? 4, 4);
  assert.equal(json.accessors[primitive.indices].count / 3, 293696);
  assert.equal(json.images.length, 2);
  for (const view of json.bufferViews) {
    assert.ok((view.byteOffset ?? 0) + view.byteLength <= bin.length);
  }
  for (const image of json.images) {
    assert.equal(image.mimeType, 'image/webp');
    assert.equal(image.uri, undefined);
    assert.ok(Number.isInteger(image.bufferView));
  }
  assert.equal(json.skins?.length ?? 0, 0);
  assert.equal(json.animations?.length ?? 0, 0);
});

test('Nanally has finite geometry and valid triangle indices', () => {
  const { json, bin } = readModel();
  const primitive = json.meshes[0].primitives[0];
  for (const [name, width] of [['POSITION', 3], ['NORMAL', 3], ['TEXCOORD_0', 2]] as const) {
    const accessor = json.accessors[primitive.attributes[name]];
    const view = json.bufferViews[accessor.bufferView];
    assert.equal(accessor.componentType, 5126);
    const offset = (view.byteOffset ?? 0) + (accessor.byteOffset ?? 0);
    const stride = view.byteStride ?? width * 4;
    for (let i = 0; i < accessor.count; i++) {
      for (let c = 0; c < width; c++) assert.ok(Number.isFinite(bin.readFloatLE(offset + i * stride + c * 4)));
    }
  }
  const index = json.accessors[primitive.indices];
  const view = json.bufferViews[index.bufferView];
  const offset = (view.byteOffset ?? 0) + (index.byteOffset ?? 0);
  const vertices = json.accessors[primitive.attributes.POSITION].count;
  assert.equal(index.componentType, 5125);
  for (let i = 0; i < index.count; i++) assert.ok(bin.readUInt32LE(offset + i * 4) < vertices);
});

test('Nanally uses the existing 2.2-unit character loader without replacing Mint', () => {
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  assert.deepEqual(manifest.nanally, { url: 'assets/characters/nanally.glb', height: 2.2, facingOffset: 0 });
  assert.deepEqual(manifest.mint, { url: 'assets/characters/mint.glb', height: 2.2, facingOffset: 0 });
});

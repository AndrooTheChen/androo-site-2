# Character workstream handoff

The game and the character models can progress independently. Gameplay uses stable IDs `mint`, `nanally`, and `hotori`. The model's visual mesh never defines navigation or collision.

## Drop-in files

1. Place optimized, self-contained GLBs in `public/assets/characters/`.
2. Update `public/assets/characters/manifest.json`, replacing each null entry:

```json
{
  "mint": { "url": "assets/characters/mint.glb", "height": 2.2, "facingOffset": 0 },
  "nanally": { "url": "assets/characters/nanally.glb", "height": 2.2, "facingOffset": 0 },
  "hotori": { "url": "assets/characters/hotori.glb", "height": 2.2, "facingOffset": 0 }
}
```

3. Run the repository’s root build and publish through its GitHub Pages workflow. The loader replaces each stand-in only after its GLB loads successfully; a missing or failed asset preserves the working stand-in.

## Export contract

- glTF 2.0 binary, embedded textures, Y up, face +Z, feet near Y=0. `facingOffset` is an optional yaw correction in degrees.
- One engine unit represents a meter. Current stand-ins are about 2.2 units high including accessories. The loader normalizes each model to `height`, centers X/Z, and grounds its bounds automatically. Adjust the height per character after in-game visual review.
- Standard glTF metallic/roughness or unlit materials. Target 1–2 materials and one 1024px atlas; prefer 6k–10k triangles.
- Export in-place `Idle` and `Walk` clips. Case-insensitive clip matching also recognizes names containing idle, walk, or jog. Gameplay owns translation and rotation.
- Uncompressed GLB is the initial delivery format. Draco/Meshopt/KTX2 decoders are not configured.
- Keep weapons or long optional props out of the root bounds, or export them separately, so automatic height normalization is predictable.
- Do not bake a camera, large background, ground plane, or lights into the export.

Future adapter work: animation crossfades, greeting/sitting/receive gestures, facial expression tracks, blink, look-at, and common skeleton retargeting. Those are not implicitly present simply because the GLB contains clips.

## Acceptance after integration

- Confirm identity and silhouette at normal camera zoom.
- Check scale, front direction, grounded feet, materials, textures and daylight/evening appearance.
- Check idle/walk transitions and that root motion does not double the gameplay movement.
- Re-run `npm test` and `npm run build`, then manually check desktop Chrome and iPhone Safari. Measure frame times on the actual phone.

Asset URLs in the manifest are relative to the game page. Avoid leading slashes so the game remains portable under `/lantern_lane/` or another hosting subdirectory.

## Mint integration — October 23, 2026

- Mint replaces the courtyard NPC visual and retains the existing stable `mint` ID,
  parcel quest, friendship, collision, roaming, and save format.
- `public/assets/characters/mint.glb`: 81,616 triangles, 5,595,496 bytes, one
  material and two embedded 2048×2048 WebP textures (base color and
  metallic/roughness). Three.js 0.180.0 supports the required `EXT_texture_webp`.
- `art/characters/mint/mint-trellis-original.glb`: the untouched 276,126-triangle
  TRELLIS.2 export supplied by the user. This source is not copied into the site.
- `tools/prepare-mint.cjs`: reproducible attribute-aware meshoptimizer reduction.
  Run `npm ci --prefix tools && node tools/prepare-mint.cjs` from `lantern_lane/`.
  Simplification protects UVs and normals and stops at the configured error limit;
  the current mesh retains about 30% of the original faces. This exceeds the eventual 6k–10k mobile
  target to preserve the hair and face while character art is still in progress.
- Both files have no skeleton or clips. The game applies its existing subtle bob
  to the loaded visual and respects pause/reduced motion. Roaming translates the
  static pose; this is not a skeletal walk animation.
- The visual is normalized to 2.2 units, centered, grounded, and faces +Z.
  Failed or invalid loads keep the stand-in.

This is an unofficial fan reconstruction of Mint from Neverness to Everness.
Original upload SHA-256: `6a0ead51e652319768c41d6f3845eb1309f431c801e77d316cd87a5c2bdc3dae`.

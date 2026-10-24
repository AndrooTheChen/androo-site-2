# Character workstream handoff

The game and the character models can progress independently. Gameplay uses stable IDs `mint`, `nanally`, and `hotori`. The model's visual mesh never defines navigation or collision.

## Drop-in files

1. Place optimized, self-contained GLBs in `publicassets/characters/`.
2. Update `publicassets/characters/manifest.json`, replacing each null entry:

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

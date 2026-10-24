# Hetherau Crossing · Lantern Lane

A browser-first, cozy 3D neighborhood in Hethereau. This is a personal, unofficial NTE fan prototype, built from the October 23, 2026 NTE Cozy Neighborhood Game Plan. Final character art is being developed separately.

## Playable in 0.1

- A pedestrian block with apartments, café frontage, antique shop, courtyard, alley, and canal.
- Click/tap pathfinding, keyboard movement, touch joystick, collision, camera follow, zoom, interaction prompts, and map wayfinding.
- Mint's parcel delivery, Hotori's wandering-clock appraisal, Nanally's optional three-sticker hunt, and a forgiving fishing activity.
- Currency, unique reward claims, once-per-day greeting friendship, seven purchasable furniture types, and a keepsake reward.
- Apartment interior, sleep, furniture placement, quarter-meter snapping, rotation, storage, and session undo. Doorway and bed access remain clear.
- A 36-active-minute day, evening lighting, deterministic rain every third simulated day, menu/focus pausing, optional reward chimes, and reduced motion.
- Versioned IndexedDB saves, previous-valid-snapshot recovery, save validation, JSON export/import, and visible save errors. Saves are local to each browser/device.

## Run

From the repository root, enter `lantern_lane/`. Use Node 22+ and npm:

```sh
npm ci
npm run dev
npm test
npm run build
```

The repository root build runs this build and copies `lantern_lane/dist/` into the website’s `dist/lantern_lane/`. The main navigation opens `/lantern_lane/` in a new tab. To run the game alone, serve its own `dist/` directory. All game assets and Three.js are bundled locally; no API keys, paid services, external fonts, or character-CDN dependencies are required. All authored game code, assets, tests and notes live in this `lantern_lane/` directory; the root site only provides navigation and build orchestration.

## Source map

| File | Responsibility |
| --- | --- |
| `src/main.ts` | Input, UI, dialogue flows, camera, activity orchestration |
| `src/world.ts` | Procedural 3D scenery, stand-ins, GLB adapter, collisions and A* navigation |
| `src/state.ts` | Pure quest, economy, friendship, placement and save-validation rules |
| `src/content.ts` | Stable content IDs, catalog, characters and ambient dialogue |
| `src/save.ts` | Serialized IndexedDB writes and valid backup recovery |
| `src/style.css` | Responsive HTML overlay and touch UI |
| `public/assets/characters/manifest.json` | Integration point for final character models |
| `tests/` | State transitions, persistence, geometry and route checks |
| `docs/` | Integration contract, roadmap and verification notes |

## What this is not yet

This is the initial movement-and-daily-loop prototype, not the full content-complete plan. NPCs have light local roaming, not full daily schedules. Curios & Co. uses a shop menu rather than a separate explorable interior. Rooftop visits, the gathering ending, detailed friendship stories, 30-piece catalog, cloud saves, and multiplayer are not implemented. Character stand-ins intentionally await the other workstream.

See [model integration](docs/character-integration.md), [next milestones](docs/roadmap.md), and [validation](docs/validation.md).

## Save portability

Saves remain browser-local and origin-specific. To move progress from the original private demo, export it in Settings there, then import that JSON file on this site. The save schema and database name remain compatible.

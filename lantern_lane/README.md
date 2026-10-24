# Hetherau Crossing · Lantern Lane

A browser-first, cozy 3D neighborhood in Hethereau. This is a personal, unofficial NTE fan prototype, built from the October 23, 2026 NTE Cozy Neighborhood Game Plan. Mint now uses an optimized textured reconstruction; the other character models are being developed separately.

## Playable in 0.4

- A pedestrian block with apartments, an enterable Morrow Café, antique shop, courtyard, alley, and canal.
- Click/tap pathfinding, keyboard movement, touch joystick, collision, camera follow, zoom, interaction prompts, and map wayfinding.
- Mint's parcel delivery, Hotori's wandering-clock appraisal, Nanally's optional three-sticker hunt, and a forgiving fishing activity.
- F interacts and advances the primary conversation choice. Q opens the mission board; select a tracked mission, replay, skip, or jump directly to any step for testing. Earned rewards and furniture survive replay; rewards are issued only once.
- Closer zoom that follows the player; clear conversation close-ups with drag, orbit buttons, keyboard arrows, and zoom controls.
- “First date with Mint,” unlocked after the parcel delivery: ordering drinks inside Morrow Café and sharing them by the window, canal rendezvous, apartment invitation and cozy bed scene, +20 friendship (capped at 100), and a saved café-receipt keepsake. Mint walks to outdoor stops, visits your apartment, and stays on the bed until you ask her to return to the courtyard. The bed scene uses a static reclining pose, not a skeletal animation.
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
| `src/camera.ts` | Zoom limits, conversation framing, facing, and foreground cutaway |
| `src/world.ts` | Procedural 3D scenery, stand-ins, GLB adapter, collisions and A* navigation |
| `src/cafe.ts` / `src/cafe-menu.ts` | Procedural café room, furniture collisions, and drink menu |
| `src/missions.ts` | Mission tracking, replay, skip and checkpoint jumps for testing |
| `src/state.ts` | Pure quest, economy, friendship, placement and save-validation rules |
| `src/content.ts` | Stable content IDs, catalog, characters and ambient dialogue |
| `src/save.ts` | Serialized IndexedDB writes and valid backup recovery |
| `src/style.css` | Responsive HTML overlay and touch UI |
| `public/assets/characters/manifest.json` | Integration point for final character models |
| `tests/` | State transitions, persistence, geometry and route checks |
| `docs/` | Integration contract, roadmap and verification notes |

## What this is not yet

This is the initial movement-and-daily-loop prototype, not the full content-complete plan. NPCs have light local roaming, not full daily schedules. Curios & Co. uses a shop menu rather than a separate explorable interior. Rooftop visits, the gathering ending, further friendship stories, 30-piece catalog, cloud saves, and multiplayer are not implemented. Mint uses her static textured GLB, with light whole-model motion. Her skeleton, facial animation and walk cycle are still pending. Nanally and Hotori retain their stand-ins.

See [model integration](docs/character-integration.md), [next milestones](docs/roadmap.md), and [validation](docs/validation.md).

## Save portability

Saves remain browser-local and origin-specific. To move progress from the original private demo, export it in Settings there, then import that JSON file on this site. The save schema and database name remain compatible.


## Testing a mission

Open **Missions (Q)** or click the objective card. Select a mission to track it,
choose **Play / Replay from start**, **Skip mission**, or a checkpoint and **Jump**.
Jumping teleports to that step and saves immediately. Skips do not grant rewards;
replays retain existing coins, friendship, keepsakes and furniture. Replaying the
parcel resets the dependent date’s current progress. Starting the date from this
menu bypasses its parcel prerequisite for testing.

To try the new ending immediately: select **First date with Mint**, jump to
**4. Bring Mint home**, and press **F** beside the bed. Snuggle, finish the date,
and choose **Head back to the courtyard** to restore Mint’s normal position,
orientation, scale and roaming. Previous completed-date saves stay completed;
replay or jump to experience the new ending.


## Morrow Café

Morrow is open all day, every day, with no quest prerequisite. Walk to its marked
entrance between the outdoor tables and press **F**. Inside, approach **Order
drinks** and press **F**. Jasmine tea costs 18 coins, strawberry soda 24, honey
cloud latte 28, and vanilla matcha 30. Carry one purchased cup at a time; enjoy it
at the window corner, in the menu, or from **Bag (B)**. A cup and its payment save
with your progress. The exit mat returns you to the café frontage.

The interior has wood floors, sage window seating, soft pendant lights, plants,
a reading table, a pastry display, an espresso counter, and a barista. Its room
geometry and illustrations are generated locally from code; no remote assets
or new dependencies are required. All game assets stay under `lantern_lane`.

For Mint’s date, order a pair at the counter, then talk to her by the window to
share it. Mint covers that pair, as promised in her invitation. Ordering alone
does not advance the date. You can leave and return with the order saved; after
the conversation, use the café exit and meet her at the canal. To test directly,
open **Missions (Q) → First date with Mint → step 2 → Jump**. Existing saves are
migrated without resetting completed quests, furniture, friendship, or coins.

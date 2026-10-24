# Validation — prototype 0.2

## Automated checks

23 Node tests cover:

- Prerequisite gating and duplicate protection for delivery, appraisal and stickers.
- Unique furniture instances, insufficient-funds rollback and non-purchasable reward items.
- Placement bounds, doorway/bed protection, furniture overlap and rug layering.
- Once-per-day greetings and friendship caps.
- Save validation against corrupt values, unknown content and unsupported schemas.
- A full quest → purchase → placement → JSON reload sequence.
- IndexedDB rapid-write ordering, full reload, damaged-current-snapshot fallback, and repair (using fake-indexeddb).
- A* routes to all core destinations using the actual procedural collision map.
- Apartment navigation after decorating.
- Finite scene geometry and a 150,000-triangle ceiling.

The initial scene contains 187 mesh objects and 34,224 triangles across both interiors/exteriors, stand-ins, and hidden geometry. This is a geometry count, not a measured frame-rate result or GPU draw-call count. Static scenery is merged by material.

TypeScript checking and the Vite production build are also required before publication.

## Visual checks and limitations

The managed preview loads the application, but its Chrome environment reports `GL_VENDOR = Disabled` / `GL_RENDERER = Disabled` and cannot create a WebGL context. The in-app unsupported-WebGL message was observed. Therefore a rendered browser playthrough, touch QA, real Safari behavior, shadow quality, and GPU performance are **not verified**.

A separate software projection of the actual scene geometry was used to inspect layout without a browser. It is not evidence of successful WebGL rendering.

## Manual playthrough to complete on a WebGL-capable device

1. Enter a name, begin, and walk to Mint (keyboard, ground click/tap and joystick).
2. Accept the parcel, deliver to Nanally, and confirm 620 coins. Reopen dialogue and reload: the reward must not repeat.
3. Talk to Hotori, collect the clock by the vending machine, return it, and confirm the keepsake and 100 coins.
4. Buy the 180-coin lamp. Enter Lane House, open Decorate, place it, rotate/move it, undo and place again.
5. Reload: money, completed quests, room and placements must match.
6. Export a save, import it through the confirmation dialog, and verify continuity.
7. Check map routes, fishing, sticker collection, sleep, rain on Day 3, reduced motion, background/resume, narrow portrait and landscape screens.

New published origins have their own browser-local save; QA data on the local preview is not part of the deployed game.

## Mint model integration — October 23, 2026

The root production build, website checks and all 15 Node tests pass. Three new
checks cover model normalization without moving the gameplay root, preservation
of the stand-in on invalid geometry, and the shipped GLB's finite geometry,
embedded textures and 90,000-triangle / 6 MiB limits. The imported static visual
is the one used for whole-model motion; old stand-in limb animation is removed.

The existing 34,144-triangle scene test uses stand-ins; it does not include
asynchronously loaded models. Mint's 81,616 triangles are checked separately.

The managed browser still shows the unsupported-WebGL screen. An in-game
playthrough, daylight/evening material review, phone frame times and real Safari
behavior remain unverified. Do not treat automated asset checks as a frame-rate
benchmark or the static pose as a finished walk animation.

A front-view Blender comparison of the original and game mesh was inspected.
The final reduction retains the face and hair silhouette; texture bytes are
identical to the original. This asset render is not an in-game playthrough.


## Close-ups and First Date with Mint — October 23, 2026

- Town zoom now reaches 0.23 (previously 0.65), with the target moving toward the
  player as the camera closes in. The apartment retains a separate 0.45 minimum.
- Conversations face the player, pause travel, frame the character beside the
  desktop panel / above the mobile panel, and support full orbit and closer zoom.
  The transparent backdrop accepts dragging; buttons and keyboard arrows also
  orbit. The player avatar is hidden during this inspection view and restored on
  exit. A near-plane cutaway prevents foreground scenery obscuring the close-up.
- The optional date unlocks after delivery. Accept Mint’s invitation, meet her at
  Morrow Café, choose soda or tea, then meet her at the canal and finish the
  conversation. No coins, daily reset, or timer is required. The cat-doodle receipt
  appears in the bag and the completed memory stays in the journal. The one-time
  reward adds 20 Mint friendship, capped at 100.
- Existing schema-1 saves receive additive defaults. Both drink choices, mid-quest
  reloads, proximity checks for both characters, invalid data, and duplicate reward
  protection are tested. Mint uses the actual A* collision map to reach both stops
  and return to the courtyard. Loading an active date places her at its current
  meeting point; going indoors leaves the date available.
- Camera math is checked at 1280×800, 390×844, and 844×390. Four-sided facing/orbit,
  close follow at map edges, and character depth under foreground cutaway are
  covered. The scene count includes the new date marker, not the async GLB.

The production build and website checks pass. The managed preview still reports
`GL_VENDOR = Disabled` / `GL_RENDERER = Disabled`, so rendered conversation UI,
actual touch gestures, camera transitions, and the complete date playthrough
remain unverified in a WebGL-capable browser. Numerical framing and path checks
are not a substitute for that visual playthrough.

Manual checks on a WebGL-capable device:

1. Load an existing save, zoom in near Mint, and confirm movement stays in view.
2. Approach from different sides, talk, and check she faces the player. Orbit a
   full circle using drag and buttons, zoom to her face, reset, and close. Check
   the avatar, HUD, normal camera, and navigation return.
3. Deliver the parcel if needed; decline and then accept Mint’s date invitation.
   Follow the map’s date destination, talk before she arrives, then choose a drink.
4. Reload at the café and canal stages, visit home, and return. Finish the canal
   conversation, check +20 friendship and the receipt, reload, and verify repeat
   conversations cannot grant another reward. Try the other drink in a separate
   test save.
5. Repeat the camera and dialogue controls in phone portrait / landscape and
   reduced-motion mode. Ensure the full dialogue and buttons remain scrollable.

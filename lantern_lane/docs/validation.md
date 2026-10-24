# Validation — prototype 0.1

## Automated checks

12 Node tests cover:

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

The initial scene contains 186 mesh objects and 34,144 triangles across both interiors/exteriors, stand-ins, and hidden geometry. This is a geometry count, not a measured frame-rate result or GPU draw-call count. Static scenery is merged by material.

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

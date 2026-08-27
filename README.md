# DEAD DROP — Extraction Shooter Prototype v2.0

This is a from-scratch replacement for the previous fantasy dungeon prototype.

## Current playable core
- Top-down realtime shooting
- Pistol / SMG / AR / shotgun / DMR
- Magazine + reserve ammo + reload
- Sprint, HP, armor
- 5 PMC-style AI and 11 Scav AI
- AI hears gunshots, patrols, engages hostiles, PMC AI attempts cover and healing
- AI factions can fight each other, creating organic firefights
- Corpse looting and supply crates
- In-raid weapon swapping from the bag
- Extraction zones with a 3 second hold
- Death loses brought gear and raid loot; successful extraction stores recovered items

## Multiplayer-ready architecture
The browser UI talks to a session transport rather than manipulating the simulation directly.

- `src/protocol.js` — fixed tick and input/action protocol
- `src/sim.js` — DOM-free authoritative simulation logic
- `src/net.js` — `LocalSession` today, `WebSocketSession` adapter for the future server
- `src/main.js` — rendering, UI and input only

The multiplayer server should eventually run the authoritative simulation and accept only input commands. Clients should receive snapshots/events and never decide hits, loot ownership, death, or extraction results themselves.

For persistent realtime WebSockets, use a dedicated realtime host / Durable Object / PartyKit-style service rather than relying on a stateless request-only function.

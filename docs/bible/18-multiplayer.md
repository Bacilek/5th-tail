# 18 - Multiplayer (bonus; lowest priority, planned for later)

Priority order stays: environment/gameplay/models > NPCs/quests > multiplayer. This file keeps the design ready so single-player code stays compatible.

## Rules for single-player code (already followed)
Player logic is instance-based (player index 0/1); input via `Input` abstraction; HUD per player; camera per player; no global singletons for player state.

## Local split-screen (Phase 9)
- Two viewports (horizontal or vertical split), two cameras, two HUDs, two input devices (keyboard+mouse for P1, gamepad for P2, or two gamepads).
- Shared world, separate quest logs and inventories; shared time/world flags; companion cat/dragons per player.
- Performance: shared geometry, per-view frustum culling, lower shadow resolution in splitscreen, dynamic resolution.
- Dialogue: pause world for both or use non-blocking dialogue per player (SHOULD); only one player talks at once in cutscenes.
- Respawn/revive rules: downed state, other player revives.
- Required refactor: split `main.ts` globals into `Game` + `PlayerContext[]`, per-player UI roots.

## Gamepad (Phase 0/1)
Standard mapping (see 09): sticks move/look, triggers hands, bumpers cycle, buttons interact/jump/sneak/sprint, D-pad favourites, radial menus; vibration on hits; deadzones and aim assist (SHOULD).

## Online co-op (DREAM)
- WebRTC data channels or WebSocket relay with host authority; sync player transforms, combat events, quest flags; deterministic RNG seeds for shared events.
- Simplest model: host runs the world; client sends inputs and receives snapshots at 20 Hz with interpolation.
- NAT traversal via a small signalling server (free tier) or invite code; no accounts.
- Out of scope: PvP, matchmaking, anti-cheat.

## Acceptance
Two people on one PC can both explore, fight, mount dragons/brooms and do quests simultaneously at >= 30 FPS.

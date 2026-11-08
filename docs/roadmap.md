# Roadmap
0. [x] Setup (Vite+TS+Three, docs)
1. [~] Vertical slice (builds; NOT yet playtested in a browser): Conscription Day class choice, separate campuses per quadrant, Conscription Tower -> Parapet (Riders only, wind, fall damage) -> Citadel, wing/section/squad sorting, 1st/3rd camera, 3 bars, 2 hands, Venin, circling dragons
2. [~] Dragon bond (builds, untested in browser): Threshing at flight field, random bonded dragon; R summon, F mount, mouse flight, fire breath (LMB), tail strike per tail type (RMB), boost. TODO: species behaviours, dragon health, landing polish
3. [~] NPC dialog (F), 5 quests (scrolls, herbs, Venin, Dain orders, Xaden flight), quest log (J) + tracker, gold, cat Broccoli (adopt, follows). Builds; untested in browser
4. [~] Broom flight (B) + 9-hoop race; untested in browser
5. [ ] Split-screen + gamepad (deferred by user - not needed now)
6. [ ] Face photo -> character (MediaPipe, local)
7. [ ] Polish: audio, atmosphere, optional realistic style

## Expansion batch (user feedback after milestone 4)
- [x] Gauntlet as obstacle corridor (hurdles, sweeper bars, stepped wall, pendulum), big Flight Field meadow
- [x] Threshing: weighted species rarity + per-species acceptance (rejection burns the rider)
- [x] Enterable buildings (hollow walls, doors, furniture), Archives and Administration keep too
- [x] Procedural audio: ambient music, NPC babble, sfx (M mutes)
- [x] New areas: Basgiath Village (with inn), Venin Camp; wandering NPCs
- [x] 8 new quests incl. talk/chain/multi-objective; new NPCs (Imogen, Garrick, Mira, Commandant Sorrengail canon; Tavik, Hesper, Pell invented)

## Batch 3 (user feedback)
- [x] Flight collisions (roofs, walls, trees, ceilings) for broom and dragon
- [x] Walk cycle (3rd person limbs, 1st person hand/camera bob, NPCs, cat), footsteps
- [x] Character quick-select tiles (localStorage: look + class)
- [x] Minimap + world map (M) with waypoints and quest markers (mute is now N)
- [x] Violet Sorrengail NPC + q_violet
- [x] Day-night cycle (sun/moon, stars, fog, torches); debug: window.__game.setHour(h)

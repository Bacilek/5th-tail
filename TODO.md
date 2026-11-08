# 5th Tail - Master TODO

Fan game for two (Marek + partner): Fourth Wing / Empyrean world x Skyrim-style combat, in 3D, playable on desktop. **Not AAA** (that is hundreds of people for years); the target is the best large, deep, stylised game we can build in layers, **playable after every milestone**.

- Design detail lives in `docs/bible/` (00-vision ... 99-open-questions). This file is the plan: phases -> milestones -> small steps.
- Each step = about one session / one commit. Mark `[x]` when done, push to `origin main`.
- Priority: **MUST** / **SHOULD** / **DREAM**. Size: **S** (<1 h) / **M** (1-3 h) / **L** (a session or two).
- Definition of done: see `docs/bible/00-vision.md` (builds, verified in a real browser run, data-driven, docs updated).
- Decision gate G1 after Phase 1: re-evaluate engine (see `docs/bible/16-tech-architecture.md`).

## Where we are
Phases 0-8 are mostly NOT done. A playable prototype exists (see "Already done"). It has never been verified in a real browser run. **First job of Phase 0 is to run it and fix it.**

## Rules of play for me (Claude)
1. One step at a time; small commits; keep the game playable.
2. Do not skip verification: Phase 0 builds the tooling that lets me see the game.
3. Mark lore with `(?)`/`(invented)`; ask the owners (`docs/bible/99-open-questions.md`).
4. Ask before downloading assets or installing heavy tools.

---

## Already done (prototype, unverified in browser)
- [x] Three.js/Vite/TS scaffold, strict TS, custom collision, procedural low-poly world
- [x] Basgiath prototype: lower college, 3 quadrant campuses, Citadel mesa, Conscription Tower + Parapet (wind), Gauntlet corridor, Flight Field, village, Venin camp
- [x] Player: 1st/3rd person, 2 hands (weapon/spell), health/magicka/stamina, walk cycle + hand bob
- [x] Classes (Rider/Infantry/Healer/Scribe), Conscription Day class choice, character creator with quick-select tiles
- [x] Dragon bond: weighted Threshing, flight, fire breath, tail strikes; broom + hoop race; cat Broccoli
- [x] NPC dialogue + 13 quests + quest log; minimap/world map/waypoint; day-night cycle; procedural audio; enterable buildings; flight collisions

---

# PHASE 0 - Foundation and verifiability  (MUST)
Goal: the game runs, can be tested automatically, saves, has a menu and a real desktop icon.

## M0.1 Run it and fix it
- [ ] M0.1.1 [MUST|M] Start `npm run dev`, open in Chrome, capture console errors and first screenshots (title, spawn). *Accept: list of runtime errors in `docs/bugs.md`.*
- [ ] M0.1.2 [MUST|L] Fix all startup/runtime errors found. *Accept: character creation -> class -> spawn works with no console errors.*
- [ ] M0.1.3 [MUST|M] Walk every area (college, quadrants, Citadel, Flight Field, village, camp) and log visual/collision bugs. *Accept: bug list with severities.*
- [ ] M0.1.4 [MUST|L] Fix critical/major bugs (stuck, fall-through, invisible walls, wrong heights). *Accept: bug list has no critical/major open.*
- [ ] M0.1.5 [MUST|S] Verify Parapet crossing, Gauntlet and Threshing end-to-end; tune. *Accept: each can be completed in a run.*
- [ ] M0.1.6 [SHOULD|M] Playtest notes from Marek/partner into `docs/playtests/`. *Accept: first playtest file exists.*

## M0.2 Automated verification
- [ ] M0.2.1 [MUST|M] Add Playwright + headless Chromium; script that boots the game and screenshots fixed camera spots using `window.__game`. *Accept: `npm run smoke` outputs PNGs.*
- [ ] M0.2.2 [MUST|S] Assert no console errors and a minimum frame count in the smoke test. *Accept: test fails on error.*
- [ ] M0.2.3 [MUST|S] Add debug console API (`__game.teleport`, `give`, `startQuest`, `setHour`, `spawn`). *Accept: documented in `19-qa.md`.*
- [ ] M0.2.4 [SHOULD|M] Vitest unit tests: quest state machine, dragon rolls, collision helpers. *Accept: `npm test` green.*
- [ ] M0.2.5 [SHOULD|S] `npm run check` = typecheck + tests + smoke. *Accept: single command.*
- [ ] M0.2.6 [SHOULD|M] Data validators (unknown ids in quests/npcs/pois). *Accept: fails on broken reference.*
- [ ] M0.2.7 [DREAM|M] Screenshot diff regression. *Accept: baseline images compared with tolerance.*

## M0.3 Performance baseline
- [ ] M0.3.1 [MUST|S] FPS/draw-call/triangle overlay (F3). *Accept: shows `renderer.info`.*
- [ ] M0.3.2 [MUST|M] Profile and fix the worst hot spots (box scan in `collision`, sky recolour per frame, shadows). *Accept: >= 60 FPS at spawn on dev machine.*
- [ ] M0.3.3 [SHOULD|M] Quality presets Low/Med/High (shadow res, view distance, density). *Accept: settings switch live.*

## M0.4 Menus, settings, saves
- [ ] M0.4.1 [MUST|M] Title screen with New / Continue / Settings / Quit. *Accept: boot goes to title.*
- [ ] M0.4.2 [MUST|M] Pause menu (Esc) with resume/settings/quit-to-title. *Accept: world freezes properly, pointer lock restored.*
- [ ] M0.4.3 [MUST|L] Save system v1: player stats, class, look, inventory hands, quest states, flags, time, dragon, position, versioned JSON. *Accept: save -> reload -> same state.*
- [ ] M0.4.4 [MUST|M] Load screen/slots per character (extends quick-select tiles). *Accept: tile loads full save.*
- [ ] M0.4.5 [SHOULD|M] Settings: audio buses, sensitivity, FOV, invert Y, subtitles, quality. *Accept: persisted.*
- [ ] M0.4.6 [SHOULD|M] Key rebinding. *Accept: rebinds persist.*

## M0.5 Gamepad
- [ ] M0.5.1 [MUST|M] Gamepad API wrapper in `Input` (sticks, triggers, buttons, deadzones). *Accept: walk/look/jump/attack with a pad.*
- [ ] M0.5.2 [SHOULD|M] Gamepad UI navigation + glyph switching. *Accept: menus usable with pad.*
- [ ] M0.5.3 [SHOULD|S] Vibration on hits. *Accept: rumble on damage.*

## M0.6 Desktop app + icon  (answers "launch from desktop icon")
- [ ] M0.6.1 [MUST|M] Electron shell loading the production build (fullscreen toggle, hidden menu). *Accept: `npm run app` opens game window.*
- [ ] M0.6.2 [MUST|M] Icon: placeholder master 1024 px + `.ico/.icns/.png` generated by script. *Accept: icon visible on taskbar.*
- [ ] M0.6.3 [MUST|M] electron-builder Windows installer + portable; desktop/start-menu shortcut. *Accept: installer creates a desktop icon that launches the game.*
- [ ] M0.6.4 [SHOULD|S] Saves in app data folder (`SaveStore` interface). *Accept: saves survive app restarts.*
- [ ] M0.6.5 [SHOULD|S] PWA manifest + service worker fallback. *Accept: "Install app" works in Chrome.*
- [ ] M0.6.6 [DREAM|M] Final icon/logo design and splash screen. *Accept: approved by owners.*

## M0.7 Code structure
- [ ] M0.7.1 [MUST|L] Split `main.ts` into `Game`, `World`, `systems` registry, `PlayerContext` (per-player). *Accept: `main.ts` < 150 lines, behaviour unchanged.*
- [ ] M0.7.2 [SHOULD|M] ESLint + Prettier. *Accept: `npm run lint` clean.*
- [ ] M0.7.3 [SHOULD|M] Spatial hash for colliders. *Accept: collision cost independent of box count.*

**Phase 0 exit:** game starts from an icon, saves/loads, passes smoke test, 60 FPS target met.

---

# PHASE 1 - Skyrim-style feel  (MUST)
Goal: moment-to-moment combat and movement feel good. See `docs/bible/09-combat-skyrim-style.md`.

## M1.1 Character controller
- [ ] M1.1.1 [MUST|M] Capsule movement with step-up and slope handling. *Accept: stairs and ramps smooth.*
- [ ] M1.1.2 [MUST|S] Coyote time, jump buffering, air control tuning. *Accept: jumps feel reliable.*
- [ ] M1.1.3 [SHOULD|M] Sneak, crouch with stealth rules (noise/light). *Accept: C toggles sneak, detection reacts.*
- [ ] M1.1.4 [SHOULD|M] Climbing/vaulting basics (Gauntlet wall, ledges). *Accept: climb a 3 m wall via marked surfaces.*
- [ ] M1.1.5 [SHOULD|M] Swimming (water volumes). *Accept: swim, stamina, no fall damage in water.*

## M1.2 Melee
- [ ] M1.2.1 [MUST|M] Attack state machine: windup/active/recovery with hit-frame. *Accept: hit registers at the right frame.*
- [ ] M1.2.2 [MUST|M] Power attacks (hold). *Accept: 2x damage, stagger chance.*
- [ ] M1.2.3 [MUST|M] Blocking + shield, stamina drain, block spark. *Accept: blocked hits reduced.*
- [ ] M1.2.4 [MUST|S] Bash + stagger interrupting casts. *Accept: bash staggers enemy.*
- [ ] M1.2.5 [MUST|M] Hit reactions, hit-stop, camera shake, knockback. *Accept: visible and audible impact.*
- [ ] M1.2.6 [SHOULD|M] Weapon classes (dagger/sword/axe/mace/two-hander/spear) with stats. *Accept: each plays differently.*
- [ ] M1.2.7 [SHOULD|M] Parry/perfect block window. *Accept: timed block staggers.*
- [ ] M1.2.8 [SHOULD|M] Sneak attack/backstab multipliers. *Accept: x3 dagger sneak.*

## M1.3 Ranged
- [ ] M1.3.1 [MUST|M] Bow (draw, gravity arrows, ammo, headshot). *Accept: killable at range.*
- [ ] M1.3.2 [SHOULD|M] Crossbow, thrown knives. *Accept: two extra ranged weapons.*

## M1.4 Magic (signet expressions)
- [ ] M1.4.1 [MUST|M] Cast modes: fire-and-forget, charge, concentration, ward. *Accept: each mode exists with one spell.*
- [ ] M1.4.2 [MUST|M] Dual-cast (both hands). *Accept: stronger version.*
- [ ] M1.4.3 [MUST|L] 6 signet spells with unique VFX/SFX (lightning, fire, ice, wind, shadow, ward). *Accept: all cast and damage correctly.*
- [ ] M1.4.4 [SHOULD|M] Utility signets (retrieval pull, mending, farsight reveal). *Accept: 3 utility effects working.*
- [ ] M1.4.5 [SHOULD|S] Burnout state on overuse. *Accept: locks magicka and hurts.*

## M1.5 Enemy AI and roster
- [ ] M1.5.1 [MUST|L] AI state machine (patrol, alert, search, chase, attack, retreat, flee). *Accept: enemies behave in each state.*
- [ ] M1.5.2 [MUST|M] Group alerts, flanking, ranged keep-distance, caster roles. *Accept: mixed group fights feel varied.*
- [ ] M1.5.3 [MUST|M] Enemy types: Venin, soldier, wolf, boar, wyvern (ground). *Accept: 5 distinct enemies.*
- [ ] M1.5.4 [SHOULD|L] Grid navigation with obstacle avoidance. *Accept: enemies path around buildings.*
- [ ] M1.5.5 [SHOULD|M] Boss framework (phases, telegraphs, arena). *Accept: one boss fight.*
- [ ] M1.5.6 [SHOULD|S] Enemy health bars, damage numbers (optional toggle). *Accept: toggled in settings.*

## M1.6 Camera and feedback
- [ ] M1.6.1 [MUST|M] Third-person camera collision and smoothing. *Accept: no clipping through walls.*
- [ ] M1.6.2 [MUST|S] Crosshair/lock-on assist for gamepad (SHOULD aim assist). *Accept: lock-on toggle.*
- [ ] M1.6.3 [SHOULD|M] FOV shifts on sprint/cast, screen effects (low health, burnout). *Accept: visible effects.*
- [ ] M1.6.4 [SHOULD|M] Impact VFX (sparks, dust, blood-lite) and decals. *Accept: per material.*

## M1.7 Stats and balance
- [ ] M1.7.1 [MUST|M] Armour/damage formulas, resistances, difficulty slider. *Accept: documented tables.*
- [ ] M1.7.2 [MUST|M] Time-to-kill tuning tests. *Accept: matches targets in doc 09.*
- [ ] M1.7.3 [SHOULD|S] Death/respawn rules per class and area. *Accept: no softlocks.*

## M1.8 Mounted/flying combat v1
- [ ] M1.8.1 [MUST|M] Broom/dragon controls tuned (stall, boost, bank). *Accept: smooth.*
- [ ] M1.8.2 [SHOULD|M] Dragon health, damage states, enemy flyers. *Accept: dragon can be hurt and recover.*

**Phase 1 exit + Decision gate G1:** combat is fun for 10 minutes against mixed groups; decide whether to stay on Three.js (default) or evaluate Godot migration.

---

# PHASE 2 - Characters, assets and look  (MUST/SHOULD)
Goal: replace blocky placeholders with real models and a real animation system. See `13-art-assets.md`, `14-animation.md`.

## M2.1 Asset pipeline
- [ ] M2.1.1 [MUST|M] `assets/` structure, `licences.md`, manifest JSON. *Accept: schema + docs.*
- [ ] M2.1.2 [MUST|M] GLB loader with cache, instancing, Draco/meshopt. *Accept: loads a test model in-game.*
- [ ] M2.1.3 [MUST|S] Ask owner to approve asset sources; first CC0 pack downloaded with licence logged. *Accept: pack in `assets/`, licence recorded.*
- [ ] M2.1.4 [SHOULD|M] Blender headless script template (bpy) for custom models. *Accept: script exports one prop.*

## M2.2 Humanoid rig and animations
- [ ] M2.2.1 [MUST|L] Rigged humanoid (CC0 or Blender) loaded for player/NPC. *Accept: textured character in-game.*
- [ ] M2.2.2 [MUST|L] Animation state machine with clips (idle/walk/run/sprint/jump/fall). *Accept: transitions blend.*
- [ ] M2.2.3 [MUST|L] Combat animations (light, power, block, bash, stagger, death). *Accept: tied to attack states.*
- [ ] M2.2.4 [MUST|M] Cast, bow, interact, sit, work clips. *Accept: used by NPC activities.*
- [ ] M2.2.5 [SHOULD|M] Head look-at, foot IK. *Accept: slopes and look targets.*
- [ ] M2.2.6 [SHOULD|M] Cloth/cape/hair secondary motion. *Accept: visible sway.*

## M2.3 Characters and customization
- [ ] M2.3.1 [MUST|M] Player customization on the real model (body type, hair, skin, outfit). *Accept: creator preview rotates.*
- [ ] M2.3.2 [MUST|L] NPC variety system (head/hair/body kits, colour variation). *Accept: no two cadets identical.*
- [ ] M2.3.3 [MUST|M] Quadrant uniforms + armour sets. *Accept: colours match 05-factions.*
- [ ] M2.3.4 [SHOULD|L] Canon unique looks (Violet crown braid, Xaden aura, etc.) on real models. *Accept: recognisable.*
- [ ] M2.3.5 [SHOULD|L] **Face photo -> character** (MediaPipe landmarks, texture projection). *Accept: photo changes face.*
- [ ] M2.3.6 [DREAM|M] NPC facial animation/lip-sync babble. *Accept: mouth moves with babble.*

## M2.4 Dragons
- [ ] M2.4.1 [MUST|L] Dragon base model + rig with variation (size, colour, tail type). *Accept: all 6 tail types visible.*
- [ ] M2.4.2 [MUST|L] Dragon animation set (idle, walk, takeoff, flap, glide, land, roar, attacks). *Accept: state-driven.*
- [ ] M2.4.3 [SHOULD|M] Hatchling Andarna-style model. *Accept: small feathertail variant.*

## M2.5 Environment art
- [ ] M2.5.1 [MUST|L] PBR materials + textures for stone, wood, grass, rock. *Accept: terrain and buildings look textured.*
- [ ] M2.5.2 [MUST|L] Replace buildings with modular kit (walls, towers, roofs, doors). *Accept: Basgiath rebuilt from kit.*
- [ ] M2.5.3 [SHOULD|L] Vegetation: wind-animated trees, grass, flowers, herbs. *Accept: instanced and swaying.*
- [ ] M2.5.4 [SHOULD|M] Props library (furniture, books, weapons racks, banners). *Accept: interiors furnished.*
- [ ] M2.5.5 [SHOULD|M] Water shader (river, ponds). *Accept: reflective moving water.*

## M2.6 Rendering polish
- [ ] M2.6.1 [SHOULD|M] Post-processing (bloom, tone mapping, colour grade, vignette). *Accept: toggled via settings.*
- [ ] M2.6.2 [SHOULD|M] SSAO and cascaded shadows. *Accept: stable shadows over distance.*
- [ ] M2.6.3 [SHOULD|M] Particle system for fire, sparks, dust, magic. *Accept: GPU-friendly.*
- [ ] M2.6.4 [DREAM|L] Volumetric fog/god rays, clouds. *Accept: visible atmosphere.*

**Phase 2 exit:** the game looks like a game (textured, animated, lit), not a prototype.

---

# PHASE 3 - The world  (MUST/SHOULD)
Goal: a large, readable open world of Navarre with a full Basgiath. See `02-world-map.md`, `03-locations.md`.

## M3.1 World tech
- [ ] M3.1.1 [MUST|L] Chunked terrain meshes + LOD + streaming radius. *Accept: stable memory while flying across map.*
- [ ] M3.1.2 [MUST|M] Cell streaming for props/NPCs/enemies. *Accept: objects load/unload by distance.*
- [ ] M3.1.3 [MUST|M] Biome masks (forest, meadow, rock, snow) + splat textures. *Accept: varied terrain.*
- [ ] M3.1.4 [SHOULD|M] Roads and rivers from splines. *Accept: roads follow terrain.*
- [ ] M3.1.5 [SHOULD|L] Interior cell system (portals). *Accept: enter any large building seamlessly.*
- [ ] M3.1.6 [SHOULD|M] Fast travel (roosts/carriages). *Accept: map-driven.*

## M3.2 Basgiath complete
- [ ] M3.2.1 [MUST|L] Rebuild exterior/skyline of Basgiath on the mountain with turrets and bell tower. *Accept: iconic silhouette.*
- [ ] M3.2.2 [MUST|L] Interiors: Administration, General's office, Gathering Hall, classrooms, dorms. *Accept: each walkable.*
- [ ] M3.2.3 [MUST|L] Riders Quadrant: citadel, dorms, Torture Chamber cave, Rider Survival Course. *Accept: all visitable.*
- [ ] M3.2.4 [MUST|L] Infantry Quadrant (drill yards, armoury, barracks). *Accept: all visitable.*
- [ ] M3.2.5 [MUST|L] Healers Quadrant (infirmary, gardens, morgue). *Accept: all visitable.*
- [ ] M3.2.6 [MUST|L] Scribes Quadrant + Archives (stacks, vault, reading rooms) + central tunnel. *Accept: all visitable.*
- [ ] M3.2.7 [MUST|M] The Parapet polish (tower stair, wind/rain, fall cinematic). *Accept: tense and fair.*
- [ ] M3.2.8 [MUST|L] Gauntlet redesign (vertical climb, 5 obstacles per lore (?)). *Accept: completable, deadline timer.*
- [ ] M3.2.9 [MUST|M] Flight Field + aeries/Vale (dragon homes, hatching ground). *Accept: dragons present.*
- [ ] M3.2.10 [SHOULD|M] Chantara village (inn, market, forge). *Accept: living hub.*

## M3.3 Beyond the college
- [ ] M3.3.1 [MUST|L] Morraine region (forests, mountains, river, roads, camps). *Accept: 4x4 km playable.*
- [ ] M3.3.2 [SHOULD|L] Montserrat outpost. *Accept: visitable + event site.*
- [ ] M3.3.3 [SHOULD|L] Tyrrendor: Aretia, Athebyne, Resson, Dralor cliffs. *Accept: each reachable by dragon.*
- [ ] M3.3.4 [SHOULD|M] Dungeons/caves/ruins (6 unique). *Accept: loot + encounters.*
- [ ] M3.3.5 [SHOULD|M] Points of interest (shrines, camps, wrecks) 40+. *Accept: placed with discovery XP.*
- [ ] M3.3.6 [DREAM|L] Poromiel border zone, Zolya/Cordyn, Calldyr. *Accept: separate regions.*
- [ ] M3.3.7 [DREAM|L] Isles chapter map. *Accept: archipelago.*

## M3.4 Environment systems
- [ ] M3.4.1 [MUST|M] Weather state machine (clear/overcast/rain/fog/storm/snow). *Accept: transitions + effects.*
- [ ] M3.4.2 [SHOULD|M] Wind gameplay (Parapet, flight turbulence). *Accept: affects control.*
- [ ] M3.4.3 [SHOULD|M] Wards visual at borders. *Accept: shimmering wall.*
- [ ] M3.4.4 [DREAM|M] Seasons. *Accept: palette + foliage variants.*

**Phase 3 exit:** you can spend an hour exploring Morraine + Basgiath with real places and no empty spaces.

---

# PHASE 4 - Dragons and signets  (MUST)
See `08-dragons-signets.md`.

## M4.1 Bond depth
- [ ] M4.1.1 [MUST|M] Verify species/tails/rarities with owners; update `DRAGONS` data. *Accept: answers in 99 applied.*
- [ ] M4.1.2 [MUST|L] Threshing event rework (arena, dragon approach, rejection/burn, cinematic). *Accept: memorable scripted event.*
- [ ] M4.1.3 [MUST|M] Dragon stats: bond level, mood, hunger, health, personality. *Accept: affects behaviour.*
- [ ] M4.1.4 [MUST|M] Bond UI (dragon panel, commands). *Accept: radial command menu.*
- [ ] M4.1.5 [SHOULD|M] Special bonds (feathertail hatchling quest line). *Accept: quest-gated.*
- [ ] M4.1.6 [DREAM|M] Irid bond. *Accept: ultra-rare outcome.*

## M4.2 Signet system
- [ ] M4.2.1 [MUST|M] Signet data model (id, expression, cost, cooldown, burnout). *Accept: JSON-driven.*
- [ ] M4.2.2 [MUST|M] Signet selection/roll on bond, independent of species. *Accept: documented rule.*
- [ ] M4.2.3 [MUST|L] 10+ signets implemented as spells (see 08). *Accept: each unique.*
- [ ] M4.2.4 [SHOULD|M] Signet progression (perks, second signet event). *Accept: perk tree for signet.*
- [ ] M4.2.5 [SHOULD|M] Signet puzzles (retrocognition scenes, farsight reveal). *Accept: 3 quest uses.*

## M4.3 Dragon AI and companion
- [ ] M4.3.1 [MUST|L] Dragon follows/lands/idle/sleeps by schedule and weather. *Accept: believable.*
- [ ] M4.3.2 [MUST|L] Dragon fights independently on command. *Accept: attack/hold/circle.*
- [ ] M4.3.3 [SHOULD|M] Flight tuning: takeoff/landing, stall, turbulence, fatigue. *Accept: feels weighty.*
- [ ] M4.3.4 [SHOULD|L] Aerial combat vs wyverns/flying enemies. *Accept: dogfight encounter.*
- [ ] M4.3.5 [SHOULD|M] Formation flight (wing/section). *Accept: NPC dragons follow leader.*
- [ ] M4.3.6 [DREAM|M] Dragon care (feed, groom), saddle gear. *Accept: stat effects.*

## M4.4 Wild dragons and ecology
- [ ] M4.4.1 [SHOULD|M] Dragons patrol skies on routes; landing at roosts. *Accept: skyline alive.*
- [ ] M4.4.2 [SHOULD|M] Dragon etiquette mechanics (approach rules per colour). *Accept: wrong approach angers.*

**Phase 4 exit:** the bond is the heart of the game: choosing, caring for, flying and fighting with your dragon.

---

# PHASE 5 - Story and quests  (MUST/SHOULD)
See `06-story-arc.md`, `07-quests.md`.

## M5.1 Systems
- [ ] M5.1.1 [MUST|L] Quest engine v2 (stages, branches, conditions, timers, failure). *Accept: supports all objective types.*
- [ ] M5.1.2 [MUST|L] Dialogue system (trees, skill checks, flags, barks, camera framing). *Accept: 3 sample conversations.*
- [ ] M5.1.3 [MUST|M] Journal UI (quests, lore, bestiary). *Accept: logs entries.*
- [ ] M5.1.4 [MUST|M] Event/cutscene system (timeline, camera, actors). *Accept: Threshing cutscene scripted.*
- [ ] M5.1.5 [SHOULD|M] Quest debug tools and validator. *Accept: jump to any stage.*
- [ ] M5.1.6 [SHOULD|M] Radiant quest generator. *Accept: 5 templates.*

## M5.2 Act I (First Year) - vertical slice
- [ ] M5.2.1 [MUST|L] Prologue: Conscription Day + Parapet as scripted event with squad assignment. *Accept: full prologue playable.*
- [ ] M5.2.2 [MUST|L] First days: squad, section leader, Battle Brief, training montage quests. *Accept: 6 quests.*
- [ ] M5.2.3 [MUST|L] Gauntlet deadline quest chain. *Accept: win/fail flows.*
- [ ] M5.2.4 [MUST|L] Threshing as story peak. *Accept: bonds persist.*
- [ ] M5.2.5 [MUST|L] War Games (squad vs squad event). *Accept: multi-stage mission.*
- [ ] M5.2.6 [MUST|L] Montserrat defence. *Accept: wave defence with dragon.*
- [ ] M5.2.7 [SHOULD|L] Athebyne siege. *Accept: story reveal scene.*
- [ ] M5.2.8 [SHOULD|L] Resson battle + evacuation. *Accept: climactic event.*

## M5.3 Faction lines
- [ ] M5.3.1 [MUST|L] Riders non-main chain (10 quests). *Accept: wing standing rises.*
- [ ] M5.3.2 [MUST|L] Infantry chain (10). *Accept: ranks + rewards.*
- [ ] M5.3.3 [MUST|L] Healers chain (10). *Accept: alchemy involvement.*
- [ ] M5.3.4 [MUST|L] Scribes chain (10). *Accept: Archives mystery.*

## M5.4 Content breadth
- [ ] M5.4.1 [SHOULD|L] 30 side quests (varied types). *Accept: each with a twist.*
- [ ] M5.4.2 [SHOULD|L] 10 companion/Broccoli quests. *Accept: companions have arcs.*
- [ ] M5.4.3 [SHOULD|M] Lore books (40) and notes. *Accept: collectable + library.*

## M5.5 Act II
- [ ] M5.5.1 [SHOULD|L] Second-year hub changes, Archives vault arc. *Accept: 8 quests.*
- [ ] M5.5.2 [SHOULD|L] Samara/Aretia travel arcs. *Accept: new regions integrated.*
- [ ] M5.5.3 [SHOULD|L] Wardstone night finale. *Accept: act climax.*

## M5.6 Act III (DREAM)
- [ ] M5.6.1 [DREAM|L] Island expeditions (4 isles). *Accept: new regions + quests.*
- [ ] M5.6.2 [DREAM|L] Irids and final confrontation. *Accept: finale.*

**Phase 5 exit:** a full Act I story that can be finished, with faction lines and side quests around it.

---

# PHASE 6 - Living world  (SHOULD)
See `11-living-world.md`.
- [ ] M6.1 [MUST|L] NPC schedules (sleep/eat/train/work/patrol). *Accept: day-long observation shows routines.*
- [ ] M6.2 [MUST|M] Activity animations/props per activity. *Accept: 10 activities.*
- [ ] M6.3 [SHOULD|M] Barks and ambient conversations. *Accept: triggered by proximity.*
- [ ] M6.4 [SHOULD|M] Crowds (drills, mess, market). *Accept: groups moving together.*
- [ ] M6.5 [SHOULD|M] Reputation, crime, guards. *Accept: consequences work.*
- [ ] M6.6 [SHOULD|M] Wildlife (birds, deer, wolves) with behaviours. *Accept: territory AI.*
- [ ] M6.7 [SHOULD|M] Random world events (raid, wyvern sighting, caravan). *Accept: 8 events.*
- [ ] M6.8 [SHOULD|M] Economy: vendors, stock refresh, bounties. *Accept: shops work.*
- [ ] M6.9 [DREAM|L] Off-screen NPC simulation. *Accept: NPCs continue routines outside radius.*

---

# PHASE 7 - Audio  (SHOULD)
See `12-audio.md`.
- [ ] M7.1 [MUST|M] Audio manager with buses and spatial emitters. *Accept: settings sliders work.*
- [ ] M7.2 [MUST|M] Replace procedural SFX gaps (footsteps per surface, weapons, spells). *Accept: catalogue 70% covered.*
- [ ] M7.3 [MUST|L] Dynamic music (exploration/alert/combat) with region themes. *Accept: state transitions audible.*
- [ ] M7.4 [SHOULD|M] Dragon sound set (roars, wings, breath). *Accept: sizes differ.*
- [ ] M7.5 [SHOULD|M] Ambience layers (wind, rain, night, college bell). *Accept: per region.*
- [ ] M7.6 [SHOULD|M] NPC vocal barks by voice type. *Accept: pain/greeting/anger.*
- [ ] M7.7 [SHOULD|M] Indoor reverb/occlusion. *Accept: muffling indoors.*
- [ ] M7.8 [DREAM|L] TTS for key lines (licence-checked). *Accept: optional.*
- [ ] M7.9 [DREAM|L] Original score (composed + rendered). *Accept: 10 tracks.*

---

# PHASE 8 - UI/UX and accessibility  (SHOULD)
See `15-ui-ux.md`.
- [ ] M8.1 [MUST|L] Inventory/equipment UI. *Accept: weight, compare, hands.*
- [ ] M8.2 [MUST|L] Skills/perk UI and progression system. *Accept: levelling works.*
- [ ] M8.3 [MUST|M] Items and crafting (alchemy, smithing). *Accept: 3 recipes each.*
- [ ] M8.4 [SHOULD|M] Map layers, fog of discovery, fast travel. *Accept: filters.*
- [ ] M8.5 [SHOULD|M] Tutorial hints. *Accept: first-time tips.*
- [ ] M8.6 [SHOULD|M] Localization CZ/EN. *Accept: language switch.*
- [ ] M8.7 [SHOULD|M] Accessibility options. *Accept: subtitle size, reduce motion, colour-blind markers.*
- [ ] M8.8 [DREAM|M] Cinematic title/ending sequences. *Accept: intro and credits.*

---

# PHASE 9 - Multiplayer  (bonus)
See `18-multiplayer.md`.
- [ ] M9.1 [SHOULD|L] Two cameras/viewports, per-player HUD. *Accept: both players visible.*
- [ ] M9.2 [SHOULD|L] Two inputs (keyboard+mouse + gamepad) fully independent. *Accept: both play.*
- [ ] M9.3 [SHOULD|M] Shared world rules (time, quests per player, dialogue handling). *Accept: no softlocks.*
- [ ] M9.4 [SHOULD|M] Performance mode for splitscreen. *Accept: >= 30 FPS.*
- [ ] M9.5 [DREAM|L] Online co-op (host + client snapshots via WebRTC). *Accept: two PCs play together.*

---

# PHASE 10 - Polish and release (private)
- [ ] M10.1 [MUST|L] Full balance pass (combat, economy, difficulty). *Accept: playtest notes.*
- [ ] M10.2 [MUST|L] Bug bash (all severities). *Accept: no known major.*
- [ ] M10.3 [MUST|M] Performance and memory pass on target machines. *Accept: targets met.*
- [ ] M10.4 [SHOULD|M] Final icon, logo, installer, credits (`CREDITS.md`). *Accept: shipped installer.*
- [ ] M10.5 [SHOULD|S] Trailer/screenshots for personal keepsake. *Accept: capture tool.*
- [ ] M10.6 [MUST|S] Final QA checklist (`19-qa.md`). *Accept: signed off by owners.*

---

## Risk register
| Risk | Mitigation |
| --- | --- |
| Scope explosion | MUST/SHOULD/DREAM, vertical slices, Act I first |
| Unverified code base | Phase 0 first; automated smoke test |
| Asset quality without artists | CC0 packs + Blender scripts + stylisation |
| Lore errors | `(?)` flags, owners verify, 99-open-questions |
| Browser performance in an open world | streaming, LOD, instancing, presets, profiling |
| IP | private fan project, no book text, no distribution |
| Engine ceiling | Decision gate G1; data kept engine-neutral |

## Suggested order of attack (next sessions)
1. M0.1 (run + fix) -> M0.2 (smoke tests) -> M0.4 (menu + saves) -> M0.6 (desktop icon).
2. M1.1-M1.5 (feel) -> G1.
3. Phase 2 asset pipeline + humanoid -> Phase 3 Basgiath rebuild -> Phase 4 dragons -> Phase 5 Act I.
4. Remaining phases interleaved by owners' priorities.

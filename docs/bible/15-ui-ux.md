# 15 - UI / UX

Current: DOM overlay HUD (bars, hand labels, announce banner, objective line, minimap, world map, quest log J, dialog panel, character creator with quick-select tiles, class select).

## Screens (MUST unless noted)
- **Title / main menu**: New game, Continue (saved characters), Settings, Credits, Quit (desktop app). Background: slow fly-over of Basgiath at dusk.
- **Character creation**: name, body type, face, hair, skin, outfit colours, photo-to-face (SHOULD), voice pitch, starting class preview, quick-select tiles (done).
- **Pause menu**: resume, save, load, settings, controls, quit to menu.
- **Settings**: graphics presets + sliders (view distance, shadows, vegetation), audio buses, controls rebinding (keyboard + gamepad), subtitles, camera FOV, sensitivity, invert Y, language (CZ/EN), accessibility.
- **Inventory/equipment**: grid/list, categories, weight, compare, favourites, drag to hands, use/drop, dragon saddlebags (SHOULD).
- **Skills/perks**: constellations-style or tree UI, skill levels, perk descriptions.
- **Map**: done (M); add layers/filters, fast-travel markers, quest markers, discovered-only fog (SHOULD), custom waypoints (done), zoom/pan (SHOULD).
- **Journal**: quests, notes, lore books library, bestiary/dragon codex (SHOULD).
- **Dialogue**: speaker portrait/name, text with typewriter, choices, skill-check labels, history log (SHOULD).
- **Loading screens**: tips + lore snippets.
- **Death/respawn**, **level up**, **notifications** (stacked toasts), **tutorial prompts**.

## HUD rules
- Bars bottom-centre (health/magicka/stamina), compass/minimap top-right, objective tracker below it, hands bottom corners, crosshair, interaction prompt, enemy health bars when targeted, damage direction indicators, dragon status when mounted.
- Fade HUD in cinematic moments; "immersion mode" option.

## Input
Keyboard+mouse and gamepad parity; on-screen glyphs switch automatically. Rebindable keys. No hotkeys while typing (done for inputs).

## Localization
String tables `src/i18n/{en,cs}.json`; all UI text through `t('key')`. Czech first-class support for the owners; quest text authored in English then translated (or direct CZ).

## Accessibility (SHOULD)
Subtitle size/background, colour-blind-safe marker shapes, hold/toggle options, reduce motion (camera bob, screen shake), difficulty modifiers.

## Visual style
Parchment/ink inspired panels, dark navy background with ember accent, serif display font (Georgia placeholder -> custom), consistent iconography per class and wing colours.

## Tutorial flow
Contextual one-time hints (movement, interact, combat, block, dragon, broom, map) driven by a `hints.json` file with triggers and "seen" flags saved per character.

## Decisions
English is the default language; Czech is the second language. Difficulty is a menu setting (see 00-vision); no permadeath.

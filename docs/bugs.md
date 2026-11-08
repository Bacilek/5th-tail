# Bug list

Found by running the production build in headless Chrome (`npm run smoke`, `node scripts/walk.mjs`). Software GL renders at ~4 FPS, so timing/perf results are not representative.

## Fixed
| ID | Severity | Description | Fix |
| --- | --- | --- | --- |
| B1 | major | First-person viewmodel: spell orb and weapons were huge and dark (blade covered half the screen) | Scaled FP held items to 0.5, brighter metal, orb smaller |
| B2 | minor | 404 for favicon on every load | inline `data:` favicon in `index.html` |
| B3 | minor | NPC name labels too large | label width 5 -> 3.6 |

## Verified working (automated)
- Boot, character creation, class select, spawn on Conscription Tower: no console errors.
- Parapet: walking W from the tower top crosses all 49 m and lands in the Citadel without falling (wind gusts stay within the 1.2 m width when walking straight - consider tuning, see open).
- Gauntlet: jumping up/over the stepped wall works (box tops are standable, up to y=62.6); sweeper and wrecking ball damage and knock back (hp 100 -> ~71); the player exits onto the Flight Field.
- Infantry hall: door gap passable, furniture blocks as intended.
- Day/night: night render has stars and torch light; HUD clock updates.

## Open
| ID | Severity | Description |
| --- | --- | --- |
| O1 | minor | World labels overlap (Gauntlet / Flight Field / Citadel signs) and are huge up close |
| O2 | minor | Parapet is too safe: wind (+-0.95 m/s) barely moves the walking player; consider stronger gusts, camera sway, fall chance (lore: 15-20% fall) |
| O3 | minor | "The Threshing" banner stays on screen for a long time after teleporting |
| O4 | info | Real performance on target hardware (Ryzen 7 7735HS / Radeon 680M) unknown - needs Marek's FPS report (F3 overlay not built yet, M0.3.1) |
| O5 | minor | Threshing, dragon mount flight and broom race are not covered by automated tests yet |

## Fixed (round 2)
| ID | Severity | Description | Fix |
| --- | --- | --- | --- |
| B4 | **major** | A player who fell off the Parapet could be snapped back up onto the bridge from below (span treated as solid ground column) | `heightAtFor(x,z,y)`: the span only counts as ground for bodies at/above it; terrain mesh uses `baseHeight` so no ridge under the bridge |
| B5 | minor | Parapet wind too weak (O2) | gusts +-1.7 m/s peak; walking straight now often falls (fall = respawn at tower); hint text added |

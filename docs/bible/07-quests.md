# 07 - Quests

All quest text is original (`(invented)`), loosely parallel to canon events. Structure is data-driven (`src/data/quests.ts`, to be extended with stages, branches, conditions).

## Quest data model (target)
```
id, title, type (main|faction|side|radiant|companion|event), giver, region, requires[], 
stages[ {id, objective{type,params}, journal text, onComplete[]} ],
branches/outcomes, rewards{gold,items,xp,reputation}, failure rules, class gating, timers
```
Objective types: talk, kill, collect, reach, escort, deliver, fly-to, use-signet, craft, survive-timer, stealth, defend, investigate (clue spots), duel, race, choose.

## Existing prototype quests (13)
Lost to the Archives, The Restricted Shelves, Bitterroot for the Wounded, Salve for the Village, A Treat for Broccoli, Dark Things on the Road, Clear the Camp, Orders for the Gauntlet, Prove Your Wings, Through the Gauntlet, Ridoc's Wager, An Overdue Volume, Report to the Commandant.

## Catalogue plan (counts are targets)
### Main line (Riders) - ~30 quests across acts (06-story-arc)
Act I examples (all original narrative framing around canon events):
1. Cross the Parapet (done as a mechanic).
2. First Day in the Citadel - find your squad, meet your section leader.
3. The Gauntlet Deadline - train and finish the course before the deadline.
4. Battle Brief - attend, answer questions (dialogue skill checks), uncover a concealed fact.
5. Dragon Etiquette - learn how not to get burned (talk to older cadets).
6. The Threshing - bond (done basic).
7. First Flight - tutorials in the sky; formation drill.
8. War Games prep and event - squad vs squad, capture-the-banner style (multi-stage).
9. Montserrat - defend outpost from an air raid.
10. Athebyne - discover the venin truth; siege survival.
11. Resson - defend the trading post; evacuate civilians.
Act II/III: Archives vault, Samara, Aretia flights, wardstone night, island expeditions (DREAM).

### Faction lines (4 quadrants) - ~10 each
- **Infantry**: border patrols, formation drills, fortification, supply escort, boot camp finals.
- **Healers**: triage after a battle, rare herb expedition, fever outbreak, mender mentor (Nolon-style), field hospital under siege.
- **Scribes**: missing scrolls, ward translations, forgery investigation, vault infiltration, sign-language communication quest.
- **Riders (non-main)**: wing standing jobs, Gauntlet record, aerial patrol, dragon-care chores, challenge duels.

### Side quests - ~60
Village problems, bandits/rebels, lost items, collecting lore, delivering messages, rescuing animals, treasure hunts, cat Broccoli arcs, mini-games (broom races, archery), romance/friendship hooks (SHOULD, tasteful), rumours turning into quests.

### Radiant / repeatable - ~10 templates
Kill Venin at a location, escort a cart, fetch herbs, deliver letters, clear a wyvern nest, practice duels. Generated from templates with location/NPC picking.

### Companion quests
Broccoli, squad-mates (invented cadets), dragon personal quests (bond depth).

### Events (scripted, time-gated)
Conscription Day, Threshing, Memorial, Reunification Day (1 July (ER)), inspections, storm night.

## Design rules
- Every quest has a hook (rumour or NPC), a twist or choice, and a reward that matters.
- Prefer multi-location chains with travel by dragon/broom.
- Journal entries tell what to do and why; the HUD tracker shows 1-3 next objectives; map markers (`!`, `?`, objective area).
- Class variants: some quests have alternate steps by class.
- Never require grinding; failure is soft (retry) except tagged "permanent" story outcomes.
- Mark each quest `canon-event | canon-adjacent | invented`.

## Dialogue system (Phase 5)
Branching trees with: choice lines, skill checks (Speech, Bond, Lore), reputation gating, quest flag conditions, one-line barks, repeated-NPC memory ("you again"), subtitles + babble audio, camera framing and gestures.

## Authoring workflow
Quests defined in data; a validator script checks unknown ids, unreachable stages, missing rewards; a debug console command can jump to any stage.

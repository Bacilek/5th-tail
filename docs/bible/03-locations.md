# 03 - Locations catalogue

Format: **Name** - what it is - key features for gameplay - status in prototype - priority.

## Basgiath War College (Morraine)
Carved into Basgiath Mountain, battlements with a turret at each corner, one holds the bell (ER). Three-year program; ~a quarter graduate (ER). Name from Gaelic death + wing (ER).

### Shared / administration
- **Administration Building / General Sorrengail's Office** - command centre; Commandant quests. Prototype: hollow keep with table (done, basic). Phase 3: full interior, office, map room. MUST.
- **Bell Tower** - signals drills and alarms; bell audio. SHOULD.
- **Gathering Hall** - mess hall (?), crowds at meal hours. MUST for living world.
- **Academic Wing / classrooms** - Battle Brief class, lectures (minigame/dialogue). SHOULD.
- **Dorms/barracks** - sleep/save points, personal chest. MUST.
- **Dragon Rotunda** - named in ER (purpose unclear (?)). SHOULD (design own).
- **Lower courtyard / Conscription Day square** - assembly, class choice. Prototype: done. MUST.

### Quadrants (each its own campus; see 05-factions)
- **Riders Quadrant (Citadel)** - on a ridge; only entrance for candidates is the Parapet (ER). Contains Gauntlet, Flight Field, Rider dorms, Torture Chamber, wing halls. Prototype: Citadel, Gauntlet, Flight Field (done, basic). MUST.
- **Infantry Quadrant** - north, northern turret ground level (Fandom, ?). Drill yards, armoury, barracks. Prototype: basic. MUST.
- **Healers Quadrant** - south gate; infirmary, herb gardens, morgue. Prototype: basic. MUST.
- **Scribes Quadrant & Archives** - central tunnel down; Archives smell of parchment/glue/ink (ER); across the river per ER (?). Prototype: sunken campus + Archives hall. MUST.

### Named features
- **The Parapet** - narrow bridge of uneven mortared stone, ~18 in wide, ~200 ft up (ER); 15-20% of candidates fall. Prototype: done (49 m, wind gusts). Needs polish: gusts, rain, camera acrophobia effect, fall cinematic. MUST.
- **The Gauntlet** - steep vertical climbing course, 5 obstacles, first-years must finish within two months (ER). Prototype: horizontal obstacle corridor (invented) - redesign to a vertical climb in Phase 3 (?). MUST.
- **Flight Field** - dragons and riders train; Threshing. Prototype: big meadow (done). MUST.
- **Torture Chamber / Rider Survival Course cave** - hidden entrance under the Riders foundation; domed cave, bunks (ER). SHOULD (dungeon-style mission).
- **Dragon aeries / Vale** - dragon home and hatching grounds (LL). MUST (bond, companion).
- **Tunnels** - central tunnel to Archives (Fandom). SHOULD.
- **Chantara** - village near the college (barred Riders for a long time, ER). Prototype: Basgiath Village (invented layout). MUST.

## Other settlements and sites
| Place | Role | Phase |
| --- | --- | --- |
| Aretia / Fortress of Aretia (Riorson House) | Tyrrendor capital; Assembly HQ | 3/5 |
| Athebyne | Outpost, SE Tyrrendor at Poromiel border; supply/battle site | 5 |
| Samara | Easternmost outpost of Southern Wing | 5 |
| Montserrat | Morraine outpost near Cygnisen border; wards fell here | 5 |
| Resson | Trading post (~300 people) on Krovla-Tyrrendor border | 5 |
| Draithus | Large Krovla city | DREAM |
| Cordyn / Zolya / Anca | Poromiel cities; Zolya has Cliffsbane flier academy | DREAM |
| Sipene | Mountain village in the Esben Mountains | 5 |
| Cliffs of Dralor | Huge cliffs; dragon-only passage | 3 |
| Battle of Gianfar site | Late battle site; gryphons + dragons | DREAM |
| Calldyr City | Royal seat | DREAM |
| Lewellen, Ruel, Sumerton | Small named towns | SHOULD as filler |

## Invented locations (to fill gameplay needs)
Basgiath Village inn and market, Venin Camp, road waystations, forest shrine, mine, bandit/rebel hideout, ruined tower, dragon-skeleton cave, hot spring, lighthouse (Isles), caravan stops. Each carries `(invented)`.

## Location authoring template
```
id, name, region, kind (hub|dungeon|outdoor|interior), coordinates, size, entrance(s), music, ambience,
NPCs (ids), enemies, loot tables, quests that start/end here, map icon, discovery XP, notes/lore refs
```

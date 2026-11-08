# 11 - Living world

Goal: the world keeps moving when you do nothing. Priority MUST/SHOULD/DREAM marked per row.

## NPC simulation
| Feature | Description | Priority |
| --- | --- | --- |
| Daily schedules | Per-NPC timeline (sleep, eat, train, work, patrol) bound to the day-night clock; data-driven `routine` list of {hour, place, activity} | MUST |
| Activities | idle animations per activity: sweep, hammer, read, spar, eat, talk, pray | SHOULD |
| Barks & ambient chatter | Short lines triggered by proximity/events (weather, dragons, your rank), delivered as babble + subtitle | SHOULD |
| Crowds | Cadets marching in formation to drills, mess-hall crowds, market bustle | SHOULD |
| Reactions | React to drawn weapons, crimes, kills, bonded dragon, rank, time of day | SHOULD |
| Relationships | Per-NPC disposition toward the player; some become companions | SHOULD |
| Following & companions | Broccoli (cat), selectable squad-mates, hired help | SHOULD |
| Off-screen sim | Coarse simulation for NPCs outside the streaming radius | DREAM |

## Wildlife and environment
- Birds, deer, wolves, boars; dragons patrolling the sky on routes; wyvern raids as events.
- Weather: clear, overcast, rain, fog, storm, snow (higher mountains). Gameplay effects: wind pushes on the Parapet, rain reduces visibility, storms ground broom flight (SHOULD).
- Seasons (DREAM): different palette/foliage/snow cover.
- Day-night cycle exists (see `src/systems/daynight.ts`). Add dawn/dusk events and lamp-lighting NPCs.

## College life (Basgiath)
- Morning formation, drill schedule, flight practice windows, mess hall hours, curfew.
- Challenge duels in the practice square (rules, referee NPC).
- Notice board with rotating radiant jobs.
- Rumour system: NPCs share gossip that points to side quests.

## World events (random + scripted)
Venin raid on a road, wyvern sighting, dragon fight in the sky, caravan ambush, storm warnings, ceremonies (Threshing day, memorials), inspections by officers.

## Dragons as part of the world
Wild/unbonded dragons on the Flight Field cliffs, bonded dragons lounging near their riders, dragons landing/taking off, shadows of dragons passing over the college, roar audio from the aeries.

## Persistence
Systems state (quests, relationships, world flags, time, weather) goes into the save file (see 16-tech-architecture).

## Authoring rule
Every new NPC gets: name, role, appearance data, schedule, 3+ bark lines, chat lines, optional quest hooks, voice pitch (for babble). Key canon NPCs also get a signature mark (see 04-characters).

# 06 - Story arc

Design rule: the game's main story runs **in parallel** to the books. The player is an original cadet at Basgiath; canon events happen around them (seen, joined, influenced at the edges), and canon characters keep their book fates. Heavy spoilers. All text original.

## Canon timeline (paraphrased)
### Book 1 - Fourth Wing (year 1 at college)
1. Conscription Day: candidates choose quadrants; Riders cross the Parapet; many fall.
2. Squads and wings assigned; Fourth Wing is mostly marked cadets.
3. Training: sparring, Battle Brief, the Gauntlet (a cadet dies), Presentation (dragon fire kills cadets).
4. The Threshing: dragons choose riders; bonds form (Violet bonds Tairn and Andarna).
5. Assassination attempts; Xaden's role; secret rebel gatherings.
6. Montserrat gryphon attack; War Games (lightning, Jack fight, Liam saved).
7. Athebyne: venin revealed as the real enemy.
8. Resson battle: Deigh and Liam die; poison.
9. Brennan alive; Violet joins the revolution.
### Book 2 - Iron Flame (year 2)
10. Return to college; Archives research with Jesinia; Xaden at Samara; Sloane joins.
11. Athebyne survivors targeted; Varrish tortures Violet; royal vault journals retrieved.
12. Dain's betrayal and rescue; Varrish killed; riders choose sides and fly to Aretia.
13. Politics with Tecarus and Poromiel; wards need dragon power; Xaden an intinnsic.
14. Final battle: General Sorrengail dies; Sloane restores wards; Xaden begins turning venin.
### Book 3 - Onyx Storm
15. Basgiath battle aftermath; Sawyer loses a leg; quest squad under Captain Grady.
16. Wardstone altered for gryphon fliers; Samara trap; Theophanie.
17. Island journeys (Deverelli, Unnbriel, Hedotis, Zehyllna); finding the Irids.
18. Draithus: Mira hostage; Theophanie killed; Xaden fully venin; memory wipe twist.

## Game acts (our structure)
| Act | Real-world arc | Player experience |
| --- | --- | --- |
| **Prologue** | Conscription Day | create character, pick class, Parapet (Riders), arrival at quadrant |
| **Act I - First Year** | Book 1 | quadrant training chain, Gauntlet, Battle Brief, Threshing, War Games, Montserrat, Athebyne, Resson |
| **Act II - Second Year** | Book 2 | deeper faction lines, Archives mysteries, Samara/Aretia travel, wards, political choices |
| **Act III - The Wider War** | Book 3 | (DREAM) island expeditions, Irids, final confrontation |

Each act is a **vertical slice**: usable in isolation, hub + 5-8 main quests + side content.

## Fixed points vs player choice
- **Fixed**: canon deaths, major battles, ward events.
- **Variable**: who you fight beside, what you retrieve, side outcomes, dragon bond species/signet, class-specific paths, minor NPC fates (non-canon), reputation endings.
- **Class-specific views**: Infantry sees the border war; Healers the aftermath; Scribes the secrets; Riders the aerial war.

## Event scripting
Events are data: `{id, trigger (time/place/quest flag), actors, scripted camera/animations, outcomes, flags}`. Key events: Conscription Day, Parapet, Gauntlet deadline, Presentation, Threshing, Battle Brief, War Games, Montserrat attack, Athebyne, Resson, Archives vault, Aretia flight, wardstone night.

## Pacing guidelines
~40-60 minutes of main story per act-chapter for a fast pass; large optional content in between. No forced fail states except the Parapet and select boss fights (checkpoints).

## Tone
Dark, tense, with banter. Not gratuitously gory. Sensitive content (death of cadets, torture) handled off-screen or stylised.

# 08 - Dragons, bond and signets

Sources: Empyrean Riders wiki (ER), Ink & Imaginings (I&I), Audible guides, a few signet lists. The Fandom wiki and Literary Lifestyle could not be read, so **everything marked (?) needs verification by Marek/partner before it is locked into `src/data/`**. Paraphrased, not quoted.

## Dragon facts (lore)
- **Colors** (adult): black, blue, green, red, orange, brown, plus iridescent ("Irid", shifts appearance, extra magic). Hatchlings are golden (ER). Temperament: blue large/ruthless, red quick to anger, orange unpredictable, black rare/highly intelligent, brown loyal, green rational. Colors have no mechanical effect beyond temperament (ER, Audible).
- **Tails** (six): scorpiontail, daggertail, morningstartail, swordtail, clubtail, feathertail. Tail type is **not tied to colour**; it develops by the dragon's choice and need. Feathertails are juveniles (no claws, no fire) and can share power with a rider at a cost to themselves.
- **Size**: ~25 ft tall adult (ER); blues very large. Hatchlings have a long "Dreamless Sleep" growth period.
- **Bonding (Threshing)**: dragons choose; a dragon may bond, ignore, or kill the candidate. Bonds are permanent; a dragon's death usually kills its rider; grief can kill a dragon. Each new bond is stronger than the previous. A signet should appear within months of bonding.
- **Communication**: dragons speak only to their bonded rider and give their full name only to that rider. They can power wards.
- **Fire**: dragons breathe fire (not feathertails). Venin are immune.
- **Mates** bond for life and weaken if apart for long (~3 days).
- **Society**: the Empyrean (dragon government), rank by power/age. Body language matters when approaching (red: approach from left/front, avoid eyes; green: lower eyes; brown: show no fear).
- **Hatching grounds / Vale**: valley behind Basgiath where dragons live (ER). Colour-specific ancestral grounds exist (Steelridge green, Dunness cliffs red, etc.).
- **Names**: Scottish Gaelic, often echoing the dragon's nature/signet.

## Named dragons (best data, conflicts flagged)
| Dragon | Colour / tail | Rider | Note |
| --- | --- | --- | --- |
| Tairn | Black, morningstar (?) - our data says dagger, check | Violet | |
| Andarna | Gold feathertail, later Irid / scorpiontail | Violet | second bond |
| Sgaeyl | Blue dagger | Xaden | Tairn's mate |
| Codagh | Black, sword (?) | General Melgren | |
| Teine | Green, club (I&I) or sword (another source) (?) | Mira | CONFLICT |
| Feirge | Green, dagger (?) | Rhiannon | |
| Cath | Red sword | Dain | |
| Aotrom | Brown sword | Ridoc | |
| Sliseag | Red sword | Sawyer | |
| Deigh | Red dagger | Liam | |
| Thoirt | Red dagger | Sloane | |
| Marbh | Orange dagger | Brennan | |
| Glane | Orange dagger | Imogen | |
| Baide | Orange scorpion (?) | Jack Barlowe | |
| Cuir | Green sword | Bodhi | |
| Molvic | Blue club | Aaric | |
| Chradh | Brown scorpion | Garrick | |
| Aimsir | Brown | Lilith Sorrengail | |
| Solas | Orange dagger | Prof. Varish | one source |

## Signets (lore)
- Appear in the months after bonding; unique to rider + dragon + bond; strength scales with dragon power and bond depth; often reflects the rider's personality/needs. Overuse can burn out / kill. Mind signets can be blocked by mental shields.
- **Signets are NOT tied to dragon colour or tail type** in any readable source (the same type of dragon appears with different signets). Only the *name* of a dragon sometimes echoes the signet. => In the game, signet and dragon species are independent.
- Known (confidence varies): Xaden shadow wielding; Violet lightning (+ a second one via Andarna (?)); Dain retrocognition (touch); Rhiannon retrieval; Sawyer metallurgy; Ridoc ice wielding; Mira extending wards; Brennan/Nolon mending; Lilith storm power; Liam farsight (?); Imogen memory erasure (?); Jack Barlowe pain infliction (?); Garrick wind (?); Sloane siphoning (?); Bodhi countering (?); Kaori illusion/air (?); Caroline Ashton water (?); Cianna wind (?); Nadine ward weaving/siphoning (?); Jeremiah unweaving wards (?).

## Game implementation plan
### Species and rarity (Threshing)
Current implementation: `src/data/dragons.ts` - weighted species table + per-species acceptance, `src/systems/threshing.ts`. The weights/acceptance are **invented** (only "black/blue daggertails rarer and pickier" is a loose lore hint (?)).
Planned: base table on lore - black rare/intelligent, blue large/ruthless, red/orange temper, brown loyal, green steady; Irid ultra-rare (DREAM); feathertail hatchling for Andarna-style special bond (quest-gated).

### Signet system (MUST, Phase 4)
- On bond (and again via story events), the player receives **one signet** chosen by the player from a list or rolled by rarity; signet is independent of dragon species.
- Signet expressions map to combat shapes (see 09): lightning (bolt), fire (projectile/AoE), ice, wind/air (push, gust), shadow (cloak, tendrils), retrieval (pull item/enemy), wards (shield), mending (heal), retrocognition (see past events at a spot - puzzle/quest tool), metallurgy (manipulate metal), storm (area), farsight (reveal map/enemies), illusion.
- Costs: magicka per use; overuse -> "burnout" state (stamina/magicka locked, damage taken) rather than instant death.
- Canon characters keep their canon signets; the player's signet is original (player is not Violet).

### Bond mechanics (MUST)
- Dragon has: species, colour, tail, size, personality trait, bond level (trust), health, hunger, mood.
- Bond level unlocks: summon range, command options, combat abilities, shared stamina, flight stability.
- Dragon companion AI: follows in air/land, attacks designated targets, defends the rider, sleeps at aeries, reacts to weather.
- Mount flight: current model in `src/entities/mount.ts` (speed, boost, fire breath, tail strike). Needs: takeoff/landing, stall, turbulence, saddle UI, fatigue, altitude limits.
- Tail attacks by type (existing `TAIL_ATTACKS`): dagger pierce, sword sweep, club slam, morningstar whirl, scorpion venom, feather flick.

### Data changes to verify with the partner
1. Tairn tail type (dagger vs morningstar) and Teine tail (sword vs club) - conflicting sources.
2. Correct our `DRAGONS` list to the table above once confirmed.
3. Decide whether Irid appears at all.

### Open questions
See `99-open-questions.md`.

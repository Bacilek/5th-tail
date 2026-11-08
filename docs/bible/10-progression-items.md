# 10 - Progression, items, economy

## Progression model (Skyrim-like: use-based skills)
- Skills rise by use. Each skill levels up character XP. Perks unlocked with points at level-up.
- Level scaling: world areas have level bands; enemies scale softly (min/max) to avoid empty exploration.

### Skill list (draft)
| Group | Skills |
| --- | --- |
| Combat | One-handed, Two-handed, Archery, Block, Heavy armour, Light armour, Dodge/Acrobatics |
| Signet | Signet power (cast strength), Signet control (cost), Ward craft |
| Bond | Flight, Dragon command, Bond depth (unlocks species abilities) |
| Stealth | Sneak, Pickpocket, Lockpick |
| Support | Alchemy, Restoration (healing), Smithing, Archives lore (read runes, wards) |
| Social | Speech, Barter |

Class gives starting skill boosts: Rider (Signet, Flight), Infantry (One/Two-handed, Block, Heavy), Healer (Alchemy, Restoration), Scribe (Archives, Speech, Stealth).

## Perk trees
Each skill has ~10 perks (rank 1-3), data-driven JSON; prerequisites; examples: "Power attacks cost -25% stamina", "Signet: lightning chains to second target", "Flight: stall recovery", "Alchemy: potions last longer".

## Items
- **Categories**: weapons, armour (head/chest/hands/feet/shield), clothing (quadrant uniforms), consumables (potions, food), ingredients (herbs, venom, dragon scales - SHOULD), books/scrolls (lore + skill), keys, quest items, misc.
- **Equipment slots**: two hands, head, body, hands, feet, ring x2, amulet, cloak, broom.
- **Item data** in `src/data/items.ts`: id, name, kind, damage/armour, weight, value, tags, model id, sounds.
- **Inventory**: weight limit, favourites, sort/filter, compare stats, transfer to dragon saddlebags (SHOULD).
- **Loot**: leveled lists per container/enemy type; unique named items per quest.

## Crafting (SHOULD)
- Alchemy (herbs -> potions: health/magicka/stamina, antidotes), Smithing (forge at quadrant smithies), Cooking (DREAM), Dragon-scale armour (DREAM, lore-sensitive).

## Economy
Gold (name TBD), vendors per location with stock refresh, haggling (Speech), selling restrictions, bounties for Venin kills, wages for Riders (stipends). Prices in data tables.

## Reputation / standing
- Wing standing, quadrant standing, Navarre military rank (cadet -> ...). Unlock gear/areas/quests. See 05-factions.

## Level-up and rewards
Quest XP, discovery XP (new place), skill use. Every quest should give one of: gold, item, perk-relevant gain, access, reputation.

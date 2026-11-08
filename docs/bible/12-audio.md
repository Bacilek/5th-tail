# 12 - Audio

Current state: procedural WebAudio in `src/engine/audio.ts` (ambient music generator, NPC babble, simple SFX). Mute = N.

## Principles
- Everything routed through buses: master, music, sfx, voice, ambience; sliders in settings.
- 3D spatial audio for world sounds (PannerNode), distance attenuation, occlusion (muffled indoors) - SHOULD.
- Licensing: only own/procedural or CC0/properly licensed packs; list sources in `docs/bible/13-art-assets.md` credits.

## Music (MUST: loop per mood; SHOULD: dynamic layers)
| Mood/state | Cue |
| --- | --- |
| Menu/character creation | quiet strings + low drone |
| Basgiath exploring | slow minor-mode theme, brass undertone |
| Quadrant themes | Riders (brass + drums), Infantry (marching percussion), Healers (soft woodwinds), Scribes (piano/celesta, hush) |
| Parapet | wind + sparse sustained notes, rising tension |
| Flight | sweeping strings, tempo scales with speed |
| Combat | layered percussion that enters when enemies are alert |
| Night | sparse, cold pads |
| Story beats | custom stingers (Threshing, bond, death) |
Dynamic system: stems (base, tension, combat) cross-faded by a state machine (exploration -> alert -> combat -> aftermath).

Sources: (a) extend the procedural generator with per-state scales/tempos (cheap), (b) CC0 orchestral loops, (c) composing MIDI -> rendered samples offline (DREAM).

## SFX catalogue (checklist)
- Footsteps per surface (stone, grass, wood, snow, gravel, water), armour clank, cloth.
- Weapons: swing, hit flesh/armour/shield/wood, block, parry, bash; arrows; spell cast/charge/release per signet; ward hum.
- Dragons: wingbeat, roar (per size), growl, breath/flames, landing thud, tail whip, screech, purr (Andarna-like small dragons).
- Broom: wind rush scaling with speed.
- World: wind, rain, thunder, torch crackle, river, birds, crickets (night), bells (college), drums (drills), forge, market noise.
- UI: menu click, quest start/complete, level-up, item pickup types, map open, error.
- Cat Broccoli: meow, purr.

## Voices
- Nonsense "babble" synthesised per NPC (pitch + rhythm profile in NPC data) with subtitles - exists.
- Vocal barks (short syllable groups: greeting, anger, pain, death) per voice type - SHOULD.
- Optional TTS for key lines (DREAM; needs voice-licensing check).

## Mixing rules
- Ducking: music lowers during dialogue and loud SFX.
- Loudness targets: music -20 LUFS-equivalent, SFX -14, voices -16 (relative; tune by ear).
- Settings: separate volumes, mute, subtitles toggle.

## Technical tasks
Audio manager with buses, sound pool (avoid GC), positional emitters, event-driven API (`audio.play('hit.sword', {pos})`), loading/caching of CC0 samples, autoplay-policy handling (start on first gesture - exists).

## TTS plan (decided: Claude does it, Marek does nothing)
1. **Now:** nonsense babble + subtitles (default).
2. **SHOULD:** browser `speechSynthesis` for optional spoken lines (free; quality depends on Windows voices; English good, Czech varies).
3. **Better:** local neural TTS (e.g. Piper, offline, open-source). A script renders all key lines to audio files per character (different voice/pitch/speed), shipped with the game. Needs Marek's approval for downloading the voice models; licences to be checked. Synthetic voices are not actors; characters are distinguished by voice choice and processing (reverb, pitch). English first (default), Czech if a decent voice exists.
Voice assignment table lives in `src/data/voices.ts` (to create).

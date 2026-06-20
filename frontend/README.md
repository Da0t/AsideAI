# frontend/ — React Native / Expo

The control surface and the speakers. The phone app is where you switch
personalities and modes, build custom personalities, fire manual cues, and — most
importantly — **play the narration audio while ducking the music under it**.

## Responsibility

1. **Switch personality + mode** (writes state the backend reads via Redis).
2. **Build custom personalities** — pick a Deepgram voice + describe a character.
3. **Play audio** with an **audio manager**: voice has priority; music **ducks or
   cuts** under narration, then restores. Pre-loaded cues fire instantly.
4. **Manual cue buttons** — entrance theme, laugh track, etc.

```
backend ──(voice audio over WS)──▶ AudioManager ──▶ speakers
                                       │  ducks/cuts music under voice
user taps cue ─────────────────────▶ AudioManager ──▶ instant pre-loaded SFX
user switches persona/mode ────────▶ backend (Redis state)
```

## The audio manager (the load-bearing part)

This is the piece that makes it feel produced instead of robotic:

- **Voice always wins.** When narration arrives, music ducks (volume down) or cuts.
- **Restore** music after the line finishes.
- **Cues are pre-loaded** (from `assets/sounds/<active-personality>/`) and fire
  with **zero latency** — never generated live.
- **Only the active personality's sounds exist.** Switching personality swaps the
  cue set.

See [../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) design rules 1–3.

## Structure

```
frontend/
├── App.tsx                         # root; navigation + providers
├── app.json                        # Expo config
├── package.json
├── tsconfig.json
├── babel.config.js
└── src/
    ├── screens/
    │   ├── PersonalitySwitcherScreen.tsx   # pick personality + mode
    │   └── CustomPersonalityBuilderScreen.tsx  # voice + description
    ├── components/
    │   ├── PersonalityCard.tsx     # one selectable personality
    │   ├── ModeSwitcher.tsx        # mode toggle
    │   └── CueButtons.tsx          # entrance theme / laugh track
    ├── audio/
    │   ├── AudioManager.ts         # ducking + voice-priority (the core)
    │   └── soundCues.ts            # load active personality's pre-loaded cues
    └── api/
        └── backend.ts              # WS audio in + control messages out
```

## Setup

```bash
cd frontend
npm install
npx expo start
```

> **Scaffold only.** Screens/components/audio are TODO stubs. The audio manager
> (`src/audio/AudioManager.ts`) is the part worth getting right — see
> [../docs/BUILD_ORDER.md](../docs/BUILD_ORDER.md) step 4.

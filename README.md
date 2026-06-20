# The Narrator

> A Raspberry Pi wearable that watches a room in real time and narrates what's
> happening out loud — in a personality you can swap on the fly.

A hype man. A goth mommy who emotionally supports you. An epic quest narrator who
turns your day into a saga. Same moment, wildly different narration. Walk into a
room and your wearable announces you over entrance music; trip over a chair and
the laugh track fires. A mobile app switches personalities and modes, builds
custom ones, and plays the audio — ducking music under the voice so the narration
always wins.

---

## The Pitch

Wearables today either record you or coach you. **The Narrator does neither — it
performs your life back to you in real time.** A camera + mic clipped to your
chest perceives the room, and a swappable AI personality narrates the scene out
loud with its own voice, music, and sound effects.

The magic is *interpretation*, not transcription. The same moment —
someone walking in with coffee — becomes:

- **Hype man:** "AYO they're BACK and they brought the FUEL, let's GOOO!"
- **Goth mommy:** "Look at you, my little raven — returning with your potion of
  warmth. You're doing so beautifully today."
- **Epic quest narrator:** "Lo! The hero returns from the Bean Mines, sacred
  elixir in hand. The morning campaign may at last begin."

## Three-Component Architecture

```
┌──────────────┐        video (LiveKit)        ┌──────────────┐
│  firmware/   │ ────────────────────────────▶ │  Overshoot   │
│ Raspberry Pi │                                │  (vision)    │
│  camera+mic  │ ───── audio ─────┐             └──────┬───────┘
└──────────────┘                  │                    │ scene
                                  ▼                    ▼
                          ┌─────────────────────────────────┐
                          │            backend/             │
                          │  Overshoot scene + Deepgram STT │
                          │  + active personality (Redis)   │
                          │      → Claude Haiku (line)       │
                          │      → Deepgram TTS (voice)      │
                          │   Redis = memory + state         │
                          │   Sentry = reliability           │
                          └────────────────┬────────────────┘
                                           │ voice audio
                                           ▼
                                  ┌──────────────────┐
                                  │    frontend/     │
                                  │  React Native /  │
                                  │      Expo        │
                                  │ switch + play +  │
                                  │  duck music/SFX  │
                                  └──────────────────┘
```

- **`firmware/`** (Raspberry Pi, Python) — captures camera video + mic audio,
  publishes video to Overshoot via LiveKit, sends audio to the backend, keeps
  the stream alive.
- **`backend/`** (Python) — the central hub, running **on the Pi as the on-device
  orchestrator** (co-located with `firmware/`, not a separate server). Pulls a
  scene description from Overshoot, speech from Deepgram STT, and the active
  personality from Redis; builds a personality prompt; calls Claude Haiku for a
  short in-character line (and a music-cue decision); sends it to Deepgram TTS for
  voice audio. Holds memory + state in Redis, monitored by Sentry device-side.
- **`frontend/`** (React Native / Expo) — personality + mode switcher, custom
  personality builder, audio output with a manager that ducks/cuts music under
  narration (voice has priority), and manual cue buttons (entrance theme, laugh
  track).

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full pipeline.

## Service → Job

| Service          | Job in the system                       |
| ---------------- | --------------------------------------- |
| **Overshoot**    | Vision / eyes (scene description)       |
| **Deepgram**     | STT + TTS (ears + voice)                |
| **Claude Haiku** | Narration / brain (short in-character line) |
| **Redis**        | Memory + state (callbacks, active personality/mode) |
| **Sentry**       | Reliability (backend monitoring)        |
| **Midjourney**   | Async illustrated "journal" (off the live path) |

## Build Order (short version)

Build the live loop first, make it fast, then layer personality and polish on top.

1. **Firmware camera → Overshoot scene descriptions** — prove we can see.
2. **Full core loop** — scene → Claude → Deepgram → audio. Measure latency.
3. **Personality system** — the swappable bundles.
4. **Music/SFX + frontend** — cue buttons, ducking audio manager.
5. **Redis memory** — narration history (callbacks) + shared state.
6. **Journal (Midjourney)** — async, last, cuttable.

Full sequencing and what's cuttable: [docs/BUILD_ORDER.md](docs/BUILD_ORDER.md).

## Getting Started

```bash
cp .env.example .env   # fill in your keys
```

Then follow the README in each component:

- [firmware/README.md](firmware/README.md)
- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)

## Design Rules

These are load-bearing. Full detail in [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

1. **The live loop stays fast (~1–2s).** Narration stays SHORT — low
   `max_tokens` on Claude.
2. **Music/SFX are pre-loaded** and fire instantly from the frontend. Never
   generated live.
3. **Each personality is a bundle:** `{name, Claude system prompt, Deepgram
   voice, sound-cue set}`. Only the active personality's sounds fire.
4. **Custom personalities are first-class** — pick a voice, describe a character.
5. **Everything is free.** No payment, no paid tiers.
6. **The journal is async**, off the live loop, and built last.

> Hackathon scaffold — this repo is documentation and structure only. Every
> module is a TODO stub. See [docs/BUILD_ORDER.md](docs/BUILD_ORDER.md) to start.

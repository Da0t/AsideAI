# Build Order

Hackathon sequencing. The guiding principle: **get the live loop working and fast
first, then layer personality and polish on top.** Each step produces something
demoable. Cuttable steps are marked so you can stop early and still have a demo.

> Legend: ⭐ = core demo (do not cut) · ✂️ = cuttable if time runs out

---

## 1. Firmware camera → laptop → Claude vision ⭐

**Goal:** prove the system can *see*.

- Firmware (Pi, QNX, C++): capture a camera frame via **QSF** and send it to the
  laptop backend over the **LAN** (TCP). No streaming, no LiveKit, no keepalive.
  Fastest start: fork [`qnx/projects/ai-camera-app`](https://gitlab.com/qnx/projects/ai-camera-app).
- Backend (laptop, Python): receive the frame, send it to Claude Haiku 4.5 as
  **image input**, and print the scene it describes. (This same call later returns
  the in-character line — eyes and brain are one request.)

**Done when:** you can point the camera at a room and the laptop prints a text
description of what's happening. (Confirms QSF capture + LAN transport + Claude
vision in one shot.)

**Cut line:** none — this is the foundation.

---

## 2. Full core loop: frame → Claude → Deepgram → audio ⭐

**Goal:** the end-to-end magic, in one neutral voice. No personalities yet.

- Backend orchestration (laptop): camera frame (from the Pi over the LAN) → Claude
  Haiku (vision → short line) → Deepgram TTS (voice audio) → play it.
- Add mic → Deepgram STT so speech in the room can feed the line too.
- **Measure latency.** Time each hop. This is the moment to find out if you're at
  1–2s or 6s. Tighten before adding anything else: shrink payloads, lower
  `max_tokens`, drop unnecessary round-trips.

**Done when:** you point the camera, and a few seconds later you hear a spoken
narration of the scene.

**Cut line:** none — if you only have this, you still have a demo.

---

## 3. Personality system ⭐

**Goal:** the same moment, narrated three ways.

- Define the personality **bundle** (`{name, system prompt, voice, sound cues}`).
- Implement the three built-ins in `personalities/` (hype man, goth mommy, epic
  quest narrator).
- `prompt_builder` combines the active personality's system prompt + scene +
  speech.
- Switch which voice Deepgram uses per personality.

**Done when:** you can change personality and the narration's *character* and
*voice* both change for the same scene.

**Cut line:** the custom-personality builder (step 3b) is ✂️ — three built-ins is
a great demo on its own.

### 3b. Custom personality builder ✂️

Let users pick a voice + describe a character to mint a new bundle. Nice to have;
cut first if time is short.

---

## 4. Music/SFX + frontend ⭐ (frontend ⭐, polish ✂️)

**Goal:** make it a *performance*, not just a voice.

- Frontend: personality + mode switcher UI.
- **Audio manager** — the important part: voice has priority; music **ducks or
  cuts** under narration, then restores. Pre-loaded cues fire instantly.
- Manual cue buttons: entrance theme, laugh track.
- Per-personality sound sets (`assets/sounds/<slug>/`); only the active
  personality's sounds fire.

**Done when:** switching personality switches the music vibe, narration ducks the
music automatically, and you can fire an entrance theme / laugh track by hand.

**Cut line:** the switcher + audio ducking are ⭐. Fancy per-event auto-reactions
(auto entrance music on detected entrance) are ✂️ — manual cue buttons cover the
demo.

---

## 5. Redis memory ⭐ (callbacks ✂️)

**Goal:** continuity and shared state.

- Redis as the source of truth for **active personality + mode** (shared between
  backend and frontend). *This part is effectively required by step 3/4 and is ⭐.*
- Narration **history** for **callbacks** — Claude can reference an earlier line
  ("as predicted, the coffee returns"). This richer memory use is ✂️.

**Done when:** the active personality persists/syncs via Redis, and (stretch)
narration occasionally calls back to something earlier.

**Cut line:** state storage ⭐; callback memory ✂️.

---

## 6. TFLite event triggers (on-device) ✂️

**Goal:** auto-fire cues from what the camera sees — no button press.

- Firmware (Pi, QNX, C++): run **TensorFlow Lite via QSF** on-device to detect
  events — person enters frame, waves, falls — and signal the laptop backend over
  the LAN: "narrate now" + "fire the entrance cue". Fork
  [`qnx/projects/ai-camera-app`](https://gitlab.com/qnx/projects/ai-camera-app)
  (QSF + TFLite on QNX SDP 8.0 / Pi 4) and swap its face-detection model for a
  person/pose/gesture `.tflite`.
- Backend/frontend: the event routes through the laptop backend to the frontend,
  which fires the pre-loaded cue instantly (same path as a manual button).

**Done when:** walking into frame auto-plays the entrance theme and prompts a line.

**Cut line:** the whole step is ✂️. TFLite is only the *trigger*, not the eyes
(Claude vision does the seeing). **TFLite via QSF is the QNX-native path** (this is
why MediaPipe — Linux/Android/iOS only — was dropped). If the model work runs long,
fall back to OpenCV motion detection or just keep the manual cue buttons.

---

## 7. Journal (Midjourney) ✂️

**Goal:** an illustrated souvenir of the session.

- **Async, off the live loop.** Read narration history from Redis after the fact,
  generate illustrated panels with Midjourney.
- Built **last**. Fully cuttable — it touches the hot path zero times, so it can
  be added or dropped without risk.

**Done when:** you can generate an illustrated "journal" of a past session.

**Cut line:** the whole thing is ✂️.

---

## Cross-cutting: Sentry

Wire **Sentry** into the laptop backend early (cheap to add, instrument as you
build step 2). It monitors the orchestrator — reliability insurance for demo day,
not a feature — don't let it block the live loop.

---

## Summary Table

| # | Step                                  | Priority | Cuttable?            |
| - | ------------------------------------- | -------- | -------------------- |
| 1 | Firmware camera → Claude vision       | ⭐ core   | no                   |
| 2 | Core loop: frame → Claude → TTS → audio | ⭐ core | no                   |
| 3 | Personality system (3 built-ins)      | ⭐ core   | no                   |
| 3b| Custom personality builder            | nice     | ✂️ yes               |
| 4 | Music/SFX + frontend switcher + ducking | ⭐ core | switcher+duck no; auto-reactions ✂️ |
| 5 | Redis state                           | ⭐ core   | state no; callbacks ✂️ |
| 6 | TFLite event triggers on the Pi (auto-cues) | nice | ✂️ yes (fork ai-camera-app) |
| 7 | Journal (Midjourney)                  | nice     | ✂️ yes (build last)  |

**If you build nothing else, build steps 1 + 2 + 3.** That's the pitch:
*same moment, different narration, out loud.*

# Tech Stack — How "Aside" Works

This is the plain-English story of what we built, how it evolved, and the tools
behind it. If you read nothing else: **a Raspberry Pi running QNX is the eyes, a
laptop is the brain, and your phone is the voice.**

---

## What the product does

You clip a camera + mic to your chest. It watches the room and **narrates your
life out loud in a personality you can swap** — a hype man, a doting "goth mommy,"
or an epic-quest narrator. Walk into a room and it announces you; the same moment
sounds completely different depending on the personality.

---

## The journey: from "Pi + QNX" to today

We started with one idea — *a Raspberry Pi running QNX that sees and narrates* —
and hit real-world walls. Here's how the design changed at each wall:

| # | The wall we hit | What we switched to | Why |
|---|-----------------|---------------------|-----|
| 1 | **Overshoot.ai** was going to be the "eyes" (scene understanding) — it didn't pan out | **Claude Haiku 4.5 vision** | We send the camera photo straight to Claude. One API call returns the narration — Claude is **both the eyes and the brain**. Fewer moving parts. |
| 2 | **MediaPipe** (for detecting "a person walked in") **doesn't build on QNX** | A cheap **motion-detector on the laptop** (and TensorFlow Lite on the Pi as the future native path) | We don't need fancy on-device ML to know "something changed." A simple image-difference check does it for free. |
| 3 | Running the whole AI **on the Pi (or a Jetson)** was painful — QNX + Python + cloud SDKs fight each other | **Split it up:** the Pi only *captures*, a **laptop** runs the AI and calls the cloud | Best of both worlds — QNX-native camera capture, plus a laptop that talks to the cloud easily. They talk over Wi-Fi. |
| 4 | Writing the camera capture in **C++ with QNX's framework** was slow to get going | A small **Python sender** that uses QNX's built-in camera tools | It grabs a photo using QNX's `viewfinder` + `screenshot`, compresses it to JPEG, and ships it. The C++ version stays as the "do it properly later" path. |
| 5 | Narrating **on a timer** made it talk constantly (annoying + expensive) | **Narrate only when the scene changes** ("change-gated") | A cheap motion check runs 5×/second; the expensive Claude call only fires when something actually happens. |
| 6 | The Pi camera added a **green/"fluorescent" tint**, so it kept describing the lighting | **Auto white-balance** the image before Claude sees it | The photo gets color-corrected on the laptop, so narration describes the real scene, not the camera's tint. |

---

## System design (the big picture)

```
   RASPBERRY PI (QNX)              LAPTOP (Python "brain")              PHONE (Expo app)
   ─────────────────              ───────────────────────              ────────────────
   📷 camera                       🧠 Claude Haiku 4.5  (eyes+brain)     📱 AI Vision screen
      → JPEG photo   ──TCP────▶       photo → 1 short line               (live camera feed)
      (viewfinder +    :8765       👂 Deepgram STT (hears speech)         📝 narration text
       screenshot)                 🎨 auto white-balance + motion-gate    🔊 plays the voice
   pi_frame_sender.py              🗣  Deepgram TTS (makes the voice) ──WS─▶ 🎭 personality
                                   🧠 Redis (memory + which personality)   :8780   switcher
   🎙 Blue Snowball mic ───────────▶ (mic plugs into the laptop today)
                                          │   ▲
                                   calls  ▼   │   over the internet
                                   ☁  Anthropic Claude   +   Deepgram
```

**Read it left-to-right:** the Pi takes photos and sends them to the laptop. The
laptop asks Claude "what's happening here?" in the chosen personality, turns the
answer into speech with Deepgram, and sends the text + voice to your phone. The
mic (a Blue Snowball) is on the laptop and feeds what it hears into the same loop.

**Three connections:**
- **Pi → Laptop:** a simple TCP stream of JPEG photos (port `8765`).
- **Laptop → Phone:** a WebSocket carrying narration text + voice (port `8780`).
- **Laptop → Cloud:** HTTPS calls to Claude and Deepgram.

---

## Languages we used

| Language | Where | What it does |
|----------|-------|--------------|
| **Python** | Laptop backend **and** the Pi camera sender | The brain (AI orchestration) and the photo-capture script |
| **TypeScript / React Native (Expo)** | Phone app | The UI — personality switcher, live feed, plays the voice |
| **C++** | Pi firmware (native path) | The "proper" QNX camera capture (Python sender is the working stand-in) |
| **Bash** | Startup | `start.sh` launches everything with one command |

---

## Software & services

### On the Raspberry Pi (QNX)
- **QNX** — the real-time operating system the Pi runs.
- **QNX camera tools** (`camera_example_viewfinder`, `screenshot`) — grab a photo from the Pi Camera.
- **libjpeg-turbo (`cjpeg`)** — compress the photo to JPEG before sending.
- **`pi_frame_sender.py`** — our Python script that captures + streams the photos.

### On the laptop (the brain)
- **Claude Haiku 4.5** (Anthropic) — looks at the photo and writes the narration. Eyes **and** brain in one call.
- **Deepgram** — **STT** (turns mic audio into text) + **TTS** (turns the narration into a voice).
- **Redis** — remembers recent lines (so it can call back to them) and stores which personality/mode is active.
- **OpenCV / Pillow / NumPy** — the cheap motion-detector and the auto white-balance color fix.
- **WebSockets** — the live link to the phone.
- Mostly **Python standard library**, so it runs with very few installs.

### On the phone
- **React Native + Expo** — the cross-platform app framework.
- **expo-av** — plays the narration audio and ducks background music under the voice.
- **Expo Go** — the app you scan the QR with to run it on your phone.

### Cloud
- **Anthropic Claude** (vision + narration) · **Deepgram** (speech-to-text + text-to-speech).

---

## Why this design is good

- **Fast:** the photo → narration → voice loop runs in ~1–2 seconds.
- **Cheap & quiet:** it only "thinks" (calls Claude) when the scene actually changes.
- **Modular:** swap a personality by changing one value in Redis — no restart.
- **Resilient:** the Pi auto-reconnects if Wi-Fi blips; the laptop keeps working if a service is down.
- **Honest about the camera:** color-correction means it narrates the real world, not the lens.

---

## One-command startup

```bash
./start.sh --no-webcam      # starts the laptop brain + the phone app
```
Then start the camera sender on the Pi and scan the QR on your phone. Full
step-by-step is in the main [README](README.md) → *Running It End-to-End*.

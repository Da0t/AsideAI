# Deploy & Run

How to run The Narrator — talk to it on a laptop **today**, then the near-turnkey
Pi flow once the firmware is built.

The laptop runs the orchestrator (Claude vision + Deepgram + playback). The Pi
streams the camera (and, optionally, audio). The two talk over the LAN.

---

## A. Talk to it on the laptop (no Pi needed)

Plug the **Blue Yeti Snowball into the laptop** (it's auto-selected if present).

```bash
cp .env.example .env          # add ANTHROPIC_API_KEY + DEEPGRAM_API_KEY
python3 -m pip install sounddevice certifi   # mic + TLS certs (one-time)

# Push-to-talk: press Enter, speak, it talks back out loud
python -m backend.main --talk
python -m backend.main --talk --image room.jpg          # also give it eyes
python -m backend.main --talk --personality goth-mommy  # pick a character

# Just hear it narrate an image (no mic):
python -m backend.main --mock --image room.jpg --play

# Watch it narrate the laptop WEBCAM live, out loud — stand-in for the Pi camera
python3 -m pip install opencv-python
python -m backend.main --webcam
python -m backend.main --webcam --personality hype-man --interval 4
```

That's the full magic loop — mic → Deepgram STT → Claude vision → Deepgram TTS →
out your speakers — with zero hardware beyond the mic. `--webcam` is the live-video
stand-in until the Pi camera is wired (first run asks for camera permission).

---

## B. Run with the Pi (near-turnkey)

The one unavoidable step is a **one-time firmware build on QNX** — it can't be
cross-built/tested without the board + SDP toolchain. After that it's
"copy binary, point at the laptop, run."

### 1. Laptop (the orchestrator) — start it and leave it running

```bash
ipconfig getifaddr en0        # the laptop's LAN IP, e.g. 192.168.1.50
python -m backend.main --serve --play
```

It binds `FIRMWARE_LISTEN` (default `0.0.0.0:8765`) and waits. Until the Pi
connects it falls back to a webcam/placeholder frame, so you can sanity-check it
first. `--play` makes it speak out loud; drop it if the phone handles audio.

### 2. Pi firmware (one-time build, then deploy)

Build on the QNX Pi (or cross-compile with the SDP). **Fork
[`qnx/projects/ai-camera-app`](https://gitlab.com/qnx/projects/ai-camera-app)**
for the QSF camera + TFLite parts, then add this repo's
[`firmware/src/net_client.cpp`](../firmware/src/net_client.cpp) to ship frames.

```bash
source <QNX_SDP_8.0>/qnxsdp-env.sh        # puts qcc/q++ on PATH
cd firmware && make                        # see firmware/Makefile + README
# point it at the laptop:
export BACKEND_HOST=192.168.1.50 BACKEND_PORT=8765
scp the-narrator-firmware  qnxuser@<pi-ip>:/tmp/
```

### 3. Run on the Pi

```bash
ssh qnxuser@<pi-ip>
BACKEND_HOST=192.168.1.50 BACKEND_PORT=8765 /tmp/the-narrator-firmware
```

The Pi connects over the LAN → frames flow → the laptop narrates out loud. The
phone (when built) connects to the laptop's WebSocket to switch personalities and
play audio with music ducking.

---

## What to verify on the Pi (the real unknowns)

1. **Camera over QSF** builds and delivers frames on your Pi image (the
   `ai-camera-app` combo: Pi 4 + QNX SDP 8.0 + Pi Camera Module 3). This is the
   one thing only the hardware can confirm.
2. **Audio source.** Simplest: keep the **Snowball on the laptop** (above) — then
   the Pi only streams the camera and you avoid QNX USB-audio entirely. If you
   instead put the Snowball on the **Pi**, confirm QNX recognizes it as a USB
   audio device before relying on it; the firmware's `mic_capture.cpp` +
   `net_send_audio` path is ready, but USB-audio-class support on the Quick Start
   image is unverified.
3. **TFLite triggers** (auto-cues) are cuttable — get camera → narration working
   first; add `event_detector.cpp` later.

---

## Latency

The live loop currently measures ~1.3–3.6s/line (Claude ~1.2–1.8s, TTS varies).
Levers if you need to hit ~1–2s: lower `CLAUDE_MAX_TOKENS`, smaller `FRAME_MAX_DIM`,
and overlap TTS with the next capture. Times print on every cycle.

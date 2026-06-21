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

  Added User Pearsons
  Comp anaylsis
  Simple Problem Statment with solution
  AI integratiton slide deck with images or not a lot of words
  

## Three-Component Architecture

```
┌────────────────────────────┐   frame ─┐  audio ─┐  TFLite events ─┐
│ firmware/  Raspberry Pi     │          │         │  (entrance/wave/ │
│ (QNX, C++)                  │          │         │   fall → cue)    │
│ QSF camera + mic + TFLite   │          ▼         ▼                 ▼
└────────────────────────────┘   ════════ LAN (Wi-Fi) ════════════════
                          ┌─────────────────────────────────────────┐
                          │        backend/  (laptop, Python)        │
                          │  frame → Claude Haiku (vision = eyes +   │
                          │      brain, one call → SHORT line)       │
                          │  + Deepgram STT + active personality     │
                          │      (Redis) → Deepgram TTS (voice)      │
                          │   Redis = memory + state                 │
                          │   Sentry = reliability                   │
                          └────────────────┬────────────────────────┘
                                  voice audio │ + cue signals
                                           ▼
                                  ┌──────────────────┐
                                  │    frontend/     │
                                  │  React Native /  │
                                  │      Expo        │
                                  │ switch + play +  │
                                  │  duck music/SFX  │
                                  └──────────────────┘
```

**Deployment:** the Pi (QNX, C++) captures + runs on-device triggers; a **laptop**
(Python) runs the orchestrator and calls the cloud. They talk over the LAN.

- **`firmware/`** (Raspberry Pi, **QNX, C++**) — captures camera frames via **QSF**
  + mic audio, runs **TensorFlow Lite** on-device for fast event detection
  (entrance, wave, fall), and ships frames / audio / event signals to the laptop
  backend **over the LAN**.
- **`backend/`** (Python, on a **laptop** on the same LAN) — the orchestrator.
  Sends the camera **frame directly to Claude Haiku 4.5 (vision)** — one call
  returns the in-character line, so Claude is both eyes and brain. Pulls speech
  from Deepgram STT and the active personality from Redis, builds the prompt, and
  sends the line to Deepgram TTS for voice audio. Holds memory + state in Redis,
  monitored by Sentry. (Running the orchestrator on the laptop keeps the cloud
  SDKs off QNX.)
- **`frontend/`** (React Native / Expo) — personality + mode switcher, custom
  personality builder, audio output with a manager that ducks/cuts music under
  narration (voice has priority), and manual cue buttons (entrance theme, laugh
  track).

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full pipeline.

## Service → Job

| Service / piece  | Job in the system                       |
| ---------------- | --------------------------------------- |
| **Claude Haiku** | Vision **+** narration — eyes + brain (frame + prompt → short in-character line, one call) |
| **Deepgram**     | STT + TTS (ears + voice)                |
| **TFLite / QSF** | On-device event triggers (entrance/wave/fall → instant cues) — runs on the Pi (QNX) |
| **Redis**        | Memory + state (callbacks, active personality/mode) — on the laptop |
| **Sentry**       | Reliability (monitors the laptop orchestrator) |
| **Midjourney**   | Async illustrated "journal" (off the live path) |

> **Overshoot** was the original "eyes" but is no longer used — Claude vision
> replaced it and folded scene understanding into the same call as the narration.
> **MediaPipe** was the planned on-device trigger but doesn't build on QNX —
> **TensorFlow Lite via QSF** replaced it (proven by QNX's `ai-camera-app`).

## Build Order (short version)

Build the live loop first, make it fast, then layer personality and polish on top.

1. **Firmware camera → laptop → Claude vision** — Pi sends a frame over the LAN;
   laptop sends it to Claude Haiku → a text scene. Prove we can see.
2. **Full core loop** — frame → laptop → Claude (line) → Deepgram → audio. Measure
   latency.
3. **Personality system** — the swappable bundles.
4. **Music/SFX + frontend** — cue buttons, ducking audio manager.
5. **Redis memory** — narration history (callbacks) + shared state.
6. **TFLite triggers** — on-device event detection on the Pi → auto-fire cues
   (cuttable; fork QNX's `ai-camera-app`).
7. **Journal (Midjourney)** — async, last, cuttable.

Full sequencing and what's cuttable: [docs/BUILD_ORDER.md](docs/BUILD_ORDER.md).

## Getting Started

```bash
cp .env.example .env   # fill in your keys
```

Then follow the README in each component:

- [firmware/README.md](firmware/README.md)
- [backend/README.md](backend/README.md)
- [frontend/README.md](frontend/README.md)

## Running It End-to-End (live demo)

The working laptop + phone + Pi demo. All three devices must be on the **same
Wi-Fi** — a phone hotspot is most reliable (campus/corporate Wi-Fi often blocks
device-to-device traffic and may not let the Pi join).

**One-time setup**

- **Laptop:** `cp .env.example .env` and fill in `ANTHROPIC_API_KEY`,
  `DEEPGRAM_API_KEY`, and `REDIS_URL` (`redis://localhost:6379`). Then
  `brew install redis && brew services start redis` and
  `pip install opencv-python sounddevice certifi websockets redis pillow`.
- **Frontend:** `cd frontend && npm install`.
- **Pi (QNX):** copy `firmware/pi_frame_sender.py` onto the Pi and
  `sudo apk add libjpeg-turbo-utils` (provides `cjpeg`).

**Each run**

1. **Get the laptop's LAN IP** — everything points at this:
   ```bash
   ipconfig getifaddr en0          # e.g. 172.20.10.14  → use as <laptop-ip>
   ```
2. **Laptop — backend + app** (one command):
   ```bash
   ./start.sh --no-webcam          # Pi-only camera; drop --no-webcam to fall back to the laptop cam
   ```
   Runs the backend (logs → `backend.log`) and Expo (prints a QR). Add `--play`
   to also hear narration on the laptop (otherwise the phone is the speaker).
3. **Pi — camera sender** (SSH in, then run):
   ```bash
   ssh -m hmac-sha2-256 qnxuser@qnxpi20.local              # password: qnxuser
   sudo python3 pi_frame_sender.py --host <laptop-ip> --port 8765 --interval 0.5
   ```
   Expect `[net] connected` then `[frame N] … JPEG` scrolling.
4. **Phone — connect:** scan the Expo QR (or open `exp://<laptop-ip>:8081` in
   Expo Go), on the same Wi-Fi. The **AI Vision** screen shows the live Pi feed;
   narration plays as voice.
5. **Verify** (laptop): `tail -f backend.log` → look for
   `📷 receiving camera frames from Pi`, lines tagged `cam=pi`, and `🎤 [mic] heard:`.

**Switch personality live** (or tap it on the phone's home screen):
```bash
redis-cli set narrator:personality hype-man     # or goth-mommy, epic-quest-narrator
```

**Ports:** `8765` Pi → backend · `8780` backend → phone (WebSocket) · `8081` Expo.

**Troubleshooting**

- *Vision screen stuck on "No Signal", or it's narrating the laptop cam:* the Pi
  sender isn't reaching the laptop — check the Pi terminal for
  `connection failed, retrying` (wrong `--host`), and that both are on the same Wi-Fi.
- *`ssh` "host key changed"* after a Pi reboot: `ssh-keygen -R qnxpi20.local`, retry.
- *No audio on the phone:* the laptop mic (`--mic`, on by default) feeds STT and the
  voice plays on the phone; add `--play` to also hear it on the laptop.

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

> Status: the backend + phone app + Pi frame sender run **end-to-end today** (see
> [Running It End-to-End](#running-it-end-to-end-live-demo)). The QNX C++ firmware
> and the Midjourney journal remain TODO stubs — see
> [docs/BUILD_ORDER.md](docs/BUILD_ORDER.md).






More in detail setup

Here's the full picture — laptop side is 100% up, and the Pi is back on the network. Two things just haven't connected to it yet:

Component	Status
Laptop on hotspot	✅ 172.20.10.14
Backend running	✅ pid 15322, listening on :8765 (Pi) + :8780 (phone)
Expo dev server	✅ listening on :8081
Pi back on network	✅ qnxpi20.local → 172.20.10.12, pings (rebooted cleanly)
Pi sender → backend	⬜ not connected — sender not started yet
Phone → backend WS	⬜ not connected — app not loaded yet
So nothing's broken — you just need to start the two clients now that the Pi is back:

1. On the Pi (it rebooted, so start fresh):


sudo python3 pi_frame_sender.py --host 172.20.10.14 --port 8765 --interval 0.5
2. On the phone: scan the QR from earlier (exp://172.20.10.14:8081) in Expo Go.

Once you've done those, tell me and I'll re-run this check — you should see both sessions go ESTABLISHED, plus 📷 receiving camera frames from Pi and cam=pi in backend.log. Want me to re-check now, or after you start the sender?

For both give me the steps for the pi sender backend i think we need to ssh into it I am not too sure


then after we have that I think we get a terminal output right? like before

and then we can do the phone setup
Show less
Yes — SSH into the Pi, run the sender (you'll get the per-frame terminal output like before), then the phone. The backend + Expo are already running under my session, so your terminal is free for this. Here are the exact steps:

A. SSH into the Pi (in a laptop terminal)

ssh -m hmac-sha2-256 qnxuser@qnxpi20.local
Password: type qnxuser (the cursor won't move as you type — that's normal), Enter.
If it asks "Are you sure you want to continue connecting?" → type yes.
Ignore the post-quantum warning — harmless.
You're in when the prompt changes to the Pi (something like qnxuser@qnxpi20).

B. Start the sender (now on the Pi)

ls pi_frame_sender.py
sudo python3 pi_frame_sender.py --host 172.20.10.14 --port 8765 --interval 0.5
If ls shows nothing, find it: find / -name pi_frame_sender.py 2>/dev/null and cd to that folder.
sudo may ask for the password again → qnxuser.
You'll get the terminal output like before — watch for these two lines:


[net] connected to backend at 172.20.10.14:8765
[frame 1]  24,512 B JPEG  capture+send=180ms
[frame 2]  ...
Leave this terminal open — the sender runs here.





atch the narration live (check it's working)
￼
tail -f /Users/datnguyen/Desktop/PROJECTS/AsideAI/backend.log
You'll see → … (cam=pi) lines and 🎤 [mic] heard: lines. Move in front of the camera to trigger new lines (it waits for the scene to change). Ctrl-C stops watching (backend keeps running).

Switch personality (test each one)
Run in another terminal — takes effect on the next line, no restart:

￼
redis-cli set narrator:personality hype-man
redis-cli set narrator:personality goth-mommy
redis-cli set narrator:personality epic-quest-narrator
Watch the tail window — the character and the voice change. (Currently on epic-quest-narrator.)

Small note: I see two Pi sessions connected — you may have started the sender twice. Harmless (both just send frames), but if you want it clean, Ctrl-C one of them.

Run the tail and try switching to hype-man — you should see the tone flip immediately. Tell me how it looks and whether the AWB color fix is holding (natural descriptions, no "fluorescent")


C. Then the phone
Scan the QR from earlier (exp://172.20.10.14:8081) in Expo Go.

Order: A → B → (tell me) → C. Once you see [net] connected + [frame …] scrolling on the Pi, tell me and I'll verify from the laptop side — you should see 📷 receiving camera frames from Pi and cam=pi in backend.log, and the session go ESTABLISHED. Then we do the phone.

If SSH throws a "host key changed" error (the Pi rebooted), run ssh-keygen -R qnxpi20.local on the laptop and retry. Go for it — I'll check the moment the sender's up.

it is just taking a bunch of jpeg why?
That's exactly right — that's the sender working, not an error. The Pi sender's whole job is to capture JPEG frames (the camera's point of view) and stream them to the laptop. Each [frame N] … JPEG line = one picture shipped to the backend. The narration happens on the laptop (backend → Claude → voice), not on the Pi — the Pi just sends pictures.

Let me confirm those JPEGs are actually landing on the backend and getting narrated:

Bash Verify Pi frames are reaching the backend and being narrated
IN
cd /Users/datnguyen/Desktop/PROJECTS/AsideAI
echo "=== Pi session ESTABLISHED on :8765? ==="
netstat -anp tcp 2>/dev/null | grep "\.8765 " | grep ESTABLISHED || echo "  NOT connected — frames aren't reaching the backend"
echo
echo "=== backend.log: receiving Pi frames + narrating? ==="
grep -iE "receiving camera frames from Pi|cam=pi|cam=local|no usable view|firmware connected|firmware disconnected" backend.log 2>/dev/null | tail -12
echo
echo "=== latest narration lines (any source) ==="
grep -E "→" backend.log 2>/dev/null | tail -5

OUT
=== Pi session ESTABLISHED on :8765? ===
tcp4       0      0  172.20.10.14.8765      172.20.10.12.11720     ESTABLISHED

=== backend.log: receiving Pi frames + narrating? ===
2026-06-21 03:15:11,505 narrator: [serve] no usable view (camera dark/blank) — waiting for a real frame
2026-06-21 03:22:56,935 narrator: firmware connected: ('172.20.10.12', 11720)
2026-06-21 03:22:57,290 narrator: 📷 receiving camera frames from Pi ('172.20.10.12', 11720) — using the Pi camera
2026-06-21 03:23:00,812 narrator: goth-mommy → Sterile fluorescent boxes staring down at you again while someone fumbles with equipment—my boy's trapped in the architecture of other people's problems. (2185ms · first · cam=pi)
2026-06-21 03:23:15,757 narrator: goth-mommy → Someone's wrestling with a stubborn case while you float above it all, detached and safe in your own little nowhere, baby. (5229ms · change · cam=pi)
2026-06-21 03:23:27,426 narrator: goth-mommy → Bright geometry's got you mesmerized again, doesn't it—my boy and his love affair with fluorescent grids. (2010ms · change · cam=pi)

=== latest narration lines (any source) ===
2026-06-21 03:23:00,812 narrator: goth-mommy → Sterile fluorescent boxes staring down at you again while someone fumbles with equipment—my boy's trapped in the architecture of other people's problems. (2185ms · first · cam=pi)
2026-06-21 03:23:15,757 narrator: goth-mommy → Someone's wrestling with a stubborn case while you float above it all, detached and safe in your own little nowhere, baby. (5229ms · change · cam=pi)
2026-06-21 03:23:27,426 narrator: goth-mommy → Bright geometry's got you mesmerized again, doesn't it—my boy and his love affair with fluorescent grids. (2010ms · change · cam=pi)
It's fully working — that "bunch of jpeg" is the proof. Look what's happening on the laptop side:

✅ Pi connected: session ESTABLISHED 172.20.10.14:8765 ↔ 172.20.10.12
✅ Frames landing: 📷 receiving camera frames from Pi — using the Pi camera
✅ Narrating the Pi's view, tagged cam=pi, in goth-mommy character:
"Sterile fluorescent boxes staring down at you again while someone fumbles with equipment—my boy's trapped in the architecture of other people's problems." (first · cam=pi)
"Someone's wrestling with a stubborn case while you float above it all… baby." (change · cam=pi)
"Bright geometry's got you mesmerized again… my boy and his love affair with fluorescent grids." (change · cam=pi)

So the Pi sending JPEGs = correct. The laptop is turning each one into narration. The change-gate is working too (first to establish, then change when the scene moved).

One thing: I started the backend without --play, so it's not speaking on the laptop — the voice is being sent to the phone. That's why it looks silent. Connect the phone and it comes alive:

Final step — the phone
Scan the QR from earlier (exp://172.20.10.14:8081) in Expo Go. Then:

AI Vision screen → live Pi camera feed + the perception trace,
you'll hear the goth-mommy voice play, and see each line land.
Scan it and tell me — I'll confirm the phone's WebSocket session connects. You're basically there. 🎉

quick question my friend had the output running in the terminal ?? for us all I am seeing is the frame and it saying caoptuyre+=send how do i get the output as well?
Ah, I see the confusion — those are two different outputs on two different machines:

Pi terminal (where you SSH'd): shows the sender — [frame N] … capture+send=…ms. That's just "I shipped a picture." ✅ (what you're seeing)
The narration output (the goth-mommy lines) is generated on the laptop, not the Pi. Your friend saw it because the backend was running in their terminal. I started it in the background, logging to a file — so right now it's flowing into backend.log, not a visible terminal.
To watch the narration live like your friend did, open a laptop terminal and run:


tail -f /Users/datnguyen/Desktop/PROJECTS/AsideAI/backend.log
That streams the narration as it happens — goth-mommy → … (cam=pi), the 🎤 heard: lines, etc. Ctrl-C stops the viewing (not the backend).

Here's a peek at what's scrolling there right now:

Bash Show latest backend narration output
IN
cd /Users/datnguyen/Desktop/PROJECTS/AsideAI
tail -n 12 backend.log

OUT
2026-06-21 03:24:33,190 narrator: [serve] view restored
2026-06-21 03:24:34,046 narrator: 🎤 [mic] no speech  (4.0s in buffer)
2026-06-21 03:24:43,844 narrator: 🎤 [mic] heard: "I'll final set the phone. You are good."  (4.0s in buffer)
2026-06-21 03:24:54,295 narrator: 🎤 [mic] heard: 'My friend.'  (4.0s in buffer)
2026-06-21 03:25:05,092 narrator: 🎤 [mic] no speech  (4.0s in buffer)
2026-06-21 03:25:15,680 narrator: 🎤 [mic] no speech  (4.0s in buffer)
2026-06-21 03:25:23,480 narrator: 🎤 [mic] heard: "I think we're good. Okay."  (4.0s in buffer)
2026-06-21 03:25:25,279 narrator: goth-mommy → Mmm, they're satisfied now—you can breathe, my love, the machinery's finally quiet. (1796ms · change · cam=pi)
2026-06-21 03:25:31,937 narrator: 🎤 [mic] no speech  (4.0s in buffer)
2026-06-21 03:25:33,801 narrator: 🎤 [mic] heard: 'Is it work?'  (4.0s in buffer)
2026-06-21 03:25:35,893 narrator: 🎤 [mic] heard: 'Does it work? It should.'  (4.0s in buffer)
2026-06-21 03:25:37,583 narrator: 🎤 [mic] heard: 'It should unless something horrible happened.'  (4.0s in buffer)
And look — it's all live in there: the laptop mic is hearing your room (🎤 [mic] heard: 'Does it work? It should.') and goth-mommy is narrating the Pi camera in character:

"Mmm, they're satisfied now—you can breathe, my love, the machinery's finally quiet." (change · cam=pi)

So the full stack is running: Pi frames + laptop mic audio + Claude → goth-mommy narration. That's the output your friend saw — just run tail -f backend.log in a laptop terminal to watch it scroll live.

Last thing to light up: you'll hear the voice once the phone connects (it's the speaker). Scan exp://172.20.10.14:8081 in Expo Go and you're 100% there.

okay the mic output works how do we use the perosnaltites we did for the other terminal? it might be gone but like the agents/persontalties we have, I think the hero or goth mommy?
You don't lose the personalities — they're always there (hype-man, goth-mommy, epic-quest-narrator). The normal way to switch is on the phone (the home screen taps between them and sends it to the backend live). But since the phone isn't connected yet, you can switch them right now from the laptop. Let me check exactly how the active personality is stored so I give you the right command:

Read redis_client.py
The active personality lives in Redis (narrator:personality), and the running backend re-reads it every narration line — so you can switch it live, no restart. Let me confirm what's available and the current one:

Bash List personality slugs and current active one
IN
cd /Users/datnguyen/Desktop/PROJECTS/AsideAI
echo "=== available personalities (slug + voice) ==="
for f in personalities/*.json; do
  python -c "import json,sys; d=json.load(open('$f')); print(f\"  {d['slug']:<22} {d.get('name','')}  · voice={d.get('deepgram_voice','')}\")"
done
echo
echo "=== current active personality / mode (live in Redis) ==="
redis-cli get narrator:personality
redis-cli get narrator:mode

OUT
=== available personalities (slug + voice) ===
  todo-kebab-case-slug   TODO: Human-readable name shown in the app switcher  · voice=TODO: Deepgram TTS voice id that fits the character
  epic-quest-narrator    Epic Quest Narrator  · voice=aura-zeus-en
  goth-mommy             Goth Mommy  · voice=aura-luna-en
  hype-man               Hype Man  · voice=aura-orion-en

=== current active personality / mode (live in Redis) ===
goth-mommy
chatty
There they are — you've got 3 personalities (the todo-kebab-case-slug one is just an unfilled template, ignore it):

Personality	Slug	Voice
Hype Man ("the hero")	hype-man	aura-orion-en
Goth Mommy ← active now	goth-mommy	aura-luna-en
Epic Quest Narrator	epic-quest-narrator	aura-zeus-en
To switch live (takes effect on the very next narration line — no restart, the backend re-reads it every cycle), run on the laptop:


redis-cli set narrator:personality hype-man
Swap hype-man for goth-mommy or epic-quest-narrator. You'll see the character and the voice change on the next line in backend.log.

The real UX is the phone, though — the app's home screen taps between them and sends it to the backend instantly (same mechanism). Once Expo's connected, that's the slick way to flip personalities mid-demo.

Want me to flip it to hype-man right now so you can see "the hero" take over? Or leave it on goth-mommy?

I tested the agents in the terminal I know need the qr code, generated as a scanable thing please so I can test the web app
Let me make you a clean, scannable QR (a PNG opened in Preview is easiest to scan from your screen) — and confirm Expo's still serving on the LAN first:

Bash Check Expo, generate scannable PNG QR, open it, plus ASCII backup
IN
cd /Users/datnguyen/Desktop/PROJECTS/AsideAI
echo "=== Expo still up on :8081 (all interfaces)? ==="
lsof -nP -iTCP:8081 -sTCP:LISTEN 2>/dev/null | grep -q 8081 && echo "  YES — exp://172.20.10.14:8081 reachable" || echo "  NO — Expo is down, needs restart"
echo
echo "=== generate scannable PNG QR + open in Preview ==="
python - <<'PY'
import qrcode
url = "exp://172.20.10.14:8081"
qrcode.make(url).save("/Users/datnguyen/Desktop/PROJECTS/AsideAI/qr.png")
print("saved qr.png ->", url)
PY
open /Users/datnguyen/Desktop/PROJECTS/AsideAI/qr.png && echo "opened qr.png in Preview (scan it with the phone)"
echo
echo "=== terminal QR backup ==="
python - <<'PY'
import qrcode
qr = qrcode.QRCode(border=2)
qr.add_data("exp://172.20.10.14:8081"); qr.make(fit=True)
qr.print_ascii(invert=True)
PY

OUT
=== Expo still up on :8081 (all interfaces)? ===
  YES — exp://172.20.10.14:8081 reachable

=== generate scannable PNG QR + open in Preview ===
saved qr.png -> exp://172.20.10.14:8081
opened qr.png in Preview (scan it with the phone)

=== terminal QR backup ===
█████████████████████████████
██ ▄▄▄▄▄ █▄  ▄▀█ █▄█ ▄▄▄▄▄ ██
██ █   █ █▄▀█▀█ █ ▄█ █   █ ██
██ █▄▄▄█ █▀ ▀██▄▄█▀█ █▄▄▄█ ██
██▄▄▄▄▄▄▄█▄█ ▀▄█▄█▄█▄▄▄▄▄▄▄██
██ █▄▀▀█▄ █▀██▀ ▄▄▄▀▀▄▀█▄▀ ██
██▀▀█▀▀▀▄▀█▀█▄▀▀█ ▀▄ ▀█▄▄█▄██
██▄▄▄▀ █▄▄▄██▄ ▄█▄ ▄▄▀▀▄█ ▀██
██▄▄█▀ ▀▄▀ ▀ ▀ ▄ █▄▄  ▄▄ ▀▄██
██▄▄█▄▄█▄▄ █ ██  ▀ ▄▄▄  ██ ██
██ ▄▄▄▄▄ █▄ ▀▄█▀█  █▄█ ▀▀▀ ██
██ █   █ ██▄▄▄ ▄█▀ ▄ ▄▄ █▄▄██
██ █▄▄▄█ █▄▀▄▀ ▄  █▄█▄ ▀▀▄▄██
██▄▄▄▄▄▄▄█▄████▄▄█▄▄▄▄▄███▄██
▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀▀
Your scannable QR just opened in Preview on the laptop (saved at qr.png) — plus the terminal one above as backup. Both encode exp://172.20.10.14:8081.

To scan it:

Open Expo Go on the phone → tap "Scan QR code", point at the Preview window, OR
Just use the iPhone Camera app — it'll detect the QR and offer to open it in Expo Go.
Make sure the phone is on the same hotspot Wi-Fi as the laptop (172.20.10.x).

Once it loads, the app connects to the backend over WebSocket (:8780). You should get:

AI Vision screen → the live Pi camera feed + perception trace,
the narration lines appearing, and the voice playing (it's the speaker now),
the home screen to tap between Hype Man / Goth Mommy / Epic Quest live.
Scan it and tell me — I'll confirm the phone's WebSocket session shows ESTABLISHED on the backend. 🎉

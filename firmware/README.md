# firmware/ — QNX capture + triggers (C++)

The wearable's eyes and ears. Runs on the **Raspberry Pi under QNX (SDP 8.0)**,
in **C++**. **Perceive and trigger — nothing more.** No scene interpretation
here; Claude vision (in the laptop backend) does that.

The Pi does *not* run the orchestrator. It ships frames, audio, and event signals
to the **laptop backend over the LAN** (Wi-Fi). That split sidesteps running the
Python SDKs on QNX — the laptop calls Claude + Deepgram.

> **Fastest path: fork [`qnx/projects/ai-camera-app`](https://gitlab.com/qnx/projects/ai-camera-app).**
> It already does **QSF camera capture + TensorFlow Lite inference on QNX SDP 8.0
> / Pi 4** (Pi Camera Module 3) — the hard part. Adapt it: swap its face-detection
> model for a person/pose/gesture `.tflite`, and add `net_client` to ship data to
> the laptop. Don't write QSF capture from scratch.

## Responsibility

1. **Capture camera frames** via **QSF (QNX Sensor Framework)** and send the
   latest one to the laptop backend (which forwards it to Claude vision).
2. **Run TensorFlow Lite event detection** on each frame, **on-device**, and
   signal the backend on an event ("narrate now" + which cue to auto-fire).
3. **Capture mic audio** and send it to the laptop backend (for Deepgram STT).

```
camera ─QSF─┬─▶ camera_capture ────────▶ (latest frame) ─LAN─▶ laptop ─▶ Claude vision
            └─▶ event_detector (TFLite) ─▶ event signal ──LAN─▶ laptop ─▶ frontend cue
mic ──────────▶ mic_capture ────────────▶ (audio) ───────LAN─▶ laptop ─▶ Deepgram STT
                                           (Pi → laptop is a TCP socket over Wi-Fi)
```

## Modules

| File                      | Job                                                                  |
| ------------------------- | -------------------------------------------------------------------- |
| `include/firmware.hpp`    | Shared types (`Frame`, `AudioChunk`, `Event`) + module declarations. |
| `src/main.cpp`            | Entry point. Capture → detect → send loop; reconnect on link drop.   |
| `src/camera_capture.cpp`  | Grab frames via **QSF** (for the detector + the backend).            |
| `src/event_detector.cpp`  | **TensorFlow Lite** on-device triggers (entrance/wave/fall). Trigger only — not the eyes. |
| `src/mic_capture.cpp`     | Grab mic audio.                                                       |
| `src/net_client.cpp`      | TCP client to the laptop backend (JPEG-encode + length-prefixed send). |
| `Makefile`                | QNX SDP 8.0 build stub (`qcc`/`q++` aarch64le; link QSF + TFLite).    |

## Why TFLite, not MediaPipe

MediaPipe targets Linux / Android / iOS — **not QNX** — and being C++ doesn't make
it portable (its Bazel build + GPU/ML deps are the blocker). **TensorFlow Lite via
QSF is the QNX-supported on-device ML path**, proven by `ai-camera-app`. TFLite is
only the *trigger*; losing it costs auto-cues, not narration. Fallbacks: OpenCV
motion detection, or drop auto-triggers and use the phone's manual cue buttons.

## Target & build

- **Board:** Raspberry Pi 4 · **OS:** QNX SDP 8.0 · **Camera:** Pi Camera Module 3
  (ai-camera-app's tested combo — flag if yours differs).
- **Build:** source `qnxsdp-env.sh`, then `qcc`/`q++` for `aarch64le`, linking QSF
  + TensorFlow Lite. See [`Makefile`](Makefile) — but prefer adapting
  ai-camera-app's build.
- **Config (env):** the laptop backend's host/port (`BACKEND_HOST`/`BACKEND_PORT`,
  matching the backend's `FIRMWARE_LISTEN`) and the trigger `MODEL_PATH`.

> **Scaffold only.** Every module is a TODO stub. See
> [../docs/BUILD_ORDER.md](../docs/BUILD_ORDER.md): step 1 (frame → laptop → Claude
> vision) first; TFLite triggers are step 6 and cuttable.

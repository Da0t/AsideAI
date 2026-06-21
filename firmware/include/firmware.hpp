// The Narrator — firmware shared interfaces (QNX, C++).
//
// Target: QNX SDP 8.0 on a Raspberry Pi 4.  Build with qcc/q++ (see ../Makefile).
//
// Perceive + trigger only — the laptop backend interprets. This header declares
// the small module surface the capture/trigger loop uses.
//
// FASTEST PATH: fork qnx/projects/ai-camera-app — it already does QSF camera
// capture + TensorFlow Lite inference on QNX — and adapt it: swap the model,
// add net_client to ship frames/audio/events to the laptop backend over the LAN.
//
// All functions are TODO stubs (return false). This is scaffold, not an
// implementation.
#pragma once

#include <cstdint>
#include <string>
#include <vector>

// ── Data carried over the local network to the laptop backend ────────────────

struct Frame {
    // TODO: pixel buffer + width/height/format as delivered by QSF.
    std::vector<uint8_t> pixels;
    int width = 0;
    int height = 0;
};

struct AudioChunk {
    // TODO: PCM samples + sample rate from the QNX audio capture.
    std::vector<int16_t> samples;
    int sample_rate = 0;
};

struct Event {
    // A MediaPipe-style trigger, produced ON-DEVICE by TFLite.
    std::string kind;          // "entrance" | "wave" | "fall" | ...
    bool narrate_now = false;  // ask the backend to narrate this moment
    std::string cue;           // pre-loaded cue to auto-fire (e.g. "entrance")
};

// ── camera_capture.cpp — QSF camera ──────────────────────────────────────────
bool camera_open();                 // TODO: open the camera via QSF
bool camera_next_frame(Frame& out); // TODO: pull the latest frame

// ── event_detector.cpp — TensorFlow Lite (replaces MediaPipe on QNX) ─────────
bool detector_init(const char* model_path); // TODO: load the .tflite model
bool detector_run(const Frame& in, Event& out); // TODO: infer; out set if fired

// ── mic_capture.cpp — QNX audio ──────────────────────────────────────────────
bool mic_open();                       // TODO: open audio capture
bool mic_next_chunk(AudioChunk& out);  // TODO: pull an audio chunk

// ── net_client.cpp — TCP to the laptop backend over the LAN ──────────────────
bool net_connect(const char* host, int port); // TODO: connect (reconnect on drop)
bool net_send_frame(const Frame& f);           // TODO: JPEG-encode + length-prefixed send
bool net_send_audio(const AudioChunk& a);      // TODO: length-prefixed send
bool net_send_event(const Event& e);           // TODO: length-prefixed send

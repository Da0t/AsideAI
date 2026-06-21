// The Narrator — firmware entry point (QNX, C++).
//
// Perceive + trigger; the laptop backend interprets. Runs on the Raspberry Pi
// (QNX SDP 8.0). Capture frames + audio via QSF, run on-device TFLite event
// detection, and ship everything to the laptop backend over the LAN.
//
// Loop:
//   net_connect(BACKEND_HOST, BACKEND_PORT)
//   camera_open(); mic_open(); detector_init(MODEL_PATH)
//   forever:
//     camera_next_frame(frame)
//     if (detector_run(frame, ev)) net_send_event(ev)   // "narrate now" + cue
//     net_send_frame(frame)                             // backend → Claude vision
//     mic_next_chunk(audio); net_send_audio(audio)      // backend → Deepgram STT
//
// No Overshoot, no LiveKit, no MediaPipe, no on-device LLM. The laptop calls
// Claude vision + Deepgram. Start from qnx/projects/ai-camera-app.
//
// TODO: implement. This is a scaffold stub.

#include "firmware.hpp"

// TODO: load from env/config (see ../README.md):
//   BACKEND_HOST / BACKEND_PORT  — the laptop backend on the LAN
//   MODEL_PATH                   — the .tflite trigger model

int main() {
    // TODO: net_connect(BACKEND_HOST, BACKEND_PORT)
    // TODO: camera_open(); mic_open(); detector_init(MODEL_PATH)
    // TODO: capture/detect/send loop (see header comment)
    // TODO: handle SIGINT/SIGTERM for clean shutdown; reconnect on link drop
    return 0;
}

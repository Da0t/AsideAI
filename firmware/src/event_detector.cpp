// event_detector.cpp — on-device TensorFlow Lite triggers (QNX, C++).
//
// Runs on every frame, LOCALLY on the Pi (no network round-trip), to detect
// events (person enters / waves / falls). On an event it produces a signal the
// firmware forwards to the backend: "narrate now" + which cue to auto-fire.
// This is the instant half of the cinematic-entrance beat.
//
// IMPORTANT — this is a TRIGGER, not the eyes. Claude vision (on the laptop)
// does the scene understanding; this only decides *when* to narrate and *which*
// cue fires. Fully cuttable (see ../../docs/BUILD_ORDER.md step 6).
//
// This REPLACES MediaPipe, which does not build on QNX. TFLite via QSF is the
// QNX-supported on-device ML path — proven by qnx/projects/ai-camera-app (which
// ships a face-detection model; swap in a person/pose/gesture .tflite).
// Fallback if needed: OpenCV motion detection, or drop auto-triggers and use the
// phone's manual cue buttons.
//
// TODO: implement. This is a scaffold stub.

#include "firmware.hpp"

bool detector_init(const char* model_path) {
    // TODO: load the .tflite model (TensorFlow Lite C/C++ API).
    (void)model_path;
    return false;
}

bool detector_run(const Frame& in, Event& out) {
    // TODO: run inference on `in`; map detections to an Event.
    // Return true (and fill `out`) only when an event should fire.
    (void)in;
    (void)out;
    return false;
}

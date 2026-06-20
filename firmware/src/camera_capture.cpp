// camera_capture.cpp — grab frames from the Pi camera via QSF (QNX, C++).
//
// Produces frames for two consumers: event_detector (TFLite, on-device) and
// net_client (sent to the laptop backend → Claude vision). No streaming.
//
// Reference: qnx/projects/ai-camera-app (QSF camera on QNX SDP 8.0 / Pi 4,
// Pi Camera Module 3) and the QSF camera_example*_viewfinder samples.
//
// TODO: implement. This is a scaffold stub.

#include "firmware.hpp"

bool camera_open() {
    // TODO: open the camera through the QNX Sensor Framework (QSF) camera API.
    return false;
}

bool camera_next_frame(Frame& out) {
    // TODO: pull the latest frame from QSF into `out`.
    // TODO: downscale to control Claude image-token cost/latency before sending.
    (void)out;
    return false;
}

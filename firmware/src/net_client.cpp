// net_client.cpp — ship frames/audio/events to the laptop backend over the LAN.
//
// The firmware↔backend hop is a TCP connection over Wi-Fi/LAN (the backend runs
// on a laptop, NOT on the Pi). Protocol: length-prefixed messages, one per
// frame / audio chunk / event. Reconnect on drop — it's a moving wearable on
// Wi-Fi, so expect jitter and the occasional dropped frame (fine: only one
// frame per narration cycle is needed).
//
// TODO: implement with QNX sockets. This is a scaffold stub.

#include "firmware.hpp"

bool net_connect(const char* host, int port) {
    // TODO: open a TCP socket to the laptop backend (config FIRMWARE_LISTEN side).
    (void)host;
    (void)port;
    return false;
}

bool net_send_frame(const Frame& f) {
    // TODO: JPEG-encode (downscaled) + length-prefixed send.
    (void)f;
    return false;
}

bool net_send_audio(const AudioChunk& a) {
    // TODO: length-prefixed send of the PCM chunk.
    (void)a;
    return false;
}

bool net_send_event(const Event& e) {
    // TODO: length-prefixed send of the event ({kind, narrate_now, cue}).
    (void)e;
    return false;
}

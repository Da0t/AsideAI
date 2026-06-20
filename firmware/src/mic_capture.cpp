// mic_capture.cpp — grab mic audio (QNX, C++).
//
// The laptop backend feeds this audio to Deepgram STT. Firmware does NOT
// transcribe — it just captures and ships chunks over the LAN.
//
// TODO: implement. This is a scaffold stub.

#include "firmware.hpp"

bool mic_open() {
    // TODO: open audio capture (QNX audio).
    return false;
}

bool mic_next_chunk(AudioChunk& out) {
    // TODO: read an audio chunk at a rate/format suitable for Deepgram STT.
    (void)out;
    return false;
}

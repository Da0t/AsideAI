"""Backend orchestration entry point.

Runs the live narration loop and serves the frontend (audio out) + firmware
(audio in). This is the conductor; the clients/ modules do the talking.

Live loop (target ~1-2s, narration SHORT):
    1. scene   = overshoot.describe_scene(stream_id)        # vision
    2. speech  = deepgram_stt.latest_transcript()           # ears
    3. persona = redis_client.get_active_personality()      # state
    4. history = redis_client.recent_lines()                # memory (callbacks)
    5. prompt  = prompt_builder.build(persona, scene, speech, history)
    6. line    = claude.narrate(prompt)                     # brain (Claude Haiku)
    7. audio   = deepgram_tts.speak(line, persona.voice)    # voice
    8. push audio to frontend (it plays + ducks music)
    9. redis_client.append_line(line)                       # remember for callbacks

Sentry wraps the whole thing for reliability. The journal (Midjourney) runs
async, OFF this loop — see journal/midjourney.py.

TODO: implement. This is a scaffold stub.
"""

# from . import config, prompt_builder
# from .clients import overshoot, deepgram_stt, deepgram_tts, claude, redis_client, sentry_client


def run() -> None:
    # TODO: sentry_client.init()
    # TODO: connect clients (overshoot, deepgram, claude, redis)
    # TODO: start firmware audio intake (-> deepgram_stt)
    # TODO: start frontend WebSocket (audio out + control: switch persona/mode, cues)
    # TODO: loop: steps 1-9 above, on config.LOOP_INTERVAL_SEC
    # TODO: measure + log latency per hop (BUILD_ORDER step 2)
    raise NotImplementedError("TODO: backend orchestration loop")


if __name__ == "__main__":
    run()

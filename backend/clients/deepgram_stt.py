"""Deepgram STT client — EARS.

Transcribes the mic audio coming from the firmware so the narration can react to
what people are actually saying.

TODO: implement. This is a scaffold stub.
"""


def latest_transcript() -> str:
    """Return the most recent speech transcript (may be empty).

    TODO:
      - consume mic audio chunks streamed from the firmware
      - run Deepgram STT (streaming) with DEEPGRAM_API_KEY
      - expose the latest transcript text to the live loop
    """
    raise NotImplementedError("TODO: Deepgram STT")

"""Overshoot client — VISION / eyes.

Overshoot is an OpenAI-compatible chat completions API. We get a scene
description by sending a chat message that references the live video via an
`ovs://` URI:

    ovs://streams/{stream_id}?frame_index=-1        # latest frame
    ovs://streams/{stream_id}?start_offset_ms=-5000 # last 5 seconds

Firmware created the stream and is publishing video over LiveKit; here we only
read/describe it.

TODO: implement. This is a scaffold stub.
"""


def describe_scene(stream_id: str) -> str:
    """Return a short text description of what's happening in the live video.

    Args:
        stream_id: the Overshoot stream the firmware is publishing to.

    TODO:
      - OpenAI-compatible client pointed at Overshoot, using OVERSHOOT_API_KEY
      - chat completion with an ovs:// video reference (latest frame or last 5s)
      - return the description text (keep the request lean — it's on the hot path)
    """
    raise NotImplementedError("TODO: Overshoot scene description")

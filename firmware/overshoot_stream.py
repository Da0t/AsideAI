"""Overshoot streaming — create a stream and publish camera video over LiveKit.

Lifecycle:
    1. create_stream() -> Overshoot returns stream_id + LiveKit room URL + token
    2. start_publishing() -> publish camera frames into that LiveKit room

The backend later references the live video by stream_id, e.g.
    ovs://streams/{stream_id}?frame_index=-1      (latest frame)
    ovs://streams/{stream_id}?start_offset_ms=-5000  (last 5s)

Remember: the stream dies ~5 min after the last keepalive (see keepalive.py).

TODO: implement. This is a scaffold stub.
"""


def create_stream():
    """Create an Overshoot stream.

    TODO:
      - POST to Overshoot with OVERSHOOT_API_KEY
      - return { stream_id, livekit_url, livekit_token }
    """
    raise NotImplementedError("TODO: create Overshoot stream")


def start_publishing(stream, frame_source) -> None:
    """Publish camera frames into the stream's LiveKit room.

    Args:
        stream: result of create_stream() (room URL + token + stream_id).
        frame_source: a frame generator (camera_capture.frames()).

    TODO:
      - connect to the LiveKit room with the token (LiveKit SDK)
      - publish a video track fed by frame_source
      - keep publishing until shutdown
    """
    raise NotImplementedError("TODO: publish video over LiveKit")

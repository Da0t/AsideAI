"""Camera capture — grab frames from the Pi camera.

Produces a stream of frames for overshoot_stream.py to publish over LiveKit.
On-device this should use picamera2; opencv is a dev fallback.

TODO: implement. This is a scaffold stub.
"""


def frames():
    """Yield camera frames (generator).

    TODO:
      - open the camera (picamera2 on-device, cv2.VideoCapture for dev)
      - yield frames at the configured resolution/fps
      - keep it lightweight — this feeds the live loop's video path
    """
    raise NotImplementedError("TODO: camera frame capture")

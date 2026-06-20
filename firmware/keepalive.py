"""Keepalive — keep the Overshoot stream from expiring.

The stream dies ~5 minutes after the last keepalive ping. This module pings on an
interval safely below that TTL so the live video stays available to the backend.

TODO: implement. This is a scaffold stub.
"""


def start(stream, interval: float) -> None:
    """Ping Overshoot on an interval to keep `stream` alive.

    Args:
        stream: the active stream (id/creds from overshoot_stream.create_stream()).
        interval: seconds between pings. MUST be < ~5 min (the stream TTL).

    TODO:
      - run a background loop that pings Overshoot every `interval` seconds
      - log/raise (Sentry on the backend side) if the stream looks dead
      - stop cleanly on shutdown
    """
    raise NotImplementedError("TODO: stream keepalive loop")

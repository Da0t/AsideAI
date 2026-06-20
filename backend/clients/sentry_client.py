"""Sentry client — RELIABILITY.

Init Sentry for the backend and capture errors/performance. Insurance for demo
day; it must never slow or block the live loop.

TODO: implement. This is a scaffold stub.
"""


def init() -> None:
    """Initialize Sentry from SENTRY_DSN (no-op if unset).

    TODO:
      - sentry_sdk.init(dsn=SENTRY_DSN, ...) if DSN present
      - light performance tracing on the live loop (don't add latency)
    """
    raise NotImplementedError("TODO: Sentry init")

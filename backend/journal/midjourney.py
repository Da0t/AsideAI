"""Midjourney journal — ASYNC, off the hot path, built LAST.

Turns a session's narration history into an illustrated "journal." This touches
the live loop ZERO times: it reads Redis history after the fact and generates
images on its own clock. Fully cuttable.

TODO: implement (last). This is a scaffold stub.
"""


def build_journal(session_id: str):
    """Generate illustrated panels from a session's narration history.

    Args:
        session_id: which session's history to illustrate.

    TODO:
      - read narration history from Redis (clients.redis_client)
      - turn lines into Midjourney prompts
      - generate panels asynchronously; store/return references
      - NEVER call this from the live loop
    """
    raise NotImplementedError("TODO: Midjourney journal (async, build last)")

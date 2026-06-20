"""Claude client — BRAIN.

Calls Claude Haiku for ONE short, in-character narration line. Model choice and
low max_tokens are the whole game here: the live loop must stay ~1-2s and the
line must stay SHORT.

TODO: implement. This is a scaffold stub.
"""


def narrate(prompt: dict) -> str:
    """Generate a single short in-character line.

    Args:
        prompt: built by prompt_builder.build() — system prompt + scene + speech
            (+ history for callbacks).

    Returns:
        A short narration line (one or two sentences).

    TODO:
      - Anthropic client with ANTHROPIC_API_KEY
      - model = Claude Haiku (config.CLAUDE_MODEL)
      - max_tokens = LOW (config.CLAUDE_MAX_TOKENS) — keep it short + fast
      - return the line text
    """
    raise NotImplementedError("TODO: Claude Haiku narration")

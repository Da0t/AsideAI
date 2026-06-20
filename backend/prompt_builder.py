"""Prompt builder — assemble the Claude Haiku prompt.

Combines the active personality's system prompt with the live context (scene +
speech) and a little narration history (for callbacks). This is the seam where a
personality's character meets the current moment.

Design rule: keep the OUTPUT short. The system prompt should demand brevity, and
main.py sets a low max_tokens. This builder just assembles inputs.

TODO: implement. This is a scaffold stub.
"""


def build(personality, scene: str, speech: str, history=None) -> dict:
    """Build the Claude messages/prompt for one narration line.

    Args:
        personality: the active bundle ({name, claude_system_prompt, voice, cues}).
        scene: Overshoot's description of what's happening now.
        speech: recent transcript from Deepgram STT (may be empty).
        history: recent narration lines, for callbacks (may be None).

    Returns:
        Something main.py can hand to claude.narrate() — e.g.
        { "system": personality.claude_system_prompt,
          "messages": [ ... scene + speech + history ... ] }

    TODO:
      - system = personality.claude_system_prompt
      - user content: scene description + (speech if any) + (history for callbacks)
      - keep it tight; remind the model to stay in character and SHORT
    """
    raise NotImplementedError("TODO: build personality prompt")

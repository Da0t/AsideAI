"""prompt_builder assembles a valid Claude vision request.

    python -m unittest backend.tests.test_prompt_builder
"""

import unittest

from backend import prompt_builder

BUNDLE = {
    "name": "Hype Man",
    "slug": "hype-man",
    "claude_system_prompt": "SYSTEM PROMPT",
    "deepgram_voice": "aura-orion-en",
}


class TestPromptBuilder(unittest.TestCase):
    def test_system_prompt_passed_through(self):
        p = prompt_builder.build(BUNDLE, b"\xff\xd8jpeg\xff\xd9")
        self.assertEqual(p["system"], "SYSTEM PROMPT")
        self.assertEqual(p["personality_slug"], "hype-man")

    def test_frame_is_base64_image_block(self):
        p = prompt_builder.build(BUNDLE, b"\xff\xd8jpeg\xff\xd9")
        block = p["messages"][0]["content"][0]
        self.assertEqual(block["type"], "image")
        self.assertEqual(block["source"]["type"], "base64")
        self.assertEqual(block["source"]["media_type"], "image/jpeg")
        self.assertTrue(block["source"]["data"])  # non-empty base64

    def test_speech_and_history_included(self):
        p = prompt_builder.build(BUNDLE, b"x", speech="hi there", history=["a previous line"])
        text = p["messages"][0]["content"][1]["text"]
        self.assertIn("hi there", text)
        self.assertIn("a previous line", text)
        self.assertEqual(p["mock_hint"], "hi there")

    def test_no_speech_no_history(self):
        p = prompt_builder.build(BUNDLE, b"x")
        text = p["messages"][0]["content"][1]["text"]
        self.assertIn("ONE short sentence", text)
        self.assertIsNone(p["mock_hint"])


if __name__ == "__main__":
    unittest.main()

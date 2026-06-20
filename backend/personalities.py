"""Load personality bundles from personalities/*.json.

A bundle is {name, slug, claude_system_prompt, deepgram_voice, sound_cues, ...}.
See docs/PERSONALITIES.md. The `_template.json` and any `_`-prefixed file are
skipped.
"""

import glob
import json
import os

_DIR = os.path.join(os.path.dirname(__file__), os.pardir, "personalities")


def load_all() -> dict:
    """Return {slug: bundle} for every personality file."""
    out = {}
    for path in sorted(glob.glob(os.path.join(_DIR, "*.json"))):
        stem = os.path.splitext(os.path.basename(path))[0]
        if stem.startswith("_"):
            continue
        with open(path, "r", encoding="utf-8") as f:
            bundle = json.load(f)
        out[bundle.get("slug", stem)] = bundle
    return out


def default_slug(bundles: dict) -> str:
    """Pick a stable default active personality."""
    if "hype-man" in bundles:
        return "hype-man"
    return next(iter(bundles), "")

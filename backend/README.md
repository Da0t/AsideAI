# backend/ — the central hub

Where perception becomes performance. The backend gathers what the system sees,
hears, and remembers; builds a personality prompt; calls Claude Haiku for a short
in-character line; and voices it with Deepgram. It owns Redis (memory + state)
and reports to Sentry (reliability).

## The live loop (must stay ~1–2s)

```
Overshoot scene  ─┐
Deepgram STT     ─┼─▶ prompt_builder ─▶ Claude Haiku ─▶ Deepgram TTS ─▶ frontend
active persona   ─┘     (system prompt      (SHORT          (voice         (plays,
 (Redis)                 + scene + speech)    line)           audio)         ducks music)
                                                                  │
                                              append line to Redis history (callbacks)
```

Keep it short. Low `max_tokens` on Claude. See
[../docs/ARCHITECTURE.md](../docs/ARCHITECTURE.md) for the full pipeline and
design rules.

## Modules

| File                        | Job                                                                |
| --------------------------- | ------------------------------------------------------------------ |
| `main.py`                   | Orchestration entry point. Runs the live loop; serves the frontend WS. |
| `prompt_builder.py`         | Combine personality system prompt + scene + speech (+ history).    |
| `config.py`                 | Load env + settings (keys, Redis URL, `max_tokens`, loop timing).  |
| `clients/overshoot.py`      | **Vision** — scene description from the live stream (`ovs://`).     |
| `clients/deepgram_stt.py`   | **Ears** — mic audio → transcript.                                 |
| `clients/deepgram_tts.py`   | **Voice** — line text → voice audio (per-personality voice id).    |
| `clients/claude.py`         | **Brain** — short in-character narration line (Claude Haiku).      |
| `clients/redis_client.py`   | **Memory + state** — active personality/mode, narration history.   |
| `clients/sentry_client.py`  | **Reliability** — init + capture errors/traces.                    |
| `journal/midjourney.py`     | **Async journal** — illustrated panels from history. Off the hot path, built last. |

## Service → job

| Service      | Module                    | Job                |
| ------------ | ------------------------- | ------------------ |
| Overshoot    | `clients/overshoot.py`    | Vision / eyes      |
| Deepgram     | `deepgram_stt` / `deepgram_tts` | STT + TTS (ears + voice) |
| Claude Haiku | `clients/claude.py`       | Narration / brain  |
| Redis        | `clients/redis_client.py` | Memory + state     |
| Sentry       | `clients/sentry_client.py`| Reliability        |
| Midjourney   | `journal/midjourney.py`   | Journal (async)    |

## Overshoot usage

OpenAI-compatible chat completions. Reference the live video in a chat message:

- `ovs://streams/{stream_id}?frame_index=-1` — latest frame
- `ovs://streams/{stream_id}?start_offset_ms=-5000` — last 5 seconds

## Setup

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp ../.env.example ../.env   # set all keys + REDIS_URL
python main.py
```

> **Scaffold only.** Every module is a TODO stub. Start with
> [../docs/BUILD_ORDER.md](../docs/BUILD_ORDER.md) step 2: the core loop, then
> measure latency.

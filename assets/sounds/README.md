# assets/sounds/

Pre-loaded music + SFX cues, one folder per personality. These ship with the app
and fire **instantly** from the frontend — **never generated live** (design rule 2).

- [`manifest.json`](manifest.json) — the canonical list of cue names every
  personality is expected to provide, and the expected filenames.
- `<slug>/` — one folder per personality, holding that personality's cue files.
  **Only the active personality's sounds fire.**

Expected files per folder (see manifest): `entrance.mp3`, `laugh_track.mp3`,
`sting.mp3`, `theme_loop.mp3`. Missing files simply don't play.

> Scaffold: folders contain a `README.md` placeholder instead of real audio. Drop
> the actual `.mp3`/`.wav` files in during the build (BUILD_ORDER step 4).

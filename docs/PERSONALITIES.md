# Personalities

A personality is what makes the same moment land completely differently. It is a
**bundle** of four things, and nothing more:

```
{
  name:               human-readable label, e.g. "Goth Mommy"
  claude_system_prompt: the voice/character instructions for Claude Haiku
  deepgram_voice:     the Deepgram TTS voice id that speaks the lines
  sound_cues:         the set of pre-loaded SFX/music this personality can fire
}
```

That's the whole contract. The live loop swaps which bundle is active; everything
else stays the same.

---

## The Bundle, Field by Field

| Field                  | Type     | What it does                                                                 |
| ---------------------- | -------- | --------------------------------------------------------------------------- |
| `name`                 | string   | Display name in the app's switcher.                                         |
| `slug`                 | string   | Stable id (kebab-case). Must match the folder in `assets/sounds/<slug>/`.   |
| `claude_system_prompt` | string   | The character. Defines tone, vocabulary, length, and quirks. **Keep output SHORT.** |
| `deepgram_voice`       | string   | Deepgram TTS voice id — the actual sound of the voice.                       |
| `sound_cues`           | object   | Maps cue names (`entrance`, `laugh_track`, …) → files in this personality's sound folder. |
| `mode_hints`           | object?  | Optional per-mode tweaks (e.g. "quiet mode" narrates less often).           |

> **Only the active personality's sounds fire.** The cue set is scoped to the
> bundle — switching personalities switches which `entrance` theme and which
> `laugh_track` exist.

### Where the bundles live

- **Definitions:** `personalities/<slug>.json` — one file per personality.
- **Schema/template:** `personalities/_template.json` — copy this to add a new one.
- **Sounds:** `assets/sounds/<slug>/` — the pre-loaded audio the cues point at.
- **Cue manifest:** `assets/sounds/manifest.json` — the canonical list of cue
  names every personality is expected to provide.

### The built-in personalities (3, for now)

| Slug                   | Character                                          |
| ---------------------- | -------------------------------------------------- |
| `hype-man`             | Hype man — pumps up every tiny moment              |
| `goth-mommy`           | Emotional support, goth aesthetic — comforts you   |
| `epic-quest-narrator`  | Reframes mundane actions as an epic fantasy quest  |

> Scoped to three to start; more (and user-created custom ones) slot in with the
> same bundle shape.

---

## How to Add a New Personality

Whether it's a built-in or a user's custom creation, the steps are the same — a
new personality is just a new bundle.

1. **Copy the template.**
   `cp personalities/_template.json personalities/<your-slug>.json`

2. **Fill in `name` and `slug`.** The `slug` is kebab-case and must be unique. It
   becomes the sound folder name.

3. **Write the `claude_system_prompt`.** This is the whole character. Be specific
   about tone and vocabulary, and **explicitly constrain length** — one or two
   punchy sentences. (The backend also enforces a low `max_tokens`, but say it in
   the prompt too.) Leave it as `TODO` in templates until you write it.

4. **Pick a `deepgram_voice`.** Choose a Deepgram TTS voice id that fits the
   character. A goth mommy sounds different from a hype man.

5. **Create the sound folder.** `assets/sounds/<your-slug>/` and drop in the
   pre-loaded cue files. Match the cue names in
   [`assets/sounds/manifest.json`](../assets/sounds/manifest.json) — at minimum
   `entrance` and `laugh_track`. Missing cues simply won't fire.

6. **Wire `sound_cues`.** In your bundle, map each cue name to its file:
   `"entrance": "entrance.mp3"`, etc.

7. **Register it** so the frontend switcher lists it (see backend/frontend READMEs
   for the registry location — TODO during build).

That's it. The live loop doesn't change; it just reads a different bundle from
Redis as the active personality.

---

## Custom Personalities (user-created)

The custom-personality builder in the app is the same flow as above, minus
writing JSON by hand:

- **User picks a Deepgram voice** (from a list) → sets `deepgram_voice`.
- **User describes a character** in free text → becomes (or seeds) the
  `claude_system_prompt`.
- **Sound cues** default to a shared/neutral set (custom personalities don't ship
  their own audio), or reuse an existing personality's folder. (Exact default is
  a build-time decision — TODO.)
- Everything is **free** — no gating on custom personalities.

The result is a normal bundle stored alongside the built-ins.

---

## Modes

Modes are orthogonal to personality — the *same* personality can behave
differently per mode (e.g. how often it narrates, how punchy it is). Modes are
switched from the frontend and stored in Redis next to the active personality.
Exact mode list is a build-time decision; document it here as it solidifies (TODO).

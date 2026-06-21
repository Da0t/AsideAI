# Aside — Mobile UI Design Spec

> Reference: deep crimson dark UI with card-based layout, large bottom CTA,
> and rich red-to-black gradient surfaces.

---

## Visual Direction

The app uses a **dark + deep crimson** palette — near-black backgrounds with
wine-red/maroon card surfaces and bright coral-red accents for live/active
states. The feel is cinematic and intimate, like a broadcast console in a
dimly lit studio. Every surface has depth through layered gradients and subtle
transparency.

**Key principles:**
- Dark base with warm red tint (not cold/blue-black)
- Cards are rich crimson/maroon, NOT flat gray
- The LIVE/active accent is bright coral-red (#ff4d3d)
- Generous corner radii everywhere (cards 24–32px, pills 999px)
- Circular avatars / glyphs as visual anchors on each card
- Large, prominent bottom CTA button (the "go live" / PING equivalent)
- Swipeable card interactions for quick actions
- Uppercase mono labels for status/metadata

---

## Color Tokens

### Base (dark scale with warm red undertone)
| Token           | Hex         | Use                                    |
|-----------------|-------------|----------------------------------------|
| `bg-app`        | `#0a0610`   | Deepest app background                 |
| `bg-raised`     | `#120a14`   | Raised surfaces behind cards           |
| `surface-card`  | `#3d1225`   | Default card fill (deep wine)          |
| `surface-card2` | `#5a1a30`   | Lighter card fill / hover state        |
| `surface-hot`   | `#8b1a2b`   | Emphasized card (top/active state)     |
| `surface-input` | `#1a0e18`   | Input field background                 |

### Borders
| Token              | Hex                        | Use                       |
|--------------------|----------------------------|---------------------------|
| `border-hairline`  | `rgba(255, 80, 80, 0.12)`  | Subtle card edges         |
| `border-strong`    | `rgba(255, 80, 80, 0.25)`  | Dividers, input borders   |
| `border-glow`      | `rgba(255, 77, 61, 0.40)`  | Active/selected glow ring |

### Text
| Token           | Hex / RGBA                  | Use                        |
|-----------------|-----------------------------|----------------------------|
| `text-primary`  | `#f8f0f2`                   | Headings, names, bold copy |
| `text-secondary`| `rgba(255, 220, 220, 0.70)` | Subtitles, metadata        |
| `text-muted`    | `rgba(255, 180, 180, 0.45)` | Timestamps, hints          |
| `text-on-brand` | `#1a0508`                   | Text on bright red fills   |

### Brand / Accent
| Token           | Hex                          | Use                              |
|-----------------|------------------------------|----------------------------------|
| `brand`         | `#ff4d3d`                    | LIVE badge, primary CTA, active  |
| `brand-bright`  | `#ff6a5b`                    | Hover / press brightened         |
| `brand-deep`    | `#c9261a`                    | Pressed state                    |
| `brand-glow`    | `rgba(255, 77, 61, 0.50)`   | Shadow glow on active elements   |
| `brand-soft`    | `rgba(255, 77, 61, 0.15)`   | Tinted backgrounds               |

### Personality accent overrides
Each personality still has a signature accent, but it tints within the
red-dark system rather than replacing it:

| Theme    | Accent    | Card tint                 | Glow                              |
|----------|-----------|---------------------------|------------------------------------|
| hype     | `#2e7bff` | `rgba(46,123,255,0.08)`   | `rgba(46,123,255,0.35)`           |
| goth     | `#a04ddb` | `rgba(160,77,219,0.08)`   | `rgba(160,77,219,0.35)`           |
| quest    | `#2fa866` | `rgba(47,168,102,0.08)`   | `rgba(47,168,102,0.35)`           |
| custom   | `#7b82a0` | `rgba(123,130,160,0.08)`  | `rgba(123,130,160,0.35)`          |

---

## Typography

| Role       | Family                  | Weight | Size | Tracking  | Transform | Use                                    |
|------------|-------------------------|--------|------|-----------|-----------|----------------------------------------|
| Display    | Bricolage Grotesque     | 800    | 28–38| −0.03em   | —         | Screen titles, personality names       |
| Title      | Bricolage Grotesque     | 700    | 20–24| −0.02em   | —         | Section headers, card names            |
| Body       | Hanken Grotesk          | 400–600| 14–16| 0         | —         | Descriptions, quotes, form fields      |
| Label      | Space Mono              | 700    | 10–11| +0.12em   | uppercase | LIVE, MODE, VOICE, status chips        |
| Meta       | Hanken Grotesk          | 500    | 12   | +0.02em   | uppercase | Timestamps, locations, hints           |

---

## Spacing & Layout

- **Base grid:** 4px
- **Screen horizontal padding:** 20px
- **Card internal padding:** 16px
- **Grid gutter (between cards):** 12px
- **Minimum tap target:** 44px
- **Bottom CTA safe zone:** 100px from bottom edge (clear of home indicator)

---

## Corner Radii

| Element         | Radius |
|-----------------|--------|
| Card (personality, profile) | 24px |
| Cue pad / action button area | 20px |
| Button / input  | 14px   |
| Chip / pill     | 999px  |
| Avatar          | 999px (circle) |
| Bottom CTA      | 999px (circle) |

---

## Shadows & Depth

| Token            | Value                                                   | Use                    |
|------------------|---------------------------------------------------------|------------------------|
| `shadow-card`    | `0 8px 24px rgba(0,0,0,0.50)`                          | Card lift              |
| `shadow-lg`      | `0 16px 40px rgba(0,0,0,0.60)`                         | Modals, bottom bar     |
| `glow-brand`     | `0 0 28px rgba(255,77,61,0.50)`                        | LIVE / active glow     |
| `glow-cta`       | `0 0 40px rgba(255,77,61,0.60), 0 8px 20px rgba(255,77,61,0.40)` | Bottom CTA button |
| `inner-card`     | `inset 0 1px 0 rgba(255,255,255,0.06)`                 | Top-edge card highlight|

---

## Motion

| Token            | Value   | Use                           |
|------------------|---------|-------------------------------|
| `dur-fast`       | 140ms   | Press feedback, toggles       |
| `dur-base`       | 220ms   | Transitions, focus rings      |
| `dur-slow`       | 380ms   | Screen transitions            |
| `ease-spring`    | cubic-bezier(0.34, 1.56, 0.64, 1) | Press overshoot  |
| `press-scale`    | 0.96    | All tappable elements         |
| `live-pulse`     | 1.4s    | LIVE dot opacity cycle        |
| `eq-bar`         | 0.9s    | Waveform bar animation        |

---

## Components

### 1. Top Navigation Bar
- Height: 52px (below status bar safe area)
- Left: hamburger menu icon (24px, muted)
- Center: screen title in title font ("Dashboard" / "Aside")
- Right: 1–2 icon buttons (info, bell) — ghost variant, 44px tap target
- Background: transparent (bleeds into app bg)

### 2. Tab Bar (Profile / Recent style)
- Horizontal, centered
- Two text labels with a dot separator between them
- Active tab: full white text, underline or bold
- Inactive tab: muted text
- Use for switching between "Narrators" and "Recent" or "Live"

### 3. Mode/Filter Bar
- Full-width crimson card (`surface-hot`)
- Left: mode label ("PROFILE MODE") + dropdown chip (e.g. "ROMANCE ▾")
- Right: toggle switch with label ("DISCOVERY ON")
- Rounded corners (20px), internal padding 14px
- For Aside: "NARRATION MODE" + mode dropdown + "LIVE" toggle

### 4. Filter Chips Row
- Horizontal row of 3 pill buttons
- Inactive: outlined, crimson border, transparent fill
- Active/selected: filled with `surface-card2` or `brand-soft`, brighter text
- Icons optional (left of label)
- For Aside: "All", "Built-in", "Custom" personality filters — or "Chill / Chatty / Punchy" mode chips

### 5. Profile/Personality Cards (list style)
- Full-width rounded card (`surface-card`, radius 24px)
- Left: circular avatar/glyph (48px diameter)
- Center: name (title weight, white) + subtitle line (meta: location, timestamp, voice name)
- Right: 3-dot menu button (ellipsis, muted)
- Subtle inner top-edge highlight (`rgba(255,255,255,0.06)`)
- Card shadow: `shadow-card`
- **Active/expanded state:** card shifts to `surface-hot` with action buttons revealed (circular icon buttons in a row: X, phone, check, chat)
- **Swipe gesture:** swipe left to forget/dismiss, swipe right to remember/favorite

### 6. Action Buttons (on expanded card)
- Circular, 44px diameter
- Background: `surface-card2` or themed accent
- Icon: 20px, white or accent color
- Row of 3–4 with 12px gap
- For Aside: switch to this personality, preview voice, edit, delete

### 7. Bottom CTA — "Go Live" Button (PING equivalent)
- Large circle: 72px diameter
- Background: `brand` (#ff4d3d)
- Glow: `glow-cta` (double-layer red glow)
- Label: "GO LIVE" or "ASIDE" in mono bold, centered below or inside
- Signal wave arcs radiating from the circle (decorative, animated)
- Flanked by two status indicators:
  - Left: "NARRATING" + on/off status
  - Right: "SHARING" + active/off status
- Fixed to bottom of screen, above home indicator safe area

### 8. Status Indicator (bottom flanks)
- Small text label (mono, 10px, uppercase, muted)
- Below: status text ("ON" / "ACTIVE" / "OFF")
- Optional: small pulsing dot for active state

### 9. NowPlaying Bar (alternative to bottom CTA when narration is active)
- Slides up from bottom, replaces the CTA area
- Crimson gradient background (`surface-card` → `surface-hot`)
- Left: play/pause circle (48px, accent fill)
- Center: LIVE chip + personality name + mode/voice meta
- Right: waveform equalizer bars (animated)
- Tap to expand into LiveScreen

### 10. Personality Card (grid variant for home)
- Used in a 2-column grid on the home/switcher screen
- Gradient hero band at top (personality's signature gradient)
- Glyph emoji in the hero band (34px)
- Name in display font, overlapping the hero band bottom edge
- One-line tagline (body, muted)
- In-character sample quote (italic, bordered left with accent)
- "VOICE · Name" mono label at bottom
- Waveform bars (small, accent color, animates when this is the active personality)
- Active state: LIVE badge (coral chip with pulse dot) + glow border + breathing shadow

### 11. Cue Button (soundboard pad)
- Rectangular with rounded corners (20px)
- SFX type: raised surface (`surface-card`), hardware-like with inner shadow
- Music type: gradient fill from personality's surface colors
- Icon in a tinted square (40×40, accent color bg at 20% opacity)
- Label in display font (17px)
- Hint in mono (10px, uppercase, 55% opacity)
- Press: scale 0.985, haptic feedback, ripple

### 12. Waveform Equalizer
- 5–9 vertical bars
- Each bar: 3px wide, rounded ends, accent color
- Active: bars animate independently (scaleY oscillation, staggered 120ms)
- Inactive: all bars flatten to 18% height, 40% opacity

### 13. Chip / Badge
- Height: 26px, pill radius
- Mono font, uppercase, tracked
- Variants:
  - `brand`: coral fill, dark text, used for LIVE
  - `outline`: transparent fill, crimson border
  - `accent`: accent-tinted fill, accent text
  - `solid`: `surface-card2` fill
- Optional: pulsing dot (7px circle, animates opacity 1→0.3→1 over 1.4s)

### 14. Input Field
- Dark fill (`surface-input`)
- Height: 52px
- Border: 1px `border-strong`, transitions to accent on focus
- Optional left icon (18px, muted)
- Placeholder: muted text
- Label above: mono, 11px, uppercase, secondary color

### 15. Toggle Switch
- Track: 50×30px, radius 999
- On: accent color fill + glow
- Off: dark fill (`surface-card`)
- Knob: 24px white circle, spring-animated position

---

## Screens

### Screen 1: Home / Dashboard
```
┌─────────────────────────────┐
│  ≡   Aside          (i) (🔔) │  ← top nav
│─────────────────────────────│
│    Narrators  •  Recent      │  ← tab bar
│─────────────────────────────│
│ ┌─────────────────────────┐ │
│ │ NARRATION MODE           │ │  ← mode card (crimson)
│ │ CHATTY ▾      LIVE (●)  │ │     dropdown + toggle
│ └─────────────────────────┘ │
│  (Chill) (Chatty) (Punchy)   │  ← filter chips
│                              │
│  Swipe ◀◀ dismiss • ▶▶ fav  │  ← hint text
│                              │
│ ┌─────────────────────────┐ │
│ │ ⚡ Hype Man    •••       │ │  ← personality card
│ │    VOICE · Nova          │ │     (expanded: action btns)
│ │    (✕) (▶) (✓) (💬)     │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ 🦇 Goth Mommy    •••    │ │  ← personality card
│ │    VOICE · Asteria       │ │
│ └─────────────────────────┘ │
│ ┌─────────────────────────┐ │
│ │ ⚔️ Epic Quest    •••     │ │
│ │    VOICE · Orion         │ │
│ └─────────────────────────┘ │
│                              │
│  NARRATING        SHARING    │  ← bottom status
│    ON          ◉    ACTIVE   │  ← CTA: "GO LIVE"
│              (GO LIVE)       │     big red circle + glow
└─────────────────────────────┘
```

### Screen 2: Live Narration (full-bleed)
```
┌─────────────────────────────┐
│  ▾                  •••     │  ← back + menu
│      ● NARRATING LIVE       │  ← brand chip
│                              │
│           ⚡                 │  ← large glyph
│        ║║║║║║║║║             │  ← waveform (big)
│                              │
│  "AYO they're BACK and      │  ← narration line
│   they brought the FUEL!"   │     (cycles, fades)
│                              │
│        Hype Man              │  ← personality name
│    VOICE · Nova · DUCKED     │  ← meta
│                              │
│ [Entrance] [Laugh] [Horn]    │  ← cue pads
│           ( ❚❚ )             │  ← transport
└─────────────────────────────┘
```

### Screen 3: Create Personality
```
┌─────────────────────────────┐
│  ←  New narrator             │  ← back + title
│                              │
│     ┌───────────────┐        │  ← live preview card
│     │ ✦ Untitled    │        │     (updates as you type)
│     │  Pick a voice │        │
│     └───────────────┘        │
│                              │
│  NAME                        │
│  ┌─────────────────────────┐ │
│  │ 👤 Name your narrator   │ │  ← input
│  └─────────────────────────┘ │
│                              │
│  VOICE                       │
│  ┌─────────────────────────┐ │
│  │ ◉ Asteria               │ │  ← voice picker
│  │   Warm, velvety, slow   │ │
│  ├─────────────────────────┤ │
│  │ ○ Orion                 │ │
│  │   Booming, theatrical   │ │
│  ├─────────────────────────┤ │
│  │ ○ Nova                  │ │
│  └─────────────────────────┘ │
│                              │
│  DESCRIBE THE CHARACTER      │
│  ┌─────────────────────────┐ │
│  │ Personality, tone...    │ │  ← textarea
│  │                         │ │
│  └─────────────────────────┘ │
│            124/400           │  ← char counter
│                              │
│  [ ✦ Create narrator      ] │  ← primary CTA (coral)
└─────────────────────────────┘
```

---

## Interaction Patterns

### Press Feedback
Every tappable element spring-shrinks to `press-scale` (0.96) with
`ease-spring`. Release springs back to 1.0.

### Card Swipe (optional, from reference)
- Swipe right: select/favorite this personality → card slides, reveal green
  check, snaps back
- Swipe left: dismiss/hide → card slides, reveal red X, snaps back
- Swipe threshold: 30% of card width

### Card Expand
- Tap the ellipsis (•••) on a personality card → card expands vertically to
  reveal a row of circular action buttons (switch to, preview, edit, delete)
- Expand animation: height grows with spring, action buttons fade in staggered

### Cue Fire
- Press a cue pad → pad depresses (scale 0.985, translateY +2px) + haptic
  impact + ripple flash (accent border, 0.45s ease-out)
- Toast appears briefly: "Entrance fired" (pill, shadow-lg, 1.6s)

### LIVE Pulse
- The LIVE dot on chips and the active personality card: opacity cycles
  1 → 0.3 → 1 over 1.4s, infinite, ease-in-out

### Bottom CTA Glow
- The "GO LIVE" button has a persistent double-glow that pulses subtly
  (shadow radius oscillates ±4px over 3s)
- Signal arcs (decorative parentheses/waves) around the button pulse
  in sequence outward

### Navigation
- Home → Live: fade transition (0.38s)
- Home → Builder: slide from right (native stack default)
- Back: reverse of entry transition

---

## Adaptation Notes (Reference → Aside)

| Reference UI element       | Aside equivalent                          |
|----------------------------|-------------------------------------------|
| Profile cards (list)       | Personality cards (list view on home)      |
| Avatar photo               | Personality glyph emoji (⚡ 🦇 ⚔️ ✦)     |
| Name + location + time     | Name + voice + mode                       |
| "PROFILE MODE: ROMANCE"   | "NARRATION MODE: CHATTY"                  |
| "DISCOVERY ON" toggle      | "LIVE" toggle (narration on/off)          |
| Clear / Radar / List chips | Chill / Chatty / Punchy mode chips        |
| Swipe to forget/remember   | Swipe to hide/favorite personality        |
| PING button (bottom CTA)   | GO LIVE button (start narration)          |
| "DISCOVERY ON / SHARING"   | "NARRATING / SHARING" status flanks       |
| Action buttons on card     | Switch to / Preview / Edit / Delete       |

---

## File Reference

- Design tokens → `frontend/src/theme/tokens.ts`
- Personality themes → `frontend/src/theme/personalities.ts`
- Theme context → `frontend/src/theme/ThemeContext.tsx`
- Personality data → `frontend/src/data/personalities.ts`
- All components → `frontend/src/components/`
- All screens → `frontend/src/screens/`
- App root → `frontend/App.tsx`

---
name: Harmoniq
description: Karaoke night on a call. A record-label stage plan in near-black, off-white and Stage Amber.
colors:
  ground: "#0e0f0f"
  surface: "#151616"
  surface-2: "#1c1d1d"
  surface-3: "#242525"
  popover: "#181919"
  ink: "#fafafa"
  ink-muted: "#8c8c8c"
  ink-faint: "#5a5b5b"
  amber: "#e9a84a"
  amber-deep: "#c7842a"
  amber-ink: "#1a1005"
  gel-rose: "#E4577E"
  gel-teal: "#5FD3C8"
  gel-violet: "#9B7BE8"
  gel-lime: "#A8D65C"
  gel-sky: "#5FA8E8"
  gel-coral: "#F07C5A"
  gel-orchid: "#D46BC7"
  gel-gold: "#E2C15A"
  destructive: "#e0605f"
  line: "rgba(255, 255, 255, 0.08)"
  line-strong: "rgba(255, 255, 255, 0.14)"
typography:
  display:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "11.5vw at lg, 15vw at sm, 18vw at base"
    fontWeight: 300
    lineHeight: 0.9
    letterSpacing: "-0.035em"
  statement:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "clamp(2rem, 5vw, 4.5rem)"
    fontWeight: 300
    lineHeight: 1.05
    letterSpacing: "-0.035em"
  headline:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem, 2.25rem from sm"
    fontWeight: 300
    lineHeight: 1.2
    letterSpacing: "-0.035em"
  title:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 500
    lineHeight: 1.25
    letterSpacing: "-0.035em"
  lyric:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.875rem to 3rem active; 1.125rem to 1.25rem waiting"
    fontWeight: 500
    lineHeight: 1.2
    letterSpacing: "-0.02em"
  body:
    fontFamily: "Geist, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem, 1rem from sm"
    fontWeight: 400
    lineHeight: 1.5
    letterSpacing: "normal"
  label:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "10px to 12px"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "0.2em"
  mono:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "0.75rem"
    fontWeight: 400
    lineHeight: 1.4
    letterSpacing: "normal"
  code:
    fontFamily: "Geist Mono, ui-monospace, SFMono-Regular, Menlo, monospace"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1
    letterSpacing: "0.3em"
rounded:
  sm: "4px"
  md: "6px"
  lg: "8px"
  xl: "10px"
  pill: "9999px"
spacing:
  "1.5": "6px"
  "2": "8px"
  "3": "12px"
  "4": "16px"
  "6": "24px"
  "8": "32px"
  "10": "40px"
  "12": "48px"
  "24": "96px"
  "36": "144px"
components:
  button-primary:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.amber-ink}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "32px"
  button-primary-hover:
    backgroundColor: "{colors.amber-deep}"
    textColor: "{colors.amber-ink}"
  button-primary-lg:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.amber-ink}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "36px"
  button-secondary:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "32px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.ink-muted}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "32px"
  button-ghost-hover:
    backgroundColor: "{colors.surface-2}"
    textColor: "{colors.ink}"
  button-destructive:
    backgroundColor: "rgba(224, 96, 95, 0.2)"
    textColor: "{colors.destructive}"
    rounded: "{rounded.md}"
    padding: "0 10px"
    height: "32px"
  input:
    backgroundColor: "rgba(255, 255, 255, 0.04)"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "4px 10px"
    height: "32px"
  input-room-code:
    backgroundColor: "rgba(255, 255, 255, 0.04)"
    textColor: "{colors.ink}"
    typography: "{typography.code}"
    rounded: "{rounded.md}"
    padding: "4px 10px"
    height: "56px"
  chip-singer:
    backgroundColor: "{colors.gel-rose}"
    textColor: "#1A0A10"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  chip-everyone:
    backgroundColor: "rgba(233, 168, 74, 0.2)"
    textColor: "{colors.amber}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  badge-demo:
    backgroundColor: "{colors.ground}"
    textColor: "{colors.ink-faint}"
    typography: "{typography.label}"
    rounded: "{rounded.pill}"
    padding: "2px 8px"
  caption-chip:
    backgroundColor: "rgba(14, 15, 15, 0.7)"
    textColor: "{colors.ink}"
    rounded: "{rounded.md}"
    padding: "4px 8px"
  card:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.xl}"
    padding: "24px"
  tile-participant:
    backgroundColor: "{colors.surface}"
    textColor: "{colors.ink}"
    rounded: "{rounded.lg}"
  nav-pill:
    backgroundColor: "rgba(222, 222, 222, 0.04)"
    textColor: "{colors.ink-muted}"
    rounded: "11px"
    padding: "6px 6px 6px 12px"
  nav-pill-cta:
    backgroundColor: "{colors.amber}"
    textColor: "{colors.amber-ink}"
    rounded: "{rounded.lg}"
    padding: "0 14px"
    height: "36px"
---

# Design System: Harmoniq

## Overview

**Creative North Star: "The Stage Plan"**

Harmoniq is drawn the way an independent record label draws a stage plan for one night: a near-black sheet with a faint hairline grid, one enormous light wordmark set on it like the label's mark, and the friends who will sing placed around it as small stage-lit cards. Nothing is lit for decoration. Colour arrives only as light does on a stage: as a gel wash across a surface, as the one amber lamp that marks what is happening now, and as the lyric line filling from left to right while it is sung. The type carries the register: Geist set light and very large for the wordmark, statements and headlines, medium for the lyric lines, and Geist Mono for anything that behaves like a code, a timer or a plan annotation.

The interface is dark only and quiet by default. Surfaces are three near-black greys separated by 8 percent white hairlines, never by shadow. Depth is tonal; the only softness is the glass of the two translucent bars (the fixed pill navigation and the transport bar) and the stage-light gradients that stand in for photography. Density is low on the landing (one idea per viewport, a 96 to 144 px section rhythm) and moderate in the room, where the lyric panel is the largest, calmest region and the call controls stay small until touched.

Confirmed rejections: the feature-card hero, the neon-glow dark theme (no outer glows, no coloured drop shadows, no gradient text outside the lyric sweep), heavy display weights, and a light theme.

**Key Characteristics:**
- Neutral near-black ground with a faint hairline grid, faded at the edges
- One light grotesque (Geist 300) set very large; headlines never go heavy
- Stage Amber is the only accent: sweep fill, primary action, host crown, progress
- Eight singer gels identify people and their lines; never used for decoration
- Stage-light radial gradients (teal, magenta, violet) on tiles in place of photography
- Small radii (6 px base, 10 px frames), hairline borders, no shadows at rest
- Glass pill navigation fixed at the bottom of the landing
- Geist Mono, small, uppercase and tracked 0.2em for functional labels, codes and timers

## Colors

A monochrome stage with one lamp: three greys for ground and surfaces, three for type, Stage Amber as the sole accent, and eight saturated-but-not-neon gels that belong to people.

### Primary
- **Stage Amber** (`amber`): the only accent. It fills the active lyric line as it is sung (for "everyone" lines), colours the primary button and the pill-nav "Open a room" action, the host crown, the play button, progress fills, the marquee dots, the focus outline and the text selection (35 percent mix). At 10 to 20 percent alpha it becomes a warm field behind an "Everyone" chip or a headphone notice.
- **Amber Deep** (`amber-deep`): the hover state of the pill-nav primary action. Shadcn buttons hover to 80 percent alpha amber instead; both read as the lamp dimming, not changing hue.
- **Amber Ink** (`amber-ink`): the near-black text set on amber surfaces (buttons, the record's label).

### Neutral
- **Ground** (`ground`): the page and html background, the stage floor. Also the fill of the "Demo" badge and, at 70 percent alpha with backdrop blur, the caption chips over video tiles.
- **Surface** (`surface`): cards, frames, the lyric panel, participant tiles without video, the setlist visuals.
- **Surface 2** (`surface-2`): the secondary button, the muted chip behind a waiting singer's name, the back sheet of the stacked hero demo.
- **Surface 3** (`surface-3`): the accent and hover fill of shadcn (`--accent`), the "Karaoke" tag background in search rows.
- **Popover** (`popover`): menus and tooltips, one step above Surface.
- **Ink** (`ink`): off-white for the wordmark, headlines, primary copy and the unsung half of the active lyric.
- **Ink Muted** (`ink-muted`): the second grey for body copy, the second half of statements, nav links at rest, waiting lyric lines, timers.
- **Ink Faint** (`ink-faint`): the third grey for sung-past lyric lines, "Demo" labels, hints and empty states. Never for body text.
- **Line** (`line`): 8 percent white hairline used on every border, divider and grid line.
- **Line Strong** (`line-strong`): 14 percent white for input borders, the demo card's front edge, progress tracks and the pill-nav separator.

### Singer Gels
Eight gels, each with its own dark ink so a name reads on its own chip: **Rose** (`gel-rose`, ink `#1A0A10`), **Teal** (`gel-teal`, ink `#06201D`), **Violet** (`gel-violet`, ink `#130C24`), **Lime** (`gel-lime`, ink `#101A05`), **Sky** (`gel-sky`, ink `#071626`), **Coral** (`gel-coral`, ink `#24100A`), **Orchid** (`gel-orchid`, ink `#200A1E`), **Gold** (`gel-gold`, ink `#221B06`). A singer picks one in the lobby. It appears as the dot beside their name, the border and 2 px inset ring of their tile while they speak, the filled chip beside a lyric line assigned to them, and the sweep fill of that line. Rose also serves as the "mic off" and preview-error tint; Teal as the mic-level meter and the "copied" check. Tile gradients and the landing's stage-lit cards are drawn in OKLCH in the same hue families (rose 330 to 340, teal 172 to 175, violet 262) at low chroma, so a person's tile and their chip belong to each other.

### Status
- **Destructive** (`destructive`): the shadcn destructive role, shown as a 20 percent field with the colour as text (mic off, camera off). Not a brand colour.

Note: the viewport `themeColor` in `src/app/layout.tsx` (`#0e0b12`) predates this world and should be brought to Ground.

### Named Rules
**The One Lamp Rule.** Stage Amber is the only accent. If something is amber it is either the primary action or what is happening now (the sung part of the lyric, the host, the playhead). Never use amber for decoration, headings or a second button.

**The Gel Belongs to a Person Rule.** Singer gels colour people and the lines assigned to them: name dot, tile ring, chip, sweep. They never colour buttons, headings, icons or backgrounds that are not that person's tile.

**The Light Not Glow Rule.** Colour arrives as a field (a radial wash across a tile, a 10 to 20 percent alpha panel) or a fill (the sweep). It is never an outer glow, a coloured drop shadow or a halo around an element.

## Typography

**Display Font:** Geist (with ui-sans-serif, system-ui, sans-serif), loaded through next/font as `--font-geist`
**Body Font:** Geist (same family, 400)
**Label/Mono Font:** Geist Mono (with ui-monospace, SFMono-Regular, Menlo, monospace), `--font-geist-mono`

**Character:** One grotesque doing everything, so the contrast comes from size and weight, not from mixing faces. Display and headline text is set light (300) and tracked tight (-0.035em); the lyric line is set medium (500) so it holds up while it fills with colour; the mono face handles everything that is a plan annotation rather than prose. Body copy uses the stylistic sets `ss01` and `cv11`.

### Hierarchy
- **Display** (300, 18vw / 15vw from sm / 11.5vw from lg, line-height 0.9): the wordmark only, with the three-bar meter mark hung off its top-right corner at 3vw.
- **Statement** (300, `clamp(2rem, 5vw, 4.5rem)`, line-height 1.05): the label's "about" register: three or four short lines with alternate lines in Ink Muted. The closing headline runs larger (`clamp(2.5rem, 7vw, 6rem)`, line-height 0.95); the marquee sits between (`clamp(2rem, 4.5vw, 4rem)`).
- **Headline** (300, 1.875rem / 2.25rem from sm, up to 3rem for the disc): feature-row and section headlines in Ink. No eyebrow above them.
- **Title** (500, 1.5rem; 1.875rem to 2.25rem for the lobby room name): room and panel titles. The wordmark in the top bar and footer uses the condensed variant (500, -0.04em, 1.25rem).
- **Lyric** (500, -0.02em): the active line at 1.875rem / 2.25rem / 3rem across breakpoints, line-height 1.2, set 600 in the live room; the previous and next lines at 1.125rem / 1.25rem in Ink Faint (70 percent) and Ink Muted. The landing demo runs the same ramp one step smaller.
- **Body** (400, 0.875rem / 1rem from sm, line-height 1.5): copy in Ink Muted under Ink headings, held to about 28 to 36rem (`max-w-md` to `max-w-xl`).
- **Caption** (400 to 500, 0.75rem; 10 to 11px inside tiles): figure captions in Ink, name chips over video.
- **Label** (Geist Mono 400, 10 to 12px, uppercase, tracking 0.2em, Ink Muted or Ink Faint): functional section labels inside the operating surfaces ("Now singing", "Ready to join", "Open a room" above a form, "Lyrics, unsynced", "Demo"). This is a UI label style, used consistently across twelve app files. It is not a marketing eyebrow: landing headlines and statements carry no label above them.
- **Mono** (Geist Mono 400, 0.75rem, tabular numerals): timers, positions, drift readouts, step numbers ("01").
- **Code** (Geist Mono 600, 1.5rem, tracking 0.3em, uppercase, centered): the six-character room code input, shown as ABC-DEF. The room-code chip uses the same face at 0.875rem and 0.18em.

### Named Rules
**The Light and Large Rule.** Display and headline type is Geist 300, never 600 or above. Emphasis comes from size and from switching a line to Ink Muted, not from weight.

**The Mono Means Machine Rule.** Geist Mono is reserved for things a machine wrote: codes, timers, offsets, step numbers, and functional labels. Prose, headings and buttons never set in mono.

## Layout

The landing runs a single centered column with a 1400 px maximum width, 20 px side padding (32 px from sm). Sections breathe at 96 px vertical padding (144 px from lg); quieter sections (disc, expectations) take 48 px (96 px from lg). Feature rows use a 12-column grid at lg: copy in 5 columns, the working mock in 6, alternating sides row by row. The setlist is a bordered list divided by hairlines with a 6rem number column, a fluid text column and a 20rem visual column at lg.

The hero is `min-h-dvh` on the hairline grid (`grid-lines`: 1 px Line every 10 percent horizontally and every 20vh vertically, masked to a soft radial ellipse so it fades at the edges). Two stage cards are corner-anchored absolutely (top-left portrait at 176 to 208 px wide, right landscape at 224 to 256 px) and drift 10 to 16 px with the pointer; they are hidden below lg. The demo stack is `max-w-2xl` with two tilted sheets behind it (-3deg and 1.5deg) and the rotating text ring hung 96 px off its left edge at lg.

The pill nav is fixed 16 px from the bottom (24 px from sm) and centered; the quiet top bar is absolute, 64 px tall. The footer reserves `pb-24` so the pill never covers it.

In the app, the room stage gives the lyric panel the largest region and keeps the YouTube player visible beside it at no less than 200 px tall. Panels use 16 px internal padding (24 px from sm); cards 24 px (32 to 40 px from sm). Gaps inside components step 6 / 8 / 12 / 16 px. Breakpoints are Tailwind's defaults (sm 640, md 768, lg 1024, xl 1280).

Motion is short and eases out: `--ease-out-soft` (cubic-bezier(0.22, 1, 0.36, 1)) with 150 / 240 / 420 ms durations for state changes; the hero enters on a GSAP `power3.out` timeline (0.6 to 1.1 s, staggered 0.15 s); the marquee loops in 28 s and the text ring and disc in 18 s. Everything stops under `prefers-reduced-motion`.

## Elevation & Depth

Flat by default. Depth is tonal: Ground, Surface, Surface 2 and Surface 3 step up in lightness by roughly 3 percent each, and every edge is an 8 percent hairline. There are no resting shadows on cards, buttons, inputs or tiles. The few exceptions are physical objects or light: the fixed pill nav casts one soft shadow so it reads as floating above the page; a speaking participant's tile takes a 2 px inset ring in their gel (an inset, not a glow); and the two translucent bars use `bar-material` (Ground at 72 percent with an 18 px blur and 1.2 saturation), falling back to solid Ground under `prefers-reduced-transparency`.

Colour depth comes from the `gel-wash` field (an amber radial at 22 percent from the top-left and a rose radial at 14 percent from the bottom-right over Surface), used behind a tile without video, the lobby preview, the auth layout and the "Open a room" card. Stage cards and demo tiles are lit with OKLCH radial or linear gradients toward `#0a0b0b`, sometimes with a 16 percent grain overlay and a soft flare, standing in for photography.

### Shadow Vocabulary
- **Floating bar** (`box-shadow: 0 20px 60px -20px rgba(0,0,0,0.8)`): the pill nav only.
- **Speaking ring** (`box-shadow: inset 0 0 0 2px <gel>`): the active participant tile and demo tile, paired with the border in the same gel.

### Named Rules
**The Hairline Not Shadow Rule.** Surfaces separate by a 1 px Line border and a tonal step, never by a drop shadow. A shadow is allowed only on the one element that floats over the page.

**The Wash Behind, Never Around Rule.** Gel and amber fields sit behind content as the background of the panel itself. Nothing carries a coloured glow at its edge.

## Shapes

Small radii, consistent across the platform: 6 px is the base (`--radius: 0.375rem`; buttons, inputs, chips, stage cards, the room-code input), 4 px for tiny tags and the thumbnail badge, 8 px for tiles and the pill-nav action (Tailwind `rounded-xl` resolves to 8.4 px here), 10 px for framed cards and the demo sheets, 11 px for the pill nav shell, and full pills for name chips, the "Demo" badge, progress tracks and the record. Borders are always 1 px and always a Line alpha, never a coloured border unless it is a singer's gel on their own tile. Tiles hold `aspect-video` in the room and `4/5` or `13/10` on the landing's stage cards. The disc, the record label and the play button are the only circles.

## Components

### Buttons
Quiet and small; the amber one is the only loud thing on a screen.
- **Shape:** 6 px radius (`rounded-lg`), 32 px tall by default (`h-8`), 36 px for `lg`, 24 and 28 px for `xs` and `sm`; icon buttons are square at the same heights. 0.875rem medium, 6 px gap, 10 px side padding.
- **Primary:** Stage Amber with Amber Ink text; hover dims to 80 percent alpha (the pill-nav CTA hovers to Amber Deep instead and sits at 36 px, 8 px radius, 14 px padding).
- **Secondary:** Surface 2 with Ink text; hover mixes 5 percent Ink into the fill. Used for "Join" beside a room code.
- **Outline:** Line Strong border over a 30 percent input tint; used for toggles (Mic on, Camera on) with `aria-pressed`.
- **Ghost:** transparent, Ink Muted, hover to Surface 2 and Ink; transport icon buttons.
- **Destructive:** 20 percent destructive field with destructive text, for the "off" state of mic and camera.
- **Focus:** 3 px ring in amber at 50 percent plus an amber border; `:focus-visible` elsewhere draws a 2 px amber outline offset 2 px. Active state translates 1 px down. Disabled drops to 50 percent opacity.

### Chips
- **Singer chip:** full pill, the singer's gel as fill with their paired ink as text, 10 to 11px medium; marks the line being sung. In its waiting form it is Surface 2 with Ink Muted text and a 6 to 8 px gel dot on the left.
- **Everyone chip:** amber at 20 percent with amber text, same geometry, for lines nobody owns.
- **Demo badge:** full pill, Ground fill, Line border, mono 10px uppercase tracked 0.2em in Ink Faint, pinned to the top-right corner of any synthetic frame at `-top-2.5`.
- **Caption chip:** 70 percent Ground with backdrop blur, 6 px radius, 0.75rem medium Ink; names over video tiles, with a gel dot, an amber crown for the host and a mic icon while speaking.
- **Karaoke tag:** Surface 3 fill, amber text, 4 px radius, 10px, with the mic-vocal icon.

### Cards / Containers
- **Corner Style:** 10 px for framed cards and mocks; 8 px for setlist visuals; 6 px for inner rows.
- **Background:** Surface; Ground for a nested control strip inside a Surface card; `gel-wash` for the one featured card on a screen.
- **Shadow Strategy:** none (see Elevation & Depth).
- **Border:** 1 px Line; Line Strong only on the hero demo's front sheet.
- **Internal Padding:** 16 px (24 px from sm) for mocks and panels; 24 px (32 to 40 px from sm) for cards.

### Inputs / Fields
- **Style:** 32 px tall, 6 px radius, Line Strong border, 30 percent tint of the input colour, 1rem text (0.875rem from md), Ink Muted placeholder.
- **Room code:** 56 px tall, mono 1.5rem semibold tracked 0.3em, centered, uppercase, placeholder ABC-DEF in Ink Faint; the hero uses a 40 px, 1rem variant tracked 0.25em.
- **Focus:** amber border plus a 3 px amber ring at 50 percent.
- **Error / Disabled:** destructive border and 40 percent destructive ring under `aria-invalid`; disabled at 50 percent opacity with an 80 percent input tint.
- **Selects:** 36 px, 6 px radius, Surface 2 at 60 percent, same focus treatment.

### Navigation
- **Pill nav (landing):** fixed and centered at the bottom; a 4 percent light glass shell (`rgba(222,222,222,0.04)`, `backdrop-blur-xl`) with a Line border, 11 px radius, 6 px padding (12 px on the left), the floating-bar shadow. Contents: the meter mark, three 0.875rem links in Ink Muted that hover to Ink (hidden below sm), a 1 px Line Strong separator, and the amber "Open a room" action with an arrow.
- **Top bar (landing):** absolute, 64 px, wordmark left, one Ink Muted link right. Deliberately quiet; the pill is the navigation.
- **App bars:** `bar-material` translucent strips with a Line top or bottom border (transport bar, live-room chrome).

### Participant Tile
`aspect-video`, 8 px radius, Line border, Surface fill. Video covers the tile (local video mirrored); without video the tile shows `gel-wash` with a 64 to 80 px initials avatar. A speaking singer's tile swaps the border to their gel and adds the 2 px inset ring over 200 ms. Caption chip bottom-left; a rose mic-off chip bottom-right when muted.

### Transport Bar
A `bar-material` strip: restart, a 36 px round amber play/pause, skip; mono tabular timers 48 px wide either side of the position slider (host) or a 6 px progress track in Line Strong with an amber fill (members). Members see a 36 px status circle (amber at 15 percent while playing, Surface 2 when paused) and the line "Host controls playback".

### Stage Card (landing)
A portrait or landscape figure that stands in for concert photography: a hue-driven OKLCH key light from above, a haze radial, a cooler floor bounce at hue+200, a blurred flare with a 1 px streak, 16 percent grain, a rotated mic glyph at 80 percent Ink, a caption chip top-left and a 0.75rem Ink figcaption below. 6 px radius, Line border.

### Lyric Sweep (signature)
The line being sung is transparent text over a two-stop `linear-gradient(90deg, <fill> var(--sweep), var(--ink) var(--sweep))` clipped to the glyphs; `--sweep` advances each frame on the LRC timing. The fill is Stage Amber for everyone's lines and the singer's gel for an assigned line, with that singer's chip in a 5.5 to 7rem column to the left. The previous line sits above in Ink Faint at 70 percent, the next two below in Ink Muted then Ink Faint. Under `prefers-reduced-motion` the sweep is set to 100 percent so the active line is a solid highlight. A polite live region announces the line once.

## Do's and Don'ts

### Do:
- **Do** set every headline and statement in Geist 300 with -0.035em tracking and let alternate lines fall to Ink Muted for rhythm.
- **Do** separate surfaces with 1 px Line borders and a tonal step (Ground, Surface, Surface 2, Surface 3); reserve the single floating shadow for the pill nav.
- **Do** keep Stage Amber to the primary action and to what is happening now; one amber element per region is the norm.
- **Do** colour a person with their gel everywhere they appear: name dot, tile ring while speaking, chip, and the sweep of their assigned line, always pairing the gel with its listed ink for text on it.
- **Do** use `gel-wash` or an OKLCH stage-light gradient toward `#0a0b0b` wherever photography would otherwise go.
- **Do** set codes, timers, offsets and step numbers in Geist Mono with tabular numerals; set functional section labels in the app as mono 10 to 12px uppercase tracked 0.2em.
- **Do** label every synthetic or placeholder frame with the "Demo" badge.
- **Do** keep the YouTube player visible at no less than 200 px tall beside the lyric panel.
- **Do** honour `prefers-reduced-motion` (sweep becomes a solid highlight, marquee and ring stop) and `prefers-reduced-transparency` (glass becomes solid Ground).

### Don't:
- **Don't** add outer glows, coloured drop shadows, neon borders or halo effects; colour is a field or a fill, never a glow.
- **Don't** introduce a second accent or use a singer gel on a button, heading, icon or background that does not belong to that singer.
- **Don't** set display or headline text at 600 or heavier, and don't mix in a second display face.
- **Don't** place a kicker or eyebrow label above a landing headline; the mono label style is for functional sections inside the app, not for marketing copy.
- **Don't** use em dashes or en dashes anywhere in interface copy; use hyphens, commas, colons or rephrase.
- **Don't** use emoji as icons; every icon is a Lucide SVG.
- **Don't** ship a light theme or light surfaces; the world is dark only.
- **Don't** invent testimonials, counts or real-looking screenshots; demo content stays plainly synthetic and labelled.

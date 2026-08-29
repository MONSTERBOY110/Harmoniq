# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Stack

delegated: Next.js 16 (App Router, TypeScript, Turbopack) + Tailwind CSS v4 + shadcn/ui, Motion + GSAP for motion, Firebase (Auth + Firestore) for accounts and durable room state, LiveKit Cloud for audio/video and low-latency data, YouTube IFrame Player API for playback, LRCLIB for synced lyrics. npm. Deploy target Vercel. Chosen by Claude after the user delegated the stack; the user chose Firebase, LiveKit, the dual YouTube search adapter, and the karaoke-version approach in a decision round on 2026-08-29.

## Users

Groups of friends (typically 2 to 6 people, ages roughly 18 to 35) who are apart and want a karaoke night together. Situation: evening, at home, on a laptop or desktop with a webcam, ideally wearing headphones. State of mind: playful, social, a little self-conscious about singing on camera. One of them opens a room and shares a code or link; the others join within minutes. Mobile is a secondary joining path, not the primary stage.

## Product Purpose

Harmoniq lets friends see each other on a live video call while singing the same song together, in time, with lyrics on screen. Success for a session: everyone joined without a tutorial, at least one song played in sync with readable lyrics, and people laughed and stayed for another song. Success for the product: a room can be opened, shared, and sung in within two minutes of signing up.

## Positioning

The video call and the karaoke track live on one screen and are driven by one shared, host-controlled timeline: when the host presses play, every friend's karaoke video and lyric line move together. Search covers any song on YouTube (karaoke versions are found automatically), and synced lyrics come from an open lyrics database, so there is no fixed catalog to run out of. Neighboring products either do video calls without a shared music timeline, or synced YouTube watching without singing-oriented lyrics and a call built for voices.

## Operating Context

- A host opens a room, shares a six-character code or a link, and controls playback (play, pause, skip, queue order, lyrics timing).
- Members join from the link, pass a camera/mic preflight, and are told to wear headphones.
- Songs are searched from inside the room; results are YouTube videos, preferably karaoke or instrumental versions; anyone can add to the queue by default.
- Lyrics are synchronized LRC lines from LRCLIB and often need a timing offset because the karaoke video's intro differs from the original recording.
- Playback happens locally on each browser via the visible YouTube player; audio and video of the people travel over WebRTC (LiveKit).
- Free-tier quotas matter: Firestore 50k reads / 20k writes per day, LiveKit 5,000 participant minutes per month, YouTube Data API 10,000 units per day (about 100 searches).

## Capabilities and Constraints

Confirmed capabilities (v1): email/password and Google sign-in; create room; join by code or link; lobby preflight with a singer colour choice; duet parts (lines assigned to singers, shown in their colour); video call with mute/camera/device controls; YouTube song search with a karaoke toggle and paste-a-link; shared queue with host reordering; host-authoritative synchronized playback with automatic drift correction; synced lyrics with a host-adjustable offset and a personal nudge; chat; ephemeral reactions; host handoff when the host leaves; settings for display name and default devices.

Constraints:
- The YouTube player must remain visible on screen (YouTube API terms forbid background or hidden playback, and require at least 200 by 200 px). Harmoniq keeps it as a small "instrumental" tile beside the lyrics; the lyrics panel is the stage. Audio-only or stripped-vocal playback is out of scope.
- Singers hear each other with network latency of roughly 100 to 300 ms; the product does not promise perfectly simultaneous voices.
- Echo from speakers into the microphone is mitigated by echo cancellation and by recommending headphones; it cannot be eliminated.
- Cloud Storage is not on Firebase's free plan; avatars come from Google profile photos or generated initials. No uploads in v1.
- Videos with embedding disabled cannot play and are skipped automatically.
- Lyrics availability depends on LRCLIB coverage; when unavailable, the UI says so and relies on the karaoke video's on-screen lyrics. Lyrics are never fabricated.
- Undecided: public room discovery (rooms are private by default in v1); recording or scoring of performances (out of scope for v1).

Terminology: room, host, member, queue, now singing, lyrics offset, karaoke version.

## Brand Commitments

- Name: Harmoniq.
- Visual reference pinned by the user on 2026-08-29: https://kuratemusic.com (independent record label site). Its register, translated to Harmoniq: neutral near-black ground with a faint hairline grid, off-white type, one large light grotesque display face, small radii, a glass pill navigation, stage-light gradients where the reference uses concert photography. Applies to the landing page and the whole platform.
- Dark interface only in v1 (the product is used in the evening with video tiles; a light theme is an explicit anti-goal).
- No em dashes or en dashes anywhere in user-facing text (user requirement). Use hyphens, commas, colons, or rephrase.
- No emoji used as icons; icons are SVG (Lucide).
- Copy is plain and warm, never hype. Banned words in UI copy: elevate, seamless, unleash, supercharge, revolutionize.

## Evidence on Hand

None yet. No testimonials, user counts, press, or benchmarks exist and none may be invented. Landing page demonstrations must use clearly synthetic content (placeholder names and generated tiles labeled as demo). Real product screenshots may be used once the room UI exists.

## Product Principles

1. One timeline, one host: every shared thing (song, position, queue, offset) has exactly one writer, and everyone else follows. Ambiguity about who controls playback is a bug.
2. The song is the stage: lyrics and the karaoke video get the largest, calmest region; call controls stay quiet until needed.
3. Two minutes to singing: sign up, open a room, share a code, add a song. Anything that lengthens that path needs a reason.
4. Honest about physics: state latency, echo, and headphone advice plainly instead of pretending they do not exist.
5. Free-tier frugal: high-frequency state goes over the data channel, not the database; nothing polls.

## Accessibility & Inclusion

Keyboard operable throughout (room code entry, queue, transport). Visible focus states. Lyric text meets 4.5:1 contrast against its panel in both waiting and active states. Motion respects prefers-reduced-motion (the lyric sweep becomes a solid highlight). Translucency respects prefers-reduced-transparency. Live regions announce new chat messages politely; playback state changes are announced once, not on every tick.

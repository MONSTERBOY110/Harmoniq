export type TrackGuess = { artist: string | null; title: string };

const KARAOKE_WORDS = /\b(karaoke|instrumental|backing track)\b/i;

/** True when a video title says it is a karaoke, instrumental, or backing track. */
export function looksLikeKaraoke(title: string): boolean {
  return KARAOKE_WORDS.test(title);
}

/** Search text for a karaoke version, unless the person already asked for one. */
export function buildKaraokeQuery(query: string): string {
  const trimmed = query.trim().replace(/\s+/g, " ");
  return KARAOKE_WORDS.test(trimmed) ? trimmed : `${trimmed} karaoke`;
}

const STYLE_OF =
  /[(\[]?\s*(?:in the style of|originally performed by|as made famous by|made famous by|originally by)\s+([^)\]|]+?)(?:\s*[)\]]|(?=\s+[-–—|]\s)|$)/i;
const QUOTED = /["“]([^"”]+)["”]/;
const BRACKETS = /\s*[(\[{][^)\]}]*[)\]}]/g;
const NOISE = new RegExp(
  [
    "karaoke(?:\\s+version)?",
    "instrumental(?:\\s+version)?",
    "backing track",
    "with lyrics",
    "lyrics?",
    "official(?:\\s+(?:music\\s+)?(?:video|audio))?",
    "music video",
    "hd",
    "4k",
    "1080p",
    "720p",
    "hq",
    "no vocals?",
    "with vocals?",
    "(?:lower|higher|original|female|male)\\s+key",
    "[-+]?\\d+\\s*semitones?",
    "version",
    "unplugged",
    "acoustic",
    "cover",
    "full song",
    "bollywood",
    "hindi",
    "(?:female|male|duet)\\s+version",
    "sing king(?:\\s+karaoke)?",
    "singking",
    "karafun",
    "zoom karaoke",
    "stingray karaoke",
  ].join("|"),
  "gi",
);
const NOISE_WORD = new RegExp(`\\b(?:${NOISE.source})\\b`, "gi");
const SEPARATORS = /\s+(?:-|–|—|\||:|•|·)\s+|\s*\|\s*/;

function tidy(part: string): string {
  return part
    .replace(/^[\s\-–—|:,.]+|[\s\-–—|:,.]+$/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

/**
 * Best-effort artist and title from a karaoke video title, for the lyrics lookup.
 * The result is shown as editable fields, so it only has to be close.
 */
export function guessTrackMeta(rawTitle: string, channel: string): TrackGuess {
  let text = rawTitle;
  // Karaoke channels often stamp their own name into titles ("... | Sing King Karaoke").
  if (channel && looksLikeKaraoke(channel)) {
    const escaped = channel.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    text = text.replace(new RegExp(escaped, "gi"), " ");
  }
  let styleArtist: string | null = null;
  let quotedTitle: string | null = null;

  // Emoji and other pictographs never belong to a song title.
  text = text.replace(/[\p{Extended_Pictographic}\u{FE0F}\u{200D}]/gu, " ");
  text = text.replace(STYLE_OF, (_match, artist: string) => {
    styleArtist = tidy(artist);
    return " ";
  });
  text = text.replace(QUOTED, (_match, title: string) => {
    quotedTitle = tidy(title);
    return " ";
  });
  let bracketArtist: string | null = null;
  text = text.replace(BRACKETS, (match) => {
    const inner = tidy(match.replace(/^[\s(\[{]+/, "").replace(/[)\]}]+$/, ""));
    // A bracket the noise filter leaves untouched is usually an artist credit, as in
    // "Yellow - Acoustic karaoke (Coldplay)". Without it LRCLIB matches on the title alone and
    // happily returns a different song of the same name.
    if (inner && tidy(inner.replace(NOISE_WORD, " ")) === inner) bracketArtist ??= inner;
    return " ";
  });
  text = text.replace(NOISE_WORD, " ");

  const parts = text.split(SEPARATORS).map(tidy).filter(Boolean);

  if (quotedTitle) {
    return { artist: parts[0] ?? styleArtist ?? bracketArtist, title: quotedTitle };
  }
  if (styleArtist) {
    return { artist: styleArtist, title: parts[0] ?? tidy(rawTitle) };
  }
  if (parts.length >= 3) {
    // "Song | Movie | Singer" is the common Bollywood karaoke shape: first is the song, last the singer.
    return { artist: parts[parts.length - 1]!, title: parts[0]! };
  }
  if (parts.length === 2) {
    return { artist: parts[0]!, title: parts[1]! };
  }
  return { artist: bracketArtist, title: parts[0] ?? tidy(rawTitle) };
}

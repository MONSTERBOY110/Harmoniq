const ISO_DURATION = /^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/;

/** "PT3M41S" -> 221000. Returns null for live streams ("P0D") or unparseable input. */
export function parseIsoDurationMs(value: string | undefined | null): number | null {
  if (!value) return null;
  const match = value.match(ISO_DURATION);
  if (!match) return null;
  const [, h = "0", m = "0", s = "0"] = match;
  const total = Number(h) * 3600 + Number(m) * 60 + Number(s);
  return total > 0 ? total * 1000 : null;
}

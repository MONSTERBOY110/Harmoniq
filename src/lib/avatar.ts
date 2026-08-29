/** Two-letter initials for an avatar fallback. */
export function initialsFor(name: string, email = ""): string {
  const source = name.trim() || email.split("@")[0]?.replace(/[._-]+/g, " ").trim() || "";
  if (!source) return "?";
  const words = source.split(/\s+/).filter(Boolean);
  if (words.length >= 2) {
    return (words[0]![0]! + words[1]![0]!).toUpperCase();
  }
  return words[0]!.slice(0, 2).toUpperCase();
}

/** Deterministic hue (0-359) from an id, for generated avatar backgrounds. */
export function avatarHue(id: string): number {
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = (hash * 31 + id.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) % 360;
}

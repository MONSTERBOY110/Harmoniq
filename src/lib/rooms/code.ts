/** Uppercase letters and digits without look-alikes (no 0, 1, I, L, O). */
export const ROOM_CODE_ALPHABET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
export const ROOM_CODE_LENGTH = 6;

const VALID = new RegExp(`^[${ROOM_CODE_ALPHABET}]{${ROOM_CODE_LENGTH}}$`);

function randomIndex(max: number): number {
  const cryptoObj = globalThis.crypto;
  if (cryptoObj?.getRandomValues) {
    const buffer = new Uint32Array(1);
    cryptoObj.getRandomValues(buffer);
    return buffer[0]! % max;
  }
  return Math.floor(Math.random() * max);
}

/** A new bare room code, e.g. "K7QM2X". Collision checks happen at the database. */
export function generateRoomCode(): string {
  let code = "";
  for (let i = 0; i < ROOM_CODE_LENGTH; i++) {
    code += ROOM_CODE_ALPHABET[randomIndex(ROOM_CODE_ALPHABET.length)];
  }
  return code;
}

/** "ABCDEF" -> "ABC-DEF" for display. */
export function formatRoomCode(code: string): string {
  return `${code.slice(0, 3)}-${code.slice(3)}`;
}

/**
 * Accepts what a person might paste: "abc-def", "ABC DEF", or a full room link.
 * Returns the bare uppercase code, or null when it cannot be a room code.
 */
export function normalizeRoomCode(input: string): string | null {
  let value = input.trim();
  const linkMatch = value.match(/\/room\/([^/?#]+)/i);
  if (linkMatch) value = linkMatch[1]!;
  value = value.replace(/[\s-]/g, "").toUpperCase();
  return VALID.test(value) ? value : null;
}

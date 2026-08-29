export type ElectableMember = { uid: string; joinedAtMs: number };

/**
 * Deterministic host succession: the earliest joiner who is still on the call, ties broken by uid.
 * Every client computes the same answer, so no coordination is needed to agree on the claimant.
 */
export function nextHost(
  members: ElectableMember[],
  online: Set<string>,
  departingUid: string,
): string | null {
  const candidates = members
    .filter((member) => online.has(member.uid) && member.uid !== departingUid)
    .sort((a, b) => a.joinedAtMs - b.joinedAtMs || (a.uid < b.uid ? -1 : a.uid > b.uid ? 1 : 0));
  return candidates[0]?.uid ?? null;
}

import { readFileSync } from "node:fs";
import { afterAll, beforeAll, beforeEach, describe, it } from "vitest";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, updateDoc, deleteDoc, serverTimestamp } from "firebase/firestore";

/**
 * Security rules, exercised against the Firestore emulator.
 * Run with: npm run test:rules   (wraps `firebase emulators:exec`).
 */
const HOST = process.env.FIRESTORE_EMULATOR_HOST;
const describeRules = HOST ? describe : describe.skip;

let env: RulesTestEnvironment;
const CODE = "ABCDEF";
const HOST_UID = "host-1";
const MEMBER_UID = "member-1";
const STRANGER_UID = "stranger-1";

function ctx(uid: string) {
  return env.authenticatedContext(uid).firestore();
}

async function seed() {
  await env.withSecurityRulesDisabled(async (admin) => {
    const db = admin.firestore();
    await setDoc(doc(db, "rooms", CODE), {
      code: CODE,
      name: "Test room",
      hostUid: HOST_UID,
      visibility: "private",
      createdAt: serverTimestamp(),
      settings: { anyoneCanQueue: true, anyoneCanSkip: false },
      memberCount: 2,
    });
    for (const [uid, role] of [
      [HOST_UID, "host"],
      [MEMBER_UID, "member"],
    ] as const) {
      await setDoc(doc(db, "rooms", CODE, "members", uid), {
        uid,
        displayName: uid,
        photoURL: null,
        role,
        joinedAt: serverTimestamp(),
        lastJoinedAt: serverTimestamp(),
        leftAt: null,
      });
    }
    await setDoc(doc(db, "rooms", CODE, "playback", "current"), {
      videoId: null,
      status: "idle",
      positionMs: 0,
      seq: 0,
      hostUid: HOST_UID,
    });
    await setDoc(doc(db, "rooms", CODE, "queue", "item-1"), {
      videoId: "abc",
      title: "Song",
      addedByUid: MEMBER_UID,
      status: "queued",
      order: "a0",
    });
  });
}

describeRules("firestore.rules", () => {
  beforeAll(async () => {
    const [host, port] = HOST!.split(":");
    env = await initializeTestEnvironment({
      projectId: "harmoniq-rules-test",
      firestore: {
        host: host!,
        port: Number(port),
        rules: readFileSync("firestore.rules", "utf8"),
      },
    });
  });

  beforeEach(async () => {
    await env.clearFirestore();
    await seed();
  });

  afterAll(async () => {
    await env.cleanup();
  });

  it("lets members read the room and keeps strangers out", async () => {
    await assertSucceeds(getDoc(doc(ctx(MEMBER_UID), "rooms", CODE)));
    await assertFails(getDoc(doc(ctx(STRANGER_UID), "rooms", CODE)));
  });

  it("only the host writes playback", async () => {
    await assertSucceeds(
      setDoc(doc(ctx(HOST_UID), "rooms", CODE, "playback", "current"), { status: "playing" }, { merge: true }),
    );
    await assertFails(
      setDoc(doc(ctx(MEMBER_UID), "rooms", CODE, "playback", "current"), { status: "paused" }, { merge: true }),
    );
  });

  it("members can queue when the room allows it; the entry must carry their own uid", async () => {
    await assertSucceeds(
      setDoc(doc(ctx(MEMBER_UID), "rooms", CODE, "queue", "item-2"), {
        videoId: "xyz",
        title: "Other",
        addedByUid: MEMBER_UID,
        status: "queued",
        order: "a1",
      }),
    );
    await assertFails(
      setDoc(doc(ctx(MEMBER_UID), "rooms", CODE, "queue", "item-3"), {
        videoId: "xyz",
        title: "Forged",
        addedByUid: HOST_UID,
        status: "queued",
        order: "a2",
      }),
    );
  });

  it("owners remove their own queued song; others cannot; the host can remove anything", async () => {
    await assertFails(deleteDoc(doc(ctx(STRANGER_UID), "rooms", CODE, "queue", "item-1")));
    await assertSucceeds(deleteDoc(doc(ctx(HOST_UID), "rooms", CODE, "queue", "item-1")));
  });

  it("members change their own colour but never their role", async () => {
    await assertSucceeds(updateDoc(doc(ctx(MEMBER_UID), "rooms", CODE, "members", MEMBER_UID), { color: "teal" }));
    await assertFails(updateDoc(doc(ctx(MEMBER_UID), "rooms", CODE, "members", MEMBER_UID), { role: "host" }));
    await assertFails(updateDoc(doc(ctx(MEMBER_UID), "rooms", CODE, "members", HOST_UID), { color: "rose" }));
  });

  it("nobody but the host can change the host, and even the host cannot change it client-side", async () => {
    await assertFails(updateDoc(doc(ctx(MEMBER_UID), "rooms", CODE), { hostUid: MEMBER_UID }));
    await assertFails(updateDoc(doc(ctx(HOST_UID), "rooms", CODE), { hostUid: MEMBER_UID }));
    await assertSucceeds(updateDoc(doc(ctx(HOST_UID), "rooms", CODE), { name: "Renamed" }));
  });

  it("chat messages need the sender's uid and a bounded length", async () => {
    await assertSucceeds(
      setDoc(doc(ctx(MEMBER_UID), "rooms", CODE, "messages", "m1"), {
        uid: MEMBER_UID,
        displayName: "m",
        text: "hello",
        createdAt: serverTimestamp(),
      }),
    );
    await assertFails(
      setDoc(doc(ctx(MEMBER_UID), "rooms", CODE, "messages", "m2"), {
        uid: MEMBER_UID,
        displayName: "m",
        text: "x".repeat(501),
        createdAt: serverTimestamp(),
      }),
    );
  });

  it("the lyrics cache is read-only for clients", async () => {
    await assertFails(setDoc(doc(ctx(MEMBER_UID), "lyricsCache", "a|b"), { syncedLyrics: "x" }));
  });
});

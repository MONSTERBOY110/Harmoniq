import type { User } from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { firestore } from "@/lib/firebase/client";

/** Creates or refreshes users/{uid} from the Firebase Auth user. */
export async function upsertProfile(user: User, overrides: { displayName?: string } = {}) {
  const ref = doc(firestore(), "users", user.uid);
  const snapshot = await getDoc(ref);
  const displayName = overrides.displayName ?? user.displayName ?? user.email?.split("@")[0] ?? "Singer";
  await setDoc(
    ref,
    {
      displayName,
      photoURL: user.photoURL ?? null,
      email: user.email ?? "",
      lastSeenAt: serverTimestamp(),
      ...(snapshot.exists() ? {} : { createdAt: serverTimestamp() }),
    },
    { merge: true },
  );
}

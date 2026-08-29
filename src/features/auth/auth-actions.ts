import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
  type User,
} from "firebase/auth";
import { firebaseAuth, googleProvider } from "@/lib/firebase/client";
import { clearSessionCookie, syncSessionCookie } from "./session-sync";
import { upsertProfile } from "./profile";
import type { SignInValues, SignUpValues } from "./schemas";

async function finishSignIn(user: User, overrides?: { displayName?: string }) {
  await Promise.all([upsertProfile(user, overrides), syncSessionCookie(user, true)]);
}

export async function signUpWithEmail(values: SignUpValues): Promise<User> {
  const credential = await createUserWithEmailAndPassword(
    firebaseAuth(),
    values.email,
    values.password,
  );
  await updateProfile(credential.user, { displayName: values.displayName });
  await finishSignIn(credential.user, { displayName: values.displayName });
  return credential.user;
}

export async function signInWithEmail(values: SignInValues): Promise<User> {
  const credential = await signInWithEmailAndPassword(
    firebaseAuth(),
    values.email,
    values.password,
  );
  await finishSignIn(credential.user);
  return credential.user;
}

export async function signInWithGoogle(): Promise<User> {
  const credential = await signInWithPopup(firebaseAuth(), googleProvider());
  await finishSignIn(credential.user);
  return credential.user;
}

export async function signOutEverywhere(): Promise<void> {
  await clearSessionCookie();
  await signOut(firebaseAuth());
}

const GENERIC = "Something went wrong. Please try again.";

const COPY: Record<string, string | null> = {
  "auth/email-already-in-use": "That email already has an account. Sign in instead.",
  "auth/invalid-credential": "That email and password do not match.",
  "auth/wrong-password": "That email and password do not match.",
  "auth/user-not-found": "That email and password do not match.",
  "auth/invalid-email": "Enter a valid email address.",
  "auth/weak-password": "Use at least 8 characters.",
  "auth/too-many-requests": "Too many attempts. Wait a minute and try again.",
  "auth/network-request-failed": "You seem to be offline. Check your connection and try again.",
  "auth/popup-blocked": "Your browser blocked the Google sign-in window. Allow popups and try again.",
  "auth/account-exists-with-different-credential":
    "That email is already linked to a different sign-in method.",
  "auth/user-disabled": "This account has been disabled.",
  "auth/operation-not-allowed": "That sign-in method is not enabled yet.",
  // Quiet cancels: the user closed the popup on purpose.
  "auth/popup-closed-by-user": null,
  "auth/cancelled-popup-request": null,
};

/**
 * Turns a Firebase Auth error (or anything thrown) into copy safe to show a person.
 * Returns null when the situation should not show an error at all.
 */
export function friendlyAuthError(error: unknown): string | null {
  const code =
    typeof error === "object" && error !== null && "code" in error
      ? String((error as { code: unknown }).code)
      : null;
  if (code && code in COPY) return COPY[code];
  return GENERIC;
}

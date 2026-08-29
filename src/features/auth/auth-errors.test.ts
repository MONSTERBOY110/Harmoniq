import { describe, expect, it } from "vitest";
import { friendlyAuthError } from "./auth-errors";

describe("friendlyAuthError", () => {
  it("maps a Firebase error code to human copy", () => {
    expect(friendlyAuthError({ code: "auth/email-already-in-use" })).toBe(
      "That email already has an account. Sign in instead.",
    );
  });

  it("maps invalid credentials without revealing which field was wrong", () => {
    expect(friendlyAuthError({ code: "auth/invalid-credential" })).toBe(
      "That email and password do not match.",
    );
    expect(friendlyAuthError({ code: "auth/wrong-password" })).toBe(
      "That email and password do not match.",
    );
  });

  it("treats a closed Google popup as a quiet cancel", () => {
    expect(friendlyAuthError({ code: "auth/popup-closed-by-user" })).toBeNull();
    expect(friendlyAuthError({ code: "auth/cancelled-popup-request" })).toBeNull();
  });

  it("falls back to generic copy for unknown codes and non-Firebase errors", () => {
    expect(friendlyAuthError({ code: "auth/something-new" })).toBe(
      "Something went wrong. Please try again.",
    );
    expect(friendlyAuthError(new Error("boom"))).toBe("Something went wrong. Please try again.");
    expect(friendlyAuthError(undefined)).toBe("Something went wrong. Please try again.");
  });

  it("never contains an em dash or en dash", () => {
    const codes = [
      "auth/email-already-in-use",
      "auth/invalid-credential",
      "auth/user-not-found",
      "auth/weak-password",
      "auth/too-many-requests",
      "auth/network-request-failed",
      "auth/invalid-email",
      "auth/popup-blocked",
      "auth/account-exists-with-different-credential",
      "auth/unknown",
    ];
    for (const code of codes) {
      const copy = friendlyAuthError({ code });
      if (copy) expect(copy).not.toMatch(/[–—]/);
    }
  });
});

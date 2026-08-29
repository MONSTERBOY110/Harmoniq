import { describe, expect, it } from "vitest";
import { signInSchema, signUpSchema } from "./schemas";

describe("signInSchema", () => {
  it("accepts a valid email and any non-empty password", () => {
    const result = signInSchema.safeParse({ email: "sam@example.com", password: "x" });
    expect(result.success).toBe(true);
  });

  it("trims and lowercases the email", () => {
    const result = signInSchema.safeParse({ email: "  Sam@Example.com ", password: "secret" });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.email).toBe("sam@example.com");
  });

  it("rejects a malformed email with plain copy", () => {
    const result = signInSchema.safeParse({ email: "not-an-email", password: "secret" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Enter a valid email address.");
    }
  });

  it("requires a password", () => {
    const result = signInSchema.safeParse({ email: "sam@example.com", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Enter your password.");
    }
  });
});

describe("signUpSchema", () => {
  it("requires a display name between 2 and 40 characters", () => {
    expect(
      signUpSchema.safeParse({ displayName: "S", email: "sam@example.com", password: "longenough" })
        .success,
    ).toBe(false);
    expect(
      signUpSchema.safeParse({
        displayName: "Sam",
        email: "sam@example.com",
        password: "longenough",
      }).success,
    ).toBe(true);
  });

  it("requires at least 8 characters for the password", () => {
    const result = signUpSchema.safeParse({
      displayName: "Sam",
      email: "sam@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error.issues[0]?.message).toBe("Use at least 8 characters.");
    }
  });

  it("trims whitespace around the display name", () => {
    const result = signUpSchema.safeParse({
      displayName: "  Sam  ",
      email: "sam@example.com",
      password: "longenough",
    });
    expect(result.success).toBe(true);
    if (result.success) expect(result.data.displayName).toBe("Sam");
  });
});

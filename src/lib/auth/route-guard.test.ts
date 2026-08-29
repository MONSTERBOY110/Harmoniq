import { describe, expect, it } from "vitest";
import { decideRedirect, isAuthPage, isProtectedPath } from "./route-guard";

describe("isProtectedPath", () => {
  it("protects the app routes", () => {
    expect(isProtectedPath("/rooms")).toBe(true);
    expect(isProtectedPath("/room/ABC-DEF")).toBe(true);
    expect(isProtectedPath("/settings")).toBe(true);
  });

  it("leaves public routes open", () => {
    expect(isProtectedPath("/")).toBe(false);
    expect(isProtectedPath("/signin")).toBe(false);
    expect(isProtectedPath("/roomsy")).toBe(false);
  });
});

describe("isAuthPage", () => {
  it("recognises sign in and sign up", () => {
    expect(isAuthPage("/signin")).toBe(true);
    expect(isAuthPage("/signup")).toBe(true);
    expect(isAuthPage("/rooms")).toBe(false);
  });
});

describe("decideRedirect", () => {
  it("sends a signed-out visitor from a protected path to sign in with a return target", () => {
    expect(decideRedirect("/room/ABC-DEF", false)).toBe("/signin?next=%2Froom%2FABC-DEF");
  });

  it("sends a signed-in visitor away from auth pages to the rooms page", () => {
    expect(decideRedirect("/signin", true)).toBe("/rooms");
  });

  it("does nothing otherwise", () => {
    expect(decideRedirect("/", false)).toBeNull();
    expect(decideRedirect("/rooms", true)).toBeNull();
    expect(decideRedirect("/", true)).toBeNull();
  });
});

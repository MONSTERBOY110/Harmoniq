"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { onIdTokenChanged, type User } from "firebase/auth";
import { firebaseAuth, isFirebaseConfigured } from "@/lib/firebase/client";
import { syncSessionCookie } from "./session-sync";

type AuthStatus = "loading" | "signed-in" | "signed-out" | "unconfigured";

type AuthContextValue = {
  user: User | null;
  status: AuthStatus;
};

const AuthContext = createContext<AuthContextValue>({ user: null, status: "loading" });

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [status, setStatus] = useState<AuthStatus>(() =>
    isFirebaseConfigured() ? "loading" : "unconfigured",
  );

  useEffect(() => {
    if (!isFirebaseConfigured()) return;
    const unsubscribe = onIdTokenChanged(firebaseAuth(), async (next) => {
      setUser(next);
      setStatus(next ? "signed-in" : "signed-out");
      if (next) {
        // Keeps the httpOnly cookie fresh when Firebase rotates the ID token (about hourly).
        syncSessionCookie(next).catch(() => undefined);
      }
    });
    return unsubscribe;
  }, []);

  const value = useMemo(() => ({ user, status }), [user, status]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  return useContext(AuthContext);
}

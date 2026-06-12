"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

export type SessionUser = {
  id: string;
  email: string;
  name: string;
  nickname: string;
  avatarUrl: string | null;
  role: "user" | "admin";
};

type AuthContextValue = {
  user: SessionUser | null;
  isLoading: boolean;
  refresh: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  async function refresh() {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await response.json()) as { user: SessionUser | null };
      setUser(data.user);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }

  useEffect(() => {
    void refresh();
  }, []);

  const value = useMemo(() => ({ user, isLoading, refresh, logout }), [user, isLoading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}

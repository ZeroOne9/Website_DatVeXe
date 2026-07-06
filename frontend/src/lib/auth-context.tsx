"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { authService } from "@/services/authService";
import type { UserInfo } from "@/services/types";

type AuthState = {
  user: UserInfo | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserInfo>;
  register: (fullName: string, email: string, password: string, phone?: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const response = await authService.getMe();
      setUser(response.data.user);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const login = async (email: string, password: string) => {
    const response = await authService.login({ email, password });
    setUser(response.data.user);
    return response.data.user;
  };

  const register = async (fullName: string, email: string, password: string, phone?: string) => {
    const response = await authService.register({ fullName, email, password, phone });
    setUser(response.data.user);
  };

  const logout = async () => {
    await authService.logout().catch(() => null);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth phai nam trong AuthProvider");
  }

  return context;
}

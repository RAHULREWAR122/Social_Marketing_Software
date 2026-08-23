"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { apiRequest, ApiError } from "./api-client";

export type OrgRole = "OWNER" | "ADMIN" | "MANAGER" | "MEMBER" | "ANALYST";

export type AuthUser = {
  id: string;
  email: string;
  firstName?: string | null;
  lastName?: string | null;
};

export type Organization = {
  id: string;
  name: string;
  businessType?: string | null;
  country?: string | null;
  timezone: string;
  onboardingStep: string;
};

type AuthState = {
  status: "loading" | "authenticated" | "unauthenticated";
  user: AuthUser | null;
  organization: Organization | null;
  role: OrgRole | null;
  accessToken: string | null;
};

type AuthContextValue = AuthState & {
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (input: {
    email: string;
    password: string;
    organizationName: string;
    firstName?: string;
    lastName?: string;
  }) => Promise<void>;
  logout: () => Promise<void>;
  refreshOrganization: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

type MeResponse = {
  user: AuthUser & {
    memberships: { organization: Organization; role: OrgRole }[];
  };
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    status: "loading",
    user: null,
    organization: null,
    role: null,
    accessToken: null,
  });

  const loadMe = useCallback(async (accessToken: string) => {
    const { user } = await apiRequest<MeResponse>("/auth/me", { accessToken });
    const membership = user.memberships[0];
    setState({
      status: "authenticated",
      user,
      organization: membership?.organization ?? null,
      role: membership?.role ?? null,
      accessToken,
    });
  }, []);

  const tryRestoreSession = useCallback(async () => {
    try {
      const { accessToken } = await apiRequest<{ accessToken: string }>("/auth/refresh", {
        method: "POST",
      });
      await loadMe(accessToken);
    } catch {
      setState({ status: "unauthenticated", user: null, organization: null, role: null, accessToken: null });
    }
  }, [loadMe]);

  useEffect(() => {
    tryRestoreSession();
  }, [tryRestoreSession]);

  const login = useCallback(
    async (email: string, password: string) => {
      const { accessToken } = await apiRequest<{ accessToken: string }>("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      await loadMe(accessToken);
    },
    [loadMe],
  );

  const register = useCallback(
    async (input: {
      email: string;
      password: string;
      organizationName: string;
      firstName?: string;
      lastName?: string;
    }) => {
      const { accessToken } = await apiRequest<{ accessToken: string }>("/auth/register", {
        method: "POST",
        body: input,
      });
      await loadMe(accessToken);
    },
    [loadMe],
  );

  const logout = useCallback(async () => {
    await apiRequest("/auth/logout", { method: "POST" }).catch(() => undefined);
    setState({ status: "unauthenticated", user: null, organization: null, role: null, accessToken: null });
  }, []);

  const refreshOrganization = useCallback(async () => {
    if (!state.accessToken) return;
    await loadMe(state.accessToken);
  }, [loadMe, state.accessToken]);

  const isAdmin = state.role === "OWNER" || state.role === "ADMIN";

  const value = useMemo<AuthContextValue>(
    () => ({ ...state, isAdmin, login, register, logout, refreshOrganization }),
    [state, isAdmin, login, register, logout, refreshOrganization],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return ctx;
}

export { ApiError };

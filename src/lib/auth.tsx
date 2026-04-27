"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";

type Role = "user" | "admin";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: Role;
}

interface AuthContextValue {
  user: AuthUser | null;
  token: string | null;
  isReady: boolean;
  isAuthenticated: boolean;
  updateProfile: (payload: { name: string; email: string }) => void;
  login: (payload: { email: string; password: string }) => Promise<AuthUser>;
  signup: (payload: { name: string; email: string; password: string }) => Promise<AuthUser>;
  logout: () => void;
}

const STORAGE_KEY = "shopnest_auth_user";
const TOKEN_KEY = "shopnest_auth_token";
const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";
const GRAPHQL_URL = process.env.NEXT_PUBLIC_GRAPHQL_URL ?? `${API_URL}/graphql`;
const AUTH_TOKEN_COOKIE = "shopnest_token";
const AUTH_ROLE_COOKIE = "shopnest_role";

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const rawUser = window.localStorage.getItem(STORAGE_KEY);
    const rawToken = window.localStorage.getItem(TOKEN_KEY);

    if (rawUser) {
      try {
        const parsed = JSON.parse(rawUser) as AuthUser;
        if (parsed?.email && parsed?.role) {
          setUser(parsed);
        }
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }

    if (rawToken) {
      setToken(rawToken);
    }

    if (rawToken && rawUser) {
      try {
        const parsed = JSON.parse(rawUser) as AuthUser;
        if (parsed?.role) {
          setAuthCookies(rawToken, parsed.role);
        }
      } catch {
        // no-op
      }
    }
    setIsReady(true);
  }, []);

  const setAuthCookies = (nextToken: string, role: Role) => {
    const maxAge = 60 * 60 * 24 * 7;
    document.cookie = `${AUTH_TOKEN_COOKIE}=${encodeURIComponent(nextToken)}; path=/; max-age=${maxAge}; samesite=lax`;
    document.cookie = `${AUTH_ROLE_COOKIE}=${encodeURIComponent(role)}; path=/; max-age=${maxAge}; samesite=lax`;
  };

  const clearAuthCookies = () => {
    document.cookie = `${AUTH_TOKEN_COOKIE}=; path=/; max-age=0; samesite=lax`;
    document.cookie = `${AUTH_ROLE_COOKIE}=; path=/; max-age=0; samesite=lax`;
  };

  const persistSession = (nextUser: AuthUser, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
    window.localStorage.setItem(TOKEN_KEY, nextToken);
    setAuthCookies(nextToken, nextUser.role);
  };

  const requestAuth = async (query: string, variables: Record<string, unknown>) => {
    const response = await fetch(GRAPHQL_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query, variables })
    });

    const json = (await response.json()) as {
      data?: Record<string, { accessToken: string; user: AuthUser }>;
      errors?: Array<{ message: string }>;
    };

    if (json.errors?.length) {
      throw new Error(json.errors[0].message);
    }

    return json.data;
  };

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isReady,
      isAuthenticated: Boolean(user && token),
      updateProfile: ({ name, email }) => {
        if (!user) return;
        const nextUser: AuthUser = { ...user, name, email };
        setUser(nextUser);
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(nextUser));
      },
      login: async ({ email, password }) => {
        const data = await requestAuth(
          `mutation Login($input: LoginInput!) {
            login(input: $input) {
              accessToken
              user { id name email role }
            }
          }`,
          { input: { email, password } }
        );

        const payload = data?.login;
        if (!payload) throw new Error("Login failed");
        persistSession(payload.user, payload.accessToken);
        return payload.user;
      },
      signup: async ({ name, email, password }) => {
        const data = await requestAuth(
          `mutation Signup($input: SignupInput!) {
            signup(input: $input) {
              accessToken
              user { id name email role }
            }
          }`,
          { input: { name, email, password } }
        );

        const payload = data?.signup;
        if (!payload) throw new Error("Signup failed");
        persistSession(payload.user, payload.accessToken);
        return payload.user;
      },
      logout: () => {
        setUser(null);
        setToken(null);
        window.localStorage.removeItem(STORAGE_KEY);
        window.localStorage.removeItem(TOKEN_KEY);
        clearAuthCookies();
      }
    }),
    [isReady, user, token]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}


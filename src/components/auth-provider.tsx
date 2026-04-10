"use client";

import type { ReactNode } from "react";
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useSyncExternalStore,
} from "react";

import {
  buildStoredAccount,
  clearActiveSession,
  findStoredAccount,
  getActiveSession,
  saveActiveSession,
  saveStoredAccount,
  subscribeToActiveSession,
} from "@/lib/auth-storage";
import { registerPatient } from "@/lib/spring-api";
import type {
  AuthSession,
  LoginValues,
  PatientProfile,
  RegisterValues,
} from "@/types/auth";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

type AuthContextValue = {
  status: AuthStatus;
  session: AuthSession | null;
  login: (values: LoginValues) => Promise<void>;
  register: (values: RegisterValues) => Promise<PatientProfile>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const session = useSyncExternalStore(
    subscribeToActiveSession,
    getActiveSession,
    () => null,
  );
  const status: AuthStatus = session ? "authenticated" : "unauthenticated";

  const login = useCallback(async (values: LoginValues) => {
    const storedAccount = findStoredAccount(values);

    if (!storedAccount) {
      throw new Error(
        "User not found on this device yet. Register first or wait for the backend auth endpoint.",
      );
    }

    const nextSession: AuthSession = {
      patient: storedAccount.patient,
      signedInAt: new Date().toISOString(),
    };

    saveActiveSession(nextSession);
  }, []);

  const register = useCallback(async (values: RegisterValues) => {
    const patient = await registerPatient(values);
    const nextSession: AuthSession = {
      patient,
      signedInAt: new Date().toISOString(),
    };

    saveStoredAccount(buildStoredAccount(patient));
    saveActiveSession(nextSession);

    return patient;
  }, []);

  const logout = useCallback(() => {
    clearActiveSession();
  }, []);

  const value = useMemo(
    () => ({
      status,
      session,
      login,
      register,
      logout,
    }),
    [login, logout, register, session, status],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider.");
  }

  return context;
}

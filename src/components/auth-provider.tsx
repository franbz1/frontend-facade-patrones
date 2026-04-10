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
  clearActiveSession,
  getActiveSession,
  saveActiveSession,
  subscribeToActiveSession,
  updateActiveSession,
} from "@/lib/auth-storage";
import {
  ApiError,
  getCompleteHistory,
  loginPatient,
  logoutPatient,
  registerPatient,
} from "@/lib/spring-api";
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
  logout: () => Promise<void>;
  updatePatientProfile: (patient: PatientProfile) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);
const emptySubscribe = () => () => undefined;

export function AuthProvider({ children }: { children: ReactNode }) {
  const isClient = useSyncExternalStore(emptySubscribe, () => true, () => false);
  const session = useSyncExternalStore(
    subscribeToActiveSession,
    getActiveSession,
    () => null,
  );
  const status: AuthStatus = !isClient
    ? "loading"
    : session
      ? "authenticated"
      : "unauthenticated";

  const login = useCallback(async (values: LoginValues) => {
    const loginResponse = await loginPatient(values);
    const nextSession: AuthSession = {
      accessToken: loginResponse.accessToken,
      tokenType: loginResponse.tokenType,
      expiresAt: loginResponse.expiresAt,
      username: loginResponse.username,
      patientId: loginResponse.patientId,
      roles: loginResponse.roles,
      signedInAt: new Date().toISOString(),
      patient: null,
    };

    saveActiveSession(nextSession);

    try {
      const history = await getCompleteHistory(
        loginResponse.patientId,
        loginResponse.accessToken,
      );

      updateActiveSession((currentSession) =>
        currentSession
          ? {
              ...currentSession,
              patient: history.patient,
            }
          : currentSession,
      );
    } catch (error) {
      if (!(error instanceof ApiError) || error.status !== 401) {
        return;
      }

      clearActiveSession();
      throw error;
    }
  }, []);

  const register = useCallback(async (values: RegisterValues) => {
    const patient = await registerPatient(values);
    const loginResponse = await loginPatient({
      identifier: values.document,
      password: values.password,
    });

    saveActiveSession({
      accessToken: loginResponse.accessToken,
      tokenType: loginResponse.tokenType,
      expiresAt: loginResponse.expiresAt,
      username: loginResponse.username,
      patientId: loginResponse.patientId,
      roles: loginResponse.roles,
      signedInAt: new Date().toISOString(),
      patient,
    });

    return patient;
  }, []);

  const logout = useCallback(async () => {
    const activeSession = getActiveSession();

    if (activeSession) {
      try {
        await logoutPatient(activeSession.accessToken);
      } catch {
        // Always clear local session even if the API token is already invalid.
      }
    }

    clearActiveSession();
  }, []);

  const updatePatientProfile = useCallback((patient: PatientProfile) => {
    updateActiveSession((currentSession) =>
      currentSession
        ? {
            ...currentSession,
            patient,
          }
        : currentSession,
    );
  }, []);

  const value = useMemo(
    () => ({
      status,
      session,
      login,
      register,
      logout,
      updatePatientProfile,
    }),
    [login, logout, register, session, status, updatePatientProfile],
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

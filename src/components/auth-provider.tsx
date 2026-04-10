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
    console.info("[auth] login:start", {
      identifier: values.identifier,
    });

    try {
      const loginResponse = await loginPatient(values);

      console.info("[auth] login:success", {
        username: loginResponse.username,
        patientId: loginResponse.patientId,
        expiresAt: loginResponse.expiresAt,
        roles: loginResponse.roles,
      });

      saveActiveSession({
        accessToken: loginResponse.accessToken,
        tokenType: loginResponse.tokenType,
        expiresAt: loginResponse.expiresAt,
        username: loginResponse.username,
        patientId: loginResponse.patientId,
        roles: loginResponse.roles,
        signedInAt: new Date().toISOString(),
        patient: null,
      });

      console.info("[auth] session:saved", {
        patientId: loginResponse.patientId,
      });
    } catch (error) {
      console.error("[auth] login:error", error);
      throw error;
    }
  }, []);

  const register = useCallback(async (values: RegisterValues) => {
    console.info("[auth] register:start", {
      document: values.document,
      email: values.email,
    });

    try {
      const patient = await registerPatient(values);

      console.info("[auth] register:patient-created", {
        patientId: patient.id,
        document: patient.document,
      });

      const loginResponse = await loginPatient({
        identifier: values.document,
        password: values.password,
      });

      console.info("[auth] register:auto-login-success", {
        username: loginResponse.username,
        patientId: loginResponse.patientId,
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

      console.info("[auth] session:saved", {
        patientId: loginResponse.patientId,
      });

      return patient;
    } catch (error) {
      console.error("[auth] register:error", error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    const activeSession = getActiveSession();

    if (activeSession) {
      try {
        console.info("[auth] logout:start", {
          patientId: activeSession.patientId,
        });
        await logoutPatient(activeSession.accessToken);
        console.info("[auth] logout:remote-success", {
          patientId: activeSession.patientId,
        });
      } catch {
        // Always clear local session even if the API token is already invalid.
        console.warn("[auth] logout:remote-failed");
      }
    }

    clearActiveSession();
    console.info("[auth] session:cleared");
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

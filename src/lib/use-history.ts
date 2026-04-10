"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { getCompleteHistory, ApiError } from "@/lib/spring-api";
import type { CompleteHistoryResponse } from "@/types/medical";

export function useHistoryData() {
  const router = useRouter();
  const { logout, session, updatePatientProfile } = useAuth();
  const [history, setHistory] = useState<CompleteHistoryResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const patientId = session?.patientId ?? null;
  const accessToken = session?.accessToken ?? null;
  const hasPatientProfile = session?.patient != null;

  const loadHistory = useCallback(async () => {
    if (!patientId || !accessToken) {
      console.info("[history] load:skipped-no-session");
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);
    console.info("[history] load:start", {
      patientId,
      hasPatientProfile,
    });

    try {
      const response = await getCompleteHistory(patientId, accessToken);

      console.info("[history] load:success", {
        patientId: response.patient.id,
        consultations: response.consultations.length,
        pastAppointments: response.pastAppointments.length,
        prescriptions: response.prescriptions.length,
        laboratoryOrders: response.laboratoryOrders.length,
      });
      setHistory(response);
      updatePatientProfile(response.patient);
    } catch (fetchError) {
      console.error("[history] load:error", fetchError);
      if (fetchError instanceof ApiError && fetchError.status === 401) {
        console.warn("[history] load:unauthorized-redirect");
        await logout();
        router.replace("/login");
        return;
      }

      setError(
        fetchError instanceof Error
          ? fetchError.message
          : "No fue posible cargar tu historia clinica.",
      );
    } finally {
      setIsLoading(false);
    }
  }, [
    accessToken,
    hasPatientProfile,
    logout,
    patientId,
    router,
    updatePatientProfile,
  ]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  return {
    history,
    isLoading,
    error,
    refresh: loadHistory,
  };
}

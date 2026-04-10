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

  const loadHistory = useCallback(async () => {
    if (!session) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await getCompleteHistory(
        session.patientId,
        session.accessToken,
      );

      setHistory(response);
      updatePatientProfile(response.patient);
    } catch (fetchError) {
      if (fetchError instanceof ApiError && fetchError.status === 401) {
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
  }, [logout, router, session, updatePatientProfile]);

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

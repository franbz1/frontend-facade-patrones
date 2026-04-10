"use client";

import { HistoryTabs } from "@/components/history-tabs";
import { PortalShell } from "@/components/portal-shell";
import { InlineMessage } from "@/components/page-state";
import { ProtectedRoute } from "@/components/route-guards";
import { useHistoryData } from "@/lib/use-history";

export default function HistoryPage() {
  const { history, isLoading, error, refresh } = useHistoryData();

  return (
    <ProtectedRoute>
      <PortalShell
        title="Historia clinica"
        description="Consulta tus antecedentes, prescripciones y resultados de laboratorio en un solo lugar."
      >
        {isLoading ? (
          <InlineMessage
            title="Cargando historia clinica"
            description="Estamos reuniendo tu informacion medica."
          />
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6">
            <h2 className="text-lg font-semibold text-rose-100">
              No fue posible cargar la historia clinica
            </h2>
            <p className="mt-2 text-sm leading-6 text-rose-200">{error}</p>
            <button
              type="button"
              onClick={() => void refresh()}
              className="mt-4 inline-flex rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200"
            >
              Reintentar
            </button>
          </div>
        ) : null}

        {!isLoading && !error && history ? <HistoryTabs history={history} /> : null}
      </PortalShell>
    </ProtectedRoute>
  );
}

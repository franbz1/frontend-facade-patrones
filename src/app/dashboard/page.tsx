"use client";

import type { ReactNode } from "react";
import Link from "next/link";

import { LabResultBadge } from "@/components/lab-result-badge";
import { PortalShell } from "@/components/portal-shell";
import { InlineMessage } from "@/components/page-state";
import { ProtectedRoute } from "@/components/route-guards";
import { formatDateTime, formatList } from "@/lib/formatters";
import {
  getSpecialtyLabel,
  translateClinicalMessage,
} from "@/lib/medical-constants";
import { useHistoryData } from "@/lib/use-history";

export default function DashboardPage() {
  const { history, isLoading, error, refresh } = useHistoryData();

  return (
    <ProtectedRoute>
      <PortalShell
        title="Inicio"
        description="Consulta tu resumen medico, tus registros recientes y la informacion disponible en tu cuenta."
      >
        {isLoading ? (
          <InlineMessage
            title="Cargando inicio"
            description="Estamos reuniendo tu informacion clinica."
          />
        ) : null}

        {!isLoading && error ? (
          <div className="rounded-3xl border border-rose-500/30 bg-rose-500/10 p-6">
            <h2 className="text-lg font-semibold text-rose-100">
              No fue posible cargar la informacion principal
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

        {!isLoading && !error && history ? (
          <div className="grid gap-6">
            <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <MetricCard
                label="Consultas"
                value={history.consultations.length.toString()}
                helper="Disponibles en tu historia clinica."
              />
              <MetricCard
                label="Citas pasadas"
                value={history.pastAppointments.length.toString()}
                helper="Corresponden a las citas ya registradas en tu historial."
              />
              <MetricCard
                label="Prescripciones"
                value={history.prescriptions.length.toString()}
                helper="Indicaciones medicas registradas para tu cuenta."
              />
              <MetricCard
                label="Ordenes de laboratorio"
                value={history.laboratoryOrders.length.toString()}
                helper="Incluyen resultados y rangos de referencia."
              />
            </section>

            <section className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h2 className="text-2xl font-semibold text-white">
                      Proximas citas
                    </h2>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
                      En este momento el sistema principal solo muestra con
                      certeza las citas que ya forman parte de tu historia.
                    </p>
                  </div>
                  <Link
                    href="/appointments"
                    className="rounded-2xl bg-cyan-400 px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-cyan-300"
                  >
                    Agendar cita
                  </Link>
                </div>
                <div className="mt-6 rounded-3xl border border-dashed border-amber-500/30 bg-amber-500/10 p-5 text-sm leading-6 text-amber-100">
                  Las proximas citas todavia no estan disponibles en este resumen
                  general. Puedes registrar una nueva cita desde el modulo de
                  citas.
                </div>
              </article>

              <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-2xl font-semibold text-white">
                  Resumen del paciente
                </h2>
                <dl className="mt-5 grid gap-3 text-sm">
                  <OverviewRow label="Nombre">
                    {history.patient.firstName} {history.patient.lastName}
                  </OverviewRow>
                  <OverviewRow label="Documento">
                    {history.patient.document}
                  </OverviewRow>
                  <OverviewRow label="Correo">{history.patient.email}</OverviewRow>
                  <OverviewRow label="Telefono">{history.patient.phone}</OverviewRow>
                  <OverviewRow label="Alergias">
                    {formatList(history.allergies)}
                  </OverviewRow>
                </dl>
              </article>
            </section>

            <section className="grid gap-6 lg:grid-cols-2">
              <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <div className="flex items-center justify-between gap-4">
                  <h2 className="text-2xl font-semibold text-white">
                    Ultima prescripcion
                  </h2>
                  <Link
                    href="/history"
                    className="text-sm font-medium text-cyan-300 hover:text-cyan-200"
                  >
                    Ver historia completa
                  </Link>
                </div>

                {history.prescriptions[0] ? (
                  <div className="mt-5 rounded-3xl border border-white/10 bg-slate-900/70 p-5">
                    <p className="text-sm text-slate-400">
                      Emitida {formatDateTime(history.prescriptions[0].issuedAt)}
                    </p>
                    <div className="mt-4 grid gap-3">
                      {history.prescriptions[0].medications.map((medication) => (
                        <div
                          key={`dashboard-${medication.name}`}
                          className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                        >
                          <p className="font-medium text-white">
                            {medication.name}
                          </p>
                          <p className="mt-1 text-sm text-slate-300">
                            {medication.dose} · {medication.duration}
                          </p>
                        </div>
                      ))}
                    </div>
                    <p className="mt-4 text-sm leading-6 text-amber-200">
                      {translateClinicalMessage(history.prescriptions[0].warning)}
                    </p>
                  </div>
                ) : (
                  <EmptyPanel message="Aun no hay prescripciones registradas." />
                )}
              </article>

              <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
                <h2 className="text-2xl font-semibold text-white">
                  Ultimos resultados de laboratorio
                </h2>

                {history.laboratoryOrders[0] ? (
                  <div className="mt-5 grid gap-3">
                    {history.laboratoryOrders[0].results.map((result) => (
                      <div
                        key={`dashboard-${result.examName}`}
                        className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-3">
                          <p className="font-medium text-white">{result.examName}</p>
                          <LabResultBadge status={result.status} />
                        </div>
                        <p className="mt-3 text-sm text-slate-300">
                          Valor: {result.measuredValue}
                        </p>
                        <p className="mt-1 text-sm text-slate-400">
                          Referencia: {result.referenceRange}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <EmptyPanel message="Aun no hay ordenes de laboratorio." />
                )}
              </article>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <h2 className="text-2xl font-semibold text-white">
                    Historial reciente de citas
                  </h2>
                  <p className="mt-2 text-sm text-slate-300">
                    Aqui puedes consultar las citas que ya hacen parte de tu
                    historial.
                  </p>
                </div>
                <Link
                  href="/appointments"
                  className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
                >
                  Agendar nueva cita
                </Link>
              </div>

              {history.pastAppointments.length > 0 ? (
                <div className="mt-5 grid gap-3">
                  {history.pastAppointments.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="rounded-2xl border border-white/10 bg-slate-900/70 p-4"
                    >
                      <p className="font-medium text-white">
                        {getSpecialtyLabel(appointment.specialty)} con{" "}
                        {appointment.doctorName}
                      </p>
                      <p className="mt-1 text-sm text-slate-300">
                        {formatDateTime(appointment.appointmentDate)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-slate-400">
                        {translateClinicalMessage(appointment.reminder)}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <EmptyPanel message="Aun no hay citas pasadas registradas." />
              )}
            </section>
          </div>
        ) : null}
      </PortalShell>
    </ProtectedRoute>
  );
}

function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <article className="rounded-3xl border border-white/10 bg-white/5 p-5">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{helper}</p>
    </article>
  );
}

function OverviewRow({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 px-4 py-3">
      <dt className="text-xs uppercase tracking-[0.2em] text-slate-500">{label}</dt>
      <dd className="mt-2 text-slate-200">{children}</dd>
    </div>
  );
}

function EmptyPanel({ message }: { message: string }) {
  return (
    <div className="mt-5 rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";

import { formatDate, formatDateTime, formatList } from "@/lib/formatters";
import {
  getSpecialtyLabel,
  translateClinicalMessage,
} from "@/lib/medical-constants";
import { LabResultBadge } from "@/components/lab-result-badge";
import type { CompleteHistoryResponse } from "@/types/medical";

const tabOptions = [
  { id: "consultations", label: "Consultas" },
  { id: "prescriptions", label: "Prescripciones" },
  { id: "laboratories", label: "Laboratorios" },
] as const;

type TabId = (typeof tabOptions)[number]["id"];

export function HistoryTabs({ history }: { history: CompleteHistoryResponse }) {
  const [activeTab, setActiveTab] = useState<TabId>("consultations");

  const tabContent = useMemo(() => {
    if (activeTab === "consultations") {
      if (history.consultations.length === 0) {
        return <EmptyTabState message="Aun no hay registros de consultas." />;
      }

      return (
        <div className="grid gap-4">
          {history.consultations.map((consultation) => (
            <article
              key={consultation.id}
              className="rounded-3xl border border-white/10 bg-slate-900/70 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">
                  {consultation.diagnosis}
                </h3>
                <span className="text-sm text-slate-400">
                  {formatDate(consultation.consultationDate)}
                </span>
              </div>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {consultation.summary}
              </p>
            </article>
          ))}
        </div>
      );
    }

    if (activeTab === "prescriptions") {
      if (history.prescriptions.length === 0) {
        return <EmptyTabState message="Aun no hay prescripciones registradas." />;
      }

      return (
        <div className="grid gap-4">
          {history.prescriptions.map((prescription) => (
            <article
              key={prescription.id}
              className="rounded-3xl border border-white/10 bg-slate-900/70 p-5"
            >
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-lg font-semibold text-white">
                  Prescripcion #{prescription.id}
                </h3>
                <span className="text-sm text-slate-400">
                  {formatDateTime(prescription.issuedAt)}
                </span>
              </div>
              <div className="mt-4 grid gap-3">
                {prescription.medications.map((medication) => (
                  <div
                    key={`${prescription.id}-${medication.name}`}
                    className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                  >
                    <p className="font-medium text-white">{medication.name}</p>
                    <p className="mt-1 text-sm text-slate-300">
                      Dosis: {medication.dose}
                    </p>
                    <p className="mt-1 text-sm text-slate-300">
                      Duracion: {medication.duration}
                    </p>
                  </div>
                ))}
              </div>
              <p className="mt-4 text-sm leading-6 text-amber-200">
                {translateClinicalMessage(prescription.warning)}
              </p>
            </article>
          ))}
        </div>
      );
    }

    if (history.laboratoryOrders.length === 0) {
      return <EmptyTabState message="Aun no hay ordenes de laboratorio." />;
    }

    return (
      <div className="grid gap-4">
        {history.laboratoryOrders.map((order) => (
          <article
            key={order.id}
            className="rounded-3xl border border-white/10 bg-slate-900/70 p-5"
          >
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-lg font-semibold text-white">
                Orden de laboratorio #{order.id}
              </h3>
              <span className="text-sm text-slate-400">
                {formatDateTime(order.createdAt)}
              </span>
            </div>
            <div className="mt-4 grid gap-3">
              {order.results.map((result) => (
                <div
                  key={`${order.id}-${result.examName}`}
                  className="rounded-2xl border border-white/10 bg-slate-950/70 p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="font-medium text-white">{result.examName}</p>
                    <LabResultBadge status={result.status} />
                  </div>
                  <p className="mt-3 text-sm text-slate-300">
                    Valor: {result.measuredValue}
                  </p>
                  <p className="mt-1 text-sm text-slate-400">
                    Rango de referencia: {result.referenceRange}
                  </p>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    );
  }, [activeTab, history.consultations, history.laboratoryOrders, history.prescriptions]);

  return (
    <section className="grid gap-6">
      <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-semibold text-white">Resumen del paciente</h2>
            <p className="mt-2 text-sm text-slate-300">
              {history.patient.firstName} {history.patient.lastName} ·{" "}
              {history.patient.document}
            </p>
          </div>
          <div className="text-sm text-slate-300">
            <p>Correo: {history.patient.email}</p>
            <p className="mt-1">Telefono: {history.patient.phone}</p>
            <p className="mt-1">Alergias: {formatList(history.allergies)}</p>
          </div>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <SummaryCard
            label="Citas pasadas"
            value={history.pastAppointments.length.toString()}
            helper={
              history.pastAppointments[0]
                ? `${getSpecialtyLabel(history.pastAppointments[0].specialty)} con ${history.pastAppointments[0].doctorName}`
                : "Aun no hay citas pasadas"
            }
          />
          <SummaryCard
            label="Prescripciones"
            value={history.prescriptions.length.toString()}
            helper={
              history.prescriptions[0]
                ? `Ultima emitida ${formatDateTime(history.prescriptions[0].issuedAt)}`
                : "No hay prescripciones disponibles"
            }
          />
          <SummaryCard
            label="Ordenes de laboratorio"
            value={history.laboratoryOrders.length.toString()}
            helper={
              history.laboratoryOrders[0]
                ? `Ultima orden ${formatDateTime(history.laboratoryOrders[0].createdAt)}`
                : "No hay ordenes de laboratorio disponibles"
            }
          />
        </div>
      </article>

      <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
        <div className="flex flex-wrap gap-3">
          {tabOptions.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                activeTab === tab.id
                  ? "bg-cyan-400 text-slate-950"
                  : "border border-white/10 bg-slate-900/70 text-slate-300 hover:text-white"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="mt-6">{tabContent}</div>
      </article>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-300">{helper}</p>
    </div>
  );
}

function EmptyTabState({ message }: { message: string }) {
  return (
    <div className="rounded-3xl border border-dashed border-white/10 bg-slate-900/50 p-8 text-center text-sm text-slate-400">
      {message}
    </div>
  );
}

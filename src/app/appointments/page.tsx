"use client";

import { useMemo, useState } from "react";

import { PortalShell } from "@/components/portal-shell";
import { InlineMessage } from "@/components/page-state";
import { ProtectedRoute } from "@/components/route-guards";
import { formatDateTime } from "@/lib/formatters";
import { specialtyOptions } from "@/lib/medical-constants";
import {
  ApiError,
  createAppointment,
  getDoctorAvailability,
} from "@/lib/spring-api";
import { useAuth } from "@/components/auth-provider";
import type { Appointment, DoctorAvailability, SpecialtyValue } from "@/types/medical";

export default function AppointmentsPage() {
  const { logout, session } = useAuth();
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyValue>(
    specialtyOptions[0].value,
  );
  const [doctors, setDoctors] = useState<DoctorAvailability[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [selectedDoctorId, setSelectedDoctorId] = useState<number | null>(null);
  const [isLoadingDoctors, setIsLoadingDoctors] = useState(false);
  const [isBooking, setIsBooking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<Appointment | null>(null);

  const availableSlots = useMemo(
    () =>
      doctors.flatMap((doctor) =>
        doctor.availableSlots.map((slot) => ({
          doctorId: doctor.id,
          doctorName: doctor.fullName,
          slot,
        })),
      ),
    [doctors],
  );

  async function loadDoctors() {
    if (!session) {
      return;
    }

    setIsLoadingDoctors(true);
    setError(null);

    try {
      const response = await getDoctorAvailability(
        selectedSpecialty,
        session.accessToken,
      );
      setDoctors(response);
      setSelectedSlot(null);
      setSelectedDoctorId(null);
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await logout();
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "No fue posible cargar la disponibilidad.",
      );
    } finally {
      setIsLoadingDoctors(false);
    }
  }

  async function handleBooking() {
    if (!session || !selectedSlot) {
      return;
    }

    setIsBooking(true);
    setError(null);
    setSuccess(null);

    try {
      const appointment = await createAppointment(
        {
          patientId: session.patientId,
          specialty: selectedSpecialty,
          appointmentDate: selectedSlot,
        },
        session.accessToken,
      );
      setSuccess(appointment);
      await loadDoctors();
    } catch (requestError) {
      if (requestError instanceof ApiError && requestError.status === 401) {
        await logout();
        return;
      }

      setError(
        requestError instanceof Error
          ? requestError.message
          : "No fue posible agendar la cita.",
      );
    } finally {
      setIsBooking(false);
    }
  }

  return (
    <ProtectedRoute>
      <PortalShell
        title="Agendar cita"
        description="Selecciona una especialidad, revisa la disponibilidad y reserva el horario que mejor se ajuste a ti."
      >
        <section className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <h2 className="text-2xl font-semibold text-white">
              Nueva solicitud de cita
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
              El horario debe coincidir con una de las opciones disponibles.
            </p>

            <div className="mt-6 grid gap-4">
              <label className="space-y-2 text-sm font-medium text-slate-200">
                <span>Especialidad</span>
                <select
                  value={selectedSpecialty}
                  onChange={(event) =>
                    setSelectedSpecialty(event.target.value as SpecialtyValue)
                  }
                  className="w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                >
                  {specialtyOptions.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </label>

              <p className="text-sm leading-6 text-slate-400">
                {
                  specialtyOptions.find(
                    (option) => option.value === selectedSpecialty,
                  )?.description
                }
              </p>

              <button
                type="button"
                onClick={() => void loadDoctors()}
                disabled={isLoadingDoctors}
                className="inline-flex items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-800"
              >
                {isLoadingDoctors ? "Cargando disponibilidad..." : "Ver disponibilidad"}
              </button>
            </div>

            {error ? (
              <p className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {error}
              </p>
            ) : null}

            {success ? (
              <div className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                <h3 className="text-base font-semibold text-emerald-100">
                  Cita agendada con exito
                </h3>
                <p className="mt-2 text-sm text-emerald-200">
                  {success.doctorName} · {formatDateTime(success.appointmentDate)}
                </p>
                <p className="mt-2 text-sm leading-6 text-emerald-100">
                  {success.reminder}
                </p>
              </div>
            ) : null}
          </article>

          <article className="rounded-3xl border border-white/10 bg-white/5 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <h2 className="text-2xl font-semibold text-white">
                  Medicos y horarios disponibles
                </h2>
                <p className="mt-2 text-sm leading-6 text-slate-300">
                  Selecciona un unico horario para confirmar tu cita.
                </p>
              </div>
              {selectedSlot ? (
                <button
                  type="button"
                  onClick={() => void handleBooking()}
                  disabled={isBooking}
                  className="rounded-2xl bg-white px-4 py-2 text-sm font-medium text-slate-950 transition hover:bg-slate-200 disabled:cursor-not-allowed disabled:bg-slate-300"
                >
                  {isBooking ? "Agendando..." : "Confirmar cita"}
                </button>
              ) : null}
            </div>

            {doctors.length === 0 ? (
              <div className="mt-6 rounded-3xl border border-dashed border-white/10 bg-slate-900/40 p-8 text-center text-sm text-slate-400">
                Consulta la disponibilidad para ver medicos y horarios libres.
              </div>
            ) : (
              <div className="mt-6 grid gap-4">
                {doctors.map((doctor) => (
                  <article
                    key={doctor.id}
                    className="rounded-3xl border border-white/10 bg-slate-900/70 p-5"
                  >
                    <h3 className="text-lg font-semibold text-white">
                      {doctor.fullName}
                    </h3>
                    <p className="mt-1 text-sm text-slate-400">
                      {specialtyOptions.find(
                        (option) => option.value === doctor.specialty,
                      )?.label ?? doctor.specialty}
                    </p>

                    <div className="mt-4 flex flex-wrap gap-3">
                      {doctor.availableSlots.map((slot) => {
                        const isSelected =
                          selectedSlot === slot && selectedDoctorId === doctor.id;

                        return (
                          <button
                            key={`${doctor.id}-${slot}`}
                            type="button"
                            onClick={() => {
                              setSelectedSlot(slot);
                              setSelectedDoctorId(doctor.id);
                            }}
                            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                              isSelected
                                ? "bg-cyan-400 text-slate-950"
                                : "border border-white/10 bg-slate-950 text-slate-300 hover:text-white"
                            }`}
                          >
                            {formatDateTime(slot)}
                          </button>
                        );
                      })}
                    </div>
                  </article>
                ))}
              </div>
            )}

            {availableSlots.length > 0 && selectedSlot ? (
              <div className="mt-6 rounded-2xl border border-cyan-500/30 bg-cyan-500/10 p-4 text-sm text-cyan-100">
                Horario seleccionado: {formatDateTime(selectedSlot)}
              </div>
            ) : null}
          </article>
        </section>

        <InlineMessage
          title="Informacion importante"
          description="Por ahora el sistema solo puede mostrar con certeza las citas ya registradas en la historia clinica. Las proximas citas todavia no aparecen en el resumen principal."
        />
      </PortalShell>
    </ProtectedRoute>
  );
}

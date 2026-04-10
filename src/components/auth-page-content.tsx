"use client";

import type { FormEvent, ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { demoCredentials } from "@/lib/medical-constants";
import { checkSpringHealth } from "@/lib/spring-api";
import type { LoginValues, RegisterValues } from "@/types/auth";

type AuthMode = "login" | "register";
type HealthState = "checking" | "online" | "offline";

const initialLoginValues: LoginValues = {
  identifier: "",
  password: "",
};

const initialRegisterValues: RegisterValues = {
  firstName: "",
  lastName: "",
  document: "",
  email: "",
  phone: "",
  password: "",
  allergies: [],
};

export function AuthPageContent({ mode }: { mode: AuthMode }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { login, register } = useAuth();
  const [healthState, setHealthState] = useState<HealthState>("checking");
  const [healthMessage, setHealthMessage] = useState("Verificando disponibilidad del servicio...");
  const [loginValues, setLoginValues] = useState(initialLoginValues);
  const [registerValues, setRegisterValues] = useState({
    ...initialRegisterValues,
    allergiesInput: "",
    confirmPassword: "",
  });
  const [formError, setFormError] = useState<string | null>(null);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function loadHealth() {
      try {
        const response = await checkSpringHealth();

        if (!isMounted) {
          return;
        }

        setHealthState("online");
        setHealthMessage(
          response.status === "ok"
            ? "El servicio se encuentra disponible."
            : "El servicio respondio correctamente.",
        );
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setHealthState("offline");
        setHealthMessage(
          error instanceof Error ? error.message : "El servicio no esta disponible.",
        );
      }
    }

    void loadHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  const redirectPath = searchParams.get("redirect") || "/dashboard";

  const healthBadgeClassName = useMemo(() => {
    if (healthState === "online") {
      return "border-emerald-500/30 bg-emerald-500/10 text-emerald-200";
    }

    if (healthState === "offline") {
      return "border-rose-500/30 bg-rose-500/10 text-rose-200";
    }

    return "border-slate-500/30 bg-slate-500/10 text-slate-200";
  }, [healthState]);

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormMessage(null);
    setIsSubmitting(true);

    try {
      await login(loginValues);
      setFormMessage("Ingreso exitoso. Te estamos llevando a tu inicio.");
      router.replace(redirectPath);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "No fue posible iniciar sesion.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormMessage(null);

    if (registerValues.password !== registerValues.confirmPassword) {
      setFormError("La confirmacion de la contrasena no coincide.");
      return;
    }

    setIsSubmitting(true);

    try {
      const patient = await register({
        firstName: registerValues.firstName.trim(),
        lastName: registerValues.lastName.trim(),
        document: registerValues.document.trim(),
        email: registerValues.email.trim(),
        phone: registerValues.phone.trim(),
        password: registerValues.password,
        allergies: registerValues.allergiesInput
          .split(",")
          .map((value) => value.trim())
          .filter(Boolean),
      });

      setFormMessage(
        `${patient.firstName} ${patient.lastName}, tu registro fue creado correctamente.`,
      );
      router.replace("/dashboard");
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "No fue posible completar el registro.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto grid w-full max-w-6xl gap-6 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/30">
          <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
            Portal del paciente
          </span>
          <h1 className="mt-6 text-4xl font-semibold tracking-tight sm:text-5xl">
            {mode === "login"
              ? "Accede de forma segura a tu informacion medica."
              : "Crea tu acceso como paciente en un solo paso."}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300">
            Gestiona tus citas, revisa tu historia clinica y consulta tus
            resultados desde un solo lugar.
          </p>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <InfoCard
              title="Inicio"
              description="Resumen de tu historia clinica, prescripciones y laboratorio."
            />
            <InfoCard
              title="Citas"
              description="Elige una especialidad, revisa horarios y agenda tu cita."
            />
            <InfoCard
              title="Registros"
              description="Consulta antecedentes, prescripciones y ordenes de laboratorio."
            />
          </div>

          <article className="mt-8 rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Estado del servicio
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] ${healthBadgeClassName}`}
              >
                {healthState === "online"
                  ? "activo"
                  : healthState === "offline"
                    ? "sin servicio"
                    : "verificando"}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {healthMessage}
            </p>
            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/70 p-4">
              <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
                Credenciales de prueba
              </p>
              <div className="mt-3 grid gap-3">
                {demoCredentials.map((credential) => (
                  <p key={credential.document} className="text-sm text-slate-300">
                    {credential.document} / {credential.password}
                  </p>
                ))}
              </div>
            </div>
          </article>
        </section>

        <section className="rounded-3xl border border-white/10 bg-slate-900/80 p-8">
          <div className="flex items-center justify-between gap-4">
            <div>
              <p className="text-sm font-medium text-slate-300">
                {mode === "login" ? "Ingreso" : "Registro"}
              </p>
              <h2 className="mt-2 text-2xl font-semibold text-white">
                {mode === "login"
                  ? "Ingresa a tu cuenta"
                  : "Crea una nueva cuenta"}
              </h2>
            </div>
            <Link
              href={mode === "login" ? "/register" : "/login"}
              className="rounded-2xl border border-white/10 px-4 py-2 text-sm font-medium text-slate-300 transition hover:text-white"
            >
              {mode === "login" ? "Crear cuenta" : "Ya tengo cuenta"}
            </Link>
          </div>

          <div className="mt-6">
            {mode === "login" ? (
              <form className="space-y-4" onSubmit={handleLoginSubmit}>
                <Field label="Documento">
                  <input
                    required
                    type="text"
                    value={loginValues.identifier}
                    onChange={(event) =>
                      setLoginValues((current) => ({
                        ...current,
                        identifier: event.target.value,
                      }))
                    }
                    className={inputClassName}
                    placeholder="CC-900001"
                  />
                </Field>
                <Field label="Contrasena">
                  <input
                    required
                    type="password"
                    value={loginValues.password}
                    onChange={(event) =>
                      setLoginValues((current) => ({
                        ...current,
                        password: event.target.value,
                      }))
                    }
                    className={inputClassName}
                    placeholder="maria123"
                  />
                </Field>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-800"
                >
                  {isSubmitting ? "Ingresando..." : "Iniciar sesion"}
                </button>
              </form>
            ) : (
              <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Nombres">
                    <input
                      required
                      type="text"
                      value={registerValues.firstName}
                      onChange={(event) =>
                        setRegisterValues((current) => ({
                          ...current,
                          firstName: event.target.value,
                        }))
                      }
                      className={inputClassName}
                      placeholder="Laura"
                    />
                  </Field>
                  <Field label="Apellidos">
                    <input
                      required
                      type="text"
                      value={registerValues.lastName}
                      onChange={(event) =>
                        setRegisterValues((current) => ({
                          ...current,
                          lastName: event.target.value,
                        }))
                      }
                      className={inputClassName}
                      placeholder="Gomez"
                    />
                  </Field>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Documento">
                    <input
                      required
                      type="text"
                      value={registerValues.document}
                      onChange={(event) =>
                        setRegisterValues((current) => ({
                          ...current,
                          document: event.target.value,
                        }))
                      }
                      className={inputClassName}
                      placeholder="CC-100"
                    />
                  </Field>
                  <Field label="Telefono">
                    <input
                      required
                      type="tel"
                      value={registerValues.phone}
                      onChange={(event) =>
                        setRegisterValues((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      className={inputClassName}
                      placeholder="3001234567"
                    />
                  </Field>
                </div>
                <Field label="Correo electronico">
                  <input
                    required
                    type="email"
                    value={registerValues.email}
                    onChange={(event) =>
                      setRegisterValues((current) => ({
                        ...current,
                        email: event.target.value,
                      }))
                    }
                    className={inputClassName}
                    placeholder="laura@example.com"
                  />
                </Field>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Contrasena">
                    <input
                      required
                      type="password"
                      value={registerValues.password}
                      onChange={(event) =>
                        setRegisterValues((current) => ({
                          ...current,
                          password: event.target.value,
                        }))
                      }
                      className={inputClassName}
                      placeholder="Crea una contrasena segura"
                    />
                  </Field>
                  <Field label="Confirmar contrasena">
                    <input
                      required
                      type="password"
                      value={registerValues.confirmPassword}
                      onChange={(event) =>
                        setRegisterValues((current) => ({
                          ...current,
                          confirmPassword: event.target.value,
                        }))
                      }
                      className={inputClassName}
                      placeholder="Repite tu contrasena"
                    />
                  </Field>
                </div>
                <Field label="Alergias">
                  <input
                    type="text"
                    value={registerValues.allergiesInput}
                    onChange={(event) =>
                      setRegisterValues((current) => ({
                        ...current,
                        allergiesInput: event.target.value,
                      }))
                    }
                    className={inputClassName}
                    placeholder="penicilina, polen"
                  />
                </Field>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-800"
                >
                  {isSubmitting ? "Creando cuenta..." : "Crear cuenta"}
                </button>
              </form>
            )}
          </div>

          {formError ? (
            <p className="mt-5 rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
              {formError}
            </p>
          ) : null}

          {formMessage ? (
            <p className="mt-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
              {formMessage}
            </p>
          ) : null}
        </section>
      </div>
    </main>
  );
}

function InfoCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <article className="rounded-2xl border border-white/10 bg-slate-900/70 p-4">
      <p className="text-sm font-semibold text-white">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-400">{description}</p>
    </article>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: ReactNode;
}) {
  return (
    <label className="block space-y-2 text-sm font-medium text-slate-200">
      <span>{label}</span>
      {children}
    </label>
  );
}

const inputClassName =
  "w-full rounded-2xl border border-white/10 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30";

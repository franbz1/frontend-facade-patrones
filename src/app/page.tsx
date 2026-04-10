"use client";

import type { FormEvent, ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { checkSpringHealth, getSpringApiPrefix } from "@/lib/spring-api";

type AuthMode = "login" | "register";
type HealthState = "checking" | "online" | "offline";

const initialLoginValues = {
  email: "",
  document: "",
};

const initialRegisterValues = {
  firstName: "",
  lastName: "",
  document: "",
  email: "",
  phone: "",
  allergies: "",
};

export default function Home() {
  const { status, session, login, logout, register } = useAuth();
  const [mode, setMode] = useState<AuthMode>("login");
  const [healthState, setHealthState] = useState<HealthState>("checking");
  const [healthMessage, setHealthMessage] = useState("Checking Spring API...");
  const [loginValues, setLoginValues] = useState(initialLoginValues);
  const [registerValues, setRegisterValues] = useState(initialRegisterValues);
  const [formMessage, setFormMessage] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
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
        setHealthMessage(`Spring API responded with status "${response.status}".`);
      } catch (error) {
        if (!isMounted) {
          return;
        }

        setHealthState("offline");
        setHealthMessage(
          error instanceof Error
            ? error.message
            : "Spring API is unreachable.",
        );
      }
    }

    void loadHealth();

    return () => {
      isMounted = false;
    };
  }, []);

  const statusBadge = useMemo(() => {
    if (healthState === "online") {
      return "border-emerald-200 bg-emerald-50 text-emerald-700";
    }

    if (healthState === "offline") {
      return "border-rose-200 bg-rose-50 text-rose-700";
    }

    return "border-slate-200 bg-slate-100 text-slate-700";
  }, [healthState]);

  async function handleLoginSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormMessage(null);
    setIsSubmitting(true);

    try {
      await login(loginValues);
      setFormMessage("Session restored successfully.");
      setLoginValues(initialLoginValues);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to sign in.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleRegisterSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setFormError(null);
    setFormMessage(null);
    setIsSubmitting(true);

    try {
      const allergies = registerValues.allergies
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);

      const patient = await register({
        firstName: registerValues.firstName.trim(),
        lastName: registerValues.lastName.trim(),
        document: registerValues.document.trim(),
        email: registerValues.email.trim(),
        phone: registerValues.phone.trim(),
        allergies,
      });

      setFormMessage(`Patient ${patient.firstName} ${patient.lastName} was registered.`);
      setRegisterValues(initialRegisterValues);
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : "Unable to register user.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-10 text-slate-100">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <section className="grid gap-6 rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-slate-950/30 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <span className="inline-flex rounded-full border border-cyan-400/30 bg-cyan-400/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-cyan-200">
              Frontend workshop kickoff
            </span>
            <div className="space-y-4">
              <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
                Patient access with login, logout, and Spring API bridge.
              </h1>
              <p className="max-w-2xl text-base leading-7 text-slate-300">
                This first delivery prepares the authentication shell for the
                medical portal. Registration already talks to Spring, while sign
                in persists the user session locally until the backend auth
                endpoint is available.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <InfoCard
                title="Current scope"
                description="Patient registration, local session restore, and logout flow."
              />
              <InfoCard
                title="Spring bridge"
                description={`Requests are proxied through ${getSpringApiPrefix()} to avoid browser CORS issues.`}
              />
              <InfoCard
                title="Next features"
                description="Dashboard, appointments, history tabs, and lab result indicators."
              />
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 bg-slate-900/80 p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-slate-300">
                  Spring connectivity
                </p>
                <p className="text-xs text-slate-400">
                  Backend health is checked on page load.
                </p>
              </div>
              <span
                className={`rounded-full border px-3 py-1 text-xs font-semibold ${statusBadge}`}
              >
                {healthState}
              </span>
            </div>
            <p className="mt-4 text-sm leading-6 text-slate-300">
              {healthMessage}
            </p>

            <div className="mt-6 rounded-2xl border border-white/10 bg-slate-950/60 p-5">
              <p className="text-xs uppercase tracking-[0.25em] text-slate-500">
                Session status
              </p>
              <p className="mt-2 text-lg font-semibold text-white">
                {status === "authenticated"
                  ? `Signed in as ${session?.patient.firstName} ${session?.patient.lastName}`
                  : status === "loading"
                    ? "Restoring session..."
                    : "No active session"}
              </p>

              {session ? (
                <div className="mt-5 space-y-4">
                  <div className="grid gap-3 rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-emerald-50">
                    <p>
                      <span className="font-semibold text-emerald-200">Patient ID:</span>{" "}
                      {session.patient.id}
                    </p>
                    <p>
                      <span className="font-semibold text-emerald-200">Email:</span>{" "}
                      {session.patient.email}
                    </p>
                    <p>
                      <span className="font-semibold text-emerald-200">Document:</span>{" "}
                      {session.patient.document}
                    </p>
                    <p>
                      <span className="font-semibold text-emerald-200">Phone:</span>{" "}
                      {session.patient.phone}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={logout}
                    className="inline-flex w-full items-center justify-center rounded-2xl bg-white px-4 py-3 text-sm font-semibold text-slate-900 transition hover:bg-slate-200"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="mt-5 space-y-5">
                  <div className="grid grid-cols-2 rounded-2xl bg-slate-800 p-1 text-sm">
                    <button
                      type="button"
                      onClick={() => {
                        setMode("login");
                        setFormError(null);
                        setFormMessage(null);
                      }}
                      className={`rounded-2xl px-4 py-2 font-medium transition ${
                        mode === "login"
                          ? "bg-white text-slate-900"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      Login
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setMode("register");
                        setFormError(null);
                        setFormMessage(null);
                      }}
                      className={`rounded-2xl px-4 py-2 font-medium transition ${
                        mode === "register"
                          ? "bg-white text-slate-900"
                          : "text-slate-300 hover:text-white"
                      }`}
                    >
                      Register
                    </button>
                  </div>

                  {mode === "login" ? (
                    <form className="space-y-4" onSubmit={handleLoginSubmit}>
                      <FieldLabel label="Email">
                        <input
                          required
                          type="email"
                          value={loginValues.email}
                          onChange={(event) =>
                            setLoginValues((current) => ({
                              ...current,
                              email: event.target.value,
                            }))
                          }
                          className={inputClassName}
                          placeholder="patient@example.com"
                        />
                      </FieldLabel>
                      <FieldLabel label="Document">
                        <input
                          required
                          type="text"
                          value={loginValues.document}
                          onChange={(event) =>
                            setLoginValues((current) => ({
                              ...current,
                              document: event.target.value,
                            }))
                          }
                          className={inputClassName}
                          placeholder="1098123456"
                        />
                      </FieldLabel>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-800"
                      >
                        {isSubmitting ? "Signing in..." : "Sign in"}
                      </button>
                    </form>
                  ) : (
                    <form className="space-y-4" onSubmit={handleRegisterSubmit}>
                      <div className="grid gap-4 sm:grid-cols-2">
                        <FieldLabel label="First name">
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
                        </FieldLabel>
                        <FieldLabel label="Last name">
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
                        </FieldLabel>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <FieldLabel label="Document">
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
                            placeholder="1098123456"
                          />
                        </FieldLabel>
                        <FieldLabel label="Phone">
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
                            placeholder="+57 300 000 0000"
                          />
                        </FieldLabel>
                      </div>

                      <FieldLabel label="Email">
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
                          placeholder="patient@example.com"
                        />
                      </FieldLabel>

                      <FieldLabel label="Allergies">
                        <input
                          type="text"
                          value={registerValues.allergies}
                          onChange={(event) =>
                            setRegisterValues((current) => ({
                              ...current,
                              allergies: event.target.value,
                            }))
                          }
                          className={inputClassName}
                          placeholder="Penicillin, pollen, nuts"
                        />
                      </FieldLabel>

                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="inline-flex w-full items-center justify-center rounded-2xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:bg-cyan-800"
                      >
                        {isSubmitting ? "Creating account..." : "Create account"}
                      </button>
                    </form>
                  )}

                  {formError ? (
                    <p className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                      {formError}
                    </p>
                  ) : null}

                  {formMessage ? (
                    <p className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-200">
                      {formMessage}
                    </p>
                  ) : null}

                  <p className="text-xs leading-6 text-slate-400">
                    Login currently restores users already registered in this
                    browser. Once the backend authentication endpoint exists, the
                    provider can swap to real credential validation without
                    changing the UI contract.
                  </p>
                </div>
              )}
            </div>
          </div>
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

function FieldLabel({
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
  "w-full rounded-2xl border border-white/10 bg-slate-900 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30";

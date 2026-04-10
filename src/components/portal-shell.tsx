"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";

const navigationItems = [
  { href: "/dashboard", label: "Inicio" },
  { href: "/appointments", label: "Citas" },
  { href: "/history", label: "Historia clinica" },
];

export function PortalShell({
  children,
  title,
  description,
}: {
  children: ReactNode;
  title: string;
  description: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { logout, session } = useAuth();

  const displayName =
    session?.patient != null
      ? `${session.patient.firstName} ${session.patient.lastName}`
      : session?.username ?? "Paciente";

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-8 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6">
        <header className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-slate-950/30">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.3em] text-cyan-300">
                Portal del paciente
              </p>
              <div>
                <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">
                  {description}
                </p>
              </div>
            </div>

            <div className="rounded-2xl border border-white/10 bg-slate-900/80 px-4 py-3 text-sm">
              <p className="font-semibold text-white">{displayName}</p>
              <p className="mt-1 text-slate-400">
                ID del paciente: {session?.patientId ?? "No disponible"}
              </p>
              <button
                type="button"
                onClick={async () => {
                  await logout();
                  router.replace("/login");
                }}
                className="mt-4 inline-flex items-center rounded-2xl bg-white px-4 py-2 font-medium text-slate-950 transition hover:bg-slate-200"
              >
                Cerrar sesion
              </button>
            </div>
          </div>

          <nav className="mt-6 flex flex-wrap gap-3">
            {navigationItems.map((item) => {
              const isActive = pathname === item.href;

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
                    isActive
                      ? "bg-cyan-400 text-slate-950"
                      : "border border-white/10 bg-slate-900/70 text-slate-300 hover:text-white"
                  }`}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
        </header>

        {children}
      </div>
    </main>
  );
}

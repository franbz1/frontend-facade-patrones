"use client";

import type { ReactNode } from "react";
import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { FullPageMessage } from "@/components/page-state";

export function PublicRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }
  }, [router, status]);

  if (status === "loading" || status === "authenticated") {
    return (
      <FullPageMessage
        title="Preparando tu portal"
        description="Estamos verificando si ya tienes una sesion activa."
      />
    );
  }

  return <>{children}</>;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === "unauthenticated") {
      const redirect = encodeURIComponent(pathname || "/dashboard");
      router.replace(`/login?redirect=${redirect}`);
    }
  }, [pathname, router, status]);

  if (status !== "authenticated") {
    return (
      <FullPageMessage
        title="Protegiendo tu informacion"
        description="Estamos validando tu acceso antes de mostrar tus datos medicos."
      />
    );
  }

  return <>{children}</>;
}

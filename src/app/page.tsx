"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

import { useAuth } from "@/components/auth-provider";
import { FullPageMessage } from "@/components/page-state";

export default function Home() {
  const router = useRouter();
  const { status } = useAuth();

  useEffect(() => {
    if (status === "authenticated") {
      router.replace("/dashboard");
    }

    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [router, status]);

  return (
    <FullPageMessage
      title="Abriendo tu portal"
      description="Estamos preparando la vista adecuada para tu sesion actual."
    />
  );
}

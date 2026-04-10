import type { PatientProfile, RegisterValues } from "@/types/auth";

const SPRING_API_PREFIX = "/api/spring";

type ApiErrorPayload = {
  message?: string;
  error?: string;
};

async function extractErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as ApiErrorPayload;

    if (data.message) {
      return data.message;
    }

    if (data.error) {
      return data.error;
    }
  } catch {
    return `Request failed with status ${response.status}.`;
  }

  return `Request failed with status ${response.status}.`;
}

export async function checkSpringHealth() {
  const response = await fetch(`${SPRING_API_PREFIX}/health`, {
    cache: "no-store",
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  return (await response.json()) as { status: string };
}

export async function registerPatient(values: RegisterValues) {
  const response = await fetch(`${SPRING_API_PREFIX}/clinica/paciente`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      firstName: values.firstName,
      lastName: values.lastName,
      document: values.document,
      email: values.email,
      phone: values.phone,
      allergies: values.allergies,
    }),
  });

  if (!response.ok) {
    throw new Error(await extractErrorMessage(response));
  }

  return (await response.json()) as PatientProfile;
}

export function getSpringApiPrefix() {
  return SPRING_API_PREFIX;
}

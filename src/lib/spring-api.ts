import type {
  LoginResponse,
  LoginValues,
  LogoutResponse,
  PatientProfile,
  RegisterValues,
} from "@/types/auth";
import type {
  Appointment,
  CompleteHistoryResponse,
  CreateAppointmentValues,
  DoctorAvailability,
  SpecialtyValue,
} from "@/types/medical";

const SPRING_API_PREFIX = "/api/spring";

type ApiErrorPayload = {
  message?: string;
  error?: string;
  details?: string;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

function translateApiMessage(message: string, status: number) {
  const normalizedMessage = message.trim();
  const lowercaseMessage = normalizedMessage.toLowerCase();

  if (
    lowercaseMessage.includes("bad credentials") ||
    lowercaseMessage.includes("invalid credentials")
  ) {
    return "Credenciales invalidas.";
  }

  if (lowercaseMessage.includes("duplicate") && lowercaseMessage.includes("document")) {
    return "Ya existe un paciente registrado con ese documento.";
  }

  if (lowercaseMessage.includes("patient not found")) {
    return "No se encontro el paciente.";
  }

  if (lowercaseMessage.includes("appointment not found")) {
    return "No se encontro la cita.";
  }

  if (lowercaseMessage.includes("unsupported specialty")) {
    return "La especialidad seleccionada no es valida.";
  }

  if (lowercaseMessage.includes("unsupported exam")) {
    return "El examen seleccionado no es valido.";
  }

  if (lowercaseMessage.includes("expired") && lowercaseMessage.includes("token")) {
    return "Tu sesion ha expirado. Inicia sesion nuevamente.";
  }

  if (lowercaseMessage.includes("access denied")) {
    return "No tienes permisos para realizar esta accion.";
  }

  if (lowercaseMessage.includes("is required")) {
    const fieldName = normalizedMessage.replace(/ is required\.?$/i, "");
    return `El campo ${fieldName} es obligatorio.`;
  }

  if (status === 401) {
    return "Tu sesion no es valida o ha expirado.";
  }

  if (status === 403) {
    return "No tienes permisos para acceder a esta informacion.";
  }

  if (status === 409) {
    return "No fue posible completar la operacion porque ya existe un registro similar.";
  }

  if (status >= 500) {
    return "Ocurrio un problema al procesar tu solicitud. Intenta de nuevo.";
  }

  return normalizedMessage;
}

async function extractErrorMessage(response: Response) {
  try {
    const data = (await response.json()) as ApiErrorPayload;

    if (data.message) {
      return data.message;
    }

    if (data.error) {
      return data.error;
    }

    if (data.details) {
      return data.details;
    }
  } catch {
    try {
      const text = await response.text();

      if (text.trim()) {
        return text;
      }
    } catch {
      return `La solicitud fallo con estado ${response.status}.`;
    }
  }

  return `La solicitud fallo con estado ${response.status}.`;
}

async function request<T>(
  path: string,
  init?: RequestInit,
  accessToken?: string,
) {
  const headers = new Headers(init?.headers);

  if (!headers.has("Content-Type") && init?.body) {
    headers.set("Content-Type", "application/json");
  }

  if (accessToken) {
    headers.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(`${SPRING_API_PREFIX}${path}`, {
    ...init,
    cache: "no-store",
    headers,
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      translateApiMessage(await extractErrorMessage(response), response.status),
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export async function checkSpringHealth() {
  return request<{ status: string }>("/health");
}

export async function loginPatient(values: LoginValues) {
  return request<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({
      identifier: values.identifier,
      password: values.password,
    }),
  });
}

export async function logoutPatient(accessToken: string) {
  return request<LogoutResponse>(
    "/auth/logout",
    {
      method: "POST",
    },
    accessToken,
  );
}

export async function registerPatient(values: RegisterValues) {
  return request<PatientProfile>("/clinica/paciente", {
    method: "POST",
    body: JSON.stringify({
      firstName: values.firstName,
      lastName: values.lastName,
      document: values.document,
      email: values.email,
      phone: values.phone,
      password: values.password,
      allergies: values.allergies,
    }),
  });
}

export async function getDoctorAvailability(
  specialty: SpecialtyValue,
  accessToken: string,
) {
  const query = new URLSearchParams({ especialidad: specialty });

  return request<DoctorAvailability[]>(
    `/clinica/medicos?${query.toString()}`,
    undefined,
    accessToken,
  );
}

export async function createAppointment(
  values: CreateAppointmentValues,
  accessToken: string,
) {
  return request<Appointment>(
    "/clinica/cita",
    {
      method: "POST",
      body: JSON.stringify(values),
    },
    accessToken,
  );
}

export async function getCompleteHistory(
  patientId: number,
  accessToken: string,
) {
  return request<CompleteHistoryResponse>(
    `/clinica/historia/${patientId}`,
    undefined,
    accessToken,
  );
}

export function getSpringApiPrefix() {
  return SPRING_API_PREFIX;
}

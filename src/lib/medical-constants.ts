import type { SpecialtyValue } from "@/types/medical";

export const specialtyOptions: Array<{
  value: SpecialtyValue;
  label: string;
  description: string;
}> = [
  {
    value: "cardiologia",
    label: "Cardiologia",
    description: "Atencion del corazon, la presion arterial y la circulacion.",
  },
  {
    value: "pediatria",
    label: "Pediatria",
    description: "Atencion medica para ninos y adolescentes.",
  },
  {
    value: "dermatologia",
    label: "Dermatologia",
    description: "Evaluaciones relacionadas con piel, unas y alergias.",
  },
  {
    value: "medicina-general",
    label: "Medicina general",
    description: "Consulta general, seguimiento y revision de sintomas comunes.",
  },
];

export const demoCredentials = [
  { document: "CC-900001", password: "maria123" },
  { document: "CC-900002", password: "juan123" },
];

export function getSpecialtyLabel(value: string) {
  return specialtyOptions.find((option) => option.value === value)?.label ?? value;
}

export function getLabStatusTone(status: string) {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus.includes("normal")) {
    return "success";
  }

  return "warning";
}

export function getLabStatusLabel(status: string) {
  const normalizedStatus = status.trim().toLowerCase();

  if (normalizedStatus.includes("normal")) {
    return "Normal";
  }

  return "Fuera de rango";
}

export function translateClinicalMessage(message: string) {
  const normalizedMessage = message.trim().toLowerCase();

  if (
    normalizedMessage ===
    "arrive 15 minutes early and bring your id document."
  ) {
    return "Llega 15 minutos antes y lleva tu documento de identidad.";
  }

  if (normalizedMessage === "allergy validation completed successfully.") {
    return "La validacion de alergias se completo correctamente.";
  }

  return message;
}

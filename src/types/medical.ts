import type { PatientProfile } from "@/types/auth";

export type SpecialtyValue =
  | "cardiologia"
  | "pediatria"
  | "dermatologia"
  | "medicina-general";

export type AppointmentStatus = "SCHEDULED" | "CANCELLED";

export type DoctorAvailability = {
  id: number;
  fullName: string;
  specialty: SpecialtyValue;
  availableSlots: string[];
};

export type Appointment = {
  id: number;
  patientId: number;
  doctorId: number;
  doctorName: string;
  specialty: SpecialtyValue;
  appointmentDate: string;
  status: AppointmentStatus;
  reminder: string;
};

export type ConsultationRecord = {
  id: number;
  patientId: number;
  consultationDate: string;
  summary: string;
  diagnosis: string;
};

export type PrescribedMedication = {
  name: string;
  dose: string;
  duration: string;
};

export type Prescription = {
  id: number;
  patientId: number;
  issuedAt: string;
  medications: PrescribedMedication[];
  warning: string;
};

export type LabExamResult = {
  examName: string;
  measuredValue: string;
  referenceRange: string;
  status: string;
};

export type LaboratoryOrder = {
  id: number;
  patientId: number;
  createdAt: string;
  results: LabExamResult[];
};

export type CompleteHistoryResponse = {
  patient: PatientProfile;
  allergies: string[];
  consultations: ConsultationRecord[];
  pastAppointments: Appointment[];
  prescriptions: Prescription[];
  laboratoryOrders: LaboratoryOrder[];
};

export type CreateAppointmentValues = {
  patientId: number;
  specialty: SpecialtyValue;
  appointmentDate: string;
};

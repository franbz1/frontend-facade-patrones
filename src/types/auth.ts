export type PatientProfile = {
  id: number;
  firstName: string;
  lastName: string;
  document: string;
  email: string;
  phone: string;
  allergies: string[];
};

export type LoginValues = {
  email: string;
  document: string;
};

export type RegisterValues = {
  firstName: string;
  lastName: string;
  document: string;
  email: string;
  phone: string;
  allergies: string[];
};

export type AuthSession = {
  patient: PatientProfile;
  signedInAt: string;
};

export type StoredAccount = {
  patient: PatientProfile;
  emailKey: string;
  documentKey: string;
  registeredAt: string;
};

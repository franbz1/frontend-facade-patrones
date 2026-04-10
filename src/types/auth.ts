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
  identifier: string;
  password: string;
};

export type RegisterValues = {
  firstName: string;
  lastName: string;
  document: string;
  email: string;
  phone: string;
  password: string;
  allergies: string[];
};

export type LoginResponse = {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  username: string;
  patientId: number;
  roles: string[];
};

export type LogoutResponse = {
  message: string;
  loggedOutAt: string;
};

export type AuthSession = {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
  username: string;
  patientId: number;
  roles: string[];
  signedInAt: string;
  patient: PatientProfile | null;
};

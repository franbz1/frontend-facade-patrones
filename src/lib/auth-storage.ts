import type {
  AuthSession,
  LoginValues,
  PatientProfile,
  StoredAccount,
} from "@/types/auth";

const ACCOUNTS_STORAGE_KEY = "medical-portal.accounts";
const SESSION_STORAGE_KEY = "medical-portal.session";
const sessionListeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined";
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function normalizeDocument(value: string) {
  return value.replace(/\s+/g, "").trim().toLowerCase();
}

function readJson<T>(storageKey: string, fallback: T): T {
  if (!isBrowser()) {
    return fallback;
  }

  const rawValue = window.localStorage.getItem(storageKey);

  if (!rawValue) {
    return fallback;
  }

  try {
    return JSON.parse(rawValue) as T;
  } catch {
    return fallback;
  }
}

function writeJson(storageKey: string, value: unknown) {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.setItem(storageKey, JSON.stringify(value));
}

function notifySessionListeners() {
  sessionListeners.forEach((listener) => listener());
}

export function buildStoredAccount(patient: PatientProfile): StoredAccount {
  return {
    patient,
    emailKey: normalizeEmail(patient.email),
    documentKey: normalizeDocument(patient.document),
    registeredAt: new Date().toISOString(),
  };
}

export function getStoredAccounts() {
  return readJson<StoredAccount[]>(ACCOUNTS_STORAGE_KEY, []);
}

export function saveStoredAccount(account: StoredAccount) {
  const existingAccounts = getStoredAccounts().filter(
    ({ emailKey, documentKey }) =>
      emailKey !== account.emailKey || documentKey !== account.documentKey,
  );

  writeJson(ACCOUNTS_STORAGE_KEY, [...existingAccounts, account]);
}

export function findStoredAccount(credentials: LoginValues) {
  const emailKey = normalizeEmail(credentials.email);
  const documentKey = normalizeDocument(credentials.document);

  return getStoredAccounts().find(
    (account) =>
      account.emailKey === emailKey && account.documentKey === documentKey,
  );
}

export function getActiveSession() {
  return readJson<AuthSession | null>(SESSION_STORAGE_KEY, null);
}

export function saveActiveSession(session: AuthSession) {
  writeJson(SESSION_STORAGE_KEY, session);
  notifySessionListeners();
}

export function clearActiveSession() {
  if (!isBrowser()) {
    return;
  }

  window.localStorage.removeItem(SESSION_STORAGE_KEY);
  notifySessionListeners();
}

export function subscribeToActiveSession(listener: () => void) {
  if (!isBrowser()) {
    return () => undefined;
  }

  const handleStorage = (event: StorageEvent) => {
    if (event.key === SESSION_STORAGE_KEY) {
      listener();
    }
  };

  sessionListeners.add(listener);
  window.addEventListener("storage", handleStorage);

  return () => {
    sessionListeners.delete(listener);
    window.removeEventListener("storage", handleStorage);
  };
}

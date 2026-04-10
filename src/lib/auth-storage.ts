import type {
  AuthSession,
} from "@/types/auth";

const SESSION_STORAGE_KEY = "medical-portal.session";
const sessionListeners = new Set<() => void>();

function isBrowser() {
  return typeof window !== "undefined";
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

function isSessionExpired(session: AuthSession) {
  return new Date(session.expiresAt).getTime() <= Date.now();
}

export function getActiveSession() {
  const session = readJson<AuthSession | null>(SESSION_STORAGE_KEY, null);

  if (!session) {
    return null;
  }

  if (isSessionExpired(session)) {
    return null;
  }

  return session;
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

export function updateActiveSession(
  updater: (session: AuthSession | null) => AuthSession | null,
) {
  const nextSession = updater(getActiveSession());

  if (!nextSession) {
    clearActiveSession();
    return;
  }

  writeJson(SESSION_STORAGE_KEY, nextSession);
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

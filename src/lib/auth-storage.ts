import type {
  AuthSession,
} from "@/types/auth";

const SESSION_STORAGE_KEY = "medical-portal.session";
const sessionListeners = new Set<() => void>();
let cachedSessionRaw: string | null | undefined;
let cachedSession: AuthSession | null | undefined;

function isBrowser() {
  return typeof window !== "undefined";
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

function readCachedSession() {
  if (!isBrowser()) {
    return null;
  }

  const rawValue = window.localStorage.getItem(SESSION_STORAGE_KEY);

  if (rawValue === cachedSessionRaw && cachedSession !== undefined) {
    return cachedSession;
  }

  cachedSessionRaw = rawValue;

  if (!rawValue) {
    cachedSession = null;
    return cachedSession;
  }

  try {
    const parsedSession = JSON.parse(rawValue) as AuthSession;
    cachedSession = isSessionExpired(parsedSession) ? null : parsedSession;
    return cachedSession;
  } catch {
    cachedSession = null;
    return cachedSession;
  }
}

export function getActiveSession() {
  return readCachedSession();
}

export function saveActiveSession(session: AuthSession) {
  cachedSessionRaw = JSON.stringify(session);
  cachedSession = session;
  writeJson(SESSION_STORAGE_KEY, session);
  notifySessionListeners();
}

export function clearActiveSession() {
  if (!isBrowser()) {
    return;
  }

  cachedSessionRaw = null;
  cachedSession = null;
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

  cachedSessionRaw = JSON.stringify(nextSession);
  cachedSession = nextSession;
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

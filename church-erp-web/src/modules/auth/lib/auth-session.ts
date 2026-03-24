import type { AuthAccessType, AuthSession, AuthSessionMeta, AuthUser } from "@/modules/auth/types/auth";

export const AUTH_TOKEN_COOKIE = "church-erp.access-token";
export const AUTH_SESSION_COOKIE = "church-erp.session";
const DEFAULT_MAX_AGE = 60 * 60 * 12;

function createCookie(name: string, value: string, maxAge = DEFAULT_MAX_AGE) {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";

  return [
    `${name}=${encodeURIComponent(value)}`,
    "path=/",
    `max-age=${maxAge}`,
    "SameSite=Lax",
    secure ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");
}

function clearCookie(name: string) {
  return `${name}=; path=/; max-age=0; SameSite=Lax`;
}

function parseJsonCookie<T>(cookieValue: string | undefined) {
  if (!cookieValue) {
    return null;
  }

  try {
    return JSON.parse(cookieValue) as T;
  } catch {
    try {
      return JSON.parse(decodeURIComponent(cookieValue)) as T;
    } catch {
      return null;
    }
  }
}

export function normalizeAuthSession(response: unknown): AuthSession {
  if (typeof response !== "object" || response === null || Array.isArray(response)) {
    throw new Error("A resposta do login nao retornou um objeto valido.");
  }

  const data = response as Partial<AuthSession>;

  if (typeof data.accessToken !== "string" || !data.accessToken.trim()) {
    throw new Error("A resposta do login nao retornou um token de acesso.");
  }

  if (typeof data.user !== "object" || data.user === null || Array.isArray(data.user)) {
    throw new Error("A resposta do login nao retornou o usuario autenticado.");
  }

  return {
    accessToken: data.accessToken,
    user: data.user as AuthUser,
  };
}

export function getAuthSessionMeta(session: AuthSession): AuthSessionMeta {
  return {
    user: session.user,
  };
}

export function persistAuthSession(session: AuthSession) {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = createCookie(AUTH_TOKEN_COOKIE, session.accessToken);
  document.cookie = createCookie(
    AUTH_SESSION_COOKIE,
    JSON.stringify(getAuthSessionMeta(session)),
  );
}

export function clearAuthSession() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = clearCookie(AUTH_TOKEN_COOKIE);
  document.cookie = clearCookie(AUTH_SESSION_COOKIE);
}

export function getCookieValue(name: string, source?: string) {
  const cookieSource =
    source ?? (typeof document !== "undefined" ? document.cookie : "");

  if (!cookieSource) {
    return undefined;
  }

  const match = cookieSource.match(
    new RegExp(`(?:^|; )${name.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}=([^;]*)`),
  );

  return match ? decodeURIComponent(match[1]) : undefined;
}

export function getClientAccessToken() {
  return getCookieValue(AUTH_TOKEN_COOKIE);
}

export function getAuthSessionMetaFromCookie(cookieValue?: string) {
  return parseJsonCookie<AuthSessionMeta>(cookieValue);
}

export function getStoredAuthUser(
  _token?: string,
  sessionCookieValue?: string,
): AuthUser | null {
  return getAuthSessionMetaFromCookie(sessionCookieValue)?.user ?? null;
}

export function getAuthLoginPath(accessType?: AuthAccessType) {
  return accessType === "PLATFORM" ? "/master/login" : "/login";
}

export function getInitials(name: string) {
  const words = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  return (
    words
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase() ?? "")
      .join("") || "AD"
  );
}

import type { AuthAccessType, AuthSession, AuthSessionMeta, AuthUser } from "@/modules/auth/types/auth";

export const AUTH_TOKEN_COOKIE = "church-erp.tenant-access-token";
export const AUTH_SESSION_COOKIE = "church-erp.tenant-session";
export const MASTER_AUTH_TOKEN_COOKIE = "church-erp.master-access-token";
export const MASTER_AUTH_SESSION_COOKIE = "church-erp.master-session";

const DEFAULT_MAX_AGE = 60 * 60 * 12;
const MASTER_PATH_PREFIX = "/master";
const LEGACY_AUTH_TOKEN_COOKIE = "church-erp.access-token";
const LEGACY_AUTH_SESSION_COOKIE = "church-erp.session";

interface JwtPayload {
  exp?: number;
}

const AUTH_COOKIE_CONFIG: Record<
  AuthAccessType,
  {
    tokenCookieName: string;
    sessionCookieName: string;
    path: string;
  }
> = {
  TENANT: {
    tokenCookieName: AUTH_TOKEN_COOKIE,
    sessionCookieName: AUTH_SESSION_COOKIE,
    path: "/",
  },
  PLATFORM: {
    tokenCookieName: MASTER_AUTH_TOKEN_COOKIE,
    sessionCookieName: MASTER_AUTH_SESSION_COOKIE,
    path: MASTER_PATH_PREFIX,
  },
};

function getAuthCookieConfig(accessType: AuthAccessType) {
  return AUTH_COOKIE_CONFIG[accessType];
}

function createCookie(
  name: string,
  value: string,
  maxAge = DEFAULT_MAX_AGE,
  path = "/",
) {
  const secure =
    typeof window !== "undefined" && window.location.protocol === "https:";

  return [
    `${name}=${encodeURIComponent(value)}`,
    `path=${path}`,
    `max-age=${maxAge}`,
    "SameSite=Lax",
    secure ? "Secure" : null,
  ]
    .filter(Boolean)
    .join("; ");
}

function clearCookie(name: string, path = "/") {
  return `${name}=; path=${path}; max-age=0; SameSite=Lax`;
}

function clearLegacyAuthCookies() {
  if (typeof document === "undefined") {
    return;
  }

  document.cookie = clearCookie(LEGACY_AUTH_TOKEN_COOKIE);
  document.cookie = clearCookie(LEGACY_AUTH_SESSION_COOKIE);
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

function decodeBase64UrlSegment(segment: string) {
  const normalizedSegment = segment.replace(/-/g, "+").replace(/_/g, "/");
  const padding =
    normalizedSegment.length % 4 === 0
      ? ""
      : "=".repeat(4 - (normalizedSegment.length % 4));

  try {
    const binaryValue =
      typeof window !== "undefined" && typeof window.atob === "function"
        ? window.atob(`${normalizedSegment}${padding}`)
        : Buffer.from(`${normalizedSegment}${padding}`, "base64").toString(
            "binary",
          );

    const bytes = Uint8Array.from(binaryValue, (character) =>
      character.charCodeAt(0),
    );

    return new TextDecoder().decode(bytes);
  } catch {
    return null;
  }
}

function parseJwtPayload(token?: string): JwtPayload | null {
  if (!token) {
    return null;
  }

  const [, payloadSegment] = token.split(".");

  if (!payloadSegment) {
    return null;
  }

  const decodedPayload = decodeBase64UrlSegment(payloadSegment);

  if (!decodedPayload) {
    return null;
  }

  try {
    const payload = JSON.parse(decodedPayload) as JwtPayload;

    if (
      typeof payload !== "object" ||
      payload === null ||
      Array.isArray(payload)
    ) {
      return null;
    }

    return payload;
  } catch {
    return null;
  }
}

export function isAuthTokenActive(token?: string) {
  const payload = parseJwtPayload(token);

  if (!payload || typeof payload.exp !== "number") {
    return false;
  }

  return payload.exp * 1000 > Date.now();
}

export function parseAuthSession(response: unknown): AuthSession {
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

export function getAccessTypeFromPathname(pathname?: string): AuthAccessType {
  return pathname?.startsWith(MASTER_PATH_PREFIX) ? "PLATFORM" : "TENANT";
}

export function persistAuthSession(session: AuthSession) {
  if (typeof document === "undefined") {
    return;
  }

  const { path, sessionCookieName, tokenCookieName } = getAuthCookieConfig(
    session.user.accessType,
  );

  document.cookie = createCookie(tokenCookieName, session.accessToken, DEFAULT_MAX_AGE, path);
  document.cookie = createCookie(
    sessionCookieName,
    JSON.stringify(getAuthSessionMeta(session)),
    DEFAULT_MAX_AGE,
    path,
  );

  clearLegacyAuthCookies();
}

export function clearAuthSession(accessType?: AuthAccessType) {
  if (typeof document === "undefined") {
    return;
  }

  const resolvedAccessType =
    accessType ?? getAccessTypeFromPathname(window.location.pathname);
  const { path, sessionCookieName, tokenCookieName } =
    getAuthCookieConfig(resolvedAccessType);

  document.cookie = clearCookie(tokenCookieName, path);
  document.cookie = clearCookie(sessionCookieName, path);
  clearLegacyAuthCookies();
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

export function getClientAccessToken(accessType?: AuthAccessType) {
  const resolvedAccessType =
    accessType ??
    getAccessTypeFromPathname(
      typeof window !== "undefined" ? window.location.pathname : undefined,
    );

  const accessToken = getCookieValue(
    getAuthCookieConfig(resolvedAccessType).tokenCookieName,
  );

  return isAuthTokenActive(accessToken) ? accessToken : undefined;
}

export function getAuthSessionMetaFromCookie(cookieValue?: string) {
  return parseJsonCookie<AuthSessionMeta>(cookieValue);
}

export function getStoredAuthUser(
  token?: string,
  sessionCookieValue?: string,
): AuthUser | null {
  if (!isAuthTokenActive(token)) {
    return null;
  }

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

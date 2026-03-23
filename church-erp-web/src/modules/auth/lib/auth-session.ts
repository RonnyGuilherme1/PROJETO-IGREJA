import type {
  AuthMode,
  AuthSession,
  AuthSessionMeta,
  AuthUser,
} from "@/modules/auth/types/auth";

export const AUTH_TOKEN_COOKIE = "church-erp.access-token";
export const AUTH_SESSION_COOKIE = "church-erp.session";
const DEFAULT_TOKEN_TYPE = "Bearer";
const DEFAULT_MAX_AGE = 60 * 60 * 12;

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function getNestedRecord(record: JsonRecord, key: string) {
  const value = record[key];
  return isRecord(value) ? value : null;
}

function getCandidateRecords(source: JsonRecord) {
  const candidates: JsonRecord[] = [source];
  const queue: Array<JsonRecord | null> = [
    getNestedRecord(source, "data"),
    getNestedRecord(source, "result"),
    getNestedRecord(source, "payload"),
    getNestedRecord(source, "auth"),
    getNestedRecord(source, "authentication"),
    getNestedRecord(source, "response"),
  ];

  for (const candidate of queue) {
    if (candidate) {
      candidates.push(candidate);
    }
  }

  return candidates;
}

function getValueByPath(record: JsonRecord, path: string[]) {
  let current: unknown = record;

  for (const segment of path) {
    if (!isRecord(current) || !(segment in current)) {
      return null;
    }

    current = current[segment];
  }

  return current;
}

function findFirstString(records: JsonRecord[], paths: string[][]) {
  for (const record of records) {
    for (const path of paths) {
      const value = getValueByPath(record, path);

      if (typeof value === "string" && value.trim()) {
        return value.trim();
      }
    }
  }

  return null;
}

function findFirstNumber(records: JsonRecord[], paths: string[][]) {
  for (const record of records) {
    for (const path of paths) {
      const value = getValueByPath(record, path);

      if (typeof value === "number" && Number.isFinite(value) && value > 0) {
        return value;
      }

      if (typeof value === "string") {
        const parsed = Number(value);

        if (Number.isFinite(parsed) && parsed > 0) {
          return parsed;
        }
      }
    }
  }

  return undefined;
}

function formatProfile(value: unknown): string | null {
  if (typeof value === "string" && value.trim()) {
    return value
      .replace(/^ROLE_/i, "")
      .replace(/[_-]+/g, " ")
      .replace(/\s+/g, " ")
      .trim()
      .replace(/\b\w/g, (character) => character.toUpperCase());
  }

  if (Array.isArray(value)) {
    const labels = value
      .map((item) => formatProfile(item))
      .filter((item): item is string => Boolean(item));

    if (labels.length > 0) {
      return labels.join(", ");
    }
  }

  if (isRecord(value)) {
    return (
      formatProfile(value.name) ??
      formatProfile(value.label) ??
      formatProfile(value.description) ??
      formatProfile(value.authority)
    );
  }

  return null;
}

function decodeBase64Url(input: string) {
  const normalized = input.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized.padEnd(
    normalized.length + ((4 - (normalized.length % 4)) % 4),
    "=",
  );

  if (typeof atob === "function") {
    return atob(padded);
  }

  return Buffer.from(padded, "base64").toString("utf-8");
}

function decodeJwtPayload(token: string) {
  const segments = token.split(".");

  if (segments.length < 2) {
    return null;
  }

  try {
    const payload = decodeBase64Url(segments[1]);
    const parsed = JSON.parse(payload) as unknown;
    return isRecord(parsed) ? parsed : null;
  } catch {
    return null;
  }
}

function getUserCandidate(records: JsonRecord[]) {
  const keys = [
    ["user"],
    ["usuario"],
    ["account"],
    ["currentUser"],
    ["current_user"],
    ["profile"],
    ["perfil"],
  ];

  for (const record of records) {
    for (const key of keys) {
      const value = getValueByPath(record, key);

      if (isRecord(value)) {
        return value;
      }
    }
  }

  return null;
}

function buildAuthUser(records: JsonRecord[], token: string): AuthUser {
  const tokenClaims = decodeJwtPayload(token);
  const userRecord = getUserCandidate(records);
  const sources = [
    ...(userRecord ? [userRecord] : []),
    ...records,
    ...(tokenClaims ? [tokenClaims] : []),
  ];

  const name =
    findFirstString(sources, [
      ["name"],
      ["nome"],
      ["fullName"],
      ["full_name"],
      ["displayName"],
      ["display_name"],
    ]) ??
    findFirstString(sources, [
      ["email"],
      ["preferred_username"],
      ["username"],
      ["login"],
      ["sub"],
    ]) ??
    "Usuario autenticado";

  const email =
    findFirstString(sources, [
      ["email"],
      ["preferred_username"],
      ["username"],
      ["login"],
      ["sub"],
    ]) ?? "";

  const username =
    findFirstString(sources, [
      ["username"],
      ["userName"],
      ["preferred_username"],
      ["login"],
      ["email"],
      ["sub"],
    ]) ?? "";

  const profile =
    formatProfile(
      findFirstValue(sources, [
        ["profile"],
        ["perfil"],
        ["role"],
        ["roles"],
        ["authorities"],
        ["authority"],
      ]),
    ) ?? "Acesso interno";

  const tenantCode =
    findFirstString(sources, [
      ["tenantCode"],
      ["tenant_code"],
      ["tenant", "code"],
      ["tenant", "slug"],
      ["organization", "code"],
    ]) ?? undefined;

  const tenantName =
    findFirstString(sources, [
      ["tenantName"],
      ["tenant_name"],
      ["tenant", "name"],
      ["organization", "name"],
      ["company", "name"],
    ]) ?? undefined;

  return {
    name,
    email,
    profile,
    username,
    tenantCode,
    tenantName,
  };
}

function findFirstValue(records: JsonRecord[], paths: string[][]) {
  for (const record of records) {
    for (const path of paths) {
      const value = getValueByPath(record, path);

      if (value !== null && value !== undefined) {
        return value;
      }
    }
  }

  return null;
}

function resolveExpiresIn(records: JsonRecord[], token: string) {
  const directValue = findFirstNumber(records, [
    ["expiresIn"],
    ["expires_in"],
    ["expiration"],
    ["exp"],
  ]);

  if (directValue) {
    if (directValue > 1000000000000) {
      return Math.max(Math.floor(directValue / 1000 - Date.now() / 1000), 1);
    }

    if (directValue > 1000000000) {
      return Math.max(Math.floor(directValue - Date.now() / 1000), 1);
    }

    return directValue;
  }

  const tokenClaims = decodeJwtPayload(token);

  if (tokenClaims) {
    const exp = tokenClaims.exp;

    if (typeof exp === "number") {
      return Math.max(Math.floor(exp - Date.now() / 1000), 1);
    }
  }

  return undefined;
}

function createCookie(name: string, value: string, maxAge = DEFAULT_MAX_AGE) {
  const secure = typeof window !== "undefined" && window.location.protocol === "https:";

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
  if (!isRecord(response)) {
    throw new Error("A resposta do login nao retornou um objeto valido.");
  }

  const records = getCandidateRecords(response);
  const accessToken =
    findFirstString(records, [
      ["accessToken"],
      ["access_token"],
      ["token"],
      ["jwt"],
      ["bearerToken"],
      ["bearer_token"],
    ]) ?? null;

  if (!accessToken) {
    throw new Error("A resposta do login nao retornou um token de acesso.");
  }

  const tokenType =
    findFirstString(records, [
      ["tokenType"],
      ["token_type"],
      ["type"],
    ]) ?? DEFAULT_TOKEN_TYPE;

  return {
    accessToken,
    tokenType,
    expiresIn: resolveExpiresIn(records, accessToken),
    user: buildAuthUser(records, accessToken),
  };
}

export function getAuthSessionMeta(session: AuthSession): AuthSessionMeta {
  return {
    tokenType: session.tokenType,
    expiresIn: session.expiresIn,
    user: session.user,
  };
}

interface AuthSessionContext {
  mode: AuthMode;
  tenantCode?: string;
  username?: string;
}

export function applyAuthSessionContext(
  session: AuthSession,
  context: AuthSessionContext,
): AuthSession {
  const normalizedUsername =
    context.username?.trim() ||
    session.user.username?.trim() ||
    session.user.email.trim();
  const fallbackName =
    session.user.name === "Usuario autenticado" && normalizedUsername
      ? normalizedUsername
      : session.user.name;
  const fallbackEmail =
    session.user.email.trim() ||
    (normalizedUsername?.includes("@") ? normalizedUsername : "");

  return {
    ...session,
    user: {
      ...session.user,
      name: fallbackName,
      email: fallbackEmail,
      username: normalizedUsername,
      tenantCode:
        context.mode === "TENANT"
          ? context.tenantCode?.trim() || session.user.tenantCode
          : undefined,
      tenantName: session.user.tenantName,
      authMode: context.mode,
    },
  };
}

export function persistAuthSession(session: AuthSession) {
  if (typeof document === "undefined") {
    return;
  }

  const maxAge = session.expiresIn && session.expiresIn > 0
    ? session.expiresIn
    : DEFAULT_MAX_AGE;

  document.cookie = createCookie(AUTH_TOKEN_COOKIE, session.accessToken, maxAge);
  document.cookie = createCookie(
    AUTH_SESSION_COOKIE,
    JSON.stringify(getAuthSessionMeta(session)),
    maxAge,
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
  const cookieSource = source ?? (typeof document !== "undefined" ? document.cookie : "");

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
  token?: string,
  sessionCookieValue?: string,
): AuthUser | null {
  const sessionMeta = getAuthSessionMetaFromCookie(sessionCookieValue);

  if (sessionMeta?.user) {
    return sessionMeta.user;
  }

  if (!token) {
    return null;
  }

  const claims = decodeJwtPayload(token);

  if (!claims) {
    return {
      name: "Usuario autenticado",
      email: "",
      profile: "Acesso interno",
      username: "",
    };
  }

  return buildAuthUser([claims], token);
}

export function getStoredTokenType(sessionCookieValue?: string) {
  return getAuthSessionMetaFromCookie(sessionCookieValue)?.tokenType ?? DEFAULT_TOKEN_TYPE;
}

export function getAuthLoginPath(authMode?: AuthMode) {
  return authMode === "MASTER" ? "/master/login" : "/login";
}

export function isAdminProfile(profile?: string) {
  if (!profile?.trim()) {
    return false;
  }

  const normalized = profile
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, " ")
    .trim();

  return normalized.split(/\s+/).includes("ADMIN");
}

export function getInitials(name: string) {
  const words = name
    .split(" ")
    .map((part) => part.trim())
    .filter(Boolean);

  return words.slice(0, 2).map((part) => part[0]?.toUpperCase() ?? "").join("") || "AD";
}

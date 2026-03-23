import axios from "axios";
import { getApiConfig } from "@/lib/env";
import {
  AUTH_SESSION_COOKIE,
  getAuthSessionMetaFromCookie,
  getClientAccessToken,
  getCookieValue,
  getStoredTokenType,
} from "@/modules/auth/lib/auth-session";

export const http = axios.create({
  timeout: 15000,
  headers: {
    Accept: "application/json",
    "Content-Type": "application/json",
  },
});

function isAuthLoginRequest(url?: string) {
  const normalizedUrl = String(url ?? "");

  return [
    "/auth/login",
    "/auth/tenant/login",
    "/tenant/auth/login",
    "/auth/master/login",
    "/master/auth/login",
    "/platform/auth/login",
    "/auth/platform/login",
  ].some((path) => normalizedUrl.includes(path));
}

http.interceptors.request.use((config) => {
  const apiConfig = getApiConfig();

  if (!config.baseURL && apiConfig.baseUrl) {
    config.baseURL = apiConfig.baseUrl;
  }

  if (typeof window === "undefined") {
    return config;
  }

  if (isAuthLoginRequest(config.url)) {
    return config;
  }

  const accessToken = getClientAccessToken();

  if (!accessToken) {
    return config;
  }

  const sessionCookieValue = getCookieValue(AUTH_SESSION_COOKIE);
  const sessionMeta = getAuthSessionMetaFromCookie(sessionCookieValue);
  const tokenType = getStoredTokenType(sessionCookieValue);
  config.headers = config.headers ?? {};
  config.headers.Authorization = `${tokenType} ${accessToken}`;

  if (sessionMeta?.user.authMode === "TENANT" && sessionMeta.user.tenantCode) {
    config.headers["X-Tenant-Code"] = sessionMeta.user.tenantCode;
    config.headers["X-Tenant"] = sessionMeta.user.tenantCode;
  }

  return config;
});

export function ensureApiConfigured() {
  const apiConfig = getApiConfig();

  if (!apiConfig.isConfigured) {
    throw new Error(
      "Defina NEXT_PUBLIC_API_URL em .env.local e reinicie o dev server se acabou de alterar esse arquivo.",
    );
  }
}

export function getApiErrorMessage(
  error: unknown,
  fallback = "Nao foi possivel concluir a solicitacao.",
) {
  if (axios.isAxiosError(error)) {
    const responseData = error.response?.data;

    if (typeof responseData === "string" && responseData.trim()) {
      return responseData;
    }

    if (responseData && typeof responseData === "object") {
      const message =
        "message" in responseData
          ? responseData.message
          : "error" in responseData
            ? responseData.error
            : null;

      if (typeof message === "string" && message.trim()) {
        return message;
      }

      if (Array.isArray(message) && message.length > 0) {
        return String(message[0]);
      }
    }

    if (error.response) {
      return `A API respondeu com status ${error.response.status}.`;
    }

    if (error.request) {
      return "Nao foi possivel alcancar a API configurada.";
    }
  }

  if (error instanceof Error && error.message.trim()) {
    return error.message;
  }

  return fallback;
}

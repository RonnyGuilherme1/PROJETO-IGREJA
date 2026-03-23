import axios from "axios";
import { ensureApiConfigured, http } from "@/lib/http";
import {
  applyAuthSessionContext,
  normalizeAuthSession,
} from "@/modules/auth/lib/auth-session";
import type { AuthSession } from "@/modules/auth/types/auth";

export interface TenantLoginPayload {
  tenantCode: string;
  username: string;
  password: string;
}

export interface MasterLoginPayload {
  username: string;
  password: string;
}

const TENANT_LOGIN_ENDPOINTS = [
  "/auth/login",
  "/auth/tenant/login",
  "/tenant/auth/login",
];

const MASTER_LOGIN_ENDPOINTS = [
  "/auth/master/login",
  "/master/auth/login",
  "/platform/auth/login",
  "/auth/platform/login",
];

function sanitizeTenantPayload(payload: TenantLoginPayload) {
  return {
    tenantCode: payload.tenantCode.trim(),
    username: payload.username.trim(),
    password: payload.password,
  };
}

function sanitizeMasterPayload(payload: MasterLoginPayload) {
  return {
    username: payload.username.trim(),
    password: payload.password,
  };
}

function shouldTryNextEndpoint(error: unknown) {
  if (!axios.isAxiosError(error) || !error.response) {
    return false;
  }

  return [404, 405].includes(error.response.status);
}

async function requestLoginWithFallback<TPayload>(
  endpoints: string[],
  payload: TPayload,
) {
  let lastError: unknown = null;

  for (const endpoint of endpoints) {
    try {
      const { data } = await http.post(endpoint, payload);
      return data;
    } catch (error) {
      if (shouldTryNextEndpoint(error)) {
        lastError = error;
        continue;
      }

      throw error;
    }
  }

  throw lastError ?? new Error("Nao foi possivel acessar o endpoint de autenticacao.");
}

export async function loginTenant(
  payload: TenantLoginPayload,
): Promise<AuthSession> {
  ensureApiConfigured();

  const sanitizedPayload = sanitizeTenantPayload(payload);
  const data = await requestLoginWithFallback(
    TENANT_LOGIN_ENDPOINTS,
    sanitizedPayload,
  );

  return applyAuthSessionContext(normalizeAuthSession(data), {
    mode: "TENANT",
    tenantCode: sanitizedPayload.tenantCode,
    username: sanitizedPayload.username,
  });
}

export async function loginMaster(
  payload: MasterLoginPayload,
): Promise<AuthSession> {
  ensureApiConfigured();

  const sanitizedPayload = sanitizeMasterPayload(payload);
  const data = await requestLoginWithFallback(
    MASTER_LOGIN_ENDPOINTS,
    sanitizedPayload,
  );

  return applyAuthSessionContext(normalizeAuthSession(data), {
    mode: "MASTER",
    username: sanitizedPayload.username,
  });
}

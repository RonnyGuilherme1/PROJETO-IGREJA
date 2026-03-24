import { ensureApiConfigured, http } from "@/lib/http";
import { parseAuthSession } from "@/modules/auth/lib/auth-session";
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

export async function loginTenant(
  payload: TenantLoginPayload,
): Promise<AuthSession> {
  ensureApiConfigured();

  const response = await http.post("/auth/login", sanitizeTenantPayload(payload));

  return parseAuthSession(response.data);
}

export async function loginMaster(
  payload: MasterLoginPayload,
): Promise<AuthSession> {
  ensureApiConfigured();

  const response = await http.post(
    "/auth/master/login",
    sanitizeMasterPayload(payload),
  );

  return parseAuthSession(response.data);
}

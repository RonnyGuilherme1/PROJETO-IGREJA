import { ensureApiConfigured, http } from "@/lib/http";
import type {
  CreatePlatformUserPayload,
  PlatformUserItem,
  PlatformUsersListResult,
  UpdatePlatformUserPayload,
} from "@/modules/master/types/platform-user";

const MASTER_PLATFORM_USERS_ENDPOINT = "/master/users";

function sanitizePlatformUserPayload(
  payload: CreatePlatformUserPayload | UpdatePlatformUserPayload,
) {
  const sanitizedPayload = {
    ...payload,
    name: payload.name?.trim(),
    username:
      "username" in payload && payload.username !== undefined
        ? payload.username.trim().toLowerCase()
        : undefined,
    email:
      "email" in payload && payload.email !== undefined
        ? payload.email.trim().toLowerCase() || null
        : undefined,
    password:
      "password" in payload && payload.password !== undefined
        ? payload.password
        : undefined,
    platformRole: payload.platformRole,
    status: payload.status,
  };

  return Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([, value]) => value !== undefined),
  );
}

export async function listMasterPlatformUsers(): Promise<PlatformUsersListResult> {
  ensureApiConfigured();

  const response = await http.get<PlatformUserItem[]>(MASTER_PLATFORM_USERS_ENDPOINT);

  return {
    items: response.data,
    total: response.data.length,
  };
}

export async function getMasterPlatformUserById(
  id: string,
): Promise<PlatformUserItem> {
  ensureApiConfigured();

  const response = await http.get<PlatformUserItem>(
    `${MASTER_PLATFORM_USERS_ENDPOINT}/${id}`,
  );

  return response.data;
}

export async function createMasterPlatformUser(
  payload: CreatePlatformUserPayload,
): Promise<PlatformUserItem> {
  ensureApiConfigured();

  const response = await http.post<PlatformUserItem>(
    MASTER_PLATFORM_USERS_ENDPOINT,
    sanitizePlatformUserPayload(payload),
  );

  return response.data;
}

export async function updateMasterPlatformUser(
  id: string,
  payload: UpdatePlatformUserPayload,
): Promise<PlatformUserItem> {
  ensureApiConfigured();

  const response = await http.patch<PlatformUserItem>(
    `${MASTER_PLATFORM_USERS_ENDPOINT}/${id}`,
    sanitizePlatformUserPayload(payload),
  );

  return response.data;
}

export async function inactivateMasterPlatformUser(id: string): Promise<void> {
  ensureApiConfigured();
  await http.patch(`${MASTER_PLATFORM_USERS_ENDPOINT}/${id}/inactivate`);
}

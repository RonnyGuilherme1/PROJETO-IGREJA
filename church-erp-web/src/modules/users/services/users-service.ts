import { ensureApiConfigured, http } from "@/lib/http";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserFilters,
  UserItem,
  UserListResult,
} from "@/modules/users/types/user";

const USERS_ENDPOINT = "/users";
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 5000;

function sanitizeUserPayload(payload: CreateUserPayload | UpdateUserPayload) {
  const sanitizedPayload = {
    ...payload,
    name: payload.name?.trim(),
    username:
      "username" in payload && payload.username !== undefined
        ? payload.username.trim() || null
        : undefined,
    email:
      "email" in payload && payload.email !== undefined
        ? payload.email?.trim().toLowerCase() || null
        : undefined,
    password:
      "password" in payload && payload.password !== undefined
        ? payload.password
        : undefined,
    role: payload.role,
    status: payload.status,
    churchId:
      "churchId" in payload && payload.churchId !== undefined
        ? payload.churchId?.trim() || null
        : undefined,
  };

  return Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([, value]) => value !== undefined),
  );
}

export async function listUsers(filters: UserFilters): Promise<UserListResult> {
  ensureApiConfigured();

  const response = await http.get<UserListResult>(USERS_ENDPOINT, {
    params: {
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      name: filters.name.trim() || undefined,
      email: filters.email.trim() || undefined,
      status: filters.status || undefined,
      role: filters.role || undefined,
    },
  });

  return response.data;
}

export async function getUserById(id: string): Promise<UserItem> {
  ensureApiConfigured();

  const response = await http.get<UserItem>(`${USERS_ENDPOINT}/${id}`);
  return response.data;
}

export async function createUser(payload: CreateUserPayload): Promise<UserItem> {
  ensureApiConfigured();

  const response = await http.post<UserItem>(
    USERS_ENDPOINT,
    sanitizeUserPayload(payload),
  );

  return response.data;
}

export async function updateUser(
  id: string,
  payload: UpdateUserPayload,
): Promise<UserItem> {
  ensureApiConfigured();

  const response = await http.patch<UserItem>(
    `${USERS_ENDPOINT}/${id}`,
    sanitizeUserPayload(payload),
  );

  return response.data;
}

export async function inactivateUser(id: string): Promise<void> {
  ensureApiConfigured();
  await http.patch(`${USERS_ENDPOINT}/${id}/inactivate`);
}

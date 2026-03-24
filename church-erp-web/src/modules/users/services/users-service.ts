import { ensureApiConfigured, http } from "@/lib/http";
import type {
  CreateUserPayload,
  UpdateUserPayload,
  UserFilters,
  UserItem,
  UserListResult,
} from "@/modules/users/types/user";

const USERS_ENDPOINT = "/users";

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function matchesUserFilters(user: UserItem, filters: UserFilters) {
  const name = normalizeSearchValue(filters.name);
  const email = normalizeSearchValue(filters.email);

  return (
    (!name || normalizeSearchValue(user.name).includes(name)) &&
    (!email || normalizeSearchValue(user.email ?? "").includes(email)) &&
    (!filters.status || user.status === filters.status) &&
    (!filters.role || user.role === filters.role)
  );
}

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

  const response = await http.get<UserItem[]>(USERS_ENDPOINT);
  const items = response.data.filter((user) => matchesUserFilters(user, filters));

  return {
    items,
    total: items.length,
  };
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

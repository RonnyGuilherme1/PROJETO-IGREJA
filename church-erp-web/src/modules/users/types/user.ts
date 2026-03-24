import type {
  PlatformRole,
  UserRole,
  UserStatus,
} from "@/modules/auth/types/auth";

export interface UserItem {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  role: UserRole;
  status: UserStatus;
  tenantId: string | null;
  platformRole: PlatformRole | null;
  churchId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface UserFilters {
  name: string;
  email: string;
  status: UserStatus | "";
  role: UserRole | "";
}

export interface UserListResult {
  items: UserItem[];
  total: number;
}

export interface CreateUserPayload {
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole;
  status: UserStatus;
  churchId?: string | null;
}

export interface UpdateUserPayload {
  name?: string;
  username?: string;
  email?: string | null;
  password?: string;
  role?: UserRole;
  status?: UserStatus;
  churchId?: string | null;
}

export interface UserFormValues {
  name: string;
  username: string;
  email: string;
  password: string;
  role: UserRole | "";
  status: UserStatus;
  churchId: string;
}

export const USER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

export const USER_ROLE_OPTIONS = [
  { value: "ADMIN", label: "Administrador" },
  { value: "SECRETARIA", label: "Secretaria" },
  { value: "TESOUREIRO", label: "Tesoureiro" },
  { value: "CONSULTA", label: "Consulta" },
] as const;

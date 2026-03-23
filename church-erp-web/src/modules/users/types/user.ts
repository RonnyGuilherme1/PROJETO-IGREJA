export interface UserItem {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
  churchId?: string | null;
}

export interface UserFilters {
  name: string;
  email: string;
  status: string;
  role: string;
}

export interface UserListResult {
  items: UserItem[];
  total: number;
}

export interface CreateUserPayload {
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
  churchId?: string;
}

export interface UpdateUserPayload {
  name: string;
  email: string;
  role: string;
  status: string;
  churchId?: string;
}

export interface UserFormValues {
  name: string;
  email: string;
  password: string;
  role: string;
  status: string;
  churchId: string;
}

export const USER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

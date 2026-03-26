import type { PlatformRole, UserStatus } from "@/modules/auth/types/auth";

export interface PlatformUserItem {
  id: string;
  name: string;
  username: string | null;
  email: string | null;
  status: UserStatus;
  platformRole: PlatformRole;
  isSystemProtected: boolean;
  createdByPlatformUserId: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface PlatformUsersListResult {
  items: PlatformUserItem[];
  total: number;
}

export interface CreatePlatformUserPayload {
  name: string;
  username: string;
  email?: string;
  password: string;
  platformRole: "PLATFORM_ADMIN" | "PLATFORM_OPERATOR";
  status: UserStatus;
}

export interface UpdatePlatformUserPayload {
  name?: string;
  username?: string;
  email?: string;
  password?: string;
  platformRole?: PlatformRole;
  status?: UserStatus;
}

export interface PlatformUserFormValues {
  name: string;
  username: string;
  email: string;
  password: string;
  platformRole: PlatformRole | "";
  status: UserStatus;
}

export const PLATFORM_USER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

export const PLATFORM_USER_ROLE_OPTIONS = [
  {
    value: "PLATFORM_ADMIN",
    label: "Administrador da plataforma",
    description: "Gerencia usuarios master e ambientes.",
  },
  {
    value: "PLATFORM_OPERATOR",
    label: "Operador de ambientes",
    description: "Opera ambientes, sem criar outros usuarios master.",
  },
] as const;

export const PLATFORM_SUPPORT_ROLE_OPTION = {
  value: "PLATFORM_SUPPORT",
  label: "Suporte da plataforma",
  description: "Perfil legado mantido sem expansao de poderes.",
} as const;

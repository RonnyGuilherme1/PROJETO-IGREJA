export type LeadershipRoleStatusFilter = "ACTIVE" | "INACTIVE";

export interface LeadershipRoleItem {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface LeadershipRoleFilters {
  name: string;
  active: LeadershipRoleStatusFilter | "";
}

export interface LeadershipRoleListResult {
  items: LeadershipRoleItem[];
  total: number;
}

export interface CreateLeadershipRolePayload {
  name: string;
  description: string;
  active: boolean;
}

export interface UpdateLeadershipRolePayload {
  name?: string;
  description?: string | null;
  active?: boolean;
}

export interface LeadershipRoleFormValues {
  name: string;
  description: string;
  active: LeadershipRoleStatusFilter;
}

export const LEADERSHIP_ROLE_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

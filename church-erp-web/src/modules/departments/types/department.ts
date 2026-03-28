export type DepartmentStatusFilter = "ACTIVE" | "INACTIVE";

export interface DepartmentItem {
  id: string;
  name: string;
  description: string | null;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface DepartmentFilters {
  name: string;
  active: DepartmentStatusFilter | "";
}

export interface DepartmentListResult {
  items: DepartmentItem[];
  total: number;
}

export interface CreateDepartmentPayload {
  name: string;
  description: string;
  active: boolean;
}

export interface UpdateDepartmentPayload {
  name?: string;
  description?: string | null;
  active?: boolean;
}

export interface DepartmentFormValues {
  name: string;
  description: string;
  active: DepartmentStatusFilter;
}

export const DEPARTMENT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

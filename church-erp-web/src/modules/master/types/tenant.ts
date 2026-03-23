export interface MasterTenantItem {
  id: string;
  name: string;
  code: string;
  status: string;
  adminName: string;
  adminUsername: string;
  adminEmail: string;
  createdAt: string;
  updatedAt: string;
}

export interface MasterTenantFilters {
  name: string;
  status: string;
}

export interface MasterTenantsListResult {
  items: MasterTenantItem[];
  total: number;
}

export interface CreateMasterTenantPayload {
  name: string;
  code: string;
  status: string;
  adminName: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
}

export interface UpdateMasterTenantPayload {
  name: string;
  code: string;
  status: string;
}

export interface MasterTenantFormValues {
  name: string;
  code: string;
  status: string;
  adminName: string;
  adminUsername: string;
  adminEmail: string;
  adminPassword: string;
}

export const MASTER_TENANT_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

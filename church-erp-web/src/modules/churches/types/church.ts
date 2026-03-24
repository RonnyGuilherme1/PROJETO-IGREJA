export type ChurchStatus = "ACTIVE" | "INACTIVE";

export interface ChurchItem {
  id: string;
  name: string;
  cnpj: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  pastorName: string | null;
  status: ChurchStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface ChurchFilters {
  name: string;
  status: string;
}

export interface ChurchListResult {
  items: ChurchItem[];
  total: number;
}

export interface CreateChurchPayload {
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  pastorName: string;
  status: ChurchStatus;
  notes: string;
}

export interface UpdateChurchPayload {
  name?: string;
  cnpj?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  pastorName?: string | null;
  status?: ChurchStatus;
  notes?: string | null;
}

export interface ChurchFormValues {
  name: string;
  cnpj: string;
  phone: string;
  email: string;
  address: string;
  pastorName: string;
  status: ChurchStatus;
  notes: string;
}

export const CHURCH_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativa" },
  { value: "INACTIVE", label: "Inativa" },
] as const;

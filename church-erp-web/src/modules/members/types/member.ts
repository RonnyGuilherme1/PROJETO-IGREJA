export type MemberStatus = "ACTIVE" | "INACTIVE";

export type MemberGender = "MASCULINO" | "FEMININO";

export type MemberMaritalStatus =
  | "SOLTEIRO"
  | "CASADO"
  | "DIVORCIADO"
  | "VIUVO";

export interface MemberItem {
  id: string;
  fullName: string;
  birthDate: string | null;
  gender: MemberGender | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  maritalStatus: MemberMaritalStatus | null;
  joinedAt: string | null;
  status: MemberStatus;
  notes: string | null;
  churchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberFilters {
  name: string;
  status: MemberStatus | "";
  churchId: string;
}

export interface MemberListResult {
  items: MemberItem[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface CreateMemberPayload {
  fullName: string;
  birthDate: string;
  gender: MemberGender | "";
  phone: string;
  email: string;
  address: string;
  maritalStatus: MemberMaritalStatus | "";
  joinedAt: string;
  status: MemberStatus;
  notes: string;
  churchId: string;
}

export interface UpdateMemberPayload {
  fullName?: string;
  birthDate?: string | null;
  gender?: MemberGender | null | "";
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  maritalStatus?: MemberMaritalStatus | null | "";
  joinedAt?: string | null;
  status?: MemberStatus;
  notes?: string | null;
  churchId?: string;
}

export interface MemberFormValues {
  fullName: string;
  birthDate: string;
  gender: MemberGender | "";
  phone: string;
  email: string;
  address: string;
  maritalStatus: MemberMaritalStatus | "";
  joinedAt: string;
  status: MemberStatus;
  notes: string;
  churchId: string;
}

export const MEMBER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

export const MEMBER_GENDER_OPTIONS = [
  { value: "MASCULINO", label: "Masculino" },
  { value: "FEMININO", label: "Feminino" },
] as const;

export const MEMBER_MARITAL_STATUS_OPTIONS = [
  { value: "SOLTEIRO", label: "Solteiro" },
  { value: "CASADO", label: "Casado" },
  { value: "DIVORCIADO", label: "Divorciado" },
  { value: "VIUVO", label: "Viuvo" },
] as const;

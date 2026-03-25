export type MemberStatus =
  | "ACTIVE"
  | "INACTIVE"
  | "VISITOR"
  | "IN_PROCESS";

export type MemberAgeRange =
  | "CHILDREN"
  | "TEENS"
  | "ADULTS"
  | "SENIORS";

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
  baptismDate: string | null;
  membershipDate: string | null;
  conversionDate: string | null;
  status: MemberStatus;
  notes: string | null;
  administrativeNotes: string | null;
  churchId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MemberFilters {
  name: string;
  status: MemberStatus | "";
  churchId: string;
  ageRange: MemberAgeRange | "";
  joinedFrom: string;
  joinedTo: string;
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
  baptismDate: string;
  membershipDate: string;
  conversionDate: string;
  status: MemberStatus;
  notes: string;
  administrativeNotes: string;
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
  baptismDate?: string | null;
  membershipDate?: string | null;
  conversionDate?: string | null;
  status?: MemberStatus;
  notes?: string | null;
  administrativeNotes?: string | null;
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
  baptismDate: string;
  membershipDate: string;
  conversionDate: string;
  status: MemberStatus;
  notes: string;
  administrativeNotes: string;
  churchId: string;
}

export const MEMBER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "IN_PROCESS", label: "Em processo" },
  { value: "VISITOR", label: "Visitante" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

export const MEMBER_AGE_RANGE_OPTIONS = [
  { value: "CHILDREN", label: "Criancas (0-11)" },
  { value: "TEENS", label: "Adolescentes (12-17)" },
  { value: "ADULTS", label: "Adultos (18-59)" },
  { value: "SENIORS", label: "60+ anos" },
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

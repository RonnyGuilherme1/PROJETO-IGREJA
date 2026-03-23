export interface MemberItem {
  id: string;
  fullName: string;
  birthDate: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  maritalStatus: string;
  joinedAt: string;
  status: string;
  notes: string;
  churchId: string;
  churchName: string;
}

export interface MemberFilters {
  name: string;
  status: string;
  churchId: string;
}

export interface MemberListResult {
  items: MemberItem[];
  total: number;
}

export interface CreateMemberPayload {
  fullName: string;
  birthDate: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  maritalStatus: string;
  joinedAt: string;
  status: string;
  notes: string;
  churchId: string;
}

export interface UpdateMemberPayload {
  fullName: string;
  birthDate: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  maritalStatus: string;
  joinedAt: string;
  status: string;
  notes: string;
  churchId: string;
}

export interface MemberFormValues {
  fullName: string;
  birthDate: string;
  gender: string;
  phone: string;
  email: string;
  address: string;
  maritalStatus: string;
  joinedAt: string;
  status: string;
  notes: string;
  churchId: string;
}

export const MEMBER_STATUS_OPTIONS = [
  { value: "ACTIVE", label: "Ativo" },
  { value: "INACTIVE", label: "Inativo" },
] as const;

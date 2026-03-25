import { ensureApiConfigured, http } from "@/lib/http";
import type {
  CreateMemberPayload,
  MemberFilters,
  MemberItem,
  MemberListResult,
  UpdateMemberPayload,
} from "@/modules/members/types/member";

const MEMBERS_ENDPOINT = "/members";
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 5000;

function sanitizeMemberPayload(
  payload: CreateMemberPayload | UpdateMemberPayload,
) {
  const sanitizedPayload = {
    ...payload,
    fullName: payload.fullName?.trim(),
    birthDate:
      "birthDate" in payload && payload.birthDate !== undefined
        ? payload.birthDate?.trim() || null
        : undefined,
    gender:
      "gender" in payload && payload.gender !== undefined
        ? payload.gender || null
        : undefined,
    phone:
      "phone" in payload && payload.phone !== undefined
        ? payload.phone?.trim() || null
        : undefined,
    email:
      "email" in payload && payload.email !== undefined
        ? payload.email?.trim().toLowerCase() || null
        : undefined,
    address:
      "address" in payload && payload.address !== undefined
        ? payload.address?.trim() || null
        : undefined,
    maritalStatus:
      "maritalStatus" in payload && payload.maritalStatus !== undefined
        ? payload.maritalStatus || null
        : undefined,
    joinedAt:
      "joinedAt" in payload && payload.joinedAt !== undefined
        ? payload.joinedAt?.trim() || null
        : undefined,
    baptismDate:
      "baptismDate" in payload && payload.baptismDate !== undefined
        ? payload.baptismDate?.trim() || null
        : undefined,
    membershipDate:
      "membershipDate" in payload && payload.membershipDate !== undefined
        ? payload.membershipDate?.trim() || null
        : undefined,
    conversionDate:
      "conversionDate" in payload && payload.conversionDate !== undefined
        ? payload.conversionDate?.trim() || null
        : undefined,
    status: payload.status,
    notes:
      "notes" in payload && payload.notes !== undefined
        ? payload.notes?.trim() || null
        : undefined,
    administrativeNotes:
      "administrativeNotes" in payload &&
      payload.administrativeNotes !== undefined
        ? payload.administrativeNotes?.trim() || null
        : undefined,
    churchId:
      "churchId" in payload && payload.churchId !== undefined
        ? payload.churchId.trim()
        : undefined,
  };

  return Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([, value]) => value !== undefined),
  );
}

export async function listMembers(
  filters: MemberFilters,
): Promise<MemberListResult> {
  ensureApiConfigured();

  const response = await http.get<MemberListResult>(MEMBERS_ENDPOINT, {
    params: {
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      name: filters.name || undefined,
      status: filters.status || undefined,
      churchId: filters.churchId || undefined,
      ageRange: filters.ageRange || undefined,
      joinedFrom: filters.joinedFrom || undefined,
      joinedTo: filters.joinedTo || undefined,
    },
  });

  return response.data;
}

export async function getMemberById(id: string): Promise<MemberItem> {
  ensureApiConfigured();

  const response = await http.get<MemberItem>(`${MEMBERS_ENDPOINT}/${id}`);
  return response.data;
}

export async function createMember(
  payload: CreateMemberPayload,
): Promise<MemberItem> {
  ensureApiConfigured();

  const response = await http.post<MemberItem>(
    MEMBERS_ENDPOINT,
    sanitizeMemberPayload(payload),
  );

  return response.data;
}

export async function updateMember(
  id: string,
  payload: UpdateMemberPayload,
): Promise<MemberItem> {
  ensureApiConfigured();

  const response = await http.patch<MemberItem>(
    `${MEMBERS_ENDPOINT}/${id}`,
    sanitizeMemberPayload(payload),
  );

  return response.data;
}

export async function inactivateMember(id: string): Promise<void> {
  ensureApiConfigured();
  await http.patch(`${MEMBERS_ENDPOINT}/${id}/inactivate`);
}

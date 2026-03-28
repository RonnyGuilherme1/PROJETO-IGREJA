import { ensureApiConfigured, http } from "@/lib/http";
import type {
  CreateLeadershipRolePayload,
  LeadershipRoleFilters,
  LeadershipRoleItem,
  LeadershipRoleListResult,
  UpdateLeadershipRolePayload,
} from "@/modules/leadership-roles/types/leadership-role";

const LEADERSHIP_ROLES_ENDPOINT = "/leadership-roles";

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function matchesLeadershipRoleFilters(
  leadershipRole: LeadershipRoleItem,
  filters: LeadershipRoleFilters,
) {
  const name = normalizeSearchValue(filters.name);
  const isActiveFilter =
    filters.active === "" ? null : filters.active === "ACTIVE";

  return (
    (!name ||
      normalizeSearchValue(leadershipRole.name).includes(name) ||
      normalizeSearchValue(leadershipRole.description ?? "").includes(name)) &&
    (isActiveFilter === null || leadershipRole.active === isActiveFilter)
  );
}

function sanitizeLeadershipRolePayload(
  payload: CreateLeadershipRolePayload | UpdateLeadershipRolePayload,
) {
  const sanitizedPayload = {
    ...payload,
    name: payload.name?.trim(),
    description:
      "description" in payload && payload.description !== undefined
        ? payload.description?.trim() || null
        : undefined,
    active: payload.active,
  };

  return Object.fromEntries(
    Object.entries(sanitizedPayload).filter(([, value]) => value !== undefined),
  );
}

export async function listLeadershipRoles(
  filters: LeadershipRoleFilters,
): Promise<LeadershipRoleListResult> {
  ensureApiConfigured();

  const response = await http.get<LeadershipRoleItem[]>(LEADERSHIP_ROLES_ENDPOINT);
  const items = response.data.filter((leadershipRole) =>
    matchesLeadershipRoleFilters(leadershipRole, filters),
  );

  return {
    items,
    total: items.length,
  };
}

export async function getLeadershipRoleById(
  id: string,
): Promise<LeadershipRoleItem> {
  ensureApiConfigured();

  const response = await http.get<LeadershipRoleItem>(
    `${LEADERSHIP_ROLES_ENDPOINT}/${id}`,
  );
  return response.data;
}

export async function createLeadershipRole(
  payload: CreateLeadershipRolePayload,
): Promise<LeadershipRoleItem> {
  ensureApiConfigured();

  const response = await http.post<LeadershipRoleItem>(
    LEADERSHIP_ROLES_ENDPOINT,
    sanitizeLeadershipRolePayload(payload),
  );

  return response.data;
}

export async function updateLeadershipRole(
  id: string,
  payload: UpdateLeadershipRolePayload,
): Promise<LeadershipRoleItem> {
  ensureApiConfigured();

  const response = await http.patch<LeadershipRoleItem>(
    `${LEADERSHIP_ROLES_ENDPOINT}/${id}`,
    sanitizeLeadershipRolePayload(payload),
  );

  return response.data;
}

export async function inactivateLeadershipRole(id: string): Promise<void> {
  ensureApiConfigured();
  await http.patch(`${LEADERSHIP_ROLES_ENDPOINT}/${id}/inactivate`);
}

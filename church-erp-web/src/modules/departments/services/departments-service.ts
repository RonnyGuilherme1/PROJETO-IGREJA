import { ensureApiConfigured, http } from "@/lib/http";
import type {
  CreateDepartmentPayload,
  DepartmentFilters,
  DepartmentItem,
  DepartmentListResult,
  UpdateDepartmentPayload,
} from "@/modules/departments/types/department";

const DEPARTMENTS_ENDPOINT = "/departments";

function normalizeSearchValue(value: string) {
  return value.trim().toLocaleLowerCase("pt-BR");
}

function matchesDepartmentFilters(
  department: DepartmentItem,
  filters: DepartmentFilters,
) {
  const name = normalizeSearchValue(filters.name);
  const isActiveFilter =
    filters.active === "" ? null : filters.active === "ACTIVE";

  return (
    (!name ||
      normalizeSearchValue(department.name).includes(name) ||
      normalizeSearchValue(department.description ?? "").includes(name)) &&
    (isActiveFilter === null || department.active === isActiveFilter)
  );
}

function sanitizeDepartmentPayload(
  payload: CreateDepartmentPayload | UpdateDepartmentPayload,
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

export async function listDepartments(
  filters: DepartmentFilters,
): Promise<DepartmentListResult> {
  ensureApiConfigured();

  const response = await http.get<DepartmentItem[]>(DEPARTMENTS_ENDPOINT);
  const items = response.data.filter((department) =>
    matchesDepartmentFilters(department, filters),
  );

  return {
    items,
    total: items.length,
  };
}

export async function getDepartmentById(id: string): Promise<DepartmentItem> {
  ensureApiConfigured();

  const response = await http.get<DepartmentItem>(`${DEPARTMENTS_ENDPOINT}/${id}`);
  return response.data;
}

export async function createDepartment(
  payload: CreateDepartmentPayload,
): Promise<DepartmentItem> {
  ensureApiConfigured();

  const response = await http.post<DepartmentItem>(
    DEPARTMENTS_ENDPOINT,
    sanitizeDepartmentPayload(payload),
  );

  return response.data;
}

export async function updateDepartment(
  id: string,
  payload: UpdateDepartmentPayload,
): Promise<DepartmentItem> {
  ensureApiConfigured();

  const response = await http.patch<DepartmentItem>(
    `${DEPARTMENTS_ENDPOINT}/${id}`,
    sanitizeDepartmentPayload(payload),
  );

  return response.data;
}

export async function inactivateDepartment(id: string): Promise<void> {
  ensureApiConfigured();
  await http.patch(`${DEPARTMENTS_ENDPOINT}/${id}/inactivate`);
}

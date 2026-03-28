"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";
import { getApiErrorMessage } from "@/lib/http";
import { ConfirmActionDialog } from "@/components/shared/confirm-action-dialog";
import { ErrorView } from "@/components/shared/error-view";
import { PageHeader } from "@/components/shared/page-header";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { listChurches } from "@/modules/churches/services/churches-service";
import { listDepartments } from "@/modules/departments/services/departments-service";
import { listLeadershipRoles } from "@/modules/leadership-roles/services/leadership-roles-service";
import { MembersFilters } from "@/modules/members/components/members-filters";
import { MembersTable } from "@/modules/members/components/members-table";
import { getMembersAccessLabel } from "@/modules/members/lib/members-permissions";
import { inactivateMember, listMembers } from "@/modules/members/services/members-service";
import type { AuthUser } from "@/modules/auth/types/auth";
import type { MemberFilters, MemberItem } from "@/modules/members/types/member";

interface MembersListPageProps {
  canEdit: boolean;
  currentUser?: AuthUser | null;
}

interface ChurchOption {
  id: string;
  name: string;
}

interface LeadershipRoleOption {
  id: string;
  name: string;
}

interface DepartmentOption {
  id: string;
  name: string;
}

const initialFilters: MemberFilters = {
  name: "",
  status: "",
  churchId: "",
  leadershipRoleId: "",
  departmentId: "",
};

export function MembersListPage({
  canEdit,
  currentUser,
}: MembersListPageProps) {
  const [filters, setFilters] = useState<MemberFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] = useState<MemberFilters>(initialFilters);
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [churchOptions, setChurchOptions] = useState<ChurchOption[]>([]);
  const [leadershipRoleOptions, setLeadershipRoleOptions] = useState<
    LeadershipRoleOption[]
  >([]);
  const [departmentOptions, setDepartmentOptions] = useState<DepartmentOption[]>(
    [],
  );
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [referenceDataError, setReferenceDataError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);
  const [memberPendingInactivation, setMemberPendingInactivation] =
    useState<MemberItem | null>(null);
  const churchNamesById = Object.fromEntries(
    churchOptions.map((church) => [church.id, church.name]),
  );

  const loadMembers = useCallback(async (currentFilters: MemberFilters) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await listMembers(currentFilters);
      setMembers(response.items);
      setTotal(response.total);
    } catch (loadError) {
      setError(
        getApiErrorMessage(
          loadError,
          "Nao foi possivel carregar a listagem de membros.",
        ),
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMembers(appliedFilters);
  }, [appliedFilters, loadMembers]);

  useEffect(() => {
    let isActive = true;

    async function loadReferenceData() {
      const [churchesResult, leadershipRolesResult, departmentsResult] =
        await Promise.allSettled([
          listChurches({ name: "", status: "" }),
          listLeadershipRoles({ name: "", active: "" }),
          listDepartments({ name: "", active: "" }),
        ]);

      if (!isActive) {
        return;
      }

      if (churchesResult.status === "fulfilled") {
        setChurchOptions(
          churchesResult.value.items.map((church) => ({
            id: church.id,
            name: church.name,
          })),
        );
      }

      if (leadershipRolesResult.status === "fulfilled") {
        setLeadershipRoleOptions(
          leadershipRolesResult.value.items.map((leadershipRole) => ({
            id: leadershipRole.id,
            name: leadershipRole.name,
          })),
        );
      }

      if (departmentsResult.status === "fulfilled") {
        setDepartmentOptions(
          departmentsResult.value.items.map((department) => ({
            id: department.id,
            name: department.name,
          })),
        );
      }

      const errors: string[] = [];

      if (churchesResult.status === "rejected") {
        errors.push(
          getApiErrorMessage(
            churchesResult.reason,
            "Nao foi possivel carregar a lista de igrejas para filtro.",
          ),
        );
      }

      if (leadershipRolesResult.status === "rejected") {
        errors.push(
          getApiErrorMessage(
            leadershipRolesResult.reason,
            "Nao foi possivel carregar a lista de cargos para filtro.",
          ),
        );
      }

      if (departmentsResult.status === "rejected") {
        errors.push(
          getApiErrorMessage(
            departmentsResult.reason,
            "Nao foi possivel carregar a lista de departamentos para filtro.",
          ),
        );
      }

      setReferenceDataError(errors[0] ?? null);
    }

    void loadReferenceData();

    return () => {
      isActive = false;
    };
  }, []);

  function handleFilterChange(field: keyof MemberFilters, value: string) {
    setFilters((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function handleFilterSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAppliedFilters({ ...filters });
  }

  function handleResetFilters() {
    setFilters(initialFilters);
    setAppliedFilters(initialFilters);
  }

  async function handleInactivate(member: MemberItem) {
    setMemberPendingInactivation(member);
  }

  async function confirmInactivateMember() {
    if (!memberPendingInactivation) {
      return;
    }

    setInactivatingId(memberPendingInactivation.id);
    setError(null);

    try {
      await inactivateMember(memberPendingInactivation.id);
      await loadMembers(appliedFilters);
      setMemberPendingInactivation(null);
    } catch (actionError) {
      setError(
        getApiErrorMessage(
          actionError,
          "Nao foi possivel inativar o membro selecionado.",
        ),
      );
    } finally {
      setInactivatingId(null);
    }
  }

  if (error && members.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Nao foi possivel abrir os membros"
        description={error}
        onAction={() => void loadMembers(appliedFilters)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Membros"
        description="Acompanhe o cadastro de membros, a igreja vinculada e o status de cada registro."
        badge={getMembersAccessLabel(currentUser)}
        action={
          canEdit ? (
            <Button asChild>
              <Link href="/membros/novo">
                <Plus className="size-4" />
                Novo membro
              </Link>
            </Button>
          ) : undefined
        }
      />

      <Card className="bg-white/85">
        <CardHeader className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <CardTitle>Filtros</CardTitle>
            <CardDescription>
              Filtre por nome, status, igreja, cargo e departamento para localizar membros.
            </CardDescription>
          </div>
          <Badge variant="secondary">Total: {total}</Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          {referenceDataError ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {referenceDataError}
            </div>
          ) : null}

          <MembersFilters
            filters={filters}
            churchOptions={churchOptions}
            leadershipRoleOptions={leadershipRoleOptions}
            departmentOptions={departmentOptions}
            isLoading={isLoading}
            onChange={handleFilterChange}
            onSubmit={handleFilterSubmit}
            onReset={handleResetFilters}
          />
        </CardContent>
      </Card>

      <Card className="bg-white/85">
        <CardHeader className="space-y-2">
          <CardTitle>Listagem</CardTitle>
          <CardDescription>
            Visualize membros cadastrados, acompanhe igreja, cargo, departamento e gerencie o status.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <MembersTable
            members={members}
            churchNamesById={churchNamesById}
            isLoading={isLoading}
            canEdit={canEdit}
            inactivatingId={inactivatingId}
            onInactivate={handleInactivate}
          />
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={Boolean(memberPendingInactivation)}
        title="Inativar membro"
        description={
          memberPendingInactivation
            ? `O cadastro de ${memberPendingInactivation.fullName} permanecera no historico, mas deixara de ficar ativo.`
            : ""
        }
        confirmLabel="Inativar"
        confirmVariant="destructive"
        isLoading={Boolean(
          memberPendingInactivation &&
            inactivatingId === memberPendingInactivation.id,
        )}
        onConfirm={() => void confirmInactivateMember()}
        onOpenChange={(open) => {
          if (!open) {
            setMemberPendingInactivation(null);
          }
        }}
      />
    </div>
  );
}

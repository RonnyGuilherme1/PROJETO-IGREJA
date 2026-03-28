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
import { LeadershipRolesFilters } from "@/modules/leadership-roles/components/leadership-roles-filters";
import { LeadershipRolesTable } from "@/modules/leadership-roles/components/leadership-roles-table";
import {
  inactivateLeadershipRole,
  listLeadershipRoles,
} from "@/modules/leadership-roles/services/leadership-roles-service";
import type {
  LeadershipRoleFilters,
  LeadershipRoleItem,
} from "@/modules/leadership-roles/types/leadership-role";

interface LeadershipRolesListPageProps {
  canEdit: boolean;
}

const initialFilters: LeadershipRoleFilters = {
  name: "",
  active: "",
};

export function LeadershipRolesListPage({
  canEdit,
}: LeadershipRolesListPageProps) {
  const [filters, setFilters] = useState<LeadershipRoleFilters>(initialFilters);
  const [appliedFilters, setAppliedFilters] =
    useState<LeadershipRoleFilters>(initialFilters);
  const [leadershipRoles, setLeadershipRoles] = useState<LeadershipRoleItem[]>(
    [],
  );
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [inactivatingId, setInactivatingId] = useState<string | null>(null);
  const [leadershipRolePendingInactivation, setLeadershipRolePendingInactivation] =
    useState<LeadershipRoleItem | null>(null);

  const loadLeadershipRoles = useCallback(
    async (currentFilters: LeadershipRoleFilters) => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await listLeadershipRoles(currentFilters);
        setLeadershipRoles(response.items);
        setTotal(response.total);
      } catch (loadError) {
        setError(
          getApiErrorMessage(
            loadError,
            "Nao foi possivel carregar a listagem de cargos de lideranca.",
          ),
        );
      } finally {
        setIsLoading(false);
      }
    },
    [],
  );

  useEffect(() => {
    void loadLeadershipRoles(appliedFilters);
  }, [appliedFilters, loadLeadershipRoles]);

  function handleFilterChange(
    field: keyof LeadershipRoleFilters,
    value: string,
  ) {
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

  function handleInactivate(leadershipRole: LeadershipRoleItem) {
    setLeadershipRolePendingInactivation(leadershipRole);
  }

  async function confirmInactivateLeadershipRole() {
    if (!leadershipRolePendingInactivation) {
      return;
    }

    setInactivatingId(leadershipRolePendingInactivation.id);
    setError(null);

    try {
      await inactivateLeadershipRole(leadershipRolePendingInactivation.id);
      await loadLeadershipRoles(appliedFilters);
      setLeadershipRolePendingInactivation(null);
    } catch (actionError) {
      setError(
        getApiErrorMessage(
          actionError,
          "Nao foi possivel inativar o cargo de lideranca selecionado.",
        ),
      );
    } finally {
      setInactivatingId(null);
    }
  }

  if (error && leadershipRoles.length === 0 && !isLoading) {
    return (
      <ErrorView
        title="Nao foi possivel abrir os cargos de lideranca"
        description={error}
        onAction={() => void loadLeadershipRoles(appliedFilters)}
      />
    );
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Cargos de lideranca"
        description="Cadastre e acompanhe os cargos de lideranca disponiveis para organizacao ministerial."
        badge={canEdit ? "Gerenciamento" : "Consulta"}
        action={
          canEdit ? (
            <Button asChild>
              <Link href="/cargos-lideranca/novo">
                <Plus className="size-4" />
                Novo cargo
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
              Filtre por nome e status para localizar cargos com rapidez.
            </CardDescription>
          </div>
          <Badge variant="secondary">Total: {total}</Badge>
        </CardHeader>
        <CardContent>
          <LeadershipRolesFilters
            filters={filters}
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
            Visualize cargos cadastrados, edite descricoes e controle o status
            de uso.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error ? (
            <div className="rounded-2xl border border-destructive/20 bg-destructive/5 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <LeadershipRolesTable
            leadershipRoles={leadershipRoles}
            isLoading={isLoading}
            canEdit={canEdit}
            inactivatingId={inactivatingId}
            onInactivate={handleInactivate}
          />
        </CardContent>
      </Card>

      <ConfirmActionDialog
        open={Boolean(leadershipRolePendingInactivation)}
        title="Inativar cargo de lideranca"
        description={
          leadershipRolePendingInactivation
            ? `O cargo ${leadershipRolePendingInactivation.name} deixara de ficar disponivel para uso ativo.`
            : ""
        }
        confirmLabel="Inativar"
        confirmVariant="destructive"
        isLoading={Boolean(
          leadershipRolePendingInactivation &&
            inactivatingId === leadershipRolePendingInactivation.id,
        )}
        onConfirm={() => void confirmInactivateLeadershipRole()}
        onOpenChange={(open) => {
          if (!open) {
            setLeadershipRolePendingInactivation(null);
          }
        }}
      />
    </div>
  );
}
